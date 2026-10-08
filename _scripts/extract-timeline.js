/**
 * Extracts the error404 timeline from the original (2000) piece in _old/
 *
 * Rather than parsing the old popup scripts, this runs them: every popup's
 * script is executed in its own sandbox against a virtual clock and a
 * virtual 1024x768 screen (the resolution the piece was composed for). The
 * browser APIs the scripts use (window.open, moveTo, scrollTo, close, focus,
 * setTimeout etc.) are stubbed to record what happens and when.
 *
 * The browser emulated is Netscape 4 with zero window chrome, so positions
 * like env.w-(winx(w)) resolve to exact screen edges.
 *
 * Output: _data/timeline.json, used by the windows include and playlist.js
 *
 * Usage: node _scripts/extract-timeline.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const OLD = path.resolve(__dirname, '../_old');
const SRC = path.join(OLD, 'error404');
const OUT = path.resolve(__dirname, '../_data/timeline.json');
const IMAGES = path.resolve(__dirname, '../assets/images');

/**
 * The screen the original scripts see: the 1024x768 screen the piece was
 * composed for, less the Windows taskbar (28px) or Mac menu bar (20px).
 * The smaller of the two is used so one timeline fits both desktop themes,
 * and windows never go behind the taskbar or menu bar
 */
const SCREEN = { width: 1024, height: 740 };
/**
 * Window chrome (frame + title bar) added to a popup's content size. Both
 * desktop themes (Windows 98 and Mac OS 8/9) are styled to fit this, so
 * window positions are the same whichever theme is shown
 */
const CHROME = { x: 6, y: 26 };
/* the launcher (error404.html) opened the typing window 1024x100 at screen centre */
const SCROLLER = { w: SCREEN.width - CHROME.x, h: 100, x: 0, y: (SCREEN.height / 2) - 50 };
/* stop the simulation a little after the typing window closes itself */
const END = 1215000;

/* images which were renamed when copied to assets/images */
const IMAGE_RENAMES = {
    'error 404.gif': 'error-404.gif',
    'not found.gif': 'not-found.gif',
    'proph box.gif': 'prophbox.gif',
    'proph & pred.gif': 'prophandpred.gif',
};

/**
 * Windows which didn't work as intended in the original, keyed by file
 *  - h: content height to open the window at, in place of the original
 *  - scrollTo: scroll the content from the top to this offset over the
 *    window's movement, so it reaches the end as the window stops moving
 */
const TEXT15A_H = SCREEN.height - 240 - CHROME.y;
const ADJUSTMENTS = {
    /*
     * the origami list was opened full screen, so its MoveDown script (which
     * moves it down until it reaches the bottom of the screen) closed it
     * straight away. Opened 240px short of the screen height it moves down
     * as scripted (1px every 100ms, so 24s), reaching the bottom just before
     * act 7 at 375.7s, and its content scrolls as it moves. scrollTo is the
     * bottom of the last line of text (1409px in both themes, plus the 8px
     * margin, skipping the empty lines at the end) less the window height
     */
    '06text15a.html': { h: TEXT15A_H, scrollTo: 1417 - TEXT15A_H },
};

/**
 * Virtual clock and timer queue
 */
let now = 0;
let seq = 0;
let queue = [];
function schedule(win, delay, fn) {
    const timer = { id: ++seq, at: now + Math.max(0, delay), win, fn };
    queue.push(timer);
    return timer.id;
}
function run() {
    while (queue.length) {
        queue.sort((a, b) => a.at - b.at || a.id - b.id);
        const timer = queue.shift();
        if (timer.at > END) break;
        now = timer.at;
        if (timer.win.closed) continue;
        timer.fn();
    }
}

/**
 * Recorded windows
 */
const windows = [];
const named = {};
let raiseSeq = 0;
const warnings = [];

/* the original pages are windows-1252 encoded */
const decoder = new TextDecoder('windows-1252');
const read = file => decoder.decode(fs.readFileSync(file));

function readPage(file) {
    const html = read(path.join(SRC, file));
    const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1].trim();
    const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
    const bodyTag = (html.match(/<body([^>]*)>/i) || [, ''])[1];
    let body = (html.match(/<body[^>]*>([\s\S]*?)(<\/body>|$)/i) || [, ''])[1];
    body = body.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<\/html>\s*$/i, '').trim();
    const attr = name => (bodyTag.match(new RegExp(name + '\\s*=\\s*"([^"]*)"', 'i')) || [])[1];
    return {
        title,
        scripts,
        body,
        onload: attr('onload'),
        bgcolor: attr('bgcolor'),
        text: attr('text'),
        background: attr('background'),
        margins: /topmargin="0"/i.test(bodyTag),
    };
}

function parseFeatures(str) {
    const f = {};
    (str || '').split(',').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k) f[k.trim().toLowerCase()] = v;
    });
    const num = k => (f[k] !== undefined ? Number(f[k]) : undefined);
    return { w: num('width'), h: num('height'), x: num('screenx') ?? num('left'), y: num('screeny') ?? num('top') };
}

function openWindow(file, name, features, opener) {
    const page = readPage(file);
    const f = parseFeatures(features);
    if (ADJUSTMENTS[file] && ADJUSTMENTS[file].h) {
        f.h = ADJUSTMENTS[file].h;
    }
    const existing = named[name];
    if (existing && !existing.closed) {
        /* re-using a named window navigates it, keeping its size and position */
        warnings.push(`${(now / 1000).toFixed(1)}s: ${opener.rec.file} reloads window "${name}" with ${file}`);
        closeWindow(existing);
        f.w = existing.rec.w; f.h = existing.rec.h;
        f.x = existing.x; f.y = existing.y;
    }
    const count = windows.filter(r => r.name === name).length;
    const rec = {
        id: count ? `${name}-${count + 1}` : name,
        name,
        file,
        title: page.title,
        open: now,
        close: null,
        /* windows can't be bigger than the screen (a few of the originals were 768px high) */
        w: Math.min(f.w, SCREEN.width - CHROME.x),
        h: Math.min(f.h, SCREEN.height - CHROME.y),
        moves: [],
        scrolls: [],
        raises: [],
        swaps: [],
        page,
    };
    windows.push(rec);
    const win = createWindow(rec, opener, f.x ?? 0, f.y ?? 0);
    named[name] = win;
    raise(win);
    /* the page loads after the opener's script has finished */
    schedule(win, 0, () => {
        rec.seed = now;
        page.scripts.forEach(code => runIn(win, code));
        if (page.onload) runIn(win, page.onload);
    });
    return win;
}

function closeWindow(win) {
    if (win.closed) return;
    win.closed = true;
    if (topmost === win) topmost = null;
    win.rec.close = now;
}

let topmost = null;
function raise(win) {
    if (topmost === win) return;
    topmost = win;
    win.rec.raises.push([now, ++raiseSeq]);
}

function runIn(win, code) {
    try {
        vm.runInContext(code, win.ctx, { filename: win.rec.file });
    } catch (e) {
        warnings.push(`${(now / 1000).toFixed(1)}s: error in ${win.rec.file}: ${e.message}`);
    }
}

function createWindow(rec, opener, x, y) {
    /* Netscape 4 kept windows opened or moved by unsigned scripts on screen */
    const clamp = (v, size, max) => Math.max(0, Math.min(Math.round(v), max - size));
    const outerW = rec.w + CHROME.x;
    const outerH = rec.h + CHROME.y;
    const win = { rec, closed: false, x: clamp(x, outerW, SCREEN.width), y: clamp(y, outerH, SCREEN.height), scrollY: 0 };
    const move = (nx, ny) => {
        win.x = clamp(nx, outerW, SCREEN.width); win.y = clamp(ny, outerH, SCREEN.height);
        rec.moves.push([now, win.x, win.y]);
    };
    const scroll = sy => {
        win.scrollY = Math.max(0, Math.round(sy));
        rec.scrolls.push([now, win.scrollY]);
    };
    rec.moves.push([now, win.x, win.y]);

    class VDate {
        constructor() { this.t = now; }
        valueOf() { return this.t; }
        getTime() { return this.t; }
    }
    const images = {};
    const document = new Proxy({ images: [] }, {
        get(target, prop) {
            if (prop in target) return target[prop];
            if (typeof prop !== 'string') return undefined;
            /* named <img> elements, e.g. document.comet */
            if (!images[prop]) {
                images[prop] = {};
                Object.defineProperty(images[prop], 'src', {
                    set(src) { rec.swaps.push([now, prop, src]); },
                    get() { return ''; },
                });
            }
            return images[prop];
        },
    });
    const self = {
        get closed() { return win.closed; },
        get screenX() { return win.x; },
        get screenY() { return win.y; },
        get outerWidth() { return outerW; },
        get outerHeight() { return outerH; },
        get innerWidth() { return rec.w; },
        get innerHeight() { return rec.h; },
        moveTo: (nx, ny) => move(nx, ny),
        moveBy: (dx, dy) => move(win.x + dx, win.y + dy),
        scrollTo: (sx, sy) => scroll(sy),
        scrollBy: (sx, sy) => scroll(win.scrollY + sy),
        resizeTo: () => {},
        resizeBy: () => {},
        open: (url, name, features) => openWindow(url, name, features, win).ctx.window,
        close: () => closeWindow(win),
        focus: () => raise(win),
        blur: () => {},
        opener: opener ? opener.ctx.window : null,
        setTimeout: (fn, ms) => schedule(win, ms || 0, typeof fn === 'function' ? fn : () => runIn(win, fn)),
        setInterval: (fn, ms) => {
            const tick = () => {
                typeof fn === 'function' ? fn() : runIn(win, fn);
                schedule(win, ms, tick);
            };
            return schedule(win, ms, tick);
        },
        clearTimeout: id => { queue = queue.filter(t => t.id !== id); },
        clearInterval: id => { queue = queue.filter(t => t.id !== id); },
        alert: () => {},
        document,
        Image: function Image() { this.src = ''; },
        navigator: {
            appName: 'Netscape',
            appVersion: '4.7 [en] (Win98; U)',
            platform: 'Win32',
            userAgent: 'Mozilla/4.7 [en] (Win98; U)',
        },
        screen: { width: SCREEN.width, height: SCREEN.height, availWidth: SCREEN.width, availHeight: SCREEN.height },
        Date: VDate,
        Math,
        parseInt,
        parseFloat,
    };
    self.window = self;
    self.self = self;
    self.top = self;
    win.ctx = vm.createContext(self);
    return win;
}

/**
 * Turn a series of [t, ...values] samples, where each value is held until the
 * next sample, into a minimal list of linear keyframes
 */
function keyframes(samples, tolerance = 1) {
    if (!samples.length) return [];
    /* drop samples which don't change anything, and collapse samples at the same time */
    const pts = [];
    samples.forEach(s => {
        const last = pts[pts.length - 1];
        if (last && last[0] === s[0]) { pts[pts.length - 1] = s; return; }
        if (last && s.slice(1).every((v, i) => v === last[i + 1])) return;
        pts.push(s);
    });
    /* a value held for longer than its next step should stay put until just before that step */
    const held = [];
    pts.forEach((p, i) => {
        const prev = pts[i - 1];
        if (prev) {
            const next = pts[i + 1];
            const step = next ? Math.min(next[0] - p[0], p[0] - prev[0]) : p[0] - prev[0];
            if (p[0] - prev[0] > step * 1.5) held.push([p[0] - step, ...prev.slice(1)]);
        }
        held.push(p);
    });
    /* greedy linear simplification, checking a handful of the points each segment would replace */
    const out = [held[0]];
    let start = 0;
    const onLine = (a, b, p) => {
        const f = (p[0] - a[0]) / (b[0] - a[0]);
        return p.slice(1).every((v, k) => Math.abs(a[k + 1] + f * (b[k + 1] - a[k + 1]) - v) <= tolerance);
    };
    for (let i = 2; i < held.length; i++) {
        const probes = [i - 1, start + 1, Math.floor((start + i) / 2), Math.floor((3 * start + i) / 4), Math.floor((start + 3 * i) / 4)];
        if (!probes.every(j => j <= start || j >= i || onLine(held[start], held[i], held[j]))) {
            start = i - 1;
            out.push(held[start]);
        }
    }
    if (held.length > 1) out.push(held[held.length - 1]);
    return out;
}

/* image file name as found in assets/images, matched case-insensitively */
const imageFiles = fs.readdirSync(IMAGES);
function imageName(file) {
    const name = IMAGE_RENAMES[file] || file;
    const found = imageFiles.find(f => f.toLowerCase() === name.toLowerCase());
    if (!found) warnings.push(`missing image: ${name}`);
    return found || name;
}

function rewriteContent(html) {
    return html.replace(/(src|background)\s*=\s*"images\/([^"]+)"/gi, (m, attr, file) => {
        const name = imageName(file);
        return `${attr}="assets/images/${name}"`;
    });
}

/**
 * Typing text from the tinyType applet parameters
 */
function typingLines() {
    const html = read(path.join(SRC, 'index.html'));
    const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&rsquo;/g, '’').replace(/&amp;/g, '&');
    return [...html.matchAll(/name="LINE(\d+)" value="([^"]*)"/g)].map(m => decode(m[2]));
}

/**
 * Run it
 */
const launcher = { rec: { file: 'error404.html' }, closed: false, ctx: { window: null } };
launcher.ctx.window = { window: null };
const scroller = openWindow('index.html', 'scroller', `width=${SCROLLER.w},height=${SCROLLER.h},screenX=${SCROLLER.x},screenY=${SCROLLER.y}`, launcher);
scroller.ctx.window.opener = { window: { resizeTo: () => {} } };
run();

const out = {
    desktop: SCREEN,
    chrome: CHROME,
    duration: Math.max(...windows.map(r => r.close ?? 0)),
    typing: {
        window: 'scroller',
        lines: typingLines(),
    },
    windows: windows.map(r => {
        const w = {
            id: r.id,
            file: r.file,
            title: r.title,
            open: r.open,
            close: r.close,
            w: r.w,
            h: r.h,
            moves: keyframes(r.moves),
            raises: r.raises.map(([t, z]) => [t, z]),
        };
        if (r.scrolls.length) w.scrolls = keyframes(r.scrolls);
        const adjust = ADJUSTMENTS[r.file];
        if (adjust && adjust.scrollTo && w.moves.length > 1) {
            w.scrolls = [[w.moves[0][0], 0], [w.moves[w.moves.length - 1][0], adjust.scrollTo]];
        }
        if (r.swaps.length) w.swaps = r.swaps.map(([t, img, src]) => [t, img, `assets/images/${imageName(src.replace(/^images\//, ''))}`]);
        const style = [];
        if (r.page.bgcolor) style.push(`background-color:${r.page.bgcolor}`);
        if (r.page.text) style.push(`color:${r.page.text}`);
        if (style.length) w.style = style.join(';');
        /* pages without topmargin="0" etc. had the browser's default 8px margin */
        if (!r.page.margins) w.margins = true;
        if (r.file !== 'index.html') w.content = rewriteContent(r.page.body);
        return w;
    }),
};
/* typing speed: spread the text evenly over the life of the typing window */
const scrollerRec = out.windows.find(w => w.id === 'scroller');
const chars = out.typing.lines.reduce((n, l) => n + l.length, 0);
out.typing.start = scrollerRec.open;
out.typing.charMs = Math.floor((scrollerRec.close - scrollerRec.open) / chars * 10) / 10;

fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`${out.windows.length} windows, duration ${(out.duration / 1000).toFixed(1)}s, typing ${chars} chars @ ${out.typing.charMs}ms`);
[...new Set(warnings)].forEach(w => console.warn('  ' + w));
