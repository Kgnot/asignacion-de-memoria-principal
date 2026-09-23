//  Determinamos primero lo que son los Kilobites dados
// 2^24
(function () {
    const NS = window.MemSim;
    const {StaticMemory, DynamicMemory, ALLOCATION_ALGORITHMS, createDefaultProcesses, toHex} = NS;

    const TOTAL_KIB = 16384; // son los 16 MiB


    class App {
        constructor(root) {
            this.root = root;
            this.scheme = 'fixed';
            this.algorithm = ALLOCATION_ALGORITHMS.FIRST_FIT;
            this.compactionEnabled = false;
            this.processes = [];
            this.memory = null;

            this.schemePanel = root.querySelector('scheme-panel');
            this.processList = root.querySelector('process-list');
            this.memoryMap = root.querySelector('memory-map');
            this.memoryLegend = root.querySelector('memory-legend');
            this.memoryStats = root.querySelector('memory-stats');
            this.blockTable = root.querySelector('block-table');
            this.eventLog = root.querySelector('event-log');

            this.bindEvents();
            this.applyScheme('fixed', {count: 8});
            this.log('Simulador listo. Esquema inicial: particiones fijas iguales (8 particiones de 2048 KiB).');
        }

        bindEvents() {
            this.root.addEventListener('scheme-change', (e) => this.handleSchemeChange(e.detail.scheme));
            this.root.addEventListener('apply-fixed', (e) => this.applyScheme('fixed', {count: e.detail.count}, true));
            this.root.addEventListener('apply-variable', (e) => this.applyScheme('variable', {sizes: e.detail.sizes}, true));
            this.root.addEventListener('algorithm-change', (e) => {
                this.algorithm = e.detail.algorithm;
                this.log(`Algoritmo de asignación: ${e.detail.label}.`);
            });
            this.root.addEventListener('compaction-toggle', (e) => {
                this.compactionEnabled = e.detail.enabled;
                this.log(e.detail.enabled
                    ? 'Compactación habilitada para este esquema dinámico.'
                    : 'Compactación deshabilitada: solo se fusionan huecos adyacentes al liberar procesos.');
            });
            this.root.addEventListener('compact', () => this.compact());
            this.root.addEventListener('reset', () => this.applyScheme(this.scheme, this.lastParams, true, true));
            this.root.addEventListener('process-load', (e) => this.allocate(e.detail.id));
            this.root.addEventListener('process-free', (e) => this.freeProcess(e.detail.id));
            this.root.addEventListener('process-add', (e) => this.addCustomProcess(e.detail));
        }

        addCustomProcess({name, segments}) {
            const nextId = `P${this.processes.length + 1}`;
            const newProc = new NS.Process(nextId, name, segments);
            this.processes.push(newProc);
            this.log(`✓ Proceso ${nextId} (${name}, ${newProc.getSize()} KiB) agregado a la lista.`, 'good');
            this.render();
        }

        handleSchemeChange(scheme) {
            const params = scheme === 'fixed' ? {count: 8} : scheme === 'variable'
                ? {sizes: [300, 700, 150, 1500, 450, 2000, 1000, 10284]}
                : {};
            this.applyScheme(scheme, params, true);
            this.log(`Esquema cambiado a: ${this.schemeLabel(scheme)}.`);
        }

        schemeLabel(scheme) {
            return {
                fixed: 'particiones fijas iguales',
                variable: 'particiones fijas variables',
                dynamic: 'particiones dinámicas',
            }[scheme];
        }

        applyScheme(scheme, params = {}, clearLog = false, isReset = false) {
            if (clearLog) this.eventLog.clear();
            this.scheme = scheme;
            this.lastParams = params;

            try {
                if (scheme === 'fixed') {
                    this.memory = StaticMemory.equalPartitions(TOTAL_KIB, params.count || 8);
                } else if (scheme === 'variable') {
                    this.memory = StaticMemory.customPartitions(TOTAL_KIB, params.sizes || []);
                } else {
                    this.memory = new DynamicMemory(TOTAL_KIB);
                }
            } catch (err) {
                this.log(`✗ ${err.message}`, 'warn');
                return;
            }

            if (!this.processes || this.processes.length === 0 || isReset) {
                this.processes = createDefaultProcesses();
            } else {
                this.processes.forEach((p) => p.unload());
            }
            this.compactionEnabled = false;
            this.schemePanel.setScheme(scheme);
            this.schemePanel.setCompaction(false);

            if (isReset) this.log('Simulación reiniciada.');
            this.render();
        }

        allocate(processId) {
            const process = this.processes.find((p) => p.id === processId);
            if (!process || !process.isWaiting()) return;

            const needed = process.getSize();
            const chosenBlock = this.memory.allocate(process, this.algorithm);

            if (!chosenBlock) {
                this.log(`✗ ${process.id} (${process.name}, ${needed} KiB) rechazado: no hay hueco/partición suficientemente grande.`, 'warn');
                return;
            }

            if (this.scheme === 'dynamic') {
                this.log(`✓ ${process.id} asignado en ${toHex(chosenBlock.start)} (exacto, ${needed} KiB) — sin fragmentación interna.`, 'good');
            } else {
                const frag = chosenBlock.internalFragmentation(process);
                this.log(`✓ ${process.id} asignado a partición [${toHex(chosenBlock.start)}, ${chosenBlock.size} KiB] — fragmentación interna: ${frag} KiB.`, 'good');
            }

            this.render();
        }

        freeProcess(processId) {
            const process = this.processes.find((p) => p.id === processId);
            if (!process || !process.isLoaded()) return;

            this.memory.free(process);
            this.log(`↩ ${process.id} liberado. Memoria devuelta a la lista de huecos.`);
            this.render();
        }

        compact() {
            if (this.scheme !== 'dynamic' || typeof this.memory.compact !== 'function') return;
            const processesById = new Map(this.processes.map((p) => [p.id, p]));
            this.memory.compact(processesById);
            this.log('⇥ Compactación ejecutada: todos los procesos desplazados al inicio, hueco único al final.', 'good');
            this.render();
        }

        computeInternalFragmentation() {
            return this.memory.getOccupiedBlocks().reduce((sum, block) => {
                const proc = this.processes.find((p) => p.id === block.processId);
                return sum + (proc ? block.internalFragmentation(proc) : 0);
            }, 0);
        }

        render() {
            this.processList.processes = this.processes;
            this.memoryMap.data = {memory: this.memory, processes: this.processes};
            this.memoryLegend.processes = this.processes;
            this.memoryStats.data = {memory: this.memory, internalFrag: this.computeInternalFragmentation()};
            this.blockTable.data = {memory: this.memory, processes: this.processes};
        }

        log(message, kind) {
            this.eventLog.add(message, kind);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        new App(document.querySelector('#app'));
    });

})();