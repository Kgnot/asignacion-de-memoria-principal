import {toHex} from "../utils/hex.js";
import {colorForIndex} from "../utils/colors.js";

class MemoryMap extends HTMLElement {

    connectedCallback() {
        if (!this.querySelector('.memmap')) {
            this.innerHTML = `
                <div class="memmap" data-role="bar"></div>
                <div class="ruler">
                    <span>0x000000</span><span>0x800000</span><span>0xFFFFFF</span>
                </div>
            `;
        }
    }

    set data({memory, processes}) {
        this._memory = memory;
        this._processes = processes;
        this.render();
    }

    render() {
        const bar = this.querySelector('[data-role="bar"]');
        if (!bar || !this._memory) return;
        bar.innerHTML = '';

        const total = this._memory.totalSize;
        const sorted = [...this._memory.blocks].sort((a, b) => a.start - b.start);
        const processIndex = new Map(this._processes.map((p, i) => [p.id, i]));

        for (const block of sorted) {
            const div = document.createElement('div');
            div.className = 'block' + (block.isFree() ? ' free' : '');
            div.style.width = (block.size / total * 100) + '%';

            if (block.isOccupied()) {
                const proc = this._processes.find((p) => p.id === block.processId);
                const color = colorForIndex(processIndex.get(block.processId) ?? 0);
                div.style.background = color;

                const frag = block.internalFragmentation(proc);
                if (frag > 0) {
                    const fragDiv = document.createElement('div');
                    fragDiv.className = 'frag';
                    fragDiv.style.width = (frag / block.size * 100) + '%';
                    div.appendChild(fragDiv);
                }

                const lbl = document.createElement('span');
                lbl.className = 'lbl';
                lbl.textContent = block.size / total > 0.04 ? block.processId : '';
                div.appendChild(lbl);

                div.title = `${block.processId} · ${toHex(block.start)}–${toHex(block.getEnd())} · ${block.size} KiB partición · ${proc ? proc.getSize() : 0} KiB usados${frag > 0 ? ` · ${frag} KiB frag. interna` : ''}`;
            } else {
                div.title = `Libre · ${toHex(block.start)}–${toHex(block.getEnd())} · ${block.size} KiB`;
            }

            bar.appendChild(div);
        }
    }
}

customElements.define('memory-map', MemoryMap);
