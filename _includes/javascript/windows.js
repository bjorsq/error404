/**
 * error404 windows
 *
 * Each window in the timeline (_data/timeline.json, generated from the
 * original piece by _scripts/extract-timeline.js) has:
 *  - open / close: times in ms (close is null for windows which never close)
 *  - w / h: size of the content area (the original popup size)
 *  - moves: [t, x, y] keyframes for the window's position on screen
 *  - raises: [t, n] times the window was brought to the front (n is the order)
 *  - scrolls: [t, y] keyframes for windows which scrolled their content
 *  - swaps: [t, name, src] times an image in the window was changed
 *
 * Keyframes are interpolated linearly, everything else is a step.
 */
const Windows = {
    list: [],
    active: null,
    build(timeline, container) {
        const template = document.getElementById('window-template');
        this.list = timeline.windows.map(data => {
            const el = template.content.firstElementChild.cloneNode(true);
            el.id = 'window-' + data.id;
            el.hidden = true;
            el.style.width = (data.w + timeline.chrome.x) + 'px';
            el.style.height = (data.h + timeline.chrome.y) + 'px';
            el.querySelector('.title-bar-text').textContent = data.title;
            const body = el.querySelector('.window-body');
            if (data.content) {
                body.innerHTML = data.content;
            }
            if (data.style) {
                body.style.cssText = data.style;
            }
            if (data.margins) {
                body.classList.add('margins');
            }
            const images = {};
            (data.swaps || []).forEach(([t, name]) => {
                const img = body.querySelector('img[name="' + name + '"]');
                if (img) {
                    images[name] = { img, src: img.getAttribute('src') };
                }
            });
            container.appendChild(el);
            return { data, el, body, images, visible: false, dismissed: false, z: 0, x: null, y: null };
        });
        container.addEventListener('click', e => {
            if (e.target.closest('.title-bar-controls button[aria-label="Close"]')) {
                const win = this.list.find(w => w.el === e.target.closest('.window'));
                if (win) {
                    win.dismissed = true;
                }
            }
        });
    },
    get(id) {
        return this.list.find(w => w.data.id === id);
    },
    /* windows the viewer has closed come back if the piece is restarted */
    reset() {
        this.list.forEach(w => w.dismissed = false);
    },
    visible() {
        return this.list.filter(w => w.visible);
    },
    /* render all windows at time t - returns true if any opened or closed */
    render(t) {
        let changed = false;
        let top = null;
        this.list.forEach(win => {
            const data = win.data;
            const visible = !win.dismissed && t >= data.open && (data.close === null || t < data.close);
            if (visible !== win.visible) {
                win.el.hidden = !visible;
                win.visible = visible;
                changed = true;
            }
            if (!visible) {
                return;
            }
            /* on whole screen pixels (see Desktop.fit) */
            const pixels = Desktop.pixels || 1;
            const [x, y] = valueAt(data.moves, t).map(v => Math.round(v * pixels) / pixels);
            if (x !== win.x || y !== win.y) {
                win.el.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
                win.x = x;
                win.y = y;
            }
            const raised = lastAt(data.raises, t);
            const z = raised ? raised[1] : 0;
            if (z !== win.z) {
                win.el.style.zIndex = z;
                win.z = z;
            }
            if (!top || z > top.z) {
                top = win;
            }
            if (data.scrolls) {
                win.body.scrollTop = Math.round(valueAt(data.scrolls, t)[0]);
            }
            Object.keys(win.images).forEach(name => {
                const swap = lastAt(data.swaps.filter(s => s[1] === name), t);
                const src = swap ? swap[2] : win.images[name].src;
                if (win.images[name].img.getAttribute('src') !== src) {
                    win.images[name].img.setAttribute('src', src);
                }
            });
        });
        /* the window at the front has an active title bar */
        if (top !== this.active) {
            if (this.active) {
                this.active.el.classList.remove('is-active');
            }
            if (top) {
                top.el.classList.add('is-active');
            }
            this.active = top;
        }
        return changed;
    }
};

/* interpolated values from [t, ...values] keyframes at time t */
function valueAt(frames, t) {
    if (t <= frames[0][0]) {
        return frames[0].slice(1);
    }
    for (let i = 1; i < frames.length; i++) {
        if (t < frames[i][0]) {
            const a = frames[i - 1];
            const b = frames[i];
            const f = (t - a[0]) / (b[0] - a[0]);
            return a.slice(1).map((v, k) => v + f * (b[k + 1] - v));
        }
    }
    return frames[frames.length - 1].slice(1);
}

/* the last of a list of [t, ...] events which has happened by time t */
function lastAt(events, t) {
    let last = null;
    for (const e of events) {
        if (e[0] > t) {
            break;
        }
        last = e;
    }
    return last;
}
