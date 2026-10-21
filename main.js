//  Determinamos primero lo que son los Kilobites dados
// 2^24
(function () {
    const NS = window.MemSim;
    const {StaticMemory, MemoryManager, ALLOCATION_ALGORITHMS, createDefaultProcesses, createSystemProcess, toHex} = NS;

    const TOTAL_BYTES = 16777216;


    class App {
        constructor(root) {
            this.root = root;
            this.scheme = 'unified';
            this.algorithm = ALLOCATION_ALGORITHMS.FIRST_FIT;
            this.compactionEnabled = false;
            this.processes = [];
            this.systemProcess = createSystemProcess();
            this.manager = new MemoryManager(TOTAL_BYTES, this.systemProcess);
            this.memory = null;

            this.schemePanel = root.querySelector('scheme-panel');
            this.processList = root.querySelector('process-list');
            this.memoryMap = root.querySelector('memory-map');
            this.memoryLegend = root.querySelector('memory-legend');
            this.memoryStats = root.querySelector('memory-stats');
            this.blockTable = root.querySelector('block-table');
            this.eventLog = root.querySelector('event-log');
            this.processDetailsModal = root.querySelector('process-details-modal');

            this.bindEvents();
            this.applyScheme('unified', {});
            this.log('Simulador listo. Esquema inicial: segmentación paginada unificada.');
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
            this.root.addEventListener('process-clone', (e) => this.cloneProcess(e.detail.id));
            this.root.addEventListener('process-delete', (e) => this.deleteProcess(e.detail.id));
            this.root.addEventListener('process-select', (e) => this.openProcessDetails(e.detail.id, e.detail.opener));
            this.root.addEventListener('memory-block-select', (e) => {
                if (e.detail.process) {
                    this.processDetailsModal.show({
                        process: e.detail.process,
                        block: e.detail.block,
                        manager: this.manager,
                    });
                }
            });
        }

        handleSchemeChange(scheme) {
            if (scheme !== this.scheme && !window.confirm('Cambiar el esquema reiniciará la memoria y descargará las aplicaciones. ¿Continuar?')) {
                this.schemePanel.setScheme(this.scheme);
                return;
            }
            const params = scheme === 'fixed' ? {count: 8} : scheme === 'variable'
                ? {sizes: [300000, 700000, 150000, 1500000, 450000, 2000000, 1000000]}
                : {};
            this.applyScheme(scheme, params, true);
            this.log(`Esquema cambiado a: ${this.schemeLabel(scheme)}.`);
        }

        schemeLabel(scheme) {
            return {
                fixed: 'particiones fijas iguales',
                variable: 'particiones fijas variables',
                dynamic: 'particiones dinámicas',
                segmented: 'segmentación',
                paging: 'paginación',
                unified: 'segmentación paginada unificada',
            }[scheme];
        }

        applyScheme(scheme, params = {}, clearLog = false, isReset = false) {
            if (clearLog) this.eventLog.clear();
            this.scheme = scheme;
            this.lastParams = params;

            try {
                if (scheme === 'variable') {
                    this.manager.scheme = scheme;
                    this.manager.memory = StaticMemory.customPartitions(TOTAL_BYTES, params.sizes || [], this.systemProcess);
                } else {
                    this.manager.setScheme(scheme);
                }
                this.memory = this.manager.memory;
            } catch (err) {
                this.log(`✗ ${err.message}`, 'warn');
                return;
            }

            this.processes = [this.systemProcess, ...createDefaultProcesses()];
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
            let chosenBlock = this.manager.load(process, this.algorithm);

            if (!chosenBlock && this.scheme === 'segmented') {
                const stats = this.memory.getStats();
                const largestSegment = Math.max(...process.sections.map((section) => Math.min(section.size, 262144)));
                if (stats.totalFree >= process.getSize() && stats.largestHole < largestSegment) {
                    this.memory.compact(new Map(this.processes.map((candidate) => [candidate.id, candidate])));
                    this.log('⇥ Compactación automática: memoria libre suficiente, pero fragmentada.', 'good');
                    chosenBlock = this.manager.load(process, this.algorithm);
                }
            }

            if (!chosenBlock) {
                this.log(`✗ ${process.id} (${process.name}, ${needed} bytes) rechazado: no hay memoria suficiente.`, 'warn');
                return;
            }

            if (this.scheme === 'dynamic') {
                this.log(`✓ ${process.id} asignado en ${toHex(chosenBlock.start)} (exacto, ${needed} bytes).`, 'good');
            } else if (this.scheme === 'segmented') {
                const count = process.segmentBlocks.length;
                this.log(`✓ ${process.id} segmentado en ${count} bloque(s) de hasta 262144 bytes.`, 'good');
            } else if (this.scheme === 'paging') {
                this.log(`✓ ${process.id} paginado en ${process.pageTable.length} marco(s).`, 'good');
            } else {
                const frag = chosenBlock.internalFragmentation(process);
                this.log(`✓ ${process.id} asignado a partición [${toHex(chosenBlock.start)}, ${chosenBlock.size} bytes] — fragmentación interna: ${frag} bytes.`, 'good');
            }

            this.render();
        }

        freeProcess(processId) {
            const process = this.processes.find((p) => p.id === processId);
            if (!process || process.isSystem() || !process.isLoaded()) return;

            this.manager.unload(process);
            this.log(`↩ ${process.id} liberado. Memoria devuelta a la lista de huecos.`);
            this.render();
        }

        cloneProcess(processId) {
            const source = this.processes.find((process) => process.id === processId);
            if (!source || !source.isApplication()) return;

            const instanceCount = this.processes.filter((process) => process.baseId === source.baseId).length + 1;
            const instance = source.clone(`${source.baseId}-${instanceCount}`);
            this.processes.push(instance);
            this.log(`＋ Nueva instancia de ${source.name}: ${instance.id}.`, 'good');
            this.render();
        }

        deleteProcess(processId) {
            const index = this.processes.findIndex((process) => process.id === processId);
            const process = index >= 0 ? this.processes[index] : null;
            if (!process || process.isSystem()) return;

            if (process.isLoaded()) this.manager.unload(process);
            this.processes.splice(index, 1);
            this.processDetailsModal.close();
            this.log(`× ${process.id} eliminado de la simulación.`, 'good');
            this.render();
        }

        compact() {
            if (!['dynamic', 'segmented'].includes(this.scheme) || typeof this.memory.compact !== 'function') return;
            const processesById = new Map(this.processes.map((p) => [p.id, p]));
            this.memory.compact(processesById);
            this.log('⇥ Compactación ejecutada: todos los procesos desplazados al inicio, hueco único al final.', 'good');
            this.render();
        }

        computeInternalFragmentation() {
            if (this.scheme === 'segmented' || this.scheme === 'dynamic') return 0;
            if (this.scheme === 'paging') {
                return this.processes
                    .filter((process) => process.isLoaded())
                    .reduce((sum, process) => sum + this.memory.getInternalFragmentation(process), 0);
            }
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
            this.processDetailsModal.refresh(this.manager);
        }

        openProcessDetails(processId, opener) {
            const process = this.processes.find((candidate) => candidate.id === processId);
            if (process) this.processDetailsModal.show({process, manager: this.manager, opener});
        }

        log(message, kind) {
            this.eventLog.add(message, kind);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        new App(document.querySelector('#app'));
    });

})();