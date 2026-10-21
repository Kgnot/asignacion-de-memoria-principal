(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {Memory, MemoryBlock} = NS;
    const config = NS.MEMORY_CONFIG;

    class PagingMemory extends Memory {

        constructor(totalSize, systemProcess = null, pageSize = config.pageSize) {
            if (totalSize % pageSize !== 0) {
                throw new Error(`La RAM de ${totalSize} bytes debe ser múltiplo del tamaño de página ${pageSize}`);
            }
            super(totalSize, systemProcess, pageSize * config.systemFrameCount);
            this.pageSize = pageSize;
            this.frameCount = totalSize / pageSize;
            this.systemFrameCount = systemProcess ? this.systemSize / pageSize : 0;
            for (let frame = this.systemFrameCount; frame < this.frameCount; frame += 1) {
                this.blocks.push(new MemoryBlock(frame * pageSize, pageSize, {frameNumber: frame}));
            }
        }

        allocate(process, algorithm) {
            if (!process || !process.isWaiting()) {
                throw new Error(`El proceso ${process ? process.id : ''} ya está cargado o no es válido`);
            }

            const pages = [];
            let pageNumber = 0;
            for (const section of process.sections) {
                const pageCount = Math.ceil(section.size / this.pageSize);
                for (let pageInSection = 0; pageInSection < pageCount; pageInSection += 1) {
                    const remaining = section.size - pageInSection * this.pageSize;
                    pages.push({
                        pageNumber,
                        sectionName: section.name,
                        permissions: section.permissions,
                        validBytes: Math.min(remaining, this.pageSize),
                    });
                    pageNumber += 1;
                }
            }

            const allocated = [];
            const pageTable = [];
            for (const page of pages) {
                const chosen = this.getFreeBlocks().sort((a, b) => a.start - b.start)[0] || null;
                if (!chosen) {
                    allocated.forEach((block) => this.releasePage(block));
                    process.pageTable = [];
                    process.frames = [];
                    return null;
                }
                chosen.occupy(process);
                chosen.pageNumber = page.pageNumber;
                chosen.sectionName = page.sectionName;
                chosen.permissions = page.permissions;
                const frame = chosen.start / this.pageSize;
                pageTable.push({
                    page: page.pageNumber,
                    frame,
                    sectionName: page.sectionName,
                    permissions: page.permissions,
                    validBytes: page.validBytes,
                });
                allocated.push(chosen);
            }

            process.pageTable = pageTable;
            process.frames = pageTable.map((entry) => entry.frame);
            process.load({pageTable, frames: process.frames});
            return allocated[0] || null;
        }

        releasePage(block) {
            block.release();
            block.pageNumber = null;
            block.sectionName = null;
            block.permissions = null;
        }

        get frameTable() {
            return this.blocks.reduce((table, block) => {
                table[block.start / this.pageSize] = block.isFree() ? -1 : block.processId === 'SO' ? 0 : block.processId;
                return table;
            }, Array(this.frameCount).fill(-1));
        }

        free(process) {
            this.blocks
                .filter((block) => block.processId === process.id)
                .forEach((block) => this.releasePage(block));
            process.unload();
        }

        translatePage(process, logicalAddress, access = 'R') {
            if (!Number.isInteger(logicalAddress) || logicalAddress < 0 || logicalAddress >= config.ramBytes) {
                throw new Error(`Dirección lógica inválida: ${logicalAddress}`);
            }
            const page = logicalAddress >>> config.offsetBits;
            const offset = logicalAddress & (config.pageSize - 1);
            const entry = process.pageTable.find((candidate) => candidate.page === page);
            if (!entry) throw new Error(`La página ${page} no está cargada en ${process.id}`);
            if (offset >= entry.validBytes) {
                throw new Error(`Offset ${offset} fuera de los datos válidos de la página ${page}`);
            }
            if (![...access].every((permission) => entry.permissions.includes(permission))) {
                throw new Error(`Error de protección: acceso ${access} no permitido en ${entry.sectionName}`);
            }
            return entry.frame * this.pageSize + offset;
        }

        translate(process, logicalAddress, access = 'R') {
            return this.translatePage(process, logicalAddress, access);
        }

        getInternalFragmentation(process) {
            return process.sections.reduce((total, section) => {
                const remainder = section.size % this.pageSize;
                return total + (remainder === 0 ? 0 : this.pageSize - remainder);
            }, 0);
        }
    }

    NS.PagingMemory = PagingMemory;
})();