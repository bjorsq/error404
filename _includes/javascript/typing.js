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
