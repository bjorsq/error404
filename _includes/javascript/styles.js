
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
/* downloadfree animation */
css += '\
@keyframes downloadfree {\
    from {\
	    left: 0;\
	    top: 0;\
	}\
    100% {\
	    left: 0;\
	    top: 100vh;\
	}\
}\';
/* downloadfree - 10px per second - starting at 36secs */
let dfdur = window.innerHeight / 10;
css += '\
.downloadfree {\
	animation: downloadfree ' + dfdur + 's linear 36s infinite;\
}\';
style.innerHTML = css;
document.getElementsByTagName('head')[0].appendChild(style);

