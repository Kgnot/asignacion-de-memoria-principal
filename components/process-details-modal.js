(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {toHex} = NS;

    class ProcessDetailsModal extends HTMLElement {

        connectedCallback() {
            this.innerHTML = `
                <div class="modal-backdrop" data-action="close" hidden>
                    <section class="details-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                        <div class="modal-header">
                            <div>
                                <div class="kicker">TABLA DE SEGMENTOS</div>
                                <h2 id="modal-title">Proceso seleccionado</h2>
                                <p data-role="summary"></p>
                            </div>
                            <button type="button" class="modal-close" data-action="close" aria-label="Cerrar">×</button>
                        </div>
                        <div data-role="message" class="note" hidden></div>
                        <div data-role="table-container"></div>
                        <div class="modal-footer" data-role="footer"></div>
                        <div class="modal-actions">
                            <button type="button" class="danger" data-action="terminate">Terminar proceso</button>
                        </div>
                    </section>
                </div>
            `;
            this.backdrop = this.querySelector('.modal-backdrop');
            this.lastFocused = null;
            this.querySelectorAll('[data-action="close"]').forEach((element) => {
                element.addEventListener('click', (event) => {
                    if (event.target === this.backdrop || element.classList.contains('modal-close')) this.close();
                });
            });
            this.querySelector('[data-action="terminate"]').addEventListener('click', () => {
                if (!this.selectedProcess) return;
                this.dispatchEvent(new CustomEvent('process-free', {
                    detail: {id: this.selectedProcess.id},
                    bubbles: true,
                }));
            });
            this.handleEscape = (event) => {
                if (event.key === 'Escape' && !this.backdrop.hidden) this.close();
            };
            document.addEventListener('keydown', this.handleEscape);
        }

        show({process, manager, opener = document.activeElement}) {
            this.selectedProcess = process;
            this.manager = manager;
            this.lastFocused = opener;
            this.render();
            this.backdrop.hidden = false;
            this.querySelector('.modal-close').focus();
        }

        refresh(manager = this.manager) {
            if (!this.selectedProcess || this.backdrop.hidden) return;
            this.manager = manager;
            this.render();
        }

        render() {
            const process = this.selectedProcess;
            if (!process) return;
            const scheme = this.manager ? this.manager.scheme : 'unified';
            const loaded = process.isLoaded();
            const terminated = process.isTerminated();
            const segments = this.segmentRows(process, loaded);
            const includeBase = scheme === 'segmented' || scheme === 'dynamic';
            const includePages = scheme === 'unified';

            this.querySelector('#modal-title').textContent = `${process.id} — ${process.name}`;
            this.querySelector('[data-role="summary"]').textContent = `${process.status} · ${process.getSize()} bytes · ${segments.length} segmento(s)`;
            const message = this.querySelector('[data-role="message"]');
            message.hidden = !terminated;
            message.textContent = terminated ? 'Proceso terminado, memoria liberada' : '';
            this.querySelector('[data-role="table-container"]').innerHTML = terminated
                ? ''
                : this.table(segments, includeBase, includePages, loaded);

            const reserved = loaded && scheme === 'unified'
                ? segments.reduce((sum, segment) => sum + segment.pages.reduce((pageSum) => pageSum + 65536, 0), 0)
                : loaded ? process.getSize() : 0;
            const wasted = Math.max(0, reserved - (loaded ? process.getSize() : 0));
            this.querySelector('[data-role="footer"]').innerHTML = `
                <span>Ocupados: <strong>${loaded ? process.getSize() : 0} bytes</strong></span>
                <span>Reservados por páginas: <strong>${reserved} bytes</strong></span>
                <span>Fragmentación interna: <strong>${wasted} bytes</strong></span>
            `;
            this.querySelector('[data-action="terminate"]').hidden = !loaded || process.isSystem();
        }

        segmentRows(process, loaded) {
            if (loaded && process.segmentTable.length) {
                return process.segmentTable.map((segment) => ({
                    number: segment.number,
                    name: segment.sectionName,
                    limit: segment.limit,
                    permissions: segment.permissions,
                    base: segment.base,
                    pages: segment.pageTable || [],
                }));
            }
            return process.segments.map((section, number) => ({
                number,
                name: section.name,
                limit: section.size,
                permissions: section.permissions,
                base: null,
                pages: [],
            }));
        }

        table(segments, includeBase, includePages, loaded) {
            const headers = ['Num', 'Bin', 'Nombre', 'Límite', 'Permisos'];
            if (includeBase) headers.push('Base (Dec)', 'Base (Hex)');
            if (includePages) headers.push('Páginas');
            const head = headers.map((header) => `<th>${header}</th>`).join('');
            const rows = segments.map((segment) => {
                const base = loaded && segment.base !== null ? segment.base : '—';
                const pageCell = includePages && segment.pages.length
                    ? `<details><summary>${segment.pages.length}</summary><table class="page-table"><thead><tr><th>Página</th><th>Marco</th><th>Base física</th></tr></thead><tbody>${segment.pages.map((page) => `<tr><td>${page.page}</td><td>${page.frame}</td><td class="hex">${toHex(page.frame * 65536)}</td></tr>`).join('')}</tbody></table></details>`
                    : includePages ? '—' : '';
                return `<tr><td>${segment.number}</td><td class="binary">${segment.number.toString(2).padStart(6, '0')}</td><td>${segment.name}</td><td>${segment.limit}</td><td>${segment.permissions}</td>${includeBase ? `<td>${base}</td><td class="hex">${base === '—' ? '—' : toHex(base)}</td>` : ''}${includePages ? `<td>${pageCell}</td>` : ''}</tr>`;
            }).join('');
            return `<div class="segment-table-wrap"><table class="segment-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
        }

        close() {
            this.backdrop.hidden = true;
            if (this.lastFocused && typeof this.lastFocused.focus === 'function') this.lastFocused.focus();
        }
    }

    customElements.define('process-details-modal', ProcessDetailsModal);
})();
