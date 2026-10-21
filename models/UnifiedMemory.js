(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {Memory, MemoryBlock, Segment} = NS;

    class UnifiedMemory extends Memory {

        constructor(totalSize, systemProcess = null, segmentSize = 262144, pageSize = 65536) {
            super(totalSize, systemProcess, pageSize * 16);
            this.segmentSize = segmentSize;
            this.pageSize = pageSize;
            this.frameCount = totalSize / pageSize;
            this.frameTable = Array(this.frameCount).fill(-1);
            this.systemFrameCount = systemProcess ? this.systemSize / pageSize : 0;
            if (systemProcess) this.frameTable.fill(0, 0, this.systemFrameCount);
            for (let frame = this.systemFrameCount; frame < this.frameCount; frame += 1) {
                this.blocks.push(new MemoryBlock(frame * pageSize, pageSize, {frameNumber: frame}));
            }
        }

        load(process) {
            if (!process || !process.isWaiting()) {
                throw new Error(`El proceso ${process ? process.id : ''} ya está cargado o no es válido`);
            }
            const segments = [];
            process.sections.forEach((section) => {
                let remaining = section.size;
                let sectionPart = 0;
                while (remaining > 0) {
                    const size = Math.min(remaining, this.segmentSize);
                    segments.push({name: section.name, part: sectionPart, size, permissions: section.permissions});
                    remaining -= size;
                    sectionPart += 1;
                }
            });
            if (segments.length > 64) throw new Error(`El proceso ${process.id} necesita más de 64 segmentos`);

            const allocated = [];
            const segmentTable = [];
            for (const [number, definition] of segments.entries()) {
                const pageCount = Math.ceil(definition.size / this.pageSize);
                if (pageCount > 4) throw new Error(`El segmento ${number} supera las 4 páginas permitidas`);
                const pageTable = [];
                for (let page = 0; page < pageCount; page += 1) {
                    const block = this.freeFrame();
                    if (!block) {
                        allocated.forEach((candidate) => this.releaseFrame(candidate));
                        process.segmentTable = [];
                        return null;
                    }
                    block.occupy(process);
                    block.segmentNumber = number;
                    block.pageNumber = page;
                    block.segmentName = definition.name;
                    block.permissions = definition.permissions;
                    const frame = block.start / this.pageSize;
                    const remaining = definition.size - page * this.pageSize;
                    this.frameTable[frame] = process.id;
                    pageTable.push({
                        page,
                        frame,
                        validBytes: Math.min(remaining, this.pageSize),
                        permissions: definition.permissions,
                    });
                    allocated.push(block);
                }
                const segment = new Segment(
                    number,
                    pageTable[0].frame * this.pageSize,
                    definition.size,
                    definition.permissions,
                    definition.name,
                );
                segment.sectionPart = definition.part;
                segment.pageTable = pageTable;
                segmentTable.push(segment);
            }
            process.segmentTable = segmentTable;
            process.segmentBlocks = allocated;
            process.load({segmentTable});
            return allocated[0] || null;
        }

        freeFrame() {
            return this.blocks
                .filter((block) => block.isFree())
                .sort((a, b) => a.start - b.start)[0] || null;
        }

        releaseFrame(block) {
            const frame = block.start / this.pageSize;
            if (block.isOccupied()) block.release();
            block.segmentNumber = null;
            block.pageNumber = null;
            block.segmentName = null;
            block.permissions = null;
            this.frameTable[frame] = -1;
        }

        unload(process) {
            this.blocks
                .filter((block) => block.processId === process.id)
                .forEach((block) => this.releaseFrame(block));
            process.unload();
        }

        translate(process, logicalAddress, access = 'R') {
            if (!Number.isInteger(logicalAddress) || logicalAddress < 0 || logicalAddress >= 16777216) {
                throw new Error(`Dirección lógica inválida: ${logicalAddress}`);
            }
            const segmentNumber = logicalAddress >>> 18;
            const page = (logicalAddress >>> 16) & 0x03;
            const offset = logicalAddress & 0xFFFF;
            const segment = process.segmentTable.find((candidate) => candidate.number === segmentNumber);
            if (!segment) throw new Error(`Segmento ${segmentNumber} no existe en ${process.id}`);
            if (offset + page * this.pageSize >= segment.limit) {
                throw new Error(`Error de direccionamiento: offset fuera del límite del segmento ${segmentNumber}`);
            }
            if (!segment.canAccess(access)) {
                throw new Error(`Error de protección: acceso ${access} no permitido en el segmento ${segmentNumber}`);
            }
            const pageEntry = segment.pageTable.find((entry) => entry.page === page);
            if (!pageEntry) throw new Error(`Página ${page} no existe en el segmento ${segmentNumber}`);
            return pageEntry.frame * this.pageSize + offset;
        }

        getInternalFragmentation(process) {
            return process.segmentTable.reduce((total, segment) => {
                const last = segment.pageTable[segment.pageTable.length - 1];
                return total + (this.pageSize - last.validBytes) % this.pageSize;
            }, 0);
        }
    }

    NS.UnifiedMemory = UnifiedMemory;
})();