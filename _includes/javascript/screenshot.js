/**
 * Screenshots
 *
 * The camera button (under the fullscreen button) takes a screenshot of the
 * desktop, with a camera shutter sound and a flash, and saves it as a
 * 1024x768 PNG named after the theme and the moment in the piece
 * (e.g. error404-win-04m12s.png).
 *
 * The page is turned into an image by html-to-image, which is only loaded
 * the first time a screenshot is taken.
 */
const Screenshot = {
    library: 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.js',
    busy: false,
    init() {
        if (new URLSearchParams(location.search).has('capture')) {
            return;
        }
        this.screen = document.getElementById('screen');
        this.flashEl = document.getElementById('flash');
        const button = document.querySelector('.js-screenshot-btn');
        button.hidden = false;
        button.addEventListener('click', () => this.take());
    },
    async take() {
        if (this.busy) {
            return;
        }
        this.busy = true;
        const name = this.filename(Clock.now());
        this.shutter();
        this.flash();
        try {
            await this.load();
            const png = await htmlToImage.toPng(this.screen, {
                width: 1024,
                height: 768,
                /* the screen is scaled and centred in the browser window - capture it at its own size */
                style: {
                    transform: 'none',
                    position: 'relative',
                    /* the copied styles include logical properties, which have to be reset too */
                    inset: 'auto', insetBlock: 'auto', insetInline: 'auto',
                    margin: '0px', marginBlock: '0px', marginInline: '0px',
                },
                /* leave out the flash, and windows which aren't open (their images would be embedded too) */
                filter: node => node !== this.flashEl && !(node.classList && node.classList.contains('window') && node.hidden),
            });
            const link = document.createElement('a');
            link.href = png;
            link.download = name;
            link.click();
        } catch (e) {
            console.error('screenshot failed', e);
        }
        this.busy = false;
    },
    filename(ms) {
        const s = Math.floor(ms / 1000);
        const os = document.documentElement.classList.contains('os-mac') ? 'mac' : 'win';
        return 'error404-' + os + '-' + String(Math.floor(s / 60)).padStart(2, '0') + 'm' + String(s % 60).padStart(2, '0') + 's.png';
    },
    load() {
        if (!this.loading) {
            this.loading = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = this.library;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        return this.loading;
    },
    flash() {
        this.flashEl.classList.remove('flash');
        /* restart the animation */
        void this.flashEl.offsetWidth;
        this.flashEl.classList.add('flash');
    },
    /* a mechanical shutter: two short clicks of filtered noise */
    shutter() {
        try {
            const ctx = this.audio || (this.audio = new (window.AudioContext || window.webkitAudioContext)());
            const noise = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
            const data = noise.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            [[0, 2500, 0.9], [0.09, 1800, 0.6]].forEach(([at, freq, level]) => {
                const t = ctx.currentTime + at;
                const source = ctx.createBufferSource();
                source.buffer = noise;
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = freq;
                filter.Q.value = 0.8;
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(level, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
                source.connect(filter).connect(gain).connect(ctx.destination);
                source.start(t);
                source.stop(t + 0.08);
            });
        } catch (e) {}
    }
};
document.addEventListener('DOMContentLoaded', () => Screenshot.init());
