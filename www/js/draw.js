'use strict';

function fillScreen(color) {
	if (color) {
		ctx.fillStyle = color;
	}

	ctx.beginPath();
	ctx.rect(0, 0, screenWidth, screenHeight);
	ctx.fill();
}

function drawRect(x, y, width, height, color) {
	if (color) {
		ctx.fillStyle = color;
	}

	ctx.beginPath();
	ctx.rect(x, y, width, height);
	ctx.fill();
}

function drawArc(x, y, radius, start, stop, invert, color) {
	if (color) {
		ctx.fillStyle = color;
	}

	ctx.beginPath();
	ctx.arc(x, y, radius, start, stop, !!invert);
	ctx.fill();
}

function drawCircle(x, y, radius, color) {
	drawArc(x, y, radius, 0, 2 * Math.PI, false, color);
}

function drawRoundRect(x, y, width, height, rounding, color) {
	if (color) {
		ctx.fillStyle = color;
	}

	ctx.beginPath();
	ctx.moveTo(x + rounding, y);
	ctx.lineTo(x + width - rounding, y);
	ctx.arc(x + width - rounding, y + rounding, rounding, 1.5 * Math.PI, 2 * Math.PI);
	ctx.lineTo(x + width, y + height - rounding);
	ctx.arc(x + width - rounding, y + height - rounding, rounding, 0, Math.PI / 2);
	ctx.lineTo(x + rounding, y + height);
	ctx.arc(x + rounding, y + height - rounding, rounding, Math.PI / 2, Math.PI);
	ctx.lineTo(x, y + rounding);
	ctx.arc(x + rounding, y + rounding, rounding, Math.PI, 1.5 * Math.PI);

	ctx.fill();
}

function drawText(text, x, y, align, color, font) {
	if (color) {
		ctx.fillStyle = color;
	}

	if (font) {
		ctx.font = font;
	}

	ctx.textAlign = align;
	ctx.fillText(text, x, y);
}

function drawButton(text, x, y, width, height, textColor, bgColor, font, rounding, shxofs, shyofs, shColor) {
	if (font) {
		ctx.font = font;
	}

	if (shxofs || shyofs) {
		drawRoundRect(x - width / 2 + shxofs, y - height / 2 + shyofs, width, height, rounding, shColor);
	}

	drawRoundRect(x - width / 2, y - height / 2, width, height, rounding, bgColor);
	if (text) drawText(text, x, y + parseInt(ctx.font) * 0.4, 'center', textColor);

	if (Mouse.x > x - width / 2 && Mouse.x < x + width / 2 && Mouse.y > y - height / 2 && Mouse.y < y + height / 2) {
		cursor = 'pointer';

		return clickframe;
	}

	return false;
}

function drawTexture(img, x, y, width, height, hflip, vflip, alpha) {
	let txt = rs[img];

	if (txt === undefined) {
		txt = rs['missingno'];
	}

	if (txt instanceof HTMLImageElement) {
		rs['$TMP'] = {src:img};
		return drawTexture('$TMP', x, y, width, height, hflip, vflip, alpha);
	}

	if (txt.frames instanceof Array) {
		const fo = txt.frameorder || range(txt.frames.length);
		const fn = fo[Math.floor(performance.now() / txt.msperframe) % fo.length];
		const frame = txt.frames[fn];
		txt = frame || rs['missingno'];
	}

	let simg = rs[txt.src];

	hflip = !!((!hflip)^(!txt.hflip));
	vflip = !!((!vflip)^(!txt.vflip));

	alpha = (txt.alpha || 1) * (alpha === undefined ? 1 : alpha);

	ctx.globalAlpha = alpha;

	if (hflip || vflip)
		ctx.scale(hflip ? -1 : 1, vflip ? -1 : 1);

	if (hflip) x = -width - x;
	if (vflip) y = -height - y;

	if (txt.crop) {
		ctx.drawImage(simg, txt.crop.x, txt.crop.y, txt.crop.width, txt.crop.height, x, y, width, height);
	} else {
		ctx.drawImage(simg, x, y, width, height);
	}

	ctx.globalAlpha = 1;

	if (hflip || vflip)
		ctx.scale(hflip ? -1 : 1, vflip ? -1 : 1);
}
