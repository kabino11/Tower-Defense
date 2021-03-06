Game.graphics = (function() {
	'use strict';

	function FloatingNumberEffect(spec) {
		var that = {
			get x() { return spec.x; },
			get y() { return spec.y; },
			get text() { return spec.text; },

			get lifetime() { return spec.lifetime; },
			get alive() { return spec.alive; }
		};

		if(spec.lifetime == undefined) {
			spec.lifetime = .5;
		}

		if(spec.alive == undefined) {
			spec.alive = 0;
		}

		that.update = function(timePassed) {
			spec.y -= 100 * timePassed / 1000;

			spec.alive += timePassed / 1000;
		};

		that.render = function() {
			context.save();

			context.font = "30px fantasy";
			context.fillStyle = "#000";
			context.fillText(spec.text, spec.x, spec.y);

			context.restore();
		};

		return that;
	}

	var effects = [];

	//initalize canvas
	var canvas = document.getElementById('gameplay-canvas'),
		context = canvas.getContext('2d');

	var canvas2 = document.getElementById('scoring-canvas'),
		context2 = canvas2.getContext('2d');

	var destructionParticles = ParticleSystem( {
			image : 'textures/bigspark.png',
			speed: {mean: 50, stdev: 10},
			lifetime: {mean: 1, stdev: .5}
		},
		{
			drawImage: drawImage
		}
	);

	var bombParticles = ParticleSystem( {
		image: 'textures/explodespark.png',
		speed: {mean: 240, stdev: .5},
		lifetime: {mean: .25, stdev: .01}
	},
	{
		drawImage: drawImage
	});

	var freezeParticles = ParticleSystem( {
		image: 'textures/freezespark.png',
		speed: {mean: 180, stdev: .5},
		lifetime: {mean: 1, stdev: .01}
	},
	{
		drawImage: drawImage
	});

	// Storing images so that they only have to be loaded once
	var entranceImage = new Image();
	entranceImage.src = "textures/entrance.png";
	var bombImage = new Image();
	bombImage.src = "textures/bomb.png";
	var bulletImage = new Image();
	bulletImage.src = "textures/shellshot.png";
	var moneyImage = new Image();
	moneyImage.src = "textures/money.png";

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
			if(args.y < 30){
				context.beginPath();
		    context.rect(args.x + 5, args.y + 10, 40, 10);
		    context.fillStyle = 'red';
		    context.fill();
				context.strokeStyle = "#000";
				context.stroke();
		    context.closePath();

				context.beginPath();
		    context.rect(args.x + 5, args.y + 10, 40 * (args.HP/args.totalHP), 10);
		    context.fillStyle = 'yellow';
		    context.fill();
				context.strokeStyle = "#000";
				context.stroke();
		    context.closePath();

			}else{
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
		}

		return that;
	}

	// methods for spawning particles (keep in mind, each of these spawns one particle per call)
	function spawnParticle(location) {
		location.direction = Random.nextCircleVector();

		effects.push(destructionParticles.create(location));
	}

	function spawnParticleInRange(location, a, b) {
		location.direction = Random.nextVectorInAngleRange(a, b);

		effects.push(destructionParticles.create(location));
	}

	function createBombParticle(location) {
		location.direction = Random.nextCircleVector();

		effects.push(bombParticles.create(location));
	}

	function createBombParticleInRange(location, a, b) {
		location.direction = Random.nextVectorInAngleRange(a, b);

		effects.push(bombParticles.create(location));
	}

	function createFreezeParticle(location) {
		location.direction = Random.nextCircleVector();

		effects.push(freezeParticles.create(location));
	}

	function spawnNumberEffect(location) {
		effects.push(FloatingNumberEffect(location));
	}

	function spawnParticleUp(location) {
		location.direction = Random.nextTopQuarterVector();

		destructionParticles.create(location);
	}

	function updateParticles(timePassed) {
		for(var i = effects.length - 1; i >= 0; i--) {
			effects[i].update(timePassed);

			if(effects[i].alive >= effects[i].lifetime) {
				effects.splice(i, 1);
			}
		}
	}

	// clear particles from system
	function clearParticles() {
		effects.length = 0;
	}

	// and now to draw
	function drawParticles() {
		for(var i = 0; i < effects.length; i++) {
			effects[i].render();
		}
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
		context2.clear();
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

		// draw tower direction angle for bugfixing, no longer used
		//xPos += xDist/2;
		//yPos += xDist/2;
		//context.beginPath();
		//context.lineWidth = 2;
		//context.strokeStyle = 'black';
		//context.moveTo(xPos, yPos);
		//context.lineTo(xPos + xDist / 2 * Math.cos(spec.angle), yPos + yDist / 2 * Math.sin(spec.angle));
		//context.stroke();

		context.restore();
	}

	function drawBullet(spec) {
		context.save();

		context.translate(spec.x, spec.y);
		context.rotate(spec.angle);
		context.drawImage(bulletImage, 0, 0, 9, 9, -spec.r, -spec.r, spec.r * 2.5, spec.r * 2.5);

		context.restore();
	}

	function drawBomb(spec) {
		context.save();

		//context.beginPath();
		//context.fillStyle = 'red';
		//context.arc(spec.x, spec.y, spec.r, 0, Math.PI * 2);
		//context.fill();

		context.drawImage(bombImage, spec.x  - spec.r, spec.y  - spec.r, spec.r * 2, spec.r * 2);

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

		if(spec.hasOwnProperty('x') && spec.hasOwnProperty('y')) {
			var squareX = Math.floor(spec.x / xDist);
			var squareY = Math.floor(spec.y / yDist);
		}

		if(spec.hasOwnProperty('row') && spec.hasOwnProperty('col')) {
			squareX = spec.row;
			squareY = spec.col;
		}

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

		if(spec.hasOwnProperty('x') && spec.hasOwnProperty('y')) {
			var squareX = Math.floor(spec.x / xDist);
			var squareY = Math.floor(spec.y / yDist);
		}

		if(spec.hasOwnProperty('row') && spec.hasOwnProperty('col')) {
			squareX = spec.row;
			squareY = spec.col;
		}

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

	function highlightEntrance(spec){
		var xDist = canvas.width / spec.cols;
		var yDist = canvas.height / spec.rows;

		if(spec.hasOwnProperty('x') && spec.hasOwnProperty('y')) {
			var squareX = Math.floor(spec.x / xDist);
			var squareY = Math.floor(spec.y / yDist);
		}

		if(spec.hasOwnProperty('row') && spec.hasOwnProperty('col')) {
			squareX = spec.row;
			squareY = spec.col;
		}

		var xPos = squareX * xDist + 2;
		var yPos = squareY * yDist + 2;

		context.save();

		context.drawImage(entranceImage, xPos, yPos, xDist - 4, yDist - 4);

		context.restore();

	}

	function drawGameOver() {
		context.save();

		context.beginPath();

		context.font = '100px fantasy';
		context.fillStyle = 'black';
		context.fillText('GAME OVER', canvas.width / 2 - 300, canvas.height / 3);

		context.restore();
	}

	function drawScore(score) {
		context2.save();
		context2.font = "30px fantasy";
		context2.fillStyle = "#000";
		context2.fillText("Score: " + score, 5, 50);
		context2.restore();
	}

	function drawMoney(money) {
		context2.save();

		context2.drawImage(moneyImage, 200, 0, 60, 78);
		context2.font = "30px fantasy";
		context2.fillStyle = "#000";
		context2.fillText(": $" + money, 265, 50);
		context2.restore();
	}

	function drawLives(lives) {
		context2.save();
		context2.font = "30px fantasy";
		context2.fillStyle = "#000";
		context2.fillText("Lives: " + lives, 400, 50);
		context2.restore();
	}

	function drawWaves(wave) {
		context2.save();
		context2.font = "30px fantasy";
		context2.fillStyle = "#000";
		context2.fillText("Wave: " + wave, 600, 50);
		context2.restore();
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
		drawBullet: drawBullet,
		drawBomb: drawBomb,
		drawCreep: drawCreep,
		drawGrid: drawGrid,
		highlightSquare: highlightSquare,
		highlightRange: highlightRange,
		highlightEntrance:highlightEntrance,
		drawGameOver: drawGameOver,
		drawScore: drawScore,
		drawMoney: drawMoney,
		drawLives: drawLives,
		drawWaves:drawWaves,
		drawText: drawText,
		drawImage: drawImage,
		spawnParticle: spawnParticle,
		spawnParticleInRange: spawnParticleInRange,
		createBombParticle: createBombParticle,
		createBombParticleInRange: createBombParticleInRange,
		createFreezeParticle: createFreezeParticle,
		spawnNumberEffect: spawnNumberEffect,
		spawnParticleUp: spawnParticleUp,
		clearParticles: clearParticles,
		updateParticles: updateParticles,
		drawParticles: drawParticles
	};
}());
