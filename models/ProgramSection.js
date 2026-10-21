(function () {
    const NS = (window.MemSim = window.MemSim || {});

    class ProgramSection {

        constructor(name, size, permissions = 'RW') {
            if (typeof size !== 'number' || size <= 0) {
                throw new Error(`La sección "${name}" necesita un tamaño positivo, recibió: ${size}`);
            }
            this.name = name;
            this.size = size;
            this.permissions = permissions;
        }

        describe() {
            return `${this.name}: ${this.size} bytes (${this.permissions})`;
        }
    }

    NS.ProgramSection = ProgramSection;
})();