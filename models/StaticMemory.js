(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {Memory, MemoryBlock} = NS;

// Memoria estatica con particiones fijas
    class StaticMemory extends Memory {

        constructor(totalSize, partitionSizes, systemProcess = null) {
            super(totalSize, systemProcess);

            let start = this.systemSize;
            for (const size of partitionSizes) {
                this.blocks.push(new MemoryBlock(start, size));
                start += size;
            }
        }

        // metado de fabrica para crear particiones automaticamnete en base al toal
        static equalPartitions(totalSize, count, systemProcess = null) {
            const available = totalSize - (systemProcess ? systemProcess.getSize() : 0);
            const base = Math.floor(available / count);
            const sizes = Array(count).fill(base);
            sizes[count - 1] += available - base * count;
            return new StaticMemory(totalSize, sizes, systemProcess);
        }

        // metodo de fabrica para el tema de crear particiones manuales con un tamaño
        static customPartitions(totalSize, partitionSizes, systemProcess = null) {
            const available = totalSize - (systemProcess ? systemProcess.getSize() : 0);
            const used = partitionSizes.reduce((a, b) => a + b, 0);
            if (used > available) {
                throw new Error(`Las particiones suman ${used}, superan la memoria disponible de ${available}`);
            }
            const sizes = used < available ? [...partitionSizes, available - used] : partitionSizes;
            return new StaticMemory(totalSize, sizes, systemProcess);
        }

        getInternalFragmentation(process) {
            const block = this.getBlockOf(process);
            return block ? block.size - process.getSize() : 0;
        }
    }

    NS.StaticMemory = StaticMemory;
})();
