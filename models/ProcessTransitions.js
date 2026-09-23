(function () {
    const NS = (window.MemSim = window.MemSim || {});

    const PROCESS_STATES = Object.freeze({
        WAITING: 'WAITING',
        LOADED: 'LOADED',
        TERMINATED: 'TERMINATED',
    })

    const PROCESS_EVENTS = Object.freeze({
        LOAD: 'LOAD',
        UNLOAD: 'UNLOAD',
        TERMINATE: 'TERMINATE',
    })

    const TRANSITIONS = Object.freeze({
        [PROCESS_STATES.WAITING]: {
            [PROCESS_EVENTS.LOAD]: PROCESS_STATES.LOADED,
        },
        [PROCESS_STATES.LOADED]: {
            [PROCESS_EVENTS.UNLOAD]: PROCESS_STATES.WAITING,
            [PROCESS_EVENTS.TERMINATE]: PROCESS_STATES.TERMINATED,
        },
        [PROCESS_STATES.TERMINATED]: {},
    });

    function transition(currentState, event) {
        return TRANSITIONS[currentState]?.[event] ?? null;
    }

    NS.PROCESS_STATES = PROCESS_STATES;
    NS.PROCESS_EVENTS = PROCESS_EVENTS;
    NS.processTransition = transition;
})();