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

        split(limit) {
            const parts = [];
            let remaining = this.size;
            let part = 0;
            while (remaining > 0) {
                const size = Math.min(remaining, limit);
                const section = new ProgramSection(this.name, size, this.permissions);
                section.part = part;
                parts.push(section);
                remaining -= size;
                part += 1;
            }
            return parts;
        }

        describe() {
            return `${this.name}: ${this.size} bytes (${this.permissions})`;
        }
    }

    NS.ProgramSection = ProgramSection;
})();