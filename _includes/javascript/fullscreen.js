document.addEventListener( 'DOMContentLoaded', function(e){
    if ( document.fullscreenEnabled ) {
        const toggleBtn = document.querySelector('.js-toggle-fullscreen-btn');
        toggleBtn.hidden = false;
        toggleBtn.addEventListener('click', function() {
            if ( document.fullscreenElement !== null ) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        });
        
        document.addEventListener('fullscreenchange', handleFullscreen);
        
        function handleFullscreen() {
            if ( document.fullscreenElement !== null ) {
                toggleBtn.classList.add('on');
                toggleBtn.setAttribute('aria-label', 'Exit fullscreen mode');
            } else {
                toggleBtn.classList.remove('on');
                toggleBtn.setAttribute('aria-label', 'Enter fullscreen mode');
            }
        }
    }
});