(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {PROCESS_EVENTS, PROCESS_STATES, processTransition: transition} = NS;

    class Process {


        constructor(id, name, sections, kind = 'application') {
            this.id = id;
            this.name = name;
            this.sections = sections;
            this.segments = sections;
            this.kind = kind;

            this.status = PROCESS_STATES.WAITING;
            this.segmentTable = [];
            this.pageTable = [];
            this.frames = [];
            this.segmentBlocks = [];
        }


        getSize() {
            return this.sections.reduce((total, section) => total + section.size, 0);
        }

        splitSections(limit) {
            return this.sections.flatMap((section) => section.split(limit));
        }

        // pregunta si el evento tiene una transicion valida desde el actual
        can(event) {
            return transition(this.status, event) !== null;
        }

        // Unico punto para cambiar el tema del estado

        dispatch(event) {
            const nextState = transition(this.status, event);
            if (nextState == null) {
                throw new Error(`Evento inválido en ${this.id}: "${event}" no aplica en estado ${this.status}`);
            }
            this.status = nextState;
            return nextState;
        }

        load(allocation = {}) {
            this.dispatch(PROCESS_EVENTS.LOAD);
            this.segmentTable = allocation.segmentTable || [];
            this.pageTable = allocation.pageTable || [];
            this.frames = allocation.frames || [];
        }

        unload() {
            this.dispatch(PROCESS_EVENTS.UNLOAD);
            this.segmentTable = [];
            this.pageTable = [];
            this.frames = [];
        }

        terminate() {
            this.dispatch(PROCESS_EVENTS.TERMINATE);
            this.segmentTable = [];
            this.pageTable = [];
            this.frames = [];
        }

        isWaiting() {
            return this.status === PROCESS_STATES.WAITING;
        }

        isLoaded() {
            return this.status === PROCESS_STATES.LOADED;
        }

        isTerminated() {
            return this.status === PROCESS_STATES.TERMINATED;
        }

        isSystem() {
            return this.kind === 'system';
        }

        isApplication() {
            return this.kind === 'application';
        }

    }

    NS.Process = Process;

    class SystemProcess extends Process {
        constructor(size) {
            super('SO', 'Sistema operativo', [new NS.ProgramSection('kernel', size)], 'system');
            this.load();
        }
    }

    class ApplicationProcess extends Process {
        constructor(id, name, sections, baseId = id) {
            super(id, name, sections, 'application');
            this.baseId = baseId;
        }

        clone(id) {
            const sections = this.sections.map((section) => new NS.ProgramSection(section.name, section.size, section.permissions));
            return new ApplicationProcess(id, this.name, sections, this.baseId);
        }
    }

    NS.SystemProcess = SystemProcess;
    NS.ApplicationProcess = ApplicationProcess;
})();
