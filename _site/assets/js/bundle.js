function waitForMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

var style = document.createElement('style');
style.setAttribute( 'type', 'text/css' );
/* carla animation */
let l = ( ( window.innerWidth - 99 ) * 2 ) + ( ( window.innerHeight - 155 ) * 2 );
let xpc = Math.floor( 100 *  ( window.innerWidth - 99 ) / l );
var css = '\
@keyframes mrsl {\
    from {\
        left: 0;\
	    top: 0;\
    }\
	' + xpc + '% {\
    	left: calc(100vw - 100px);\
		top: 0;\
  	}\
  	50% {\
    	left: calc(100vw - 100px);\
		top: calc(100vh - 125px);\
  	}\
  	' + (50+xpc) + '% {\
		left: 0;\
		top: calc(100vh - 125px);\
  	}\
  	100% {\
		left: 0;\
		top: 0;\
  }\
}';
style.innerHTML = css;
document.getElementsByTagName('head')[0].appendChild(style);


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
document.addEventListener('click', e => {
	if ( e.target.getAttribute('aria-label') == 'Close' ) {
		e.target.closest('.window').style.visibility = 'hidden';
	}
});
async function typeLetters(el, letters) {
    let i = 0;
	console.log(letters);
    while(i < letters.length) {
        await waitForMs(135);
		console.log(letters[i], i);
        el.textContent += letters[i];
        i++;
    }
    el.classList.remove('active');
    return;
}
async function typeLine(eleID) {
    let elref = document.getElementById( eleID );
    let letrs = elref.textContent.split("");
    elref.textContent = '';
    elref.classList.add('active');
	elref.style.display = 'flex';
	return typeLetters(elref, letrs);
}

async function startTyping() {
	let currentLine = 1;
    while(document.getElementById('line'+currentLine)){
	    await typeLine('line'+currentLine);
	    currentLine++;
        scrollUp(currentLine);
        await waitForMs(25);
	}
}
function scrollUp(lineNo){
    document.getElementById('typing-paper').scrollTo(0, (lineNo * 25) + 25 );
}

/*********************
 * Error404 playlist *
 *********************/
document.addEventListener( 'DOMContentLoaded', function(e){
    var seed = new Date().valueOf();
    startTyping();

    /**
     * windows which appear, animate, then disappear
     * the cssv class animates visibility so this isn't needed
     */
    document.addEventListener('animationstart', e => {
        if (e.animationName != 'cssv' ) {
            e.target.classList.add('active');
        }
    });
    document.addEventListener('animationend', e => {
        if (e.animationName != 'cssv' ) {
            e.target.classList.remove('active');
        }
    });
});