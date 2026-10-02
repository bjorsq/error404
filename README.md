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

### Redevelopment as CSS

In the redeveloped version of the piece, all windows are placed within the screen with their CSS visibility set to `hidden`. A CSS animation (`cssv`) is used to time their appearance on screen and the duration of their visibility. For windows which are animated on screen, CSS keyframes are used to animate their positions. In order to ensure these animated windows are visible for the duration of ther animation, a JavaScript event handler is placed on the `animationstart` and `animationend` events to toggle the class `active` on the window - these event handlers first check to ensure that they are not triggered for animated elements using the `cssv` keyframes to toggle visibility.

This `windows.scss` file contains comments which indicate where in the original application various parameters were defined.


