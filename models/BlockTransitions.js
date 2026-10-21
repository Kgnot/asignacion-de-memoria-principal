(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {createTransition} = NS;
    const BLOCK_STATES = Object.freeze({FREE: 'FREE', OCCUPIED: 'OCCUPIED'});
    const BLOCK_EVENTS = Object.freeze({ASSIGN: 'ASSIGN', RELEASE: 'RELEASE'});
    const blockTransition = createTransition({
        [BLOCK_STATES.FREE]: {[BLOCK_EVENTS.ASSIGN]: BLOCK_STATES.OCCUPIED},
        [BLOCK_STATES.OCCUPIED]: {[BLOCK_EVENTS.RELEASE]: BLOCK_STATES.FREE},
    });
    NS.BLOCK_STATES = BLOCK_STATES;
    NS.BLOCK_EVENTS = BLOCK_EVENTS;
    NS.blockTransition = blockTransition;
})();