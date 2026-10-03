/*********************
 * Error404 playlist *
 *********************
 *
 * Plays the piece from the timeline. Add ?t=<seconds> to the URL to start
 * part way through, and ?debug to show the time. While playing:
 *   space        pause / play
 *   left, right  back / forward 10 seconds (with shift, 60 seconds)
 *
 * ?capture is used by _scripts/capture.js to render the piece to video: the
 * piece doesn't play, and window.renderAt(ms) renders any moment of it.
 * ?clock=HH:MM sets the time shown on the desktop clock at the start.
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

    if (params.has('capture')) {
        const [hours, minutes] = (params.get('clock') || '12:00').split(':').map(Number);
        const clockStart = new Date(2000, 0, 1, hours, minutes).getTime();
        dialog.hidden = true;
        document.body.classList.add('playing', 'capture');
        window.renderAt = t => {
            if (Windows.render(t)) {
                Desktop.updateTasks(Windows.visible().filter(w => w.data.id === timeline.typing.window));
            }
            Typing.render(t);
            /* the typing cursor blinks once a second */
            document.body.classList.toggle('cursor-off', t % 1000 >= 500);
            Desktop.tick(new Date(clockStart + t));
        };
        /* every image, including swapped ones, loaded before capturing */
        const sources = new Set([...document.querySelectorAll('#windows img')].map(img => img.src));
        timeline.windows.forEach(w => (w.swaps || []).forEach(s => sources.add(new URL(s[2], location.href).href)));
        window.captureReady = Promise.all([document.fonts.ready, ...[...sources].map(src => {
            const img = new Image();
            img.src = src;
            return img.decode().catch(() => console.warn('image failed to load: ' + src));
        })]).then(() => ({ end }));
        return;
    }

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
            Desktop.updateTasks(Windows.visible().filter(w => w.data.id === timeline.typing.window));
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
