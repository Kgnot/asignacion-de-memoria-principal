(function () {
    const NS = (window.MemSim = window.MemSim || {});

    function createSections(sizes) {
        return Object.entries(sizes).map(([name, definition]) => {
            const size = typeof definition === 'number' ? definition : definition.size;
            const permissions = typeof definition === 'number'
                ? (name === 'text' || name === '.text' || name === 'code' ? 'RX' : 'RW')
                : definition.permissions;
            return new NS.ProgramSection(name, size, permissions);
        });
    }

    NS.createSections = createSections;
})();