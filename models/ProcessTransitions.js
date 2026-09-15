export const PROCESS_STATES = Object.freeze({
    WAITING: 'WAITING',
    LOADED: 'LOADED',
    TERMINATED: 'TERMINATED',
})

export const PROCESS_EVENTS = Object.freeze({
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
        [PROCESS_EVENTS.TERMINATED]: PROCESS_STATES.TERMINATED
    },
    [PROCESS_STATES.TERMINATE]: {}
})

export function transition(currentState, event) {
    return TRANSITIONS[currentState]?.[event] ?? null;
}