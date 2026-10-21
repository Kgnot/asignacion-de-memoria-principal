(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {toHex} = NS;

    class ProcessCard extends HTMLElement {

        set data({process, color}) {
            this._process = process;
            this._color = color;
            this.render();
        }

        render() {
            const p = this._process;
            const segChips = p.sections.map((s) => `<span class="seg-chip">${s.name}: ${s.size} B (${s.permissions})</span>`).join('');
            const loaded = p.isLoaded();
            const terminated = p.isTerminated();
            const system = p.isSystem();

            this.innerHTML = `
                <article class="proc-card">
                    <div class="proc-top">
                        <div class="proc-name"><span class="swatch" style="background:${this._color}"></span>${p.id} — ${p.name}</div>
                        <span class="proc-status ${loaded ? 'st-loaded' : terminated ? 'st-terminated' : 'st-waiting'}">
                            ${system ? 'permanente' : loaded ? 'cargado' : terminated ? 'terminado' : 'en espera'}
                        </span>
                    </div>
                    <div class="seg-row">${segChips}<span class="seg-chip">total: ${p.getSize()} B</span></div>
                    <div class="proc-actions">
                        ${system ? '<span class="note">Reserva fija: 1048576 bytes</span>' : `
                        <button type="button" data-action="load" ${!p.isWaiting() ? 'disabled' : ''}>Cargar</button>
                        <button type="button" data-action="free" ${!loaded ? 'disabled' : ''}>Terminar</button>
                        <button type="button" data-action="clone">Abrir otra instancia</button>`}
                    </div>
                </article>
            `;

            this.querySelector('.proc-card').addEventListener('click', (event) => {
                if (event.target.closest('button')) return;
                this.dispatchEvent(new CustomEvent('process-select', {
                    detail: {id: p.id, opener: event.currentTarget},
                    bubbles: true,
                }));
            });

            if (!system) {
                this.querySelector('[data-action="load"]').addEventListener('click', () => {
                    this.dispatchEvent(new CustomEvent('process-load', {detail: {id: p.id}, bubbles: true}));
                });
                this.querySelector('[data-action="free"]').addEventListener('click', () => {
                    this.dispatchEvent(new CustomEvent('process-free', {detail: {id: p.id}, bubbles: true}));
                });
                this.querySelector('[data-action="clone"]').addEventListener('click', () => {
                    this.dispatchEvent(new CustomEvent('process-clone', {detail: {id: p.id}, bubbles: true}));
                });
            }
        }
    }

    customElements.define('process-card', ProcessCard);
})();
