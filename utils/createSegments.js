(function () {
    const NS = (window.MemSim = window.MemSim || {});

    function createSegments(sizes) {
        return Object.entries(sizes).map(([name, size]) => new NS.Segment(name, size));
    }

    NS.createSegments = createSegments;
})();
