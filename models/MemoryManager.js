(function () {
    const NS = (window.MemSim = window.MemSim || {});

    class MemoryManager {

        constructor(totalSize, systemProcess, options = {}) {
            this.totalSize = totalSize;
            this.systemProcess = systemProcess;
            this.algorithm = options.algorithm || NS.ALLOCATION_ALGORITHMS.FIRST_FIT;
            this.autoCompact = options.autoCompact === true;
            this.loadedProcesses = new Map();
            this.strategies = {};
            this.scheme = null;
            this.memory = null;
            this.registerDefaultStrategies();
            this.setScheme(NS.MEMORY_SCHEMES?.PAGED_SEGMENTED || 'paged-segmented');
        }

        registerDefaultStrategies() {
            const schemes = NS.MEMORY_SCHEMES || {};
            this.strategies = {
                [schemes.PAGED_SEGMENTED || 'paged-segmented']: (process) => new NS.PagedSegmentedMemory(this.totalSize, process),
                [schemes.DYNAMIC || 'dynamic']: (process) => new NS.DynamicMemory(this.totalSize, process),
                [schemes.SEGMENTED || 'segmented']: (process) => new NS.SegmentedMemory(this.totalSize, process),
                [schemes.PAGING || 'paging']: (process) => new NS.PagingMemory(this.totalSize, process),
                [schemes.STATIC || 'static']: (process) => NS.StaticMemory.equalPartitions(this.totalSize, 8, process),
                unified: (process) => new NS.PagedSegmentedMemory(this.totalSize, process),
                fixed: (process) => NS.StaticMemory.equalPartitions(this.totalSize, 8, process),
            };
        }

        setScheme(name) {
            const factory = this.strategies[name];
            if (!factory) throw new Error(`Esquema de gestión desconocido: ${name}`);
            this.loadedProcesses.forEach((process) => this.memory?.unload(process));
            this.loadedProcesses.clear();
            this.scheme = name;
            this.memory = factory(this.systemProcess);
            return this.memory;
        }

        load(process) {
            let allocation = this.memory.load(process, this.algorithm);
            if (!allocation && this.autoCompact && this.memory.compact) {
                const stats = this.memory.getStats();
                if (stats.totalFree >= process.getSize()) {
                    this.memory.compact(this.loadedProcesses);
                    allocation = this.memory.load(process, this.algorithm);
                }
            }
            if (allocation) this.loadedProcesses.set(process.id, process);
            return allocation;
        }

        unload(process) {
            const result = this.memory.unload(process);
            this.loadedProcesses.delete(process.id);
            return result;
        }

        translate(process, address, access = 'R') {
            return this.memory.translate(process, address, access);
        }

        compact() { return this.memory.compact?.(this.loadedProcesses); }

        getState() {
            return {
                scheme: this.scheme,
                memory: this.memory,
                stats: this.memory.getStats(),
            };
        }
    }

    NS.MemoryManager = MemoryManager;
})();