
const controls = [
	['left', 'left', 'd'],
	['right', 'right', 'a'],
	['jump', 'x', ' ', 2],
	['run', 'z', 'ctrl', 3, 0]
];

function getCurrentInputState() {
	let o = {};
		
	if (gamepad) {
		if (gamepad.axes[0] < 0) {
			o.left = true;
		}
		else if (gamepad.axes[0] > 0) {
			o.right = true;
		}
		if (gamepad.axes[1] < 0) {
			o.up = true;
		}
		else if (gamepad.axes[1] > 0) {
			o.down = true;
		}
	}

	for (const control of controls) {
		for (let btni = 1; btni < control.length; btni++) {
			if ((gamepad && 'number' === (typeof control[btni]) && gamepad.buttons[control[btni]].pressed) || isDown(control[btni])) {
				o[control[0]] = true;
				break;
			}
		}
	}
	return o;
}
