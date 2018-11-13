'use strict';

let objectTypes = {};

// The enum of styles a level can be in.
const LevelStyles = Object.freeze({
	SMB: 1,
	SMB3: 2
});

function levelStyleName(id) {
	for (const style in LevelStyles) {
		if (LevelStyles[style] === id) return style;
	}
}

// The enum of types of area.
const AreaTypes = Object.freeze({
	GROUND: 1,
	UNDERGROUND: 2,
	CASTLE: 3,
	WATER: 4,
	GHOST: 5,
	AIRSHIP: 6,
	SNOW: 7,
	SEWER: 8,
	MOON: 9
});

function areaTypeName(id) {
	for (const style in AreaTypes) {
		if (AreaTypes[style] === id) return style;
	}
}

// A level.
// string name: The name of the level.
// LevelStyle style: The style of the level.
// Area[] areas: The areas of the level.
class Level {
	
	constructor (j/*data*/) {
		if (j) {
			//let j = JSON.parse(data);

			this.name = j.n;
			this.id = j.i;
			this.style = j.s;

			this.areas = j.a.map(x => new Area(this, x));

			this.start_x = j.X;
			this.start_y = j.Y;
			this.start_a = j.A;
		} else {
			this.name = 'Level';
			this.id = (Date.now().toString(16).padStart(16, '0') + ((Math.random() * 2147483648)|0).toString(16).padStart(8, '0')).toUpperCase();
			this.style = LevelStyles.SMB;

			this.areas = [new Area(this)];

			this.start_x = 4;
			this.start_y = -2;
			this.start_a = 0;
		}
		
		this.current_area_ind = 0;

		this.input = {};
		this.prev_input = {};
	}

	objectify() {
		return {n:this.name,i:this.id,s:this.style,a:this.areas.map(x => x.objectify()),X:this.start_x,Y:this.start_y,A:this.start_a};
	}

	save() {
		const data = JSON.stringify(this.objectify());
		const cdata = LZString.compressToUTF16(data);
		localStorage.setItem(`level.${ this.id }.data`, cdata);

		let llist = JSON.parse(localStorage.getItem('levels.ls') || '[]');
		
		for (const level of llist) {
			if (level.id === this.id) {
				if (level.name !== this.name) {
					level.name = this.name;
					localStorage.setItem('levels.ls', JSON.stringify(llist));
				}

				return;
			}
		}

		llist.push({id: this.id, name: this.name});
		localStorage.setItem('levels.ls', JSON.stringify(llist));
	}

	get current_area() {
		return this.areas[this.current_area_ind];
	}

	start() {
		this.current_area_ind = this.start_a;
		this.current_area.objects.push(new Mario(this.current_area, this.start_x, this.start_y));

		for (const area of this.areas) {
			area.setup();
		}
	}

	tick(input) {
		this.prev_input = this.input;
		this.input = input;
		this.current_area.tick();

		this.posttick();
	}

	posttick() {
		this.current_area.posttick();
	}

	render(camx, camy, editor) {
		this.current_area.render(camx, camy, editor);

		if (editor && this.current_area_ind === this.start_a) {
			drawTexture('editor.start', (this.start_x-camx) * blkSize(), (this.start_y-camy) * blkSize(), blkSize(), blkSize());
		}
	}
}

// A sub-area of a level.
// AreaType type: The type of area. (Ground, Castle, Airship etc.)
// LevelObject[] objects: The objects in the area.
class Area {
	
	constructor (level, j) {
		this.level = level;

		this.edges = [];

		if (j) {
			this.type = j.t;

			this.objects = j.o.map(o => CreateObject(this, o));
		} else {
			this.type = AreaTypes.GROUND;

			this.objects = [];
		}
	}

	objectify() {
		return {t:this.type,o:this.objects.map(x => x.objectify()).filter(x=>!!x)};
	}

	get gravity() {
		return this.type === AreaTypes.MOON ? 0.004 : 0.024;
	}

	addObject(type, x, y) {
		this.objects.push(new type(this, x, y));
	}

	objectExistsAt(x, y) {
		for (const obj of this.objects) {
			if (x > obj.x && y > obj.y && x < obj.x + obj.width && y < obj.y + obj.height) return true;
		}

		return false;
	}

	getObjectsAt(x, y) {
		let objs = [];
		
		for (const obj of this.objects) {
			if (x > obj.x && y > obj.y && x < obj.x + obj.width && y < obj.y + obj.height) objs.push(obj);
		}

		return objs;
	}

	collideEdge(a, min_strength) {
		
		min_strength = min_strength || 0;

		let edges, dist = Infinity;

		const b = fd(a.x - a.y, 16);
		for (let blk = b - 1; blk < b + 2; blk++) {
			const es = this.edges[blk];

			if (es instanceof Array) {
				for (let i = 1; i < es.length; i += 9) {
					if (es[i] === EdgeSideOpposites[a.side] && es[i+8] >= min_strength) {
						let ed;
						if (a.side === EdgeSides.TOP) ed = a.y - es[i+3];
						else if (a.side === EdgeSides.BOTTOM) ed = es[i+3] - a.y;
						else if (a.side === EdgeSides.LEFT) ed = a.x - es[i+2];
						else if (a.side === EdgeSides.RIGHT) ed = es[i+2] - a.x;

						if (ed <= dist && this.collideEdges(a, blk, i)) {
							if (ed < dist) {
								edges = [this.createEdgeObject(blk, i)];
								dist = ed;
							} else edges.push(this.createEdgeObject(blk, i));
						} 
					}
				}
			}
		}

		return [edges, dist];
	}

	createEdgeObject(b, i) {
		const p = this.edges[b];
		return {
			side: p[i],
			type: p[i+1],
			x: p[i+2], y: p[i+3],
			dx: p[i+4], dy: p[i+5],
			len: p[i+6],
			friction: p[i+7],
			strength: p[i+8]
		};
	}

	collideEdges(a, b, i) {
		const p = this.edges[b];
		const dx = a.dx - p[i+4], dy = a.dy - p[i+5], x = a.x - p[i+2], y = a.y - p[i+3];
		if (a.side === EdgeSides.TOP && dy < 0) return trhCollide(x + dx, y + dy, a.len, -dy, -dx, 0, 0, p[i+6]);
		if (a.side === EdgeSides.BOTTOM && dy > 0) return trhCollide(x, y, a.len, dy, dx, 0, 0, p[i+6]);
		if (a.side === EdgeSides.LEFT && dx < 0) return trvCollide(x + dx, y + dy, -dx, a.len, -dy, 0, 0, p[i+6]);
		if (a.side === EdgeSides.RIGHT && dx > 0) return trvCollide(x, y, dx, a.len, dy, 0, 0, p[i+6]);
	}

	setup() {
		for (const obj of this.objects) {
			obj.setup();
		}
	}

	tick() {
		for (const obj of this.objects) {
			obj.tick();
		}
	}

	posttick() {
		for (let i = 0; i < this.objects.length; i++) {
			const obj = this.objects[i];
			obj.posttick();
			if (obj.dead) {
				this.objects.splice(i--, 1);
			}
		}
	}

	render(camx, camy, editor) {
		
		switch (this.level.style) {
			case (LevelStyles.SMB):
			{
				switch (this.type){
					case (AreaTypes.GROUND):
					case (AreaTypes.AIRSHIP):
					{
						fillScreen('#5c94fc');
					}
					break;

					case (AreaTypes.WATER):
					{
						fillScreen('#2038ec');
					}
					break;

					case (AreaTypes.UNDERGROUND):
					case (AreaTypes.CASTLE):
					case (AreaTypes.GHOST):
					case (AreaTypes.SNOW):
					case (AreaTypes.SEWER):
					case (AreaTypes.MOON):
					{
						fillScreen('#000');
					}
					break;
				}
			}
			break;

			case (LevelStyles.SMB3):
			{
				fillScreen('#4ff');
			}
			break;
		}

		for (const obj of this.objects) {
			obj.render(camx, camy, editor);
		}
	}
}

const EdgeSides = Object.freeze({
	TOP: 1,
	BOTTOM: 2,
	LEFT: 3,
	RIGHT: 4
});

const EdgeSideOpposites = Object.freeze([0, 2, 1, 4, 3]);

const EdgeTypes = Object.freeze({
	SOLID: 1,
	SPIKE: 2
});

class Edge {
	
	constructor(side, x, y, len, fric, strength) {
		this.side = side;
		this.x = x;
		this.y = y;
		this.len = len;
		this.friction = isNaN(parseFloat(fric)) ? 1 : +fric;
		this.strength = isNaN(parseInt(strength)) ? 1000000 : parseInt(strength);
		this.type = EdgeTypes.SOLID;

		this.dx = this.dy = 0;

		this.area = null;
	}

	register(area) {
		this.area = area;
		this.block = fd(this.x - this.y, 16);
		this.addToBlock(this.block);

		return this;
	}

	addToBlock(blk) {
		if (this.area.edges[blk] instanceof Array) {
			if (this.area.edges[blk][0] === this.area.edges[blk].length) {
				this.area.edges[blk].push(
					this.side,
					this.type,
					this.x, this.y,
					this.dx, this.dy,
					this.len,
					this.friction,
					this.strength
				);
				this.index = this.area.edges[blk][0];
				this.area.edges[blk][0] += 9;
			} else {
				const p = this.area.edges[blk][0];
				this.area.edges[blk][p]   = this.side;
				this.area.edges[blk][p+1] = this.type;
				this.area.edges[blk][p+2] = this.x;
				this.area.edges[blk][p+3] = this.y;
				this.area.edges[blk][p+4] = this.dx;
				this.area.edges[blk][p+5] = this.dy;
				this.area.edges[blk][p+6] = this.len;
				this.area.edges[blk][p+7] = this.friction;
				this.area.edges[blk][p+8] = this.strength;
				do {
					this.area.edges[blk][0] += 9;
				} while (this.area.edges[blk][0] < this.area.edges[blk].length && this.area.edges[blk][this.area.edges[blk][0]] !== 0);
				this.index = p;
			}
		} else {
			this.area.edges[blk] = [
				10,
				this.side,
				this.type,
				this.x, this.y,
				this.dx, this.dy,
				this.len,
				this.friction,
				this.strength
			];
			this.index = 1;
		}
	}

	removeFromBlock(blk) {
		this.area.edges[blk][this.index] = 0;
		this.area.edges[blk][0] = Math.min(this.index, this.area.edges[blk][0]);
	}

	unregister() {
		this.removeFromBlock(this.block);
		this.area = null;
	}

	update() {
		if (this.block === fd(this.x - this.y, 16)) {
			this.area.edges[this.block][this.index + 2] = this.x;
			this.area.edges[this.block][this.index + 3] = this.y;
			this.area.edges[this.block][this.index + 4] = this.dx;
			this.area.edges[this.block][this.index + 5] = this.dy;
			this.area.edges[this.block][this.index + 6] = this.len;
		} else {
			this.removeFromBlock(this.block);
			this.block = fd(this.x - this.y, 16);
			this.addToBlock(this.block);
		}
	}
}

// The abstract base class for all objects.
// Area area: The area the object is in.

class LevelObject {
	
	constructor(area, x, y) {
		this.area = area;
		if ('number' === typeof y) {
			this.x = x;
			this.y = y;
		} else this.load_from(x);
	}

	get level() {
		return this.area.level;
	}

	get width() { return 0; }
	get height() { return 0; }

	remove() {
		this.area.objects.splice(this.area.objects.indexOf(this), 1);
	}

	objectify() {
		const err = `Unable to save object of type ${this.constructor.name} at x: ${this.x}, y: ${this.y}. Skipping.`;
		console.warn(err);
		alert(err);
		return null;
	}

	setup() {}
	tick() {}
	posttick() {}
}

// Basic, solid ground.
class GroundTile extends LevelObject {
	
	setup() {
		new Edge(EdgeSides.TOP, this.x, this.y, 1).register(this.area);
		new Edge(EdgeSides.LEFT, this.x, this.y, 1).register(this.area);
		new Edge(EdgeSides.BOTTOM, this.x, this.y+1, 1).register(this.area);
		new Edge(EdgeSides.RIGHT, this.x+1, this.y, 1).register(this.area);
	}

	render(camx, camy) {
		let rx = this.x - camx,
		    ry = this.y - camy;

		let px = blkSize() * rx,
		    py = blkSize() * ry;

		if (this.level.style === LevelStyles.SMB) {
			drawTexture('SMB.' + areaTypeName(this.area.type) + '.ground', px, py, blkSize(), blkSize());
		}
	}

	objectify() {
		return {t: this.constructor.name, p: [this.x, this.y]};
	}

	get width() { return 1; }
	get height() { return 1; }

	static getMenuTexture(level_style, area_type) {
		if (level_style === LevelStyles.SMB) {
			return 'SMB.' + areaTypeName(area_type) + '.ground';
		}
	}
}
objectTypes.GroundTile = GroundTile;

// A solid block.
class SolidBlock extends LevelObject {
	
	setup() {
		new Edge(EdgeSides.TOP, this.x, this.y, 1).register(this.area);
		new Edge(EdgeSides.LEFT, this.x, this.y, 1).register(this.area);
		new Edge(EdgeSides.BOTTOM, this.x, this.y+1, 1).register(this.area);
		new Edge(EdgeSides.RIGHT, this.x+1, this.y, 1).register(this.area);
	}

	render(camx, camy) {
		let rx = this.x - camx,
		    ry = this.y - camy;

		let px = blkSize() * rx,
		    py = blkSize() * ry;

		drawTexture(levelStyleName(this.level.style)+'.'+areaTypeName(this.area.type) + '.block', px, py, blkSize(), blkSize());
	}
	
	objectify() {
		return {t: this.constructor.name, p: [this.x, this.y]};
	}

	get width() { return 1; }
	get height() { return 1; }

	static getMenuTexture(level_style, area_type) {
		return levelStyleName(level_style)+'.'+areaTypeName(area_type) + '.block';
	}
}
objectTypes.SolidBlock = SolidBlock;

// A brick block. Can contain items. Turns into a coin when a P-switch is pressed.
class BrickBlock extends LevelObject {
	
	setup() {
		this.top = new Edge(EdgeSides.TOP, this.x, this.y, 1).register(this.area);
		this.left = new Edge(EdgeSides.LEFT, this.x, this.y, 1).register(this.area);
		this.bottom = new Edge(EdgeSides.BOTTOM, this.x, this.y+1, 1).register(this.area);
		this.right = new Edge(EdgeSides.RIGHT, this.x+1, this.y, 1).register(this.area);

		this.bop = 0;
	}

	render(camx, camy) {
		let rx = this.x - camx,
		    ry = this.y - camy;

		let px = blkSize() * rx,
		    py = blkSize() * ry;

		drawTexture(levelStyleName(this.level.style)+'.'+areaTypeName(this.area.type) + '.brick', px, py, blkSize(), blkSize());
	}

	tick() {
		const bopys =  [0, 0.0625, 0.25, 0.375, 0.375, 0.375, 0.25, 0.0625];
		const bopdys = [];

		if (this.bop > 0) {
			this.bop--;


		}
	}

	objectify() {
		return {t: this.constructor.name, p: [this.x, this.y]};
	}

	get width() { return 1; }
	get height() { return 1; }

	static getMenuTexture(level_style, area_type) {
		return levelStyleName(level_style)+'.'+areaTypeName(area_type) + '.brick';
	}

}
objectTypes.BrickBlock = BrickBlock;

// A cloud that is solid on one side, usually the top.
class CloudBlock extends LevelObject {
	
	setup() {
		new Edge(EdgeSides.TOP, this.x, this.y, 1).register(this.area);
	}

	render(camx, camy) {
		let rx = this.x - camx,
		    ry = this.y - camy;

		let px = blkSize() * rx,
		    py = blkSize() * ry;

		drawTexture(levelStyleName(this.level.style)+'.'+areaTypeName(this.area.type) + '.cloudblock', px, py, blkSize(), blkSize());
	}

	objectify() {
		return {t: this.constructor.name, p: [this.x, this.y]};
	}

	get width() { return 1; }
	get height() { return 1; }

	static getMenuTexture(level_style, area_type) {
		return levelStyleName(level_style)+'.'+areaTypeName(area_type) + '.cloudblock';
	}
}
objectTypes.CloudBlock = CloudBlock;

// An object that follows physics. The base of most enemies.
class PhysicsObject extends LevelObject {
	
	constructor(area, x, y) {
		super(area, x, y);
		this.dx = this.dy = 0;
		this.crawltop = this.crawlbottom = this.crawlleft = this.crawlright = 0;
		this.colleft = this.colright = this.coltop = this.colbottom = false;
		this.fricleft = this.fricright = this.frictop = 0; this.fricbottom = 1;
		this.pstrtop = this.pstrside = this.pstrbottom = 0;
		this.cstop = 200;
		this.csside = 100;
		this.csbottom = 100;
		this.drag = 0.924;
	}

	setup() {
		this.top = new Edge(EdgeSides.TOP, this.x, this.y, this.colWidth, this.frictop, this.pstrtop);
		this.top.dx = this.dx;
		this.top.dy = this.dy;
		this.top.register(this.area);

		this.left = new Edge(EdgeSides.LEFT, this.x, this.y, this.colHeight, this.fricleft, this.pstrside);
		this.left.dx = this.dx;
		this.left.dy = this.dy;
		this.left.register(this.area);

		this.bottom = new Edge(EdgeSides.BOTTOM, this.x, this.y + this.colHeight, this.colWidth, this.fricbottom, this.pstrbottom);
		this.bottom.dx = this.dx;
		this.bottom.dy = this.dy;
		this.bottom.register(this.area);

		this.right = new Edge(EdgeSides.RIGHT, this.x + this.colWidth, this.y, this.colHeight, this.fricright, this.pstrside);
		this.right.dx = this.dx;
		this.right.dy = this.dy;
		this.right.register(this.area);
	}

	tick() {
		this.colleft = this.colright = this.coltop = this.colbottom = false;
		this.dy += this.area.gravity;
		this.dy *= this.drag;

		let collided = true, hits = 0;

		while (collided) {
			collided = false;
			hits++;
		
			this.top.dx = this.left.dx = this.bottom.dx = this.right.dx = this.dx;
			this.top.dy = this.left.dy = this.bottom.dy = this.right.dy = this.dy;

			this.top.x = this.x;
			this.top.y = this.y,
			this.left.x = this.x;
			this.left.y = this.y;
			this.bottom.x = this.x;
			this.bottom.y = this.y + this.colHeight;
			this.right.x = this.x + this.colWidth;
			this.right.y = this.y;

			if (hits > 99) {
				this.dead = 1;
				return;
			} //throw new Error('hits');

			let closest_set, closest_time = Infinity;

			let collision;

			collision = this.area.collideEdge(this.top, this.cstop);
			collision[1] /= this.dy; //TODO: Make relative dy.
			if (Math.abs(collision[1]) < closest_time) {
				closest_time = Math.abs(collision[1]);
				closest_set = collision[0];
			}
			
			collision = this.area.collideEdge(this.left, this.csside);
			collision[1] /= this.dx; //TODO: Make relative dx.
			if (Math.abs(collision[1]) < closest_time) {
				closest_time = Math.abs(collision[1]);
				closest_set = collision[0];
			}
			
			collision = this.area.collideEdge(this.bottom, this.csbottom);
			collision[1] /= this.dy; //TODO: Make relative dy.
			if (Math.abs(collision[1]) < closest_time) {
				closest_time = Math.abs(collision[1]);
				closest_set = collision[0];
			}
			
			collision = this.area.collideEdge(this.right, this.csside);
			collision[1] /= this.dx; //TODO: Make relative dx.
			if (Math.abs(collision[1]) < closest_time) {
				closest_time = Math.abs(collision[1]);
				closest_set = collision[0];
			}

			if (closest_time < Infinity) {
				collided = true;

				if (closest_set[0].side === EdgeSides.TOP) {
					let my = Infinity, mdy = Infinity;
					let pedge = closest_set[0];

					for (const edge of closest_set) {
						if (edge.y < my) my = edge.y;
						if (edge.dy < mdy) mdy = edge.dy;
					}

					this.y = my - this.colHeight;
					this.dy = mdy;

					this.dx -= this.crawlbottom + pedge.dx;
					this.dx *= 1 - (this.fricbottom * pedge.friction);
					this.dx += this.crawlbottom + pedge.dx;

					this.colbottom = true;
				}
				
				else if (closest_set[0].side === EdgeSides.LEFT) {
					let mx = Infinity, mdx = Infinity;
					let pedge = closest_set[0];

					for (const edge of closest_set) {
						if (edge.x < mx) mx = edge.x;
						if (edge.dx < mdx) mdx = edge.dx;
					}

					this.x = mx - this.colWidth;
					this.dx = mdx;

					this.dy -= this.crawlright + pedge.dy;
					this.dy *= 1 - (this.fricright * pedge.friction);
					this.dy += this.crawlright + pedge.dy;

					this.colright = true;
				}
				
				else if (closest_set[0].side === EdgeSides.BOTTOM) {
					let my = -Infinity, mdy = -Infinity;
					let pedge = closest_set[0];

					for (const edge of closest_set) {
						if (edge.y > my) my = edge.y;
						if (edge.dy > mdy) mdy = edge.dy;
					}

					this.y = my;
					this.dy = mdy;

					this.dx -= this.crawltop + pedge.dx;
					this.dx *= 1 - (this.frictop * pedge.friction);
					this.dx += this.crawltop + pedge.dx;

					this.coltop = true;
				}
				
				else if (closest_set[0].side === EdgeSides.RIGHT) {
					let mx = -Infinity, mdx = -Infinity;
					let pedge = closest_set[0];

					for (const edge of closest_set) {
						if (edge.x > mx) mx = edge.x;
						if (edge.dx > mdx) mdx = edge.dx;
					}

					this.x = mx;
					this.dx = mdx;

					this.dy -= this.crawlleft + pedge.dy;
					this.dy *= 1 - (this.fricleft * pedge.friction);
					this.dy += this.crawlleft + pedge.dy;

					this.colleft = true;
				}
			}
		}

		if (!this.colleft && !this.colright) this.x += this.dx;
		if (!this.coltop && !this.colbottom) this.y += this.dy;

		this.top.dx = this.left.dx = this.bottom.dx = this.right.dx = this.dx;
		this.top.dy = this.left.dy = this.bottom.dy = this.right.dy = this.dy;
			
		this.top.x = this.x;
		this.top.y = this.y,
		this.left.x = this.x;
		this.left.y = this.y;
		this.bottom.x = this.x;
		this.bottom.y = this.y + this.colHeight;
		this.right.x = this.x + this.colWidth;
		this.right.y = this.y;
	}
	
	posttick() {
		const f = this.dead ? 'unregister' : 'update';
		this.top[f]();
		this.left[f]();
		this.bottom[f]();
		this.right[f]();
	}

	get width() {return this.colWidth;}
	get height() {return this.colHeight;}
}

// The most basic enemy.
class Goomba extends PhysicsObject {
	
	constructor(area, x, y) {
		super(area, x, y);

		this.colWidth = 1;
		this.colHeight = 1;

		this.crawlbottom = -0.049;

		this.pstrside = 50;
		this.csside = 50;
	}

	render(camx, camy, editor) {
		let rx = this.x - camx,
		    ry = this.y - camy;

		let px = blkSize() * rx,
		    py = blkSize() * ry;

		drawTexture(levelStyleName(this.level.style)+'.'+areaTypeName(this.area.type) + '.goomba.' + (editor ? 'stand' : 'walk'), px, py, blkSize(), blkSize());
	}

	tick() {
		super.tick();

		if ((this.crawlbottom < 0 && this.colleft) || (this.crawlbottom > 0 && this.colright)) this.crawlbottom *= -1;
	}

	objectify() {
		return {t: this.constructor.name, p: [this.x, this.y]};
	}

	static getMenuTexture(level_style, area_type) {
		return levelStyleName(level_style)+'.'+areaTypeName(area_type) + '.goomba.stand';
	}
}
objectTypes.Goomba = Goomba;

// It's a me, 
class Mario extends PhysicsObject {
	
	constructor(area, x, y) {
		super(area, x + 0.125, y);

		this.colWidth = 0.75;
		this.colHeight = 0.9375;

		this.fricbottom = 0.15;

		this.jumpTimer = 0;

		this.facingRight = true;
	}

	render(camx, camy, editor) {
		if (editor) return this.remove();

		let rx = this.x - camx - 0.125,
		    ry = this.y - camy - 0.0625;

		let px = blkSize() * rx,
		    py = blkSize() * ry;

		let pose = 'stand';

		if (!this.colbottom) {
			pose = 'jump';
		} else {
			let move = !!this.level.input.right - !!this.level.input.left;
			if (move === 1) {
				pose = this.dx >= 0 ? 'walk' : 'skid';
			} else if (move === -1) {
				pose = this.dx <= 0 ? 'walk' : 'skid';
			}

			if (pose === 'walk' && Math.abs(this.dx) > 0.15) pose = 'run';
		}

		drawTexture(levelStyleName(this.level.style) + '.mario.small.' + pose, px, py, blkSize(), blkSize(), !this.facingRight);
	}

	tick() {
		
		let move = !!this.level.input.right - !!this.level.input.left;

		move *= this.level.input.run ? 0.16 : 0.098;

		this.crawlbottom = move;

		if (this.colbottom) {
			if (move !== 0) {
				this.facingRight = move > 0;
			}
		} else {
			const airmove = (!!this.level.input.right - !!this.level.input.left) * 0.006;
			if ((airmove > 0 && this.dx < 0.125) || (airmove < 0 && this.dx > -0.125)) this.dx += airmove;
			else if (airmove === 0) this.dx *= 0.99;
		}

		if (this.colbottom && this.level.input.jump && !this.level.prev_input.jump) this.jumpTimer = Math.abs(this.dx) > 0.15 ? 15 : 10;

		if (this.coltop || !this.level.input.jump) this.jumpTimer = 0;
		else if (this.jumpTimer > 0) this.jumpTimer--;

		if (this.jumpTimer) this.dy = -0.369;

		super.tick();
	}
}

function CreateObject(area, d) {
	if ('p' in d) {
		return new objectTypes[d.t](area, d.p[0], d.p[1]);
	} else {
		return new objectTypes[d.t](area, d.d);
	}
}
