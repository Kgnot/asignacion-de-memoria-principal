// El bloque de memoria tiene dos estados, free y ocupado
export const BLOCK_STATES = Object.freeze({
    FREE: 'FREE',
    OCCUPIED: 'OCCUPIED',
});

// Y tiene dos eventos, el de asignar o el de liberar
export const BLOCK_EVENTS = Object.freeze({
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

export function transition(currentState, event) {
    return TRANSITIONS[currentState]?.[event] ?? null;
}