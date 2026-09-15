class MemoryStats extends HTMLElement {

    set data({memory, internalFrag}) {
        const stats = memory.getStats();
        this.render(stats, internalFrag);
    }

    render(stats, internalFrag) {
        const items = [
            ['Memoria ocupada', stats.totalOccupied + ' KiB'],
            ['Memoria libre', stats.totalFree + ' KiB'],
            ['Fragmentación interna', internalFrag + ' KiB'],
            ['Huecos libres / mayor', `${stats.holeCount} / ${stats.largestHole} KiB`],
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
