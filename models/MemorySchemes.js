(function () {
    const NS = (window.MemSim = window.MemSim || {});
    NS.MEMORY_SCHEMES = Object.freeze({
        PAGED_SEGMENTED: 'paged-segmented',
        DYNAMIC: 'dynamic',
        SEGMENTED: 'segmented',
        PAGING: 'paging',
        STATIC: 'static',
    });
})();