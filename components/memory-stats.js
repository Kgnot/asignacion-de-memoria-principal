(function () {
    class MemoryStats extends HTMLElement {

        set data({memory, internalFrag}) {
            const stats = memory.getStats();
            this.render(stats, internalFrag);
        }

        render(stats, internalFrag) {
            const items = [
                ['Memoria ocupada', stats.totalOccupied + ' bytes'],
                ['Memoria libre', stats.totalFree + ' bytes'],
                ['Fragmentación interna', internalFrag + ' bytes'],
                ['Huecos libres / mayor', `${stats.holeCount} / ${stats.largestHole} bytes`],
            ];

            this.innerHTML = `
                <div class="stats">
                    ${items.map(([label, val]) => `
                        <div class="stat">
                            <div class="n">${val}</div>
                            <div class="l">${label}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    customElements.define('memory-stats', MemoryStats);
})();
