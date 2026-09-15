import {chooseBlock} from "./AllocationAlgorithms";

class Memory {


    constructor(totalSize) {
        this.totalSize = totalSize;
        this.blocks = []; // MemoryBlock (class)
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
        const candidates = this.findCandidates(process.getSize());
        const chosen = chooseBlock(candidates, algorithm);
        if (!chosen) return null;

        return this.assign(chosen, process);
    }

    free(process) {
        const block = this.getBlockOf(process);
        if (!block) return;

        block.release();
        process.unload();
        this.afterFree(block);
    }

    // Apartados para las subclases
    // Por defecto: no hace nada extra al liberar. DynamicMemory lo usa para fusionar huecos.
    afterFree(_block) {
    }

    // Por defecto: el proceso ocupa el bloque completo -> (comportamiento estático).
    assign(block, process) {
        block.occupy(process);
        process.load(block.start);
    }

    getStats() {
        const free = this.getFreeBlocks();
        const occupied = this.getOccupiedBlocks();

        return {
            totalFree: free.reduce((sum, b) => sum + b.size, 0),
            totalOccupied: occupied.reduce((sum, b) => sum + b.size, 0),
            holeCount: free.length,
            largestHole: free.length ? Math.max(...free.map((b) => b.size)) : 0,
        };
    }


}

export default Memory;