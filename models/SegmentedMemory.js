(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {Memory, MemoryBlock, chooseBlock} = NS;

    class SegmentedMemory extends Memory {

        constructor(totalSize, segmentLimit = 256) {
            super(totalSize);
            this.segmentLimit = segmentLimit;
            this.blocks.push(new MemoryBlock(0, totalSize));
        }

        allocate(process, algorithm) {
            const pieces = [];
            process.segments.forEach((segment) => {
                let remaining = segment.size;
                let pieceIndex = 0;
                while (remaining > 0) {
                    const size = Math.min(remaining, this.segmentLimit);
                    pieces.push({name: segment.name, index: pieceIndex, size});
                    remaining -= size;
                    pieceIndex += 1;
                }
            });

            const allocated = [];
            for (const piece of pieces) {
                const chosen = chooseBlock(this.findCandidates(piece.size), algorithm);
                if (!chosen) {
                    allocated.forEach((block) => this.releaseBlock(block));
                    return null;
                }
                const block = this.splitAndAssign(chosen, process, piece);
                allocated.push(block);
            }

            process.load(allocated[0].start);
            process.segmentBlocks = allocated;
            return allocated[0];
        }

        splitAndAssign(block, process, piece) {
            const index = this.blocks.indexOf(block);
            const occupied = new MemoryBlock(block.start, piece.size, {
                segmentName: piece.name,
                segmentIndex: piece.index,
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
        }

        getBlockOf(process) {
            return this.blocks.find((block) => block.processId === process.id);
        }

        free(process) {
            this.blocks
                .filter((block) => block.processId === process.id)
                .forEach((block) => this.releaseBlock(block));
            process.segmentBlocks = [];
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
    }

    NS.SegmentedMemory = SegmentedMemory;
})();