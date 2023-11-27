document.addEventListener('click', e => {
	if ( e.target.getAttribute('aria-label') == 'Close' ) {
		e.target.closest('.window').style.visibility = 'hidden';
	}
});