'use strict';

function square(x) {
	return x * x;
}

function fd(x, y) {
	return Math.floor(x / y);
}

function md(x, y) {
	return ((x % y) + y) % y;
}

function blkSize() {
	return fd(screenWidth, 36);
}

function rectCollide(x1,y1,w1,h1 , x2,y2,w2,h2 , xcantouch,ycantouch) {
	
	let r1 = x1 + w1, b1 = y1 + h1,
	    r2 = x2 + w2, b2 = y2 + h2;
	
	let tmp;

	if (r1 < x1) {
		tmp = r1;
		r1 = x1;
		x1 = tmp;
	}

	if (b1 < y1) {
		tmp = b1;
		b1 = y1;
		y1 = tmp;
	}
	
	if (r2 < x2) {
		tmp = r2;
		r2 = x2;
		x2 = tmp;
	}

	if (b2 < y2) {
		tmp = b2;
		b2 = y2;
		y2 = tmp;
	}

	const xcol = xcantouch ? x1 <= r2 && r1 >= x2 : x1 < r2 && r1 > x2;
	const ycol = ycantouch ? b1 >= y2 && y1 <= b2 : b1 > y2 && y1 < b2;

	return xcol && ycol;
}

function trhCollide(x,y,w,h,o, x2,y2,l) {
	x -= x2;
	y -= y2;

	const so = h === 0 ? 0 : y * o / h;

	return !(y > 0.0001 || y + h < -0.0001 || x - so >= l || x + w - so <= 0);
}

function trvCollide(x,y,w,h,o, x2,y2,l) {
	x -= x2;
	y -= y2;

	const so = w === 0 ? 0 : x * o / w;

	return !(x > 0.0001 || x + w < -0.0001 || y - so >= l || y + h - so <= 0);
}

function range(a, b, c) {
	if (arguments.length === 1) {
		return range(0, a);
	}

	if (arguments.length === 2) {
		return range(a, b, a > b ? -1 : 1);
	}

	if (arguments.length === 3) {
		let arr = [];
		if (a > b) {
			for (let i = a; i > b; i += c) arr.push(i);
		} else {
			for (let i = a; i < b; i += c) arr.push(i);
		}
		return arr;
	}
}

class SpeedChecker {
	
	constructor() {
		this.cps = 0;
		this.last_reset = 0;
		this.calls = 0;
	}

	tick () {
		if (32 === ++this.calls) {
			let now = performance.now();

			this.calls = 0;
			this.cps = 32000 / (now - this.last_reset);
			this.last_reset = now;
		}
	}

}
