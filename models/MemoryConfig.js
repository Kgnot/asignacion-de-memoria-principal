(function () {
    const NS = (window.MemSim = window.MemSim || {});

    // Dirección lógica unificada: 6 bits de segmento | 2 de página | 16 de offset.
    const MEMORY_CONFIG = Object.freeze({
        ramBytes: 2 ** 24,
        addressBits: 24,
        osBytes: 2 ** 20,
        stackBytes: 2 ** 16,
        heapBytes: 2 ** 17,
        segmentBits: 6,
        pageBits: 2,
        offsetBits: 16,
        pureSegmentOffsetBits: 18,
        pageSize: 2 ** 16,
        segmentSize: 2 ** 18,
        frameCount: 2 ** 8,
        systemFrameCount: 2 ** 4,
        maxSegments: 2 ** 6,
        pagesPerSegment: 2 ** 2,
    });

    if (MEMORY_CONFIG.ramBytes % MEMORY_CONFIG.pageSize !== 0) {
        throw new Error('La RAM debe ser múltiplo del tamaño de página');
    }
    if (MEMORY_CONFIG.segmentSize % MEMORY_CONFIG.pageSize !== 0) {
        throw new Error('El tamaño de segmento debe ser múltiplo del tamaño de página');
    }

    NS.MEMORY_CONFIG = MEMORY_CONFIG;
})();