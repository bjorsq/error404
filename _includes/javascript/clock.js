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
