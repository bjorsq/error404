function waitForMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
document.addEventListener( 'DOMContentLoaded', function(e){
    if ( document.fullscreenEnabled ) {
        const toggleBtn = document.querySelector('.js-toggle-fullscreen-btn');
        toggleBtn.hidden = false;
        toggleBtn.addEventListener('click', function() {
            if ( document.fullscreenElement !== null ) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        });
        
        document.addEventListener('fullscreenchange', handleFullscreen);
        
        function handleFullscreen() {
            if ( document.fullscreenElement !== null ) {
                toggleBtn.classList.add('on');
                toggleBtn.setAttribute('aria-label', 'Exit fullscreen mode');
            } else {
                toggleBtn.classList.remove('on');
                toggleBtn.setAttribute('aria-label', 'Enter fullscreen mode');
            }
        }
    }
});
/**
 * Playback clock
 *
 * Everything in the piece (windows, typing) is rendered from the time on
 * this clock, so it can be paused and moved to any point in the piece
 */
const Clock = {
    offset: 0,
    startedAt: null,
    now() {
        return this.startedAt === null ? this.offset : this.offset + (performance.now() - this.startedAt);
    },
    get playing() {
        return this.startedAt !== null;
    },
    play() {
        if (this.startedAt === null) {
            this.startedAt = performance.now();
        }
    },
    pause() {
        this.offset = this.now();
        this.startedAt = null;
    },
    seek(ms) {
        this.offset = Math.max(0, ms);
        if (this.startedAt !== null) {
            this.startedAt = performance.now();
        }
    }
};

/**
 * The desktop: a 1024x768 screen (the resolution the piece was made for)
 * scaled to fit the browser window, with a Windows taskbar or Mac menu bar
 */
const Desktop = {
    init() {
        this.screen = document.getElementById('screen');
        this.tasks = document.querySelector('.taskbar-tasks');
        this.fit();
        window.addEventListener('resize', () => this.fit());
        this.tick();
        setInterval(() => this.tick(), 1000);
        document.querySelectorAll('input[name="os"]').forEach(input => {
            input.checked = document.documentElement.classList.contains('os-' + input.value);
            input.addEventListener('change', () => this.setTheme(input.value));
        });
    },
    fit() {
        const scale = Math.min(window.innerWidth / 1024, window.innerHeight / 768);
        document.documentElement.style.setProperty('--scale', scale);
    },
    setTheme(os) {
        document.documentElement.classList.remove('os-mac', 'os-win');
        document.documentElement.classList.add('os-' + os);
        const link = document.getElementById('theme-css');
        link.href = link.href.replace(/(mac|win)\.css/, os + '.css');
        try {
            localStorage.setItem('error404-os', os);
        } catch (e) {}
    },
    /* clock in the taskbar / menu bar shows the real time */
    tick() {
        const now = new Date();
        const h = now.getHours();
        const m = String(now.getMinutes()).padStart(2, '0');
        document.querySelectorAll('.desktop-clock').forEach(el => {
            el.textContent = (h % 12 || 12) + ':' + m + ' ' + (h < 12 ? 'AM' : 'PM');
        });
    },
    /* a taskbar button for each open window, in the order they were opened */
    updateTasks(windows) {
        if (!this.tasks) {
            return;
        }
        this.tasks.replaceChildren(...windows.map(win => {
            const button = document.createElement('button');
            button.className = 'taskbar-task';
            button.tabIndex = -1;
            button.textContent = win.data.title || ' ';
            return button;
        }));
    }
};

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
            const [x, y] = valueAt(data.moves, t).map(Math.round);
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

/*********************
 * Error404 playlist *
 *********************
 *
 * Plays the piece from the timeline. Add ?t=<seconds> to the URL to start
 * part way through, and ?debug to show the time. While playing:
 *   space        pause / play
 *   left, right  back / forward 10 seconds (with shift, 60 seconds)
 */
document.addEventListener('DOMContentLoaded', function () {
    const timeline = JSON.parse(document.getElementById('timeline-data').textContent);
    const params = new URLSearchParams(location.search);
    const startAt = (parseFloat(params.get('t')) || 0) * 1000;
    const debug = params.has('debug') ? document.getElementById('debug') : null;
    const dialog = document.getElementById('dialog');
    /* the piece ends a few seconds after the typing window closes */
    const end = timeline.duration + 3000;
    let started = false;

    Desktop.init();
    Windows.build(timeline, document.getElementById('windows'));
    Typing.build(timeline.typing, Windows.get(timeline.typing.window));

    function start(at) {
        dialog.hidden = true;
        document.body.classList.add('playing');
        Windows.reset();
        Clock.seek(at);
        Clock.play();
        if (!started) {
            started = true;
            requestAnimationFrame(frame);
        }
    }

    function finish() {
        Clock.pause();
        dialog.dataset.state = 'ended';
        dialog.hidden = false;
        document.body.classList.remove('playing');
        document.getElementById('dialog-start').focus();
    }

    function frame() {
        let t = Clock.now();
        if (t >= end && Clock.playing) {
            finish();
            t = end;
        }
        if (Windows.render(t)) {
            Desktop.updateTasks(Windows.visible());
        }
        Typing.render(t);
        if (debug) {
            debug.textContent = (t / 1000).toFixed(1) + 's' + (Clock.playing ? '' : ' (paused)');
        }
        requestAnimationFrame(frame);
    }

    document.getElementById('dialog-start').addEventListener('click', () => {
        start(dialog.dataset.state === 'ended' ? 0 : startAt);
    });

    document.addEventListener('keydown', e => {
        if (!started || !dialog.hidden) {
            return;
        }
        if (e.key === ' ') {
            Clock.playing ? Clock.pause() : Clock.play();
            e.preventDefault();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const step = (e.shiftKey ? 60000 : 10000) * (e.key === 'ArrowLeft' ? -1 : 1);
            Windows.reset();
            Clock.seek(Math.min(end - 1, Clock.now() + step));
        }
    });

    if (debug) {
        debug.hidden = false;
    }
    if (params.has('t')) {
        start(startAt);
    } else {
        document.getElementById('dialog-start').focus();
    }
});

