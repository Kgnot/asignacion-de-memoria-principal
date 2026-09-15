(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {colorForIndex} = NS;

    class ProcessList extends HTMLElement {

        connectedCallback() {
            if (!this.querySelector('.panel')) {
                this.innerHTML = `<section class="panel"><h2>Procesos simulados</h2><div data-role="list"></div></section>`;
            }
        }

        set processes(processes) {
            this._processes = processes;
            this.render();
        }

        render() {
            const container = this.querySelector('[data-role="list"]');
            if (!container) return;
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
