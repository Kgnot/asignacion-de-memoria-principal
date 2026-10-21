(function () {
    const NS = (window.MemSim = window.MemSim || {});

    class MemoryManager {

        constructor(totalSize, systemProcess) {
            this.totalSize = totalSize;
            this.systemProcess = systemProcess;
            this.strategies = {};
            this.scheme = null;
            this.memory = null;
            this.registerDefaultStrategies();
            this.setScheme('unified');
        }

        registerDefaultStrategies() {
            this.strategies = {
                unified: (process) => new NS.UnifiedMemory(this.totalSize, process),
                dynamic: (process) => new NS.DynamicMemory(this.totalSize, process),
                segmented: (process) => new NS.SegmentedMemory(this.totalSize, process),
                paging: (process) => new NS.PagingMemory(this.totalSize, process),
                fixed: (process) => NS.StaticMemory.equalPartitions(this.totalSize, 8, process),
            };
        }

        setScheme(name) {
            const factory = this.strategies[name];
            if (!factory) throw new Error(`Esquema de gestión desconocido: ${name}`);
            this.scheme = name;
            this.memory = factory(this.systemProcess);
            return this.memory;
        }

        load(process, algorithm) {
            if (typeof this.memory.load === 'function' && this.scheme === 'unified') {
                return this.memory.load(process, algorithm);
            }
            return this.memory.allocate(process, algorithm);
        }

        unload(process) {
            if (typeof this.memory.unload === 'function' && this.scheme === 'unified') {
                return this.memory.unload(process);
            }
            return this.memory.free(process);
        }

        translate(process, address, access = 'R') {
            if (this.scheme === 'unified') return this.memory.translate(process, address, access);
            if (this.scheme === 'paging') return this.memory.translatePage(process, address, access);
            if (this.scheme === 'segmented') {
                const segment = address >>> 18;
                return this.memory.translateSegment(process, segment, address & 0x3FFFF, access);
            }
            throw new Error(`El esquema ${this.scheme} no define traducción lógica`);
        }

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