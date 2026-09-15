(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {toHex} = NS;

    class BlockTable extends HTMLElement {

        connectedCallback() {
            if (!this.querySelector('table')) {
                this.innerHTML = `
                    <table>
                        <thead>
                            <tr>
                                <th>#</th><th>Inicio</th><th>Fin</th><th>Tamaño (KiB)</th>
                                <th>Estado</th><th>Proceso</th><th>Frag. interna</th>
                            </tr>
                        </thead>
                        <tbody data-role="rows"></tbody>
                    </table>
                `;
            }
        }

        set data({memory, processes}) {
            this._memory = memory;
            this._processes = processes;
            this.render();
        }

        render() {
            const tbody = this.querySelector('[data-role="rows"]');
            if (!tbody || !this._memory) return;
            tbody.innerHTML = '';

            const sorted = [...this._memory.blocks].sort((a, b) => a.start - b.start);
            sorted.forEach((block, i) => {
                const proc = block.isOccupied() ? this._processes.find((p) => p.id === block.processId) : null;
                const frag = proc ? block.internalFragmentation(proc) : '—';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${i}</td>
                    <td>${toHex(block.start)}</td>
                    <td>${toHex(block.getEnd())}</td>
                    <td>${block.size}</td>
                    <td><span class="tag ${block.isOccupied() ? 'tag-busy' : 'tag-free'}">${block.isOccupied() ? 'Ocupado' : 'Libre'}</span></td>
                    <td class="name-cell">${proc ? proc.id + ' — ' + proc.name : '—'}</td>
                    <td>${frag}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    customElements.define('block-table', BlockTable);
})();
