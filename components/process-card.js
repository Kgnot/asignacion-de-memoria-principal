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
            const segChips = p.segments.map((s) => `<span class="seg-chip">${s.name}: ${s.size}K</span>`).join('');
            const loaded = p.isLoaded();
            const terminated = p.isTerminated();

            this.innerHTML = `
                <article class="proc-card">
                    <div class="proc-top">
                        <div class="proc-name"><span class="swatch" style="background:${this._color}"></span>${p.id} — ${p.name}</div>
                        <span class="proc-status ${loaded ? 'st-loaded' : terminated ? 'st-terminated' : 'st-waiting'}">
                            ${loaded ? toHex(p.blockStart) : terminated ? 'terminado' : 'en espera'}
                        </span>
                    </div>
                    <div class="seg-row">${segChips}<span class="seg-chip">total: ${p.getSize()}K</span></div>
                    <div class="proc-actions">
                        <button type="button" data-action="load" ${!p.isWaiting() ? 'disabled' : ''}>Cargar</button>
                        <button type="button" data-action="free" ${!loaded ? 'disabled' : ''}>Terminar</button>
                    </div>
                </article>
            `;

            this.querySelector('[data-action="load"]').addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('process-load', {detail: {id: p.id}, bubbles: true}));
            });
            this.querySelector('[data-action="free"]').addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('process-free', {detail: {id: p.id}, bubbles: true}));
            });
        }
    }

    customElements.define('process-card', ProcessCard);
})();
