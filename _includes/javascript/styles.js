
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

