(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {Memory} = NS;

    class FramedMemory extends Memory {
        freeFrame() {
            return this.blocks.find((block) => block.isFree()) || null;
        }

        releaseFrame(block) {
            if (block && block.isOccupied()) block.release();
        }

        unload(process) {
            this.blocks.filter((block) => block.processId === process.id).forEach((block) => this.releaseFrame(block));
            process.unload();
        }

        getInternalFragmentation() {
            return 0;
        }

        getStats() {
            const stats = super.getStats();
            return {
                ...stats,
                freeFrames: this.getFreeBlocks().length,
                usedFrames: this.getOccupiedBlocks().length,
            };
        }
    }

    NS.FramedMemory = FramedMemory;
})();