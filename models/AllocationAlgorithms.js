(function () {
    const NS = (window.MemSim = window.MemSim || {});

    const ALLOCATION_ALGORITHMS = Object.freeze({
        FIRST_FIT: 'FIRST_FIT',
        BEST_FIT: 'BEST_FIT',
        WORST_FIT: 'WORST_FIT',
    });

    function firstFit(candidates) {
        return [...candidates].sort((a, b) => a.start - b.start)[0];
    }

    function bestFit(candidates) {
        return [...candidates].sort((a, b) => (a.size - b.size) || (a.start - b.start))[0];
    }

    function worstFit(candidates) {
        return [...candidates].sort((a, b) => (b.size - a.size) || (a.start - b.start))[0];
    }

// relacionamos u¿n algorutmo con la referencia de la funcion
    const STRATEGIES = Object.freeze({
        [ALLOCATION_ALGORITHMS.FIRST_FIT]: firstFit,
        [ALLOCATION_ALGORITHMS.BEST_FIT]: bestFit,
        [ALLOCATION_ALGORITHMS.WORST_FIT]: worstFit,
    });


    function chooseBlock(candidates, algorithm) {
        if (candidates.length === 0) return null;

        const strategy = STRATEGIES[algorithm];
        if (!strategy) {
            throw new Error(`Algoritmo de asignación desconocido: ${algorithm}`);
        }
        return strategy(candidates);
    }

    NS.ALLOCATION_ALGORITHMS = ALLOCATION_ALGORITHMS;
    NS.chooseBlock = chooseBlock;
})();
