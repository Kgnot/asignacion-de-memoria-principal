// Bytes -> dirección hexadecimal de 6 dígitos, ej: 500 -> "0x0001F4"
(function () {
    const NS = (window.MemSim = window.MemSim || {});

    function toHex(bytes) {
        return '0x' + bytes.toString(16).toUpperCase().padStart(6, '0');
    }

    NS.toHex = toHex;
})();
