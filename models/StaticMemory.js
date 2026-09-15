(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {Memory, MemoryBlock} = NS;

// Memoria estatica con particiones fijas
    class StaticMemory extends Memory {

        constructor(totalSize, partitionSizes) {
            super(totalSize);

            let start = 0;
            for (const size of partitionSizes) {
                this.blocks.push(new MemoryBlock(start, size));
                start += size;
            }
        }

        // metado de fabrica para crear particiones automaticamnete en base al toal
        static equalPartitions(totalSize, count) {
            const base = Math.floor(totalSize / count);
            const sizes = Array(count).fill(base);
            sizes[count - 1] += totalSize - base * count;
            return new StaticMemory(totalSize, sizes);
        }

        // metodo de fabrica para el tema de crear particiones manuales con un tamaño
        static customPartitions(totalSize, partitionSizes) {
            const used = partitionSizes.reduce((a, b) => a + b, 0);
            if (used > totalSize) {
                throw new Error(`Las particiones suman ${used}, superan el total de ${totalSize}`);
            }
            const sizes = used < totalSize ? [...partitionSizes, totalSize - used] : partitionSizes;
            return new StaticMemory(totalSize, sizes);
        }
    }

    NS.StaticMemory = StaticMemory;
})();
