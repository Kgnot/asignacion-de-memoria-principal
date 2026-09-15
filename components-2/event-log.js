class EventLog extends HTMLElement {

    connectedCallback() {
        if (!this.querySelector('.log')) {
            this.innerHTML = `<div class="log" data-role="lines"></div>`;
        }
    }

    add(message, kind) {
        const el = this.querySelector('[data-role="lines"]');
        const line = document.createElement('div');
        if (kind) line.className = kind;
        line.textContent = message;
        el.appendChild(line);
        el.scrollTop = el.scrollHeight;
    }

    clear() {
        const el = this.querySelector('[data-role="lines"]');
        if (el) el.innerHTML = '';
    }
}

customElements.define('event-log', EventLog);
