Game.graphics = (function() {
	'use strict';

	//initalize canvas
	var canvas = document.getElementById('gameplay-canvas'),
		context = canvas.getContext('2d');

	var destructionParticles = ParticleSystem( {
			image : 'textures/bigspark.png',
			speed: {mean: 50, stdev: 10},
			lifetime: {mean: 1, stdev: .5}
		},
		{
			drawImage: drawImage
		}
	);

	// main object to store sprite sheets
	var directionalSpriteSheets = {};
	var animatedDirectionalSpriteSheets = {};

	// creates a direcitonal sprite sheet for generic use
	function DirectionalSpriteSheet(spec) {
		var that = {},
			image = new Image();

		image.onload = function() {
			//
			// Our clever trick, replace the draw function once the image is loaded...no if statements!
			that.draw = function(args) {
				context.save();

				var toUse;

				switch(args.dir){
				case 'r':
					toUse = 0;
					break;
				case 'u':
					toUse = 1;
					break;
				case 'l':
					toUse = 2;
					break;
				case 'd':
					toUse = 3;
					break;
				default:
					toUse = 0;
				}

				//
				// Pick the selected sprite from the sprite sheet to render
				context.drawImage(
					image,
					spec.width * toUse, 0,	// Which sprite to pick out
					spec.width, spec.height,		// The size of the sprite
					args.x,	// Where to draw the sprite
					args.y,
					args.width, args.height);

				context.restore();
			};
			//
			// Once the image is loaded, we can compute the height and width based upon
			// what we know of the image and the number of sprites in the sheet.
			spec.height = image.height;
			spec.width = image.width / 4;
		};

		image.src = 'textures/' + spec.type + '.png';
		console.log('Using ' + image.src);

		that.draw = function(args) {};

		return that;
	}

	function AnimatedDirectionalSprite(spec) {
		var that = {},
			image = new Image();

		image.onload = function() {
			that.draw = function(args) {
				context.save();

				var dirUsed;

				switch(args.dir){
				case 'r':
					dirUsed = 0;
					break;
				case 'u':
					dirUsed = 1;
					break;
				case 'l':
					dirUsed = 2;
					break;
				case 'd':
					dirUsed = 3;
					break;
				default:
					dirUsed = 0;
				}

				var frameUsed;

				if(args.frameNo != undefined) {
					frameUsed = args.frameNo;
				}
				else {
					frameUsed = 0;
				}

				context.drawImage(
					image,
					spec.dirWidth * dirUsed + spec.frameWidth * frameUsed, 0,	// Which sprite to pick out
					spec.frameWidth, spec.height,		// The size of the sprite
					args.x,	args.y, 					// Where to draw the sprite
					args.w, args.h						// Draw output size
				);

				context.restore();
			};

			spec.height = image.height;
			spec.dirWidth = image.width / 4;
			spec.frameWidth = spec.dirWidth / 4;
		};

		image.src = 'textures/' + spec.type + '.png';
		console.log('Using ' + image.src);

		that.draw = function(args) {};

		/*******
		*This function shows how much life a creep has.
		********/

		that.drawCreepLifeIndicator = function(args){
			context.beginPath();
	    context.rect(args.x + 5, args.y - 20, 40, 10);
	    context.fillStyle = 'red';
	    context.fill();
			context.strokeStyle = "#000";
			context.stroke();
	    context.closePath();

			context.beginPath();
	    context.rect(args.x + 5, args.y - 20, 40 * (args.HP/args.totalHP), 10);
	    context.fillStyle = 'yellow';
	    context.fill();
			context.strokeStyle = "#000";
			context.stroke();
	    context.closePath();

		}

		return that;
	}

	// methods for spawning particles (keep in mind, each of these spawns one particle per call)
	function spawnParticle(location) {
		location.direction = Random.nextCircleVector();

		destructionParticles.create(location);
	}

	function spawnParticleUp(location) {
		location.direction = Random.nextTopQuarterVector();

		destructionParticles.create(location);
	}

	function updateParticles(timePassed) {
		destructionParticles.update(timePassed);
	}

	// clear particles from system
	function clearParticles() {
		destructionParticles.clear();
	}

	// and now to draw
	function drawParticles() {
		destructionParticles.render();
	}

	//create methods to clear canvas
	CanvasRenderingContext2D.prototype.clear = function() {
		this.save();
		this.setTransform(1, 0, 0, 1, 0, 0);
		this.clearRect(0, 0, canvas.width, canvas.height);
		this.restore();
	};

	function clear() {
		context.clear();
	}

	// draws tower
	function drawTower(spec) {
		var xDist = canvas.width / spec.cols;
		var yDist = canvas.height / spec.rows;

		// set xPos and yPos depending on if the caller specified a row and col or an x and y
		// useful so that we can call with mouse coordinates or with tower placement specificaitons
		if(spec.hasOwnProperty('row') && spec.hasOwnProperty('col')) {
			var xPos = spec.row * xDist;
			var yPos = spec.col * yDist;
		}
		else if(spec.hasOwnProperty('x') && spec.hasOwnProperty('y')) {
			xPos = Math.floor(spec.x / xDist) * xDist;
			yPos = Math.floor(spec.y / yDist) * yDist;
		}

		context.save();

		// allows us to specify that we want some transparency
		if(spec.hasOwnProperty('placing') && spec.placing) {
			context.globalAlpha = 0.5;
		}

		// determine if sprite sheet is loaded yet, if so draw sprite, otherwise create the sprite sheet
		if(directionalSpriteSheets.hasOwnProperty(spec.type)) {
			directionalSpriteSheets[spec.type].draw({x:xPos + 4, y:yPos + 4, type:spec.type, dir:spec.dir, width:xDist - 8, height:yDist - 8});
		}
		else {
			directionalSpriteSheets[spec.type] = DirectionalSpriteSheet({type:spec.type});
		}

		context.restore();
	}

	// draws a creep.  (TODO: animated sprites as creeps)
	function drawCreep(spec) {
		context.save();

		//context.fillStyle = 'blue';

		//context.fillRect(spec.x, spec.y, spec.w, spec.h);

		if(animatedDirectionalSpriteSheets.hasOwnProperty(spec.type)) {
			animatedDirectionalSpriteSheets[spec.type].draw(spec);
			animatedDirectionalSpriteSheets[spec.type].drawCreepLifeIndicator(spec);
		}
		else {
			animatedDirectionalSpriteSheets[spec.type] = AnimatedDirectionalSprite({type:spec.type});
		}

		context.restore();
	}

	//draws grid by looping through and drawing dividing lines across cols and rows
	function drawGrid(spec) {
		context.save();

		context.beginPath();
		context.moveTo(0, canvas.height);
		context.lineTo(0, 0);
		context.lineTo(canvas.width, 0);

		var xDist = canvas.width / spec.cols;
		var yDist = canvas.height / spec.rows;

		for(var i = 0; i < spec.cols; i++) {
			context.moveTo(xDist * (i + 1), 0);
			context.lineTo(xDist * (i + 1), canvas.height);
		}

		for(i = 0; i < spec.rows; i++) {
			context.moveTo(0, yDist * (i + 1));
			context.lineTo(canvas.width, yDist * (i + 1));
		}

		context.lineWidth = 4;
		context.stroke();

		context.restore();
	}

	// highlights designated square
	// valid = true for blue highlight, otherwise red highlight
	function highlightSquare(spec) {
		var xDist = canvas.width / spec.cols;
		var yDist = canvas.height / spec.rows;

		var squareX = Math.floor(spec.x / xDist);
		var squareY = Math.floor(spec.y / yDist);

		var xPos = squareX * xDist + 2;
		var yPos = squareY * yDist + 2;

		context.save();

		context.globalAlpha = 0.5;
		if(spec.validPlace) {
			context.fillStyle = 'blue';
		}
		else {
			context.fillStyle = 'red';
		}

		context.fillRect(xPos, yPos, xDist - 4, yDist - 4);

		context.restore();
	}

	// highlights range in locaiton specified with specified radius
	function highlightRange(spec) {
		var xDist = canvas.width / spec.cols;
		var yDist = canvas.height / spec.rows;

		var squareX = Math.floor(spec.x / xDist);
		var squareY = Math.floor(spec.y / yDist);

		var xPos = (squareX + .5) * xDist;
		var yPos = (squareY + .5) * yDist;

		context.save();

		context.globalAlpha = 0.5;
		context.fillStyle = 'yellow';

		context.beginPath();
		context.arc(xPos, yPos, spec.r * xDist, 0, 2 * Math.PI);
		context.fill();

		context.restore();
	}

	// generic draw text amd draw image functions
	function drawText(spec) {
		context.save();

		context.font = spec.font;
		context.fillStyle = spec.fillStyle;
		context.lineWidth = spec.lineWidth;

		context.fillText(spec.msg, spec.x, spec.y);

		context.restore();
	}

	function drawImage(spec) {
		context.save();

		context.translate(spec.center.x, spec.center.y);
		context.rotate(spec.rotation);
		context.translate(-spec.center.x, -spec.center.y);

		context.drawImage(
			spec.image,
			spec.center.x - spec.size/2,
			spec.center.y - spec.size/2,
			spec.size, spec.size);

		context.restore();
	}

	return {
		clear: clear,
		drawTower: drawTower,
		drawCreep: drawCreep,
		drawGrid: drawGrid,
		highlightSquare: highlightSquare,
		highlightRange: highlightRange,
		drawText: drawText,
		drawImage: drawImage,
		spawnParticle: spawnParticle,
		spawnParticleUp: spawnParticleUp,
		clearParticles: clearParticles,
		updateParticles: updateParticles,
		drawParticles: drawParticles
	};
}());
