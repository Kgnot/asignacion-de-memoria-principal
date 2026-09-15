// Un segmento es el como esta dividido el proceso es decir: nombre y tamaño
(function () {
    const NS = (window.MemSim = window.MemSim || {});

    class Segment {

        constructor(name, size) {
            if (typeof size !== 'number' || size <= 0) {
                throw new Error(`El segmento "${name}" necesita un tamaño positivo, recibió: ${size}`);
            }
            this.name = name;
            this.size = size;
        }

        static totalSize(segments) {
            return segments.reduce((total, segment) => total + segment.size, 0);
        }

        describe() {
            return `${this.name}: ${this.size} KiB`;
        }
    }

    NS.Segment = Segment;
})();
