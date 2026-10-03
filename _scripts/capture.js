/**
 * Renders error404 to video, one video for each desktop theme
 *
 * Opens the built site (_site, so run `bundle exec jekyll build` first) in
 * headless Chrome at 1024x768 - the resolution the piece was composed for -
 * renders each frame at an exact time with window.renderAt() and pipes
 * screenshots to ffmpeg. The piece is split into chunks which are rendered in
 * parallel, then joined without re-encoding.
 *
 * Usage:
 *   node _scripts/capture.js [--os win,mac] [--fps 30] [--jobs 4] [--clock 12:00]
 *   node _scripts/capture.js --os mac --from 60 --to 90      (a test clip)
 *
 * Output: output/error404-win.mp4 and output/error404-mac.mp4
 * --clock sets the time shown on the desktop clock at the start of the piece.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, '_site');
const OUT = path.join(ROOT, 'output');
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';

const opts = { os: 'win,mac', fps: '30', jobs: '4', clock: '12:00', crf: '18' };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 2) {
    opts[argv[i].replace(/^--/, '')] = argv[i + 1];
}
const fps = parseFloat(opts.fps);

/* a minimal static server for the built site */
function serve() {
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.gif': 'image/gif', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
    const server = http.createServer((req, res) => {
        let file = path.join(SITE, decodeURIComponent(new URL(req.url, 'http://x').pathname));
        if (file.endsWith('/')) file += 'index.html';
        if (!file.startsWith(SITE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
            res.writeHead(404).end();
            return;
        }
        res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream' });
        fs.createReadStream(file).pipe(res);
    });
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function openPiece(browser, url) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 768 });
    page.on('console', msg => msg.type() === 'warning' && console.warn(msg.text()));
    await page.goto(url);
    /* polled on a timer: pages in background tabs don't get animation frames */
    await page.waitForFunction(() => window.captureReady, { polling: 100, timeout: 120000 });
    return { page, info: await page.evaluate(() => window.captureReady) };
}

/* each chunk has its own browser, so its page is never a throttled background tab */
const launch = () => puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
});

/* render frames [first, last) to a video file */
async function renderChunk(url, first, last, file) {
    const browser = await launch();
    const { page } = await openPiece(browser, url);
    const ffmpeg = spawn('ffmpeg', [
        '-y', '-loglevel', 'error',
        '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', opts.crf, '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
        file,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = first; i < last; i++) {
        await page.evaluate(t => window.renderAt(t), i * 1000 / fps);
        const png = await page.screenshot({ type: 'png' });
        if (!ffmpeg.stdin.write(png)) {
            await new Promise(resolve => ffmpeg.stdin.once('drain', resolve));
        }
    }
    ffmpeg.stdin.end();
    await new Promise(resolve => ffmpeg.on('close', resolve));
    await browser.close();
}

(async () => {
    if (!fs.existsSync(path.join(SITE, 'index.html'))) {
        console.error('_site not found - run `bundle exec jekyll build` first');
        process.exit(1);
    }
    fs.mkdirSync(OUT, { recursive: true });
    const server = await serve();
    const browser = await launch();
    for (const os of opts.os.split(',')) {
        const url = `http://127.0.0.1:${server.address().port}/?capture&os=${os}&clock=${opts.clock}`;
        const { page, info } = await openPiece(browser, url);
        await page.close();
        const first = opts.from ? Math.round(parseFloat(opts.from) * fps) : 0;
        const last = opts.to ? Math.round(parseFloat(opts.to) * fps) : Math.ceil(info.end / 1000 * fps);
        const jobs = Math.max(1, parseInt(opts.jobs, 10));
        const size = Math.ceil((last - first) / jobs);
        const name = opts.from || opts.to ? `error404-${os}-${opts.from || 0}-${opts.to || 'end'}` : `error404-${os}`;
        const parts = [];
        for (let j = 0; j < jobs; j++) {
            const a = first + j * size;
            const b = Math.min(last, a + size);
            if (a < b) parts.push({ a, b, file: path.join(OUT, `${name}.part${j}.mp4`) });
        }
        const started = Date.now();
        console.log(`${os}: rendering ${last - first} frames in ${parts.length} chunks`);
        await Promise.all(parts.map(p => renderChunk(url, p.a, p.b, p.file)));
        /* join the chunks without re-encoding */
        const list = path.join(OUT, `${name}.txt`);
        fs.writeFileSync(list, parts.map(p => `file '${path.basename(p.file)}'`).join('\n') + '\n');
        await new Promise((resolve, reject) => {
            spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', path.join(OUT, name + '.mp4')], { stdio: 'inherit' })
                .on('close', code => code === 0 ? resolve() : reject(new Error('ffmpeg concat failed')));
        });
        parts.forEach(p => fs.unlinkSync(p.file));
        fs.unlinkSync(list);
        console.log(`${os}: output/${name}.mp4 in ${Math.round((Date.now() - started) / 1000)}s`);
    }
    await browser.close();
    server.close();
})();
