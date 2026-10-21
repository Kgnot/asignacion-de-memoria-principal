(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {Memory, MemoryBlock} = NS;

    class ContiguousMemory extends Memory {
        splitBlock(block, size, metadata = {}) {
            if (!Number.isInteger(size) || size <= 0 || size > block.size) throw new Error('Tamaño de bloque inválido');
            const index = this.blocks.indexOf(block);
            const occupied = new MemoryBlock(block.start, size, metadata);
            const remainder = block.size > size ? new MemoryBlock(block.start + size, block.size - size) : null;
            this.blocks.splice(index, 1, ...[occupied, remainder].filter(Boolean));
            return occupied;
        }

        mergeAdjacentFreeBlocks() {
            this.sortByStart();
            // Se recorre hacia atrás para poder hacer splice sin saltarse índices.
            for (let index = this.blocks.length - 1; index > 0; index -= 1) {
                const previous = this.blocks[index - 1];
                const current = this.blocks[index];
                if (previous.isFree() && current.isFree() && previous.getEnd() === current.start) {
                    previous.size += current.size;
                    this.blocks.splice(index, 1);
                }
            }
        }

        compact() {
            this.sortByStart();
            const occupied = this.getOccupiedBlocks().filter((block) => block.processId !== 'SO');
            let nextStart = this.systemSize;
            const systemBlock = this.getOccupiedBlocks().find((block) => block.processId === 'SO');
            const nextBlocks = systemBlock ? [systemBlock] : [];
            occupied.forEach((block) => {
                block.start = nextStart;
                this.onRelocate(block, nextStart);
                nextBlocks.push(block);
                nextStart += block.size;
            });
            if (nextStart < this.totalSize) nextBlocks.push(new MemoryBlock(nextStart, this.totalSize - nextStart));
            this.blocks = nextBlocks;
        }

        onRelocate() {}

        getStats() {
            const stats = super.getStats();
            stats.externalFragmentation = Math.max(0, stats.totalFree - stats.largestHole);
            return stats;
        }
    }

    NS.ContiguousMemory = ContiguousMemory;
})();