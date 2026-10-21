(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {ApplicationProcess, SystemProcess, createSections} = NS;
    const PROCESS_DEFINITIONS = [
        {id: 'P1', name: 'Calculadora', sections: {'.text': 60000, '.data': 20000, '.bss': 1000, heap: 131072, stack: 65536}},
        {id: 'P2', name: 'Word', sections: {'.text': 180000, '.data': 70000, '.bss': 5000, heap: 131072, stack: 65536}},
        {id: 'P3', name: 'Excel', sections: {'.text': 200000, '.data': 90000, '.bss': 8000, heap: 131072, stack: 65536}},
        {id: 'P4', name: 'Chrome', sections: {'.text': 115000, '.data': 123470, '.bss': 1123, heap: 131072, stack: 65536}},
        {id: 'P5', name: 'Spotify', sections: {'.text': 150000, '.data': 100000, '.bss': 8000, heap: 131072, stack: 65536}},
        {id: 'P6', name: 'AutoCAD', sections: {'.text': 260000, '.data': 400000, '.bss': 12000, heap: 131072, stack: 65536}},
        {id: 'P7', name: 'Editor grande', sections: {'.text': 300000, '.data': 900000, '.bss': 20000, heap: 131072, stack: 65536}},
        {id: 'P8', name: 'Programa grande', sections: {'.text': 349000, '.data': 2150000, '.bss': 1000, heap: 131072, stack: 65536}},
    ];

// creamos los proceso por defecto con el createSegments que os crea segun las definiciones
    function createDefaultProcesses() {
        return PROCESS_DEFINITIONS.map(
            ({id, name, sections}) => new ApplicationProcess(id, name, createSections(sections))
        );
    }

    function createSystemProcess(size = 1048576) {
        return new SystemProcess(size);
    }

    NS.createDefaultProcesses = createDefaultProcesses;
    NS.createSystemProcess = createSystemProcess;
})();
