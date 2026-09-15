(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {PROCESS_EVENTS, PROCESS_STATES, processTransition: transition} = NS;

    class Process {


        constructor(id, name, segments) {
            this.id = id;
            this.name = name;
            this.segments = segments; // Es un arreglo de segmentos

            this.status = PROCESS_STATES.WAITING;
            this.blockStart = null;
        }


        getSize() {
            return this.segments.reduce((total, segment) => total + segment.size, 0);
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

        load(blockStart) {
            this.dispatch(PROCESS_EVENTS.LOAD);
            this.blockStart = blockStart;
        }

        unload() {
            this.dispatch(PROCESS_EVENTS.UNLOAD);
            this.blockStart = null;
        }

        terminate() {
            this.dispatch(PROCESS_EVENTS.TERMINATE);
            this.blockStart = null;
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

    }

    NS.Process = Process;
})();
