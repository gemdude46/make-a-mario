
// A class for loading resources for the game.
class ResourceLoader {
	constructor() {
		this.rsCount = 0;
		this.rsComplete = 0;
	}

	get percent() {
		return Math.round(100 * this.rsComplete / this.rsCount);
	}

	get done() {
		return this.rsCount === this.rsComplete;
	}

	// Adds a loaded resource to the loader. Can be used for hard-coded resources.
	// string name: The name of the resource.
	// object resource: The resource
	add(name, rs) {
		this[name] = rs;
	}

	// Loads a resource.
	// string type: The type of resource this is. Must be 'IMG' or 'SND'
	// string name: The name of the resource. This is also how you access it after it loads.
	// string path: The URI of the resource.
	load(type, name, path) {
		
		if (type === 'IMG') {
			let el = document.createElement('img');

			let rsldr = this;
			el.addEventListener('load', () => {
				rsldr.rsComplete++;
			});

			el.addEventListener('error', () => {
				throw new Error('Unable to load resource "' + path + '"');
			});

			el.setAttribute('src', path);

			this.add(name, el);
		} else if (type === 'SND') {
			// NYI
		} else {
			throw new Error('"' + type + '" is not a valid resource type.');
		}

		this.rsCount++;
	}
}

function createResourceLoader() {
	const rs = new ResourceLoader();

	rs.load('IMG', 'missing', '../img/missing.png');
	rs['missingno'] = {
		src: 'missing'
	};

	rs.load('IMG', 'SMB.mario', '../img/SMB1_mario.png');
	rs['SMB.mario.small.stand'] = {
		src: 'SMB.mario',
		crop: {
			x: 0,
			y: 32,
			width: 16,
			height: 16
		}
	};

	rs['SMB.mario.small.walk'] = {
		frames: [
			{
				src: 'SMB.mario',
				crop: {
					x: 16,
					y: 32,
					width: 16,
					height: 16
				}
			},
			{
				src: 'SMB.mario',
				crop: {
					x: 32,
					y: 32,
					width: 16,
					height: 16
				}
			},
			{
				src: 'SMB.mario',
				crop: {
					x: 48,
					y: 32,
					width: 16,
					height: 16
				}
			},
		],
		msperframe: 120
	};
	
	rs['SMB.mario.small.run'] = {
		frames: [
			{
				src: 'SMB.mario',
				crop: {
					x: 16,
					y: 32,
					width: 16,
					height: 16
				}
			},
			{
				src: 'SMB.mario',
				crop: {
					x: 32,
					y: 32,
					width: 16,
					height: 16
				}
			},
			{
				src: 'SMB.mario',
				crop: {
					x: 48,
					y: 32,
					width: 16,
					height: 16
				}
			},
		],
		msperframe: 80
	};
	
	
	rs['SMB.mario.small.skid'] = {
		src: 'SMB.mario',
		crop: {
			x: 64,
			y: 32,
			width: 16,
			height: 16
		}
	};
	
	rs['SMB.mario.small.jump'] = {
		src: 'SMB.mario',
		crop: {
			x: 80,
			y: 32,
			width: 16,
			height: 16
		}
	};

	rs['SMB.mario.small.die'] = {
		src: 'SMB.mario',
		crop: {
			x: 96,
			y: 32,
			width: 16,
			height: 16
		}
	};

	rs['editor.start'] = {
		src: 'SMB.mario',
		crop: {
			x: 0,
			y: 32,
			width: 16,
			height: 16
		},
		alpha: 0.5
	};
	
	rs.load('IMG', 'menu.SMB_1-1_scr2', '../img/classic.png');

	rs.load('IMG', 'SMB.GROUND.tiles', '../img/SMB1_ground_tiles.png');
	rs['SMB.GROUND.ground'] = {
		src: 'SMB.GROUND.tiles',
		crop: {
			x: 0,
			y: 0,
			width: 16,
			height: 16
		}
	};

	rs['SMB.GROUND.block'] = {
		src: 'SMB.GROUND.tiles',
		crop: {
			x: 48,
			y: 0,
			width: 16,
			height: 16
		}
	};

	rs['SMB.GROUND.brick'] = {
		src: 'SMB.GROUND.tiles',
		crop: {
			x: 16,
			y: 0,
			width: 16,
			height: 16
		}
	};

	rs['SMB.GROUND.goomba.stand'] = {
		src: 'SMB.GROUND.tiles',
		crop: {
			x: 0,
			y: 128,
			width: 16,
			height: 16
		}
	}
	
	rs['SMB.GROUND.goomba.walk'] = {
		frames: [
			{
				src: 'SMB.GROUND.tiles',
				crop: {
					x: 0,
					y: 128,
					width: 16,
					height: 16
				}
			},
			{
				src: 'SMB.GROUND.tiles',
				crop: {
					x: 0,
					y: 128,
					width: 16,
					height: 16
				},
				hflip: true
			}
		],
		msperframe: 160
	}

	return rs;
}
