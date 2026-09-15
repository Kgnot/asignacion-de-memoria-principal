// Ocho tonos legibles sobre fondo blanco, uno por proceso.
(function () {
    const NS = (window.MemSim = window.MemSim || {});

    const PROCESS_COLORS = [
        '#C1752B', // ámbar
        '#2F6F9E', // azul
        '#4C8C4C', // verde
        '#B3495B', // rosa
        '#6C57A6', // violeta
        '#2E8F82', // verde azulado
        '#A6763A', // ocre
        '#8A6248', // marrón
    ];

    function colorForIndex(index) {
        return PROCESS_COLORS[index % PROCESS_COLORS.length];
    }

    NS.PROCESS_COLORS = PROCESS_COLORS;
    NS.colorForIndex = colorForIndex;
})();
