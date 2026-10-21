(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {Memory, MemoryBlock, Segment, chooseBlock} = NS;
    const config = NS.MEMORY_CONFIG;

    class SegmentedMemory extends Memory {

        constructor(totalSize, systemProcess = null, segmentLimit = config.segmentSize) {
            super(totalSize, systemProcess);
            this.segmentLimit = segmentLimit;
            this.blocks.push(new MemoryBlock(this.systemSize, totalSize - this.systemSize));
        }

        allocate(process, algorithm) {
            if (!process || !process.isWaiting()) {
                throw new Error(`El proceso ${process ? process.id : ''} ya está cargado o no es válido`);
            }
            const pieces = process.splitSections(this.segmentLimit).map((section) => ({
                name: section.name,
                index: section.part,
                size: section.size,
                permissions: section.permissions,
            }));

            const allocated = [];
            const segmentTable = [];
            for (const [segmentNumber, piece] of pieces.entries()) {
                const chosen = chooseBlock(this.findCandidates(piece.size), algorithm);
                if (!chosen) {
                    allocated.forEach((block) => this.releaseBlock(block));
                    process.segmentTable = [];
                    this.mergeAdjacentFreeBlocks();
                    return null;
                }
                const block = this.splitAndAssign(chosen, process, piece, segmentNumber);
                const segment = new Segment({number: segmentNumber, base: block.start, limit: block.size, permissions: piece.permissions, sectionName: piece.name});
                block.segment = segment;
                segmentTable.push(segment);
                allocated.push(block);
            }

            process.segmentBlocks = allocated;
            process.segmentTable = segmentTable;
            process.load({segmentTable});
            return allocated[0];
        }

        splitAndAssign(block, process, piece, segmentNumber) {
            const index = this.blocks.indexOf(block);
            const occupied = new MemoryBlock(block.start, piece.size, {
                segmentName: piece.name,
                segmentIndex: piece.index,
                segmentNumber,
                permissions: piece.permissions,
            });
            occupied.occupy(process);
            const replacement = [occupied];
            if (block.size > piece.size) {
                replacement.push(new MemoryBlock(block.start + piece.size, block.size - piece.size));
            }
            this.blocks.splice(index, 1, ...replacement);
            return occupied;
        }

        releaseBlock(block) {
            if (block.isOccupied()) block.release();
            block.segment = null;
            block.segmentName = null;
            block.segmentIndex = null;
            block.segmentNumber = null;
            block.permissions = null;
        }

        getBlockOf(process) {
            return this.blocks.find((block) => block.processId === process.id);
        }

        translateSegment(process, segmentNumber, offset, access = 'R') {
            const segment = process.segmentTable.find((entry) => entry.number === segmentNumber);
            if (!segment) throw new Error(`Segmento ${segmentNumber} no existe en ${process.id}`);
            return segment.translate(offset, access);
        }

        translate(process, segmentNumber, offset, access = 'R') {
            return this.translateSegment(process, segmentNumber, offset, access);
        }

        getAllocationView(process) {
            const rows = process.isLoaded() && process.segmentTable.length
                ? process.segmentTable.map((segment) => ({number: segment.number, bin: segment.number.toString(2).padStart(6, '0'), name: segment.sectionName, limit: segment.limit, permissions: segment.permissions, base: segment.base, pages: []}))
                : process.sections.map((section, number) => ({number, bin: number.toString(2).padStart(6, '0'), name: section.name, limit: section.size, permissions: section.permissions, base: null, pages: []}));
            return {pid: process.id, name: process.name, status: process.status, totalSize: process.getSize(), segmentCount: rows.length, rows, footer: {occupiedBytes: process.isLoaded() ? process.getSize() : 0, reservedBytes: process.isLoaded() ? process.getSize() : 0, internalFragmentation: 0}};
        }

        free(process) {
            this.blocks
                .filter((block) => block.processId === process.id)
                .forEach((block) => this.releaseBlock(block));
            process.segmentBlocks = [];
            process.segmentTable = [];
            process.unload();
            this.mergeAdjacentFreeBlocks();
        }

        mergeAdjacentFreeBlocks() {
            this.sortByStart();
            for (let i = this.blocks.length - 1; i > 0; i -= 1) {
                const previous = this.blocks[i - 1];
                const current = this.blocks[i];
                if (previous.isFree() && current.isFree() && previous.getEnd() === current.start) {
                    previous.size += current.size;
                    this.blocks.splice(i, 1);
                }
            }
        }

        compact(processesById) {
            this.sortByStart();
            const occupied = this.getOccupiedBlocks().filter((block) => block.processId !== 'SO');
            const systemBlock = this.getOccupiedBlocks().find((block) => block.processId === 'SO');
            const newBlocks = systemBlock ? [systemBlock] : [];
            let nextBase = this.systemSize;

            for (const block of occupied) {
                const relocated = new MemoryBlock(nextBase, block.size, {
                    segmentName: block.segmentName,
                    segmentIndex: block.segmentIndex,
                    segmentNumber: block.segmentNumber,
                    permissions: block.permissions,
                });
                relocated.occupyWithId(block.processId);
                relocated.segment = block.segment;
                if (relocated.segment) relocated.segment.base = nextBase;
                newBlocks.push(relocated);

                const process = processesById.get(block.processId);
                if (process) {
                    const segment = process.segmentTable.find((entry) => entry.number === block.segmentNumber);
                    if (segment) segment.base = nextBase;
                    process.segmentBlocks = process.segmentBlocks.map((candidate) => candidate === block ? relocated : candidate);
                }
                nextBase += block.size;
            }

            if (nextBase < this.totalSize) {
                newBlocks.push(new MemoryBlock(nextBase, this.totalSize - nextBase));
            }
            this.blocks = newBlocks;
        }
    }

    NS.SegmentedMemory = SegmentedMemory;
})();