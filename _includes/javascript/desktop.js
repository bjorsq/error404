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
        /* when capturing to video, the clock is set from the piece's time instead */
        if (!new URLSearchParams(location.search).has('capture')) {
            this.tick();
            setInterval(() => this.tick(), 1000);
        }
        document.querySelectorAll('input[name="os"]').forEach(input => {
            input.checked = document.documentElement.classList.contains('os-' + input.value);
            input.addEventListener('change', () => this.setTheme(input.value));
        });
    },
    /**
     * Scale the desktop to fit the window, and centre it on a whole screen
     * pixel. Windows are also positioned on whole screen pixels (windows.js),
     * otherwise fine detail like the Mac title bar stripes shimmers as they
     * move, because the stripes land on screen pixels differently each frame
     */
    fit() {
        const scale = Math.min(window.innerWidth / 1024, window.innerHeight / 768);
        const dpr = window.devicePixelRatio || 1;
        const snap = v => Math.round(v * dpr) / dpr;
        /* screen pixels per desktop pixel */
        this.pixels = scale * dpr;
        const root = document.documentElement.style;
        root.setProperty('--scale', scale);
        root.setProperty('--left', snap((window.innerWidth - 1024 * scale) / 2) + 'px');
        root.setProperty('--top', snap((window.innerHeight - 768 * scale) / 2) + 'px');
        /* make windows.js reposition every window */
        if (typeof Windows !== 'undefined') {
            Windows.list.forEach(win => win.x = win.y = null);
        }
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
    tick(now = new Date()) {
        const h = now.getHours();
        const m = String(now.getMinutes()).padStart(2, '0');
        document.querySelectorAll('.desktop-clock').forEach(el => {
            el.textContent = (h % 12 || 12) + ':' + m + ' ' + (h < 12 ? 'AM' : 'PM');
        });
    },
    /* taskbar buttons for the given windows (just the main typing window) */
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
