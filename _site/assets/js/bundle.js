

var style = document.createElement('style');
style.type = 'text/css';
let l = ( ( window.innerWidth - 99 ) * 2 ) + ( ( window.innerHeight - 155 ) * 2 );
let xpc = Math.floor( 100 *  ( window.innerWidth - 99 ) / l );
var keyFrames = '\
@keyframes mrsl {\
    from {\
        left: 0;\
	    top: 0;\
    }\
	' + xpc + '% {\
    	left: calc(100% - 99px);\
		top: 0;\
  	}\
  	50% {\
    	left: calc(100% - 99px);\
		top: calc(100% - 155px);\
  	}\
  	' + (50+xpc) + '% {\
		left: 0;\
		top: calc(100% - 155px);\
  	}\
  	100% {\
		left: 0;\
		top: 0;\
  }\
}';
style.innerHTML = keyFrames;
document.getElementsByTagName('head')[0].appendChild(style);
document.getElementById('error404-container').classList.add('win98');

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
		e.target.closest('.window').style.display = 'none';
	}
});
async function typeSentence(el, letters) {
    let i = 0;
	console.log(letters);
    while(i < letters.length) {
        await waitForMs(100);
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
	return typeSentence(elref, letrs);
}

async function startTyping() {
	let currentLine = 1;
    while(document.getElementById('line'+currentLine)){
	    await typeLine('line'+currentLine);
	    currentLine++;
        scrollUp(currentLine);
	}
}
function scrollUp(lineNo){
    document.getElementById('typing-paper').scrollTo(0, (lineNo * 25) + 25 );
}
function waitForMs(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
/*********************
 * Error404 playlist *
 *********************/
document.addEventListener( 'DOMContentLoaded', function(e){
    startTyping();
})