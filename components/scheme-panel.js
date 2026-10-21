(function () {
    class SchemePanel extends HTMLElement {

        connectedCallback() {
            this.render();
            this.bindEvents();
        }

        render() {
            this.innerHTML = `
                <section class="panel">
                    <h2>Configuración de memoria</h2>
                    <details data-role="configuration">
                        <summary>Cambiar esquema de gestión</summary>
                    <div class="radiogroup" data-role="scheme-radios">
                        <label><input type="radio" name="scheme" value="paged-segmented" checked> Segmentación paginada unificada</label>
                        <label><input type="radio" name="scheme" value="static"> Particiones estáticas — tamaño fijo</label>
                        <label><input type="radio" name="scheme" value="dynamic"> Particiones dinámicas</label>
                        <label><input type="radio" name="scheme" value="segmented"> Segmentación</label>
                        <label><input type="radio" name="scheme" value="paging"> Paginación</label>
                    </div>

                    <div data-role="fixed-controls">
                        <label for="numPart">Número de particiones iguales</label>
                        <input type="number" id="numPart" value="8" min="2" max="32">
                        <div class="btnrow"><button type="button" data-action="apply-fixed">Recalcular particiones</button></div>
                    </div>

                    <div data-role="dynamic-controls" hidden>
                        <div class="checkrow">
                            <input type="checkbox" id="compactionToggle">
                            <label for="compactionToggle" style="margin:0;">Habilitar compactación</label>
                        </div>
                        <div class="btnrow">
                            <button type="button" data-action="compact" disabled>Compactar memoria</button>
                        </div>
                        <p class="note">Sin compactación: al liberar un proceso solo se fusionan huecos <em>adyacentes</em>. La fragmentación externa dispersa no se elimina.</p>
                    </div>

                    <div data-role="segmented-controls" hidden>
                        <p class="note">Cada segmento se coloca por separado. Los segmentos mayores de 262144 bytes se dividen en varias partes.</p>
                    </div>

                    <div data-role="paging-controls" hidden>
                        <p class="note">Páginas de 65.536 bytes y marcos físicos de tamaño fijo. El S.O. ocupa los primeros 16 marcos.</p>
                    </div>

                    <label for="algoSelect">Algoritmo de asignación</label>
                    <select id="algoSelect">
                        <option value="FIRST_FIT">Primer ajuste (First Fit)</option>
                        <option value="BEST_FIT">Mejor ajuste (Best Fit)</option>
                        <option value="WORST_FIT">Peor ajuste (Worst Fit)</option>
                    </select>

                    <div class="btnrow">
                        <button type="button" class="primary" data-action="reset">Reiniciar simulación</button>
                    </div>
                    </details>
                </section>
            `;
        }

        bindEvents() {
            this.querySelectorAll('input[name=scheme]').forEach((radio) => {
                radio.addEventListener('change', (e) => {
                    this.querySelector('[data-role="fixed-controls"]').hidden = e.target.value !== 'static';
                    this.querySelector('[data-role="dynamic-controls"]').hidden = e.target.value !== 'dynamic';
                    this.querySelector('[data-role="segmented-controls"]').hidden = e.target.value !== 'segmented';
                    this.querySelector('[data-role="paging-controls"]').hidden = e.target.value !== 'paging';
                    this.emit('scheme-change', {scheme: e.target.value});
                });
            });

            this.querySelector('[data-action="apply-fixed"]').addEventListener('click', () => {
                const count = parseInt(this.querySelector('#numPart').value, 10) || 8;
                this.emit('apply-fixed', {count});
            });

            this.querySelector('#algoSelect').addEventListener('change', (e) => {
                this.emit('algorithm-change', {
                    algorithm: e.target.value,
                    label: e.target.selectedOptions[0].text,
                });
            });

            this.querySelector('#compactionToggle').addEventListener('change', (e) => {
                this.querySelector('[data-action="compact"]').disabled = !e.target.checked;
                this.emit('compaction-toggle', {enabled: e.target.checked});
            });

            this.querySelector('[data-action="compact"]').addEventListener('click', () => {
                this.emit('compact');
            });

            this.querySelector('[data-action="reset"]').addEventListener('click', () => {
                this.emit('reset');
            });
        }

        setScheme(scheme) {
            const radio = this.querySelector(`input[name=scheme][value="${scheme}"]`);
            if (radio) radio.checked = true;
            this.querySelector('[data-role="fixed-controls"]').hidden = scheme !== 'static';
            this.querySelector('[data-role="dynamic-controls"]').hidden = scheme !== 'dynamic';
            this.querySelector('[data-role="segmented-controls"]').hidden = scheme !== 'segmented';
            this.querySelector('[data-role="paging-controls"]').hidden = scheme !== 'paging';
        }

        setCompaction(enabled) {
            this.querySelector('#compactionToggle').checked = enabled;
            this.querySelector('[data-action="compact"]').disabled = !enabled;
        }

        emit(name, detail = {}) {
            this.dispatchEvent(new CustomEvent(name, {detail, bubbles: true}));
        }
    }

    customElements.define('scheme-panel', SchemePanel);
})();
