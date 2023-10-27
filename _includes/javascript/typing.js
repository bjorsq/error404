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
startTyping();
function waitForMs(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}