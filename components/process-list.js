(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {colorForIndex, Process, Segment} = NS;

    class ProcessList extends HTMLElement {
// proceso Personalizado 
        ensureDOM() {
            if (!this.querySelector('[data-role="list"]')) {
                this.innerHTML = `
                    <section class="panel">
                        <h2>Procesos simulados</h2>
                        <div data-role="list"></div>
                        
                        <div style="margin-top:16px; padding-top:12px; border-top:1px dashed var(--border);">
                            <h3 style="font-size:11.5px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); margin:0 0 8px;">+ Agregar Proceso Personalizado</h3>
                            <div style="display:flex; flex-direction:column; gap:8px;">
                                <div>
                                    <label style="font-size:11px; color:var(--muted); display:block; margin:0 0 3px;">Nombre del proceso</label>
                                    <input type="text" id="newProcName" placeholder="" style="width:100%; font-size:12px; padding:6px 8px;">
                                </div>
                                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px;">
                                    <div>
                                        <label style="font-size:10.5px; color:var(--muted); display:block; margin:0 0 2px;">Code (KiB)</label>
                                        <input type="number" id="newProcCode" min="1" value="200" style="width:100%; font-size:12px; padding:5px 6px;">
                                    </div>
                                    <div>
                                        <label style="font-size:10.5px; color:var(--muted); display:block; margin:0 0 2px;">Data (KiB)</label>
                                        <input type="number" id="newProcData" min="1" value="100" style="width:100%; font-size:12px; padding:5px 6px;">
                                    </div>
                                    <div>
                                        <label style="font-size:10.5px; color:var(--muted); display:block; margin:0 0 2px;">Stack (KiB)</label>
                                        <input type="number" id="newProcStack" min="1" value="50" style="width:100%; font-size:12px; padding:5px 6px;">
                                    </div>
                                </div>
                                <button type="button" data-action="add-proc-btn" class="primary" style="width:100%; margin-top:4px; padding:8px; font-size:12.5px; cursor:pointer;">
                                     Agregar a la Lista
                                </button>
                            </div>
                        </div>
                    </section>
                `;
                this.bindAddButton();
            }
        }

        connectedCallback() {
            this.ensureDOM();
            if (this._processes) {
                this.render();
            }
        }

        bindAddButton() {
            const addBtn = this.querySelector('[data-action="add-proc-btn"]');
            if (addBtn) {
                addBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const nameInput = this.querySelector('#newProcName');
                    const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Proceso';
                    const codeSize = parseInt(this.querySelector('#newProcCode').value, 10) || 100;
                    const dataSize = parseInt(this.querySelector('#newProcData').value, 10) || 50;
                    const stackSize = parseInt(this.querySelector('#newProcStack').value, 10) || 30;

                    const segments = [
                        new Segment('code', codeSize),
                        new Segment('data', dataSize),
                        new Segment('stack', stackSize)
                    ];

                    this.dispatchEvent(new CustomEvent('process-add', {
                        detail: { name, segments },
                        bubbles: true
                    }));

                    if (nameInput) nameInput.value = '';
                });
            }
        }

        set processes(processes) {
            this._processes = processes;
            this.ensureDOM();
            this.render();
        }

        render() {
            this.ensureDOM();
            const container = this.querySelector('[data-role="list"]');
            if (!container || !this._processes) return;
            container.innerHTML = '';
            this._processes.forEach((process, i) => {
                const card = document.createElement('process-card');
                card.data = {process, color: colorForIndex(i)};
                container.appendChild(card);
            });
        }
    }

    customElements.define('process-list', ProcessList);
})();
