(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const config = NS.MEMORY_CONFIG;
    const pageMask = (2 ** config.pageBits) - 1;
    const offsetMask = (2 ** config.offsetBits) - 1;
    const segmentMask = (2 ** config.segmentBits) - 1;

    function decode(address) {
        if (!Number.isInteger(address) || address < 0 || address >= config.ramBytes) {
            throw new Error(`Dirección lógica inválida: ${address}`);
        }
        return {
            segment: (address >>> (config.pageBits + config.offsetBits)) & segmentMask,
            page: (address >>> config.offsetBits) & pageMask,
            offset: address & offsetMask,
        };
    }

    function encode({segment, page = 0, offset = 0}) {
        if (!Number.isInteger(segment) || segment < 0 || segment > segmentMask) throw new Error('Segmento inválido');
        if (!Number.isInteger(page) || page < 0 || page > pageMask) throw new Error('Página inválida');
        if (!Number.isInteger(offset) || offset < 0 || offset > offsetMask) throw new Error('Offset inválido');
        return (segment << (config.pageBits + config.offsetBits)) | (page << config.offsetBits) | offset;
    }

    NS.LogicalAddress = Object.freeze({decode, encode, toHex: (address) => `0x${address.toString(16).toUpperCase().padStart(6, '0')}`});
})();