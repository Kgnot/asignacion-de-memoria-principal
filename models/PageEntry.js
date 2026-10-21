(function () {
    const NS = (window.MemSim = window.MemSim || {});

    class PageEntry {
        constructor(page, frame, validBytes, permissions) {
            this.page = page;
            this.frame = frame;
            this.validBytes = validBytes;
            this.permissions = permissions;
        }
    }

    NS.PageEntry = PageEntry;
})();