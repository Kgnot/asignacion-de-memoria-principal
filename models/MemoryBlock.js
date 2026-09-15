(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {BLOCK_EVENTS, BLOCK_STATES, blockTransition: transition} = NS;

    class MemoryBlock {


        constructor(start, size) {
            this.start = start;
            this.size = size;

            this.status = BLOCK_STATES.FREE;
            this.processId = null;
        }

        // devolvemos el final
        getEnd() {
            return this.start + this.size;
        }

        // para el tema de los eventos, el can (para mas detalle podremos ir a process en models xd)
        can(event) {
            return transition(this.status, event) != null;
        }

        dispatch(event) {
            const nextState = transition(this.status, event);
            if (nextState === null) {
                throw new Error(`Bloque [${this.start}, ${this.size}]: evento inválido "${event}" en estado ${this.status}`);
            }
            this.status = nextState;
            return nextState;
        }

        occupy(process) {
            this.occupyWithId(process.id);
        }

        // para el tema de si solo tenemos el id
        occupyWithId(id) {
            this.dispatch(BLOCK_EVENTS.ASSIGN);
            this.processId = id;
        }

        release() {
            this.dispatch(BLOCK_EVENTS.RELEASE);
            this.processId = null;
        }

        isFree() {
            return this.status === BLOCK_STATES.FREE;
        }

        isOccupied() {
            return this.status === BLOCK_STATES.OCCUPIED;
        }

        // TODO
        internalFragmentation(process) {
            if (!process) return 0;
            return this.size - process.getSize();
        }
    }

    NS.MemoryBlock = MemoryBlock;
})();