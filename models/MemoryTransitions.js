(function () {
    const NS = (window.MemSim = window.MemSim || {});

// El bloque de memoria tiene dos estados, free y ocupado
    const BLOCK_STATES = Object.freeze({
        FREE: 'FREE',
        OCCUPIED: 'OCCUPIED',
    });

// Y tiene dos eventos, el de asignar o el de liberar
    const BLOCK_EVENTS = Object.freeze({
        ASSIGN: 'ASSIGN',
        RELEASE: 'RELEASE',
    });

// Las transiciones
    const TRANSITIONS = Object.freeze({
        [BLOCK_STATES.FREE]: {
            [BLOCK_EVENTS.ASSIGN]: BLOCK_STATES.OCCUPIED,
        },
        [BLOCK_STATES.OCCUPIED]: {
            [BLOCK_EVENTS.RELEASE]: BLOCK_STATES.FREE,
        },
    });

    function transition(currentState, event) {
        return TRANSITIONS[currentState]?.[event] ?? null;
    }

    NS.BLOCK_STATES = BLOCK_STATES;
    NS.BLOCK_EVENTS = BLOCK_EVENTS;
    NS.blockTransition = transition;
})();
