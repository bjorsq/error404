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