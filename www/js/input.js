
const controls = [
	['left', 'left', 'd'],
	['right', 'right', 'a'],
	['jump', 'x', ' '],
	['run', 'z', 'ctrl']
];

function getCurrentInputState() {
	let o = {};
	for (const control of controls) {
		for (let btni = 1; btni < control.length; btni++) {
			if (isDown(control[btni])) {
				o[control[0]] = true;
				break;
			}
		}
	}
	return o;
}
