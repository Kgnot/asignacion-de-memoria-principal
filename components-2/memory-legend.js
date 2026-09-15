import {colorForIndex} from "../utils/colors.js";

class MemoryLegend extends HTMLElement {

    set processes(processes) {
        this._processes = processes;
        this.render();
    }

    render() {
        const items = this._processes.map((p, i) => `
            <span><span class="swatch" style="background:${colorForIndex(i)}"></span>${p.id} — ${p.name}</span>
        `).join('');

        this.innerHTML = `
            <div class="legend">
                ${items}
                <span><span class="swatch" style="background:var(--free)"></span>Libre</span>
                <span><span class="swatch" style="background:repeating-linear-gradient(45deg,#00000055,#00000055 2px,#0000001a 2px,#0000001a 4px)"></span>Fragmentación interna</span>
            </div>
        `;
    }
}

customElements.define('memory-legend', MemoryLegend);
