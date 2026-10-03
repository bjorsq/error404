/**
 * Desktop theme: Windows 98 or Mac OS 8/9
 *
 * Runs in the <head> so the right stylesheet is loaded before the page is
 * shown. The theme can be chosen with ?os=mac or ?os=win, or from the start
 * dialog (remembered in this browser), otherwise it depends on the viewer's
 * platform - just as the original chose between e2.css and e2_mac.css.
 */
(function () {
    var os = new URLSearchParams(location.search).get('os');
    if (os !== 'mac' && os !== 'win') {
        try {
            os = localStorage.getItem('error404-os');
        } catch (e) {}
    }
    if (os !== 'mac' && os !== 'win') {
        var platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent;
        os = /mac|iphone|ipad|ipod/i.test(platform) ? 'mac' : 'win';
    }
    document.documentElement.classList.add('os-' + os);
    document.write('<link rel="stylesheet" id="theme-css" href="{{ "/assets/css/" | relative_url }}' + os + '.css">');
})();
