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
            const view = this.manager ? this.manager.memory.getAllocationView(process) : null;
            const segments = view ? view.rows : [];
            const includeBase = scheme === 'segmented' || scheme === 'dynamic';
            const includePages = scheme === 'paged-segmented' || scheme === 'paging';

            this.querySelector('#modal-title').textContent = `${process.id} — ${process.name}`;
            this.querySelector('[data-role="summary"]').textContent = `${view?.status || process.status} · ${view?.totalSize || process.getSize()} bytes · ${view?.segmentCount || segments.length} segmento(s)`;
            const message = this.querySelector('[data-role="message"]');
            message.hidden = !terminated;
            message.textContent = terminated ? 'Proceso terminado, memoria liberada' : '';
            this.querySelector('[data-role="table-container"]').innerHTML = terminated
                ? ''
                : this.table(segments, includeBase, includePages, loaded);

            const footerData = view?.footer || {occupiedBytes: 0, reservedBytes: 0, internalFragmentation: 0};
            this.querySelector('[data-role="footer"]').innerHTML = `
                <span>Ocupados: <strong>${footerData.occupiedBytes} bytes</strong></span>
                <span>Reservados por páginas: <strong>${footerData.reservedBytes} bytes</strong></span>
                <span>Fragmentación interna: <strong>${footerData.internalFragmentation} bytes</strong></span>
            `;
            this.querySelector('[data-action="terminate"]').hidden = !loaded || process.isSystem();
        }

        table(segments, includeBase, includePages, loaded) {
            const headers = ['Num', 'Bin', 'Nombre', 'Límite', 'Permisos'];
            if (includeBase) headers.push('Base (Dec)', 'Base (Hex)');
            if (includePages) headers.push('Páginas');
            const head = headers.map((header) => `<th>${header}</th>`).join('');
            const rows = segments.map((segment) => {
                const base = loaded && segment.base !== null ? segment.base : '—';
                const pageCell = includePages && segment.pages.length
                    ? `<details><summary>${segment.pages.length}</summary><table class="page-table"><thead><tr><th>Página</th><th>Marco</th><th>Base física</th></tr></thead><tbody>${segment.pages.map((page) => `<tr><td>${page.page}</td><td>${page.frame}</td><td class="hex">${toHex(page.physicalBase ?? page.frame * 65536)}</td></tr>`).join('')}</tbody></table></details>`
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
