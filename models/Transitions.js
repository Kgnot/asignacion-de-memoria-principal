(function () {
    const NS = (window.MemSim = window.MemSim || {});

    function createTransition(table) {
        return (state, event) => table[state]?.[event] ?? null;
    }

    NS.createTransition = createTransition;
})();