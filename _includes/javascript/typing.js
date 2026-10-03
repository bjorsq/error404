/**
 * The central typed text
 *
 * In the original this was the tinyType java applet, which typed out each
 * line a letter at a time. Trailing spaces in the lines were the pauses in
 * the composition. Here the number of letters typed is worked out from the
 * clock, so the text stays in step with the windows.
 */
const Typing = {
    lines: [],
    ends: [],
    typed: -1,
    rows: [],
    build(typing, win) {
        this.lines = typing.lines;
        this.start = typing.start;
        this.charMs = typing.charMs;
        /* cumulative character count at the end of each line */
        let total = 0;
        this.ends = this.lines.map(line => total += line.length);
        const paper = document.createElement('div');
        paper.className = 'typing-paper';
        paper.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < Typing.visibleRows; i++) {
            const row = document.createElement('div');
            row.className = 'typed-text';
            paper.appendChild(row);
            this.rows.push(row);
        }
        win.body.appendChild(paper);
    },
    visibleRows: 4,
    render(t) {
        const total = this.ends[this.ends.length - 1];
        const typed = Math.max(0, Math.min(total, Math.floor((t - this.start) / this.charMs)));
        if (typed === this.typed) {
            return;
        }
        this.typed = typed;
        /* the line currently being typed */
        let current = this.ends.findIndex(end => typed < end);
        if (current === -1) {
            current = this.lines.length - 1;
        }
        const first = Math.max(0, current - this.visibleRows + 1);
        this.rows.forEach((row, i) => {
            const n = first + i;
            if (n > current) {
                row.textContent = '';
                row.classList.remove('active');
                return;
            }
            const lineStart = n === 0 ? 0 : this.ends[n - 1];
            row.textContent = this.lines[n].slice(0, typed - lineStart);
            row.classList.toggle('active', n === current);
        });
    }
};
