import MemoryBlock from "./MemoryBlock";
import Memory from "./Memory";

class DynamicMemory extends Memory {

    constructor(totalSize) {
        super(totalSize);
        // arrancamos como un unico apartado grande
        this.blocks.push(new MemoryBlock(0, totalSize))
    }


    assign(block, process) {
        const needed = process.getSize();
        let occupiedBlock = block;

        if (block.size === needed) {
            block.occupy(process);
        } else {
            // buscamos el index del bloque que vamos a dividir
            const index = this.blocks.indexOf(block);
            // ahora creamos un nuevo bloque de memoria y le asignamos el proceso con la cantidad exacta de bits
            const occupied = new MemoryBlock(block.start, needed);
            occupied.occupy(process);
            // ahora el remainder creamos uno que empieza donde termina el anterior
            const remainder = new MemoryBlock(block.start + needed, block.size - needed);
            // y el splice, vamos al index, eliminamos le bloque de memoria, y le añadimos los otros dos que son como sus "mitades"
            this.blocks.splice(index, 1, occupied, remainder)
        }
        process.load(block.start);
        return occupiedBlock;
    }

    // al liberar intentamos fusionar con vecinos libres indemdiatamente
    afterFree() {
        this.mergeAdjacentFreeBlocks();
    }

    mergeAdjacentFreeBlocks() {
        this.sortByStart(); // ordenamos los bloques
        for (let i = this.blocks.length - 1; i > 0; i--) {
            const prev = this.blocks[i - 1];
            const curr = this.blocks[i];
            if (prev.isFree() && curr.isFree() && prev.getEnd() === curr.start) { // aqui los "unimos"
                prev.size += curr.size;
                this.blocks.splice(i, 1);
            }
        }
    }

    // aqui movemos todos los compactos la inicio y dejamos los vacios al final
    compact(processesById) {
        this.sortByStart(); // ordenamos por inicio
        const occupied = this.getOccupiedBlocks(); // obtenemos los bloques ocupados (por el filter)

        let start = 0;
        const newBlocks = [];

        for (const block of occupied) { // cada uno de los bloques ocupados
            const relocated = new MemoryBlock(start, block.size); // creamos uno iniciando start en 0
            relocated.occupyWithId(block.processId); // al bloque de memoria le asignamos el id del proceso
            newBlocks.push(relocated); // y al array de nuevos bloques lo agregamos
            // ahora actualizamos la posición del bloque en el proceso
            const process = processesById.get(block.processId);
            if (process) process.blockStart = start; //

            start += block.size;
        }
        // si el start es menor que el tamaño total, entonces hay espacio libre al final
        if (start < this.totalSize) {
            newBlocks.push(new MemoryBlock(start, this.totalSize - start));
        }

        this.blocks = newBlocks;
    }


}

export default DynamicMemory;