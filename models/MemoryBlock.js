(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {BLOCK_EVENTS, BLOCK_STATES, blockTransition: transition} = NS;

    class MemoryBlock {


        constructor(start, size, metadata = {}) {
            this.start = start;
            this.size = size;
            this.info = {
                segmentName: metadata.segmentName || null,
                segmentIndex: metadata.segmentIndex ?? null,
                segmentNumber: metadata.segmentNumber ?? null,
                permissions: metadata.permissions || null,
                pageNumber: metadata.pageNumber ?? null,
                frameNumber: metadata.frameNumber ?? null,
            };

            this.status = BLOCK_STATES.FREE;
            this.processId = null;
            this.segment = null;
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
            this.info = {};
        }

        get segmentName() { return this.info.segmentName; }
        set segmentName(value) { this.info.segmentName = value; }
        get segmentIndex() { return this.info.segmentIndex; }
        set segmentIndex(value) { this.info.segmentIndex = value; }
        get segmentNumber() { return this.info.segmentNumber; }
        set segmentNumber(value) { this.info.segmentNumber = value; }
        get permissions() { return this.info.permissions; }
        set permissions(value) { this.info.permissions = value; }
        get pageNumber() { return this.info.pageNumber; }
        set pageNumber(value) { this.info.pageNumber = value; }
        get frameNumber() { return this.info.frameNumber; }
        set frameNumber(value) { this.info.frameNumber = value; }

        isFree() {
            return this.status === BLOCK_STATES.FREE;
        }

        isOccupied() {
            return this.status === BLOCK_STATES.OCCUPIED;
        }

    }

    NS.MemoryBlock = MemoryBlock;
})();