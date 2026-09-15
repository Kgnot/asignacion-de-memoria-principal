// KiB -> dirección hexadecimal de 6 dígitos, ej: 500 -> "0x07D000"
(function () {
    const NS = (window.MemSim = window.MemSim || {});

    function toHex(kib) {
        return '0x' + (kib * 1024).toString(16).toUpperCase().padStart(6, '0');
    }

    NS.toHex = toHex;
})();
