'use strict';

// The enum of menus the game can be in
const MenuStates = Object.freeze({
	LOADING_MAIN: 1,
	MAIN: 2,
	MYLEVELS: 3,
	CREATELEVEL: 4,
	EDITLEVEL: 5,
	PLAYLEVEL: 6
});

// The current menu
// Type: MenuState
let menu = MenuStates.LOADING_MAIN;
let menuChange = -999999999;

var debug_info = true;

// The currently active Gamepad object, or null.
var gamepad = null;

// The canvas and its rendering context
var cvs, ctx;

// The size of the screen
var screenWidth, screenHeight;

var hasAnErrorOccurred = false; // Probably wont stay that way for long.

var cursor = 'auto';

// Was there a click this frame
// Type: boolean
var clickframe = false;

const Tools = Object.freeze({
	PLACE: 1,
	ERASE: 2,
	PAN: 3,
	GRAB: 4
});

var selected_tool = Tools.PLACE;
var selected_tile = SolidBlock;

let tile_select_open;

function getSelectedTool() {
	if (Mouse.rmbdown) return Tools.ERASE;
	if (Mouse.mmbdown) return Tools.PAN;

	return selected_tool;
}

var current_level;
var level_object_copy;

// The object that stores resources.
// Type: ResourceLoader
var rs;

// How far down you are scrolled.
// Type: int
let scroll;

// Where the camera is panned, in tiles.
// Types: float, float
let camx, camy;

var tickSpeedChecker = new SpeedChecker(), FPSChecker = new SpeedChecker();

// Loads a game menu.
// MenuState newMenu: the menu to load.
function loadMenu(newMenu) {
	menu = newMenu;
	menuChange = performance.now();

	scroll = 0;
	hideTextBox();

	if (menu === MenuStates.LOADING_MAIN) {
		rs = createResourceLoader();
	}

	if (menu === MenuStates.CREATELEVEL) {
		showTextBox();
	}

	if (menu === MenuStates.EDITLEVEL) {
		camx = 0;
		camy = 1 - screenHeight / blkSize();

		tile_select_open = 0;
	}

	if (menu === MenuStates.PLAYLEVEL) {
		current_level.start();
	}
}

function handleSizeChange() {
	if (hasAnErrorOccurred) return;

	cvs.width = screenWidth = innerWidth;
	cvs.height = screenHeight = innerHeight;
	
	ctx.mozImageSmoothingEnabled = ctx.webkitImageSmoothingEnabled = ctx.imageSmoothingEnabled = false;
}

function renderFrame() {
	if (hasAnErrorOccurred) return;

	requestAnimationFrame(renderFrame);

	FPSChecker.tick();

	cursor = 'auto';

	let age = performance.now() - menuChange;
	
	if (menu === MenuStates.LOADING_MAIN) {
		fillScreen('#ff0');

		const loadingText = 'MAKE-A-MARIO';
		const letterWidth = 78;
		const font = '78px Arial';
		let modularAge = age % 5000;

		for (let i = 0; i < loadingText.length; i++) {
			if (age < i * 256) break;

			let posValue = modularAge - 256 * i;
			if (posValue < 0 || posValue > 512) posValue = 0;
			let yOffset = square(posValue) / 1024 - posValue / 2;
			let y = screenHeight / 2 + yOffset;

			let x = screenWidth / 2 - letterWidth * loadingText.length / 2 + (0.5 + i) * letterWidth;

			drawText(loadingText.charAt(i), x, y, 'center', '#000', font);
		}

		drawText(rs.percent + '%', screenWidth / 2, screenHeight / 2 + 48, 'center', '#222', '16px Arial');
		drawRect(screenWidth / 2 - 150, screenHeight / 2 + 64, 3 * rs.percent, 2, '#222');

		if (rs.done && age > 4) {
			loadMenu(MenuStates.MAIN);
		}
	} else if (menu === MenuStates.MAIN) {
		fillScreen('#ff0');
		drawText('M A K E - A - M A R I O', screenWidth / 2, screenHeight / 4, 'center', '#000', '70px Arial');

		if (drawButton(
			localize('mylevels'),
			screenWidth / 2,
			screenHeight / 2,
			360,
			64,
			'#fff',
			'#00f',
			'32px Arial',
			16,
			8,
			8,
			'#660'
		)) {
			loadMenu(MenuStates.MYLEVELS);
		}

		if (age < 420) {
			fillScreen('rgba(255,255,0,' + (1 - age / 420) + ')');
		}
	} else if (menu === MenuStates.MYLEVELS) {
		fillScreen('#ff0');

		if (drawButton('< ' + localize('back'), 100, 40, 160, 50, '#fff', '#666', '25px Arial', 12, 6, 6, '#880')) {
			loadMenu(MenuStates.MAIN);
		}

		drawRoundRect(screenWidth / 4, 48 - scroll, screenWidth / 2, 64, 16, '#000');
		drawRoundRect(screenWidth / 4 + 8, 56 - scroll, screenWidth / 2 - 16, 48, 8, '#555');

		drawText(localize('mylevels'), screenWidth / 2, 92 - scroll, 'center', '#ff0', '30px Arial');

		let levelsPerLine = Math.max(1, Math.floor(screenWidth * 0.75 / 300));
		let levelLineStartX =  (Math.floor(screenWidth * 0.75) % 300) / 2 + screenWidth / 8;

		const myLevels = JSON.parse(localStorage.getItem('levels.ls') || '[]');

		for (let i = 0; i < 1 + myLevels.length; i++) {
			let dx = levelLineStartX + 300 * (i % levelsPerLine),
			    dy = Math.floor(i / levelsPerLine) * 300 + 192 - scroll;

			if (drawButton(null, dx + 150, dy + 150, 272, 272, null, '#666', null, 16, 8, 8, '#660')) {
				if (i === myLevels.length) {
					loadMenu(MenuStates.CREATELEVEL);
				}

				else {
					const cld = localStorage.getItem(`level.${ myLevels[i].id }.data`);
					const ld = LZString.decompressFromUTF16(cld);
					current_level = new Level(JSON.parse(ld));
					loadMenu(MenuStates.EDITLEVEL);
				}
			}

			if (i === myLevels.length) {
				drawCircle(dx + 150, dy + 150, 75, '#999');
				drawRect(dx + 90, dy + 145, 120, 10, '#ff0');
				drawRect(dx + 145, dy + 90, 10, 120, '#ff0');
			} else {
			
			}
		}
	} else if (menu === MenuStates.CREATELEVEL) {
		fillScreen('#ff0');

		if (drawButton('< ' + localize('back'), 100, 40, 160, 50, '#fff', '#666', '25px Arial', 12, 6, 6, '#880')) {
			loadMenu(MenuStates.MYLEVELS);
		}

		drawText(localize('namelevel'), screenWidth / 2, screenHeight / 2 - 48, 'center', '#000', '32px Arial');
		drawText(localize('namemutable'), screenWidth / 2, screenHeight / 2 + 64, 'center', '#000', '16px Arial');

		if(drawButton(localize('letsago'), screenWidth/2,screenHeight/2+180, 256,64,'#fff','#00f','32px Arial', 16,8,8, '#660')) {
			current_level = new Level();
			current_level.name = getText();
			
			for (let i = 0; i < 5; i++) {
				current_level.current_area.addObject(GroundTile, i, 0);
				current_level.current_area.addObject(GroundTile, i, -1);
			}

			loadMenu(MenuStates.EDITLEVEL);
		}
	} else if (menu === MenuStates.EDITLEVEL) {
		current_level.render(camx, camy, true);
		for (let lx = (1 - md(camx, 1)) * blkSize(); lx < screenWidth; lx += blkSize()) {
			drawRect(lx, 0, 2, screenHeight, 'rgba(0,0,0,0.25)');
		}

		for (let ly = (1 - md(camy, 1)) * blkSize(); ly < screenHeight; ly += blkSize()) {
			drawRect(0, ly, screenWidth, 2, 'rgba(0,0,0,0.25)');
		}

		drawRect(0, 0, screenWidth, 48, 'rgba(60,60,255,0.9)');

		drawRoundRect(243, 3, 42, 42, 5, '#fff');
		drawRoundRect(246, 6, 36, 36, 2, '#060');
		drawTexture(GroundTile.getMenuTexture(current_level.style, current_level.current_area.type), 248, 8, 32, 32);

		drawRoundRect(291, 3, 42, 42, 5, '#fff');
		drawRoundRect(294, 6, 36, 36, 2, '#770');
		//drawTexture(Mushroom.getMenuTexture(current_level.style, current_level.current_area.type), 296, 8, 32, 32);

		drawRoundRect(339, 3, 42, 42, 5, '#fff');
		drawRoundRect(342, 6, 36, 36, 2, '#600');
		drawTexture(Goomba.getMenuTexture(current_level.style, current_level.current_area.type), 344, 8, 32, 32);

		if (tile_select_open) {
			const h = 240; // Warning: Hard-Coded later on.
			const spx = tile_select_open * 48 + 216;
			ctx.beginPath();
			ctx.moveTo(140, 72);
			ctx.lineTo(spx - 12, 72);
			ctx.lineTo(spx, 54);
			ctx.lineTo(spx + 12, 72);
			ctx.lineTo(480, 72);
			ctx.arc(480, 104, 32, 1.5 * Math.PI, 2 * Math.PI);
			ctx.lineTo(512, 104 + h);
			ctx.arc(480, 104 + h, 32, 0, Math.PI / 2);
			ctx.lineTo(140, 136 + h);
			ctx.arc(140, 104 + h, 32, Math.PI / 2, Math.PI);
			ctx.lineTo(108, 104);
			ctx.arc(140, 104, 32, Math.PI, 1.5 * Math.PI);

			ctx.fillStyle = '#fff';
			ctx.strokeStyle = '#888';
			ctx.lineWidth = 4;

			ctx.fill();
			ctx.stroke();

			const palette = TilePalette[ ['platforms', 'powerups', 'enemies'][tile_select_open - 1] ];

			for (let i = 0; i < palette.length; i++) {
				const x = 140 + 48 * (i % 7);
				const y = 104 + 48 * fd(i, 7);

				if (Mouse.down && rectCollide(x, y, 32, 32, Mouse.x, Mouse.y, 0, 0)) selected_tile = palette[i];

				if (selected_tile === palette[i]) {
					drawRoundRect(x - 4, y - 4, 40, 40, 4, '#ccc');
				}

				drawTexture(palette[i].getMenuTexture(current_level.style, current_level.current_area.type), x, y, 32, 32);
			}
		}

		if (Mouse.down && Mouse.y < 48) {
			if      (Mouse.x >= 243 && Mouse.x <= 285) tile_select_open = 1;
			else if (Mouse.x >= 291 && Mouse.x <= 333) tile_select_open = 2;
			else if (Mouse.x >= 339 && Mouse.x <= 381) tile_select_open = 3;
			else tile_select_open = false;
		}

		if ((Mouse.down||Mouse.rmbdown) && Mouse.y > 48) {
			if (!tile_select_open || !rectCollide(140, 72, 372, 240, Mouse.x, Mouse.y, 0, 0)) {
				tile_select_open = 0;

				switch (getSelectedTool()) {
					case (Tools.PLACE):
					{
						let bx = fd(Mouse.x + camx * blkSize(), blkSize()),
						    by = fd(Mouse.y + camy * blkSize(), blkSize());

						if (!current_level.current_area.objectExistsAt(bx+0.5, by+0.5)) {
							current_level.current_area.addObject(selected_tile, bx, by);
						}
					}
					break;

					case (Tools.ERASE):
					{
						let bx = (Mouse.x + camx * blkSize()) / blkSize(),
						    by = (Mouse.y + camy * blkSize()) / blkSize();

						for (const obj of current_level.current_area.getObjectsAt(bx, by)) {
							obj.remove();
						}
					}
					break;
				}
			}
		}

		if (isDown('p')) {
			level_object_copy = current_level.objectify();
			loadMenu(MenuStates.PLAYLEVEL);
		}
	} else if (menu === MenuStates.PLAYLEVEL) {
		current_level.render(camx, camy, false);

		if (isDown('e')) {
			current_level = new Level(level_object_copy);
			loadMenu(MenuStates.EDITLEVEL);
		}
	}

	if (debug_info) {
		drawRect(screenWidth - 128, 0, 128, 48, '#000');
		drawText('FPS: ' + FPSChecker.cps, screenWidth - 120, 16, 'left', '#fff', '16px monospace');
		drawText('TPS: ' + tickSpeedChecker.cps, screenWidth - 120, 40, 'left', '#fff', '16px monospace');
	}

	cvs.style.cursor = cursor;
	clickframe = false;
}

window.mmrel = (rx, ry) => {
	if (menu === MenuStates.EDITLEVEL && getSelectedTool() === Tools.PAN && (Mouse.mmbdown||Mouse.down) && Mouse.y > 48) {
		camx -= rx / blkSize();
		camy -= ry / blkSize();
	}
};

addEventListener('resize', handleSizeChange);

addEventListener('gamepadconnected', evt => {gamepad = evt.gamepad;});
addEventListener('gamepaddisconnected', evt => {if (gamepad.index === evt.gamepad.index) gamepad = null;});

// Aaaaannnnddddd... ACTION!
addEventListener('load', () => {
	document.body.innerHTML = '<canvas></canvas><input type=text>';

	Mouse.mmbemu = true;

	cvs = document.body.firstElementChild;
	ctx = cvs.getContext('2d');
	
	cvs.addEventListener('contextmenu', evt => {
		evt.stopPropagation();
		evt.preventDefault();
	});

	handleSizeChange();

	loadMenu(MenuStates.LOADING_MAIN);
	renderFrame();

	setInterval(() => {
		tickSpeedChecker.tick();
		if (menu === MenuStates.PLAYLEVEL &&! hasAnErrorOccurred) current_level.tick(getCurrentInputState());
	}, 16);
});

addEventListener('mouseup', evt => {
	if (evt.button === 0) {
		clickframe = true;
	}
});

window.onerror = (msg, src, lno, cno, err) => {
	hasAnErrorOccurred = true;

	fillScreen('#bbb');

	drawText('OOPS!', screenWidth / 2, 160, 'center', '#f00', '70px Arial');
	drawText('Make-A-Mario has encountered a problem.', screenWidth / 4, 256, 'left', '#000', '32px Arial');
	drawText('The error is shown below:', screenWidth / 4, 288, 'left', '#000', '32px Arial');
	drawText(err, screenWidth / 4, 340, 'left', '#f00', '16px Arial');
	drawText(`${src} ${lno}:${cno}`, screenWidth / 4, 360, 'left', '#f00', '12px Arial');
	
	hideTextBox();
};
