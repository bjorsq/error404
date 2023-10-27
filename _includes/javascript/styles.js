
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
