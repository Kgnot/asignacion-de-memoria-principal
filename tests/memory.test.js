(function () {
    const NS = window.MemSim;
    const config = NS.MEMORY_CONFIG;
    const schemes = NS.MEMORY_SCHEMES;

    function assert(condition, message) {
        if (!condition) throw new Error(`FALLO: ${message}`);
    }

    function assertMemoryInvariant(memory) {
        const stats = memory.getStats();
        assert(stats.totalFree + stats.totalOccupied === config.ramBytes, 'ocupado + libre debe ser igual a la RAM');
    }

    function runMemoryTests() {
        const system = NS.createSystemProcess();
        const processes = NS.createDefaultProcesses();
        const p4 = processes.find((process) => process.id === 'P4');
        const p8 = processes.find((process) => process.id === 'P8');
        const manager = new NS.MemoryManager(config.ramBytes, system);

        manager.load(p4);
        assert(p4.segmentTable.length === 5, 'P4 debe tener cinco segmentos');
        assert(p4.segmentTable[0].pageTable.length === 2, '.text de P4 debe ocupar dos páginas');
        assert(p4.segmentTable[3].pageTable.length === 2, 'heap de P4 debe ocupar dos páginas');
        assert(manager.translate(p4, 0x010123) === 0x110123, 'la traducción paginada de P4 debe ser 0x110123');
        assertMemoryInvariant(manager.memory);
        manager.unload(p4);
        manager.load(p8);
        assert(p8.segmentTable.length === 14, 'P8 debe tener catorce segmentos');
        assert(p8.segmentTable.reduce((sum, segment) => sum + segment.pageTable.length, 0) === 43, 'P8 debe ocupar 43 páginas');
        assertMemoryInvariant(manager.memory);

        const segmented = new NS.SegmentedMemory(config.ramBytes, system);
        const pureP4 = NS.createDefaultProcesses().find((process) => process.id === 'P4');
        segmented.load(pureP4);
        const physical = segmented.translate(pureP4, 3, 5000, 'R');
        assert(physical === pureP4.segmentTable[3].base + 5000, 'segmentación pura debe sumar base + offset');
        let addressingFailed = false;
        try { segmented.translate(pureP4, 2, 1123, 'R'); } catch (error) { addressingFailed = error instanceof NS.AddressingError; }
        assert(addressingFailed, 'un offset fuera de .bss debe producir AddressingError');
        let protectionFailed = false;
        try { segmented.translate(pureP4, 0, 0, 'W'); } catch (error) { protectionFailed = error instanceof NS.ProtectionError; }
        assert(protectionFailed, 'escribir en .text debe producir ProtectionError');
        assertMemoryInvariant(segmented);

        manager.setScheme(schemes.DYNAMIC);
        assert(p8.isWaiting(), 'cambiar de esquema debe descargar los procesos');
        assert(manager.memory.getOccupiedBlocks().length === 1, 'tras cambiar solo debe quedar el SO');

        console.log('OK: pruebas de memoria completadas');
    }

    NS.runMemoryTests = runMemoryTests;
})();
