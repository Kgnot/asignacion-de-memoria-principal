(function () {
    const NS = (window.MemSim = window.MemSim || {});
    const {toHex, colorForIndex} = NS;

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
                const widthRatio = block.size / total;
                div.style.width = (widthRatio * 100) + '%';
                div.style.flex = `0 1 ${widthRatio * 100}%`;
                div.tabIndex = 0;
                div.setAttribute('role', 'button');
                div.setAttribute('aria-label', block.isFree()
                    ? `Bloque libre de ${block.size} bytes`
                    : `Bloque del proceso ${block.processId}`);

                if (block.isOccupied()) {
                    const proc = this._processes.find((p) => p.id === block.processId);
                    const color = colorForIndex(processIndex.get(block.processId) ?? 0);
                    div.style.background = color;

                    const frag = this._memory instanceof NS.SegmentedMemory ? 0 : block.internalFragmentation(proc);
                    if (frag > 0) {
                        const fragDiv = document.createElement('div');
                        fragDiv.className = 'frag';
                        fragDiv.style.width = (frag / block.size * 100) + '%';
                        div.appendChild(fragDiv);
                    }

                    const lbl = document.createElement('span');
                    lbl.className = 'lbl';
                    lbl.textContent = widthRatio > 0.04 ? block.processId : '';
                    if (widthRatio <= 0.04) div.classList.add('compact');
                    div.appendChild(lbl);

                    const unit = block.segmentName
                        ? `segmento ${block.segmentName}.${block.segmentIndex}`
                        : block.pageNumber !== null && block.pageNumber !== undefined
                            ? `página ${block.pageNumber}, marco ${block.frameNumber}`
                            : `${block.size} bytes partición`;
                    div.title = `${block.processId} · ${toHex(block.start)}–${toHex(block.getEnd())} · ${unit} · ${block.size} bytes${frag > 0 ? ` · ${frag} bytes frag. interna` : ''}`;
                } else {
                    div.title = `Libre · ${toHex(block.start)}–${toHex(block.getEnd())} · ${block.size} bytes`;
                }

                const selectBlock = () => {
                    this.dispatchEvent(new CustomEvent('memory-block-select', {
                        detail: {block, process: this._processes.find((p) => p.id === block.processId) || null},
                        bubbles: true,
                    }));
                };
                div.addEventListener('click', selectBlock);
                div.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        selectBlock();
                    }
                });

                bar.appendChild(div);
            }
        }
    }

    customElements.define('memory-map', MemoryMap);
})();
