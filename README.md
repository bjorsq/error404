error404
========

by Anna Best https://annabest.info/

> Wandering randomly through the corridors of the Internet (from
> Bollywood to &#8216;The Miracles Centre&#8217;) Best has spliced
> images and text from this journey to form a curious, jump-cut
> narrative - the story of Mrs L.

Error 404 was a commission from e-2 for a project they were doing called Containership where they were asking artists who weren't digital   artists. I'd never been on the web before, so the project was partly about a naïve navigation of cyber space and I tried to treat the internet   as the real world, a physical space. I started surfing by taking some addresses from the bookmarks on a public library computer, random   starting points in cyberspace, and I just let one website lead me to another. I worked with Pete Edwards to compose an animation of all these different fragments to tell this story. The piece is a 20 minute duration 'composition', and isn't interactive; the pop up and moving windows fill up each viewer's desktop, rendering the viewer more passive than usual. There is a central text that types out the main story letter by letter , and the other images and texts pop onto the screen and move around, seemingly taking over the desktop. I made a diagram/drawing to map out the composition for Pete and that has been shown in Amsterdam. The website was launched at the Lux in London.

error404 - REDUX
----------------

The original error404 started to break a few years it's inception, when browser vendors started to tighten up security around pop-up windows by requiring then to display the address bar and status bar. As error404 used popup windows of varying sizes, placed them around the screen and animated them, the increase in area occupied by window features started to impact the way it operated. A number of years later, popup window blockers became commonplace, and are now built into most browsers. These prevent "unsolicited" popups (all the popups in error404 are unsolicited!).

### error404 windows

In the original piece, popup windows were created to display images and text on the screen. These windows has different sizes and were placed in different positions on the screen. Some windows were animated so they moved around the screen, and all windows (with the exception of Mrs.L  and the typing window) were closed before the typing finished. All windows were co-ordinated with the typewritten text.

The responsibility for opening windows was distributed around the application to ensure that user actions (closing windows, for example) would not disrupt the playing of the piece too much. So the main index.html file (typing) cued up "**acts**" within the piece where it opened a window which then proceeded to open others. Sometimes, the window opened by `index.html` would close before  the act was complete, so it needed to delegate the responsibility of opening more windows to one of the windows it opened.

Windows which moved on screen were animated using script running within them.

### Redevelopment

The original popup scripts are kept in `_old/`. Rather than converting them by hand, `_scripts/extract-timeline.js` runs them: each popup's script is executed in a sandbox against a virtual clock and a virtual 1024x768 screen (the resolution the piece was composed for), emulating Netscape 4. Every window opened, moved, scrolled, raised and closed is recorded, and the result is written to `_data/timeline.json` with absolute times in milliseconds.

```
npm run timeline   # regenerate _data/timeline.json from _old/
npm run minify     # build assets/js/bundle.min.js
```

In the page, windows are created from the timeline (`windows.js`) and the typed text is recreated from the tinyType applet's parameters (`typing.js`). Everything is rendered from a single clock (`clock.js`), so the windows and the text stay in step and the piece can be paused or started part way through:

* `?t=<seconds>` starts the piece at that point
* `?debug` shows the time
* space pauses, left and right arrows skip back and forward 10 seconds (60 with shift)

The desktop is always 1024x768, scaled to fit the browser window.

### Desktop themes

The original loaded different styles for Macs (`e2_mac.css`). The redevelopment has two desktop themes, which style the same window markup:

* Windows 98 (`assets/css/win.scss`, `_sass/themes/win98.scss`), based on [98.css](https://github.com/jdan/98.css)
* Mac OS 8/9 Platinum (`assets/css/mac.scss`, `_sass/themes/platinum.scss`), using the public domain ChicagoFLF font

The theme is chosen from the viewer's platform in the `<head>` (`_includes/javascript/theme.js`), and can be overridden with `?os=mac` or `?os=win`, or in the start dialog. Both themes must fit their window frame and title bar into 6px horizontally and 26px vertically (see `CHROME` in `extract-timeline.js`).
