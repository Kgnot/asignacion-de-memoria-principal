(function () {
    const NS = (window.MemSim = window.MemSim || {});
    class PagedSegmentedMemory extends NS.UnifiedMemory {}
    NS.PagedSegmentedMemory = PagedSegmentedMemory;
})();