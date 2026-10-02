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
