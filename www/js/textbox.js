function getTextBox() {
	return document.getElementsByTagName('input')[0];
}

function showTextBox(text) {
	getTextBox().value = text || '';
	getTextBox().style.display = 'initial';
}

function hideTextBox() {
	getTextBox().style.display = 'none';
}

function getText() {
	return getTextBox().value;
}
