(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {hasPermissions, AddressingError, ProtectionError} = NS;

    class Segment {

        constructor({number, base = null, limit, permissions = 'RW', sectionName = null}) {
            if (!Number.isInteger(number) || number < 0) {
                throw new Error(`El segmento necesita un número válido, recibió: ${number}`);
            }
            if (base !== null && (typeof base !== 'number' || base < 0)) {
                throw new Error(`El segmento ${number} necesita una base válida, recibió: ${base}`);
            }
            if (typeof limit !== 'number' || limit <= 0) {
                throw new Error(`El segmento ${number} necesita un límite positivo, recibió: ${limit}`);
            }
            this.number = number;
            this.base = base;
            this.limit = limit;
            this.permissions = permissions;
            this.sectionName = sectionName;
            this.pageTable = [];
            this.sectionPart = null;
        }

        containsOffset(offset) {
            return offset >= 0 && offset < this.limit;
        }

        canAccess(access) {
            return hasPermissions(this.permissions, access);
        }

        translate(offset, access = 'R') {
            if (this.base === null) {
                throw new Error(`El segmento ${this.number} aún no está cargado`);
            }
            if (!this.containsOffset(offset)) {
                throw new AddressingError(`Error de direccionamiento: offset ${offset} fuera del límite del segmento ${this.number}`);
            }
            if (!this.canAccess(access)) {
                throw new ProtectionError(`Error de protección: acceso ${access} no permitido en el segmento ${this.number} (${this.permissions})`);
            }
            return this.base + offset;
        }
    }

    NS.Segment = Segment;
})();
