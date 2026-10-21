(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {Memory, MemoryBlock, Segment} = NS;
    const config = NS.MEMORY_CONFIG;

    class UnifiedMemory extends Memory {

        constructor(totalSize, systemProcess = null, segmentSize = config.segmentSize, pageSize = config.pageSize) {
            super(totalSize, systemProcess, pageSize * config.systemFrameCount);
            this.segmentSize = segmentSize;
            this.pageSize = pageSize;
            this.frameCount = totalSize / pageSize;
            this.systemFrameCount = systemProcess ? this.systemSize / pageSize : 0;
            for (let frame = this.systemFrameCount; frame < this.frameCount; frame += 1) {
                this.blocks.push(new MemoryBlock(frame * pageSize, pageSize, {frameNumber: frame}));
            }
        }

        load(process) {
            if (!process || !process.isWaiting()) {
                throw new Error(`El proceso ${process ? process.id : ''} ya está cargado o no es válido`);
            }
            const segments = process.splitSections(this.segmentSize).map((section) => ({
                name: section.name,
                part: section.part,
                size: section.size,
                permissions: section.permissions,
            }));
            if (segments.length > config.maxSegments) throw new Error(`El proceso ${process.id} necesita más de ${config.maxSegments} segmentos`);

            const allocated = [];
            const segmentTable = [];
            for (const [number, definition] of segments.entries()) {
                const pageCount = Math.ceil(definition.size / this.pageSize);
                if (pageCount > config.pagesPerSegment) throw new Error(`El segmento ${number} supera las ${config.pagesPerSegment} páginas permitidas`);
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
                    pageTable.push({
                        page,
                        frame,
                        validBytes: Math.min(remaining, this.pageSize),
                        permissions: definition.permissions,
                    });
                    allocated.push(block);
                }
                const segment = new Segment({
                    number,
                    base: null,
                    limit: definition.size,
                    permissions: definition.permissions,
                    sectionName: definition.name,
                });
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
            return this.blocks.find((block) => block.isFree()) || null;
        }

        releaseFrame(block) {
            if (block.isOccupied()) block.release();
            block.segmentNumber = null;
            block.pageNumber = null;
            block.segmentName = null;
            block.permissions = null;
        }

        get frameTable() {
            return this.blocks.reduce((table, block) => {
                table[block.start / this.pageSize] = block.isFree() ? -1 : block.processId === 'SO' ? 0 : block.processId;
                return table;
            }, Array(this.frameCount).fill(-1));
        }

        unload(process) {
            this.blocks
                .filter((block) => block.processId === process.id)
                .forEach((block) => this.releaseFrame(block));
            process.unload();
        }

        translate(process, logicalAddress, access = 'R') {
            if (!Number.isInteger(logicalAddress) || logicalAddress < 0 || logicalAddress >= config.ramBytes) {
                throw new Error(`Dirección lógica inválida: ${logicalAddress}`);
            }
            const segmentNumber = logicalAddress >>> (config.pageBits + config.offsetBits);
            const page = (logicalAddress >>> config.offsetBits) & (config.pagesPerSegment - 1);
            const offset = logicalAddress & (config.pageSize - 1);
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

        getAllocationView(process) {
            const rows = process.isLoaded() && process.segmentTable.length
                ? process.segmentTable.map((segment) => ({number: segment.number, bin: segment.number.toString(2).padStart(6, '0'), name: segment.sectionName, limit: segment.limit, permissions: segment.permissions, base: null, pages: segment.pageTable.map((page) => ({page: page.page, frame: page.frame, physicalBase: page.frame * this.pageSize}))}))
                : process.sections.map((section, number) => ({number, bin: number.toString(2).padStart(6, '0'), name: section.name, limit: section.size, permissions: section.permissions, base: null, pages: []}));
            const reservedBytes = rows.reduce((sum, row) => sum + row.pages.length * this.pageSize, 0);
            return {pid: process.id, name: process.name, status: process.status, totalSize: process.getSize(), segmentCount: rows.length, rows, footer: {occupiedBytes: process.isLoaded() ? process.getSize() : 0, reservedBytes, internalFragmentation: Math.max(0, reservedBytes - (process.isLoaded() ? process.getSize() : 0))}};
        }
    }

    NS.UnifiedMemory = UnifiedMemory;
})();