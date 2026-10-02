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
