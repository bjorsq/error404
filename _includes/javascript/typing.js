async function typeSentence(el, letters) {
    let i = 0;
	console.log(letters);
    while(i < letters.length) {
        await waitForMs(100);
		console.log(letters[i], i);
        el.textContent += letters[i];
        i++;
    }
    return;
}
async function typeLine(eleID) {
    let elref = document.getElementById( eleID );
    let letrs = elref.textContent.split("");
    elref.textContent = '';
	elref.style.display = 'flex';
	return typeSentence(elref, letrs);
}

async function startTyping() {
	let currentLine = 1;
    while(document.getElementById('line'+currentLine)){
	    await typeLine('line'+currentLine);
	    currentLine++;
		scrollUp();
	}
}
function scrollUp(){
	document.getElementById('typing-paper').style.top = ( document.getElementById('typing-paper').style.top - 20)
}
startTyping();
function waitForMs(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}