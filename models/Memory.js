(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {chooseBlock, MemoryBlock} = NS;
    const config = NS.MEMORY_CONFIG;

    class Memory {


        constructor(totalSize, systemProcess = null, systemSize = config.osBytes) {
            this.totalSize = totalSize;
            this.systemSize = systemProcess ? systemSize : 0;
            this.blocks = []; // MemoryBlock (class)
            if (systemProcess) {
                const systemBlock = new MemoryBlock(0, this.systemSize);
                systemBlock.occupy(systemProcess);
                this.blocks.push(systemBlock);
            }
        }

        getFreeBlocks() {
            return this.blocks.filter((block) => block.isFree());
        }

        getOccupiedBlocks() {
            return this.blocks.filter((block) => block.isOccupied());
        }

        getBlockOf(process) {
            return this.blocks.find((block) => block.processId === process.id);
        }

        sortByStart() {
            this.blocks.sort((a, b) => a.start - b.start);
        }

        findCandidates(size) {
            return this.getFreeBlocks().filter((block) => block.size >= size);
        }

        // apartados para algunas subclases
        allocate(process, algorithm) {
            if (!process || !process.isWaiting()) {
                throw new Error(`El proceso ${process ? process.id : ''} ya está cargado o no es válido`);
            }
            const candidates = this.findCandidates(process.getSize());
            const chosen = chooseBlock(candidates, algorithm);
            if (!chosen) return null;

            return this.assign(chosen, process);
        }

        load(process, algorithm) {
            return this.allocate(process, algorithm);
        }

        free(process) {
            const block = this.getBlockOf(process);
            if (!block) return;

            block.release();
            process.unload();
            this.afterFree(block);
        }

        unload(process) {
            return this.free(process);
        }

        translate() {
            throw new Error('La traducción lógica no está soportada por este esquema');
        }

        // Apartados para las subclases
        // Por defecto: no hace nada extra al liberar. DynamicMemory lo usa para fusionar huecos.
        afterFree(_block) {
        }

        // Por defecto: el proceso ocupa el bloque completo -> (comportamiento estático).
        assign(block, process) {
            block.occupy(process);
            process.load();
            return block;  // devolvemos el bloque
        }

        getStats() {
            const free = this.getFreeBlocks();
            const occupied = this.getOccupiedBlocks();

            return {
                totalFree: free.reduce((sum, b) => sum + b.size, 0),
                totalOccupied: occupied.reduce((sum, b) => sum + b.size, 0),
                holeCount: free.length,
                largestHole: free.length ? Math.max(...free.map((b) => b.size)) : 0,
                total: this.totalSize,
            };
        }

        getInternalFragmentation() {
            return 0;
        }

        getAllocationView(process) {
            return {
                pid: process.id,
                name: process.name,
                status: process.status,
                totalSize: process.getSize(),
                segmentCount: process.sections.length,
                rows: process.sections.map((section, number) => ({
                    number,
                    bin: number.toString(2).padStart(6, '0'),
                    name: section.name,
                    limit: section.size,
                    permissions: section.permissions,
                    base: null,
                    pages: [],
                })),
                footer: {occupiedBytes: process.isLoaded() ? process.getSize() : 0, reservedBytes: 0, internalFragmentation: 0},
            };
        }


    }

    NS.Memory = Memory;
})();
