Game.screens['game-play'] = (function(game, graphics, input) {
	'use strict';

	// basic definition for tower, returns the basic info needed for rendering.  Towers that can shoot will be a subclass and will have a update function
	function Tower(spec) {
		var that = {
			get type() { return spec.type; },
			get x() { return spec.x; },
			get y() { return spec.y; },
			get r() { return spec.r; },
			get dir() { return spec.dir; },
			get angle() { return spec.angle; },
			get rotRate() { return spec.rotRate; },

			get timeBetweenShots() { return spec.timeBetweenShots; },
			get shotTimer() { return spec.shotTimer; },

			get level() { return spec.level; },
			get damage() { return spec.damage; }
		};

		if(spec.angle == undefined) {
			spec.angle = 0;
		}

		if(spec.rotRate == undefined) {
			spec.rotRate = Math.PI;
		}

		if(spec.timeBetweenShots == undefined) {
			spec.timeBetweenShots = .4;
		}
		if(spec.shotTimer == undefined) {
			spec.shotTimer = 0;
		}

		if(spec.level == undefined) {
			spec.level = 1;
		}

		if(spec.damage == undefined) {
			spec.damage = 5;
		}

		that.setDir = function(dir) {
			if(dir == 'u' || dir == 'd' || dir == 'r' || dir == 'l') {
				spec.dir = dir;
			}
		};

		that.shoot = function(targets, xDist, yDist, timePassed) {
			//first we find the centerpoint of our tower
			var xPos = (spec.x + .5) * xDist,
				yPos = (spec.y + .5) * yDist;

			//if we're able to fire another shot then try to shoot
			if(spec.shotTimer <= 0) {
				//find if there's a creep in front of our gun
				for(var i = 0; i < targets.length; i++) {
					var cXpos = targets[i].x + targets[i].w / 2;
					var cYpos = targets[i].y + targets[i].h / 2;
					var dist = Math.sqrt(Math.pow(xPos - cXpos, 2) + Math.pow(yPos - cYpos, 2));

					var fireAngle = Math.acos((cXpos - xPos) / dist);

					if(Math.asin((cYpos - yPos) / dist) < 0) {
						fireAngle = (2 * Math.PI) - fireAngle;
					}

					// if so shoot at it
					if(Math.abs(spec.angle - fireAngle) < .1) {
						spec.shotTimer = spec.timeBetweenShots;
						bullets.push(Bullet({x:xPos, y:yPos, r:5, spd:750, range:spec.r * xDist, dmg:spec.damage, angle:spec.angle}));
						return;
					}
				}
			}
			else {  // otherwise decrement our shot timer
				spec.shotTimer -= timePassed / 1000;
			}

			// then if there's nothing to shoot at where we're pointing then find the minion closest to us and rotate likewise
			var closest = undefined;
			var closestDist = 99999;

			for(i = 0; i < targets.length; i++) {
				var cxCenter = targets[i].x + targets[i].w / 2;
				var cyCenter = targets[i].y + targets[i].h / 2;
				var dist = Math.sqrt(Math.pow(cxCenter - xPos, 2) + Math.pow(cyCenter - yPos, 2));

				if(dist < closestDist) {
					closestDist = dist;
					closest = targets[i];
				}
			}

			// if there's nothing to shoot at just return
			if(closest == undefined) {
				return;
			}

			// otherwise rotate to closest (in final will rotate by set speet)
			var cXpos = closest.x + closest.w / 2;
			var cYpos = closest.y + closest.h / 2;

			var targetAngle = Math.acos((cXpos - xPos) / closestDist);

			if(Math.asin((cYpos - yPos) / closestDist) < 0) {
				var targetAngle = 2 * Math.PI - targetAngle;
			}

			spec.angle %= Math.PI * 2;

			var targetVect = {x:Math.cos(targetAngle), y:Math.sin(targetAngle)};
			var currentVect = {x:Math.cos(spec.angle), y:Math.sin(spec.angle)};

			var cp = targetVect.y * currentVect.x - targetVect.x * currentVect.y;

			if(cp > 0) {
				spec.angle += spec.rotRate * timePassed / 1000;
				currentVect = {x:Math.cos(spec.angle), y:Math.sin(spec.angle)};
				cp = targetVect.y * currentVect.x - targetVect.x * currentVect.y;
				if(cp <= 0) {
					spec.angle = targetAngle;
				}
			}
			else if (cp <= 0) {
				spec.angle -= spec.rotRate * timePassed / 1000;
				currentVect = {x:Math.cos(spec.angle), y:Math.sin(spec.angle)}
				cp = targetVect.y * currentVect.x - targetVect.x * currentVect.y;
				if(cp > 0) {
					spec.angle = targetAngle;
				}
			}
			spec.angle = spec.angle % (Math.PI * 2);

			if(spec.angle > 0 && spec.angle < Math.PI / 4) {
				spec.dir = 'r';
			}
			else if(spec.angle >= Math.PI / 4 && spec.angle <= Math.PI * 3 / 4) {
				spec.dir = 'd';
			}
			else if (spec.angle > Math.PI * 3 / 4 && spec.angle < Math.PI * 5 / 4) {
				spec.dir = 'l';
			}
			else if (spec.angle >= Math.PI * 5 / 4 && spec.angle <= Math.PI * 7 / 4) {
				spec.dir = 'u';
			}
			else {
				spec.dir = 'r';
			}
		}

		return that;
	}

	function FlameTower(spec) {
		var that = Tower(spec);

		spec.damage = 10;

		return that;
	}

	function TowerFactory(spec) {
		var that;

		if(spec.type === 'flame-tower') {
			that = FlameTower(spec);
		}
		else {
			that = Tower(spec);
		}

		return that;
	}

	// likewise a basic creep definiteion as well, will subclass out to modify movement parameters (also hp, damage resistance, etc.)
	function Creep(spec) {
		var that = {
			get type() { return spec.type; },
			get x() { return spec.x; },
			get y() { return spec.y; },
			get w() { return spec.w; },
			get h() { return spec.h; },
			get spd() { return spec.spd; },
			get dir() { return spec.dir; },

			get totalHP() { return spec.totalHP; },
			get HP() { return spec.HP; },

			get numFrames() { return spec.numFrames; },
			get frameNo() { return spec.frameNo; },

			get idxNo() { return spec.idxNo; }
		};

		if(spec.frameNo == undefined) {
			spec.frameNo = 0;
		}
		//check if hp has been set, if not set default values
		if(spec.totalHP == undefined) {
			spec.totalHP = 25;
		}
		if(spec.HP == undefined) {
			spec.HP = spec.totalHP;
		}

		var nextFrame = 0.0;

		that.update = function(timePassed, pathData) {
			if(pathData != undefined) {
				var canvasRect = mouse.getCanvasBounds();

				var xDist = canvasRect.width / pathData[0].length;
				var yDist = canvasRect.height / pathData.length;

				var xPos = Math.floor(spec.x / xDist);
				var yPos = Math.floor(spec.y / yDist);

				var cxPos = Math.floor((spec.x + spec.w) / xDist);
				var cyPos = Math.floor((spec.y + spec.h) / yDist);

				if(xPos == cxPos && yPos == cyPos) {
					spec.dir = pathData[yPos][xPos];
				}
			}

			if(spec.dir == 'r') {
				spec.x += spec.spd * (timePassed / 1000);
			}
			else if(spec.dir == 'l') {
				spec.x -= spec.spd * (timePassed / 1000);
			}
			else if(spec.dir == 'u') {
				spec.y -= spec.spd * (timePassed / 1000);
			}
			else if(spec.dir == 'd') {
				spec.y += spec.spd * (timePassed / 1000);
			}
			else {
				spec.x += spec.spd * (timePassed / 1000);
			}

			nextFrame += timePassed / 1000;

			while(nextFrame > .1) {
				nextFrame -= .1;
				spec.frameNo += 1;
				spec.frameNo = spec.frameNo % 4;
			}
		};

		that.giveDamage = function(dmgIn) {
			spec.HP -= dmgIn;
			if(spec.HP < 0) {
				spec.HP = 0;
			}
		}

		that.setIdxNo = function(idxIn) {
			spec.idxNo = idxIn;
		};

		return that;
	}

	function AirCreep(spec) {
		var that = Creep(spec);

		var nextFrame = 0.0;

		that.update = function(timePassed) {
			if(spec.dir == 'r') {
				spec.x += spec.spd * (timePassed / 1000);
			}
			else if(spec.dir == 'l') {
				spec.x -= spec.spd * (timePassed / 1000);
			}
			else if(spec.dir == 'u') {
				spec.y -= spec.spd * (timePassed / 1000);
			}
			else if(spec.dir == 'd') {
				spec.y += spec.spd * (timePassed / 1000);
			}
			else {
				spec.x += spec.spd * (timePassed / 1000);
			}

			spec.frameNo += 1;
			spec.frameNo = spec.frameNo % 4;
		}

		return that;
	}

	function ArmoredCreep(spec) {
		var that = Creep(spec);

		that.giveDamage = function(dmgIn) {
			spec.HP -= dmgIn / 2;
			if(spec.HP < 0) {
				spec.hp = 0;
			}
		}

		return that;
	}

	function CreepFactory(spec) {
		var that;

		if(spec.type == 'air-creep') {
			that = AirCreep(spec);
		}
		else if(spec.type == 'armored-creep') {
			that = ArmoredCreep(spec);
		}
		else {
			that = Creep(spec);
		}

		return that;
	}

	function Bullet(spec) {
		var that = {
			get x() { return spec.x; },
			get y() { return spec.y; },
			get r() { return spec.r; },
			get range() { return spec.range; },
			get traveled() { return spec.traveled; },
			get spd() { return spec.spd; },
			get angle() { return spec.angle; },
			get dmg() { return spec.dmg; }
		};

		spec.traveled = 0;

		that.update = function(timePassed) {
			spec.traveled += spec.spd * timePassed / 1000;
			spec.x += spec.spd * Math.cos(spec.angle) * timePassed / 1000;
			spec.y += spec.spd * Math.sin(spec.angle) * timePassed / 1000;
		};

		return that;
	}

	// used for input
	var keyboard = input.Keyboard();
	var mouse = input.Mouse();

	// keep track of loop state
	var running = true;

	// timestamp and frame information
	var prevTime;
	var currentTime;
	var currentFrame = undefined;

	//base tower costs variable
	var towerCosts = {
		'cannon-tower': 5,
		'flame-tower': 10,
		'freeze-tower': 10,
		'anti-air-tower': 15
	};

	// actual game variables to use
	var rows;
	var cols;

	// keeps track of towers and creeps in game
	var towers;
	var creeps;
	var bullets;

	// keep track of player income
	var income;

	// keep track of tower under mouse cursor and bool for keeping track of pathfinding state
	var towerUnderMouse;
	var validPlace;

	var towerSelected;

	// 2d array for pathfinding
	var pathArray;

	// variables for enabling build mode as well as turret range and type to build
	var typeSelectedBuild;
	var rangeSelected;
	var build_mode;

	// starts build mode if it hasn't been started yet
	function startBuildMode() {
		if(!build_mode) {
			if(income < towerCosts[typeSelectedBuild]) {
				document.getElementById('towerinfo').innerHTML = "Can't afford that";
				return;
			}

			build_mode = true;
			towerSelected = undefined;

			window.addEventListener('mousedown', buildClick);
		}
	}

	// runs basic blob algorithm on 2d array 'data' input.
	// also optionally takes an x and y argument for one additional obstacle in pathfinding (useful for tower placement validity)
	function blobPath(data, x, y) {
		// initalize data array
		for(var i = 0; i < data.length; i++) {
			for(var j = 0; j < data[i].length; j++) {
				data[i][j] = ' ';
			}
		}

		// create objective markers to path to
		for(i = 0; i < rows; i++) {
			data[i][data[i].length - 1] = 'r';
		}

		// then add in towers based on tower coordinates
		for(i = 0; i < towers.length; i++) {
			data[towers[i].y][towers[i].x] = 'N';
		}

		// add one more if user specified to do so
		if(x != undefined && y != undefined) {
			data[y][x] = 'N';
		}

		// create change buffer so that recent additions don't affect the algorithm
		var changes = [];

		// algorithm state variable
		var done;

		do {
			done = true;  // start loop assuming we're done.  if we make a change then immediately assume we aren't.

			// iterate through entire array
			for(i = 0; i < data.length; i++) {
				for(j = 0; j < data[i].length; j++) {
					// if the current space is empty and the space next to you contains something that isn't empty or a N
					// then add your coordinates for direciton change to the change buffer
					if(data[i][j] == ' ') {
						if(j < data[i].length - 1 && data[i][j + 1] != ' ' && data[i][j + 1] != 'N') {
							done = false;
							changes.push({x:j, y:i, dir:'r'});
						}
						else if(i > 0 && data[i - 1][j] != ' ' && data[i - 1][j] != 'N') {
							done = false;
							changes.push({x:j, y:i, dir:'u'});
						}
						else if(i < data.length - 1 && data[i + 1][j] != ' ' && data[i + 1][j] != 'N') {
							done = false;
							changes.push({x:j, y:i, dir:'d'});
						}
						else if(j > 0 && data[i][j - 1] != ' ' && data[i][j - 1] != 'N') {
							done = false;
							changes.push({x:j, y:i, dir:'l'});
						}
					}
				}
			}

			// if we're not done then iterate through the change buffer implementing the changes
			if(!done) {
				for(i = 0; i < changes.length; i++) {
					data[changes[i].y][changes[i].x] = changes[i].dir;
				}

				changes.length = 0;  // empty the buffer so we don't have repeat changes applied
			}

		} while(!done);
	}

	// prints paths to console (debug purposes)
	function printPaths() {
		for(var i = 0; i < pathArray.length; i++) {
			var rowOut = '';

			for(var j = 0; j < pathArray.length; j++) {
				rowOut += pathArray[i][j] + ' ';
			}

			console.log(rowOut);
		}
	}

	// Functions invoked via mouse listeners
	function selectTower() {
		if(mouse.inCanvas()) {
			towerSelected = undefined;

			if(!build_mode && towerUnderMouse != undefined) {
				console.log("Tower select method called!");

				towerSelected = towerUnderMouse;
				document.getElementById('delete-tower').classList.add('show');
			}
			else {
				document.getElementById('delete-tower').classList.remove('show');
			}
		}
	}

	// function set when building objects
	// places tower into array upon click
	function buildClick() {
		var mousePos = mouse.getMouse();
		var canvasRect = mouse.getCanvasBounds();

		// determines if mouse is in the canvas and if the proposed position is in a valid location
		// if so then place the tower
		if(towerUnderMouse == undefined && validPlace && mouse.inCanvas()) {
			// calculate 2d array coordinates
			var xLoc = Math.floor(mousePos.x / (canvasRect.width / cols));
			var yLoc = Math.floor(mousePos.y / (canvasRect.height / rows));

			towers.push(TowerFactory({type:typeSelectedBuild, x:xLoc, y:yLoc, r:rangeSelected, dir:'r'}));

			// update pathfinding for creeps
			blobPath(pathArray);
			//printPaths();

			//console.log(typeSelectedBuild + ' tower built');

			// turn off build mode, deselect build option, and remove the event listener for this function
			build_mode = false;
			typeSelectedBuild = undefined;

			document.getElementById('towerinfo').innerHTML = '';

			window.removeEventListener('mousedown', buildClick);

			// spawn particles for effect
			for(var i = 0; i < 20; i++) {
				graphics.spawnParticle({x:(xLoc + .5) * canvasRect.width / cols , y:(yLoc + .5) * canvasRect.height / rows});
			}
		}
		else {  //otherwise print an error message
			console.log('Can\'t place a tower there.');
		}
	}

	// functions for keys to invoke

	// stops the game loop, deregisters keys, and takes you to the main menu
	function quitGame() {
		typeSelectedBuild = undefined;

		if(build_mode) {
			build_mode = false;

			window.removeEventListener('mousedown', buildClick);
		}
		window.removeEventListener('mousedown', selectTower);

		running = false;
		keyboard.deregisterCommand(quitGame);
		window.cancelAnimationFrame(currentFrame);
		currentFrame = undefined;
		game.showScreen('main-menu');
	}

	//core loop: take time, update, render, repeat
	function gameLoop() {
		prevTime = currentTime;
		currentTime = performance.now();

		keyboard.update(currentTime - prevTime);

		update(currentTime - prevTime);

		//then update particles (done independently of game update so that they can move even on the game over screen)
		graphics.updateParticles(currentTime - prevTime);

		render();

		if(running) {
			currentFrame = window.requestAnimationFrame(gameLoop);
		}
	}

	//updates game objects each frame
	function update(timePassed) {
		// start off assuming that there isn't a tower under the mouse and that there is a valid path
		towerUnderMouse = undefined;
		validPlace = true;

		// obtain input data
		var canvasRect = mouse.getCanvasBounds();
		var mousePos = mouse.getMouse();

		var xDist = canvasRect.width / cols;
		var yDist = canvasRect.height / rows;

		// if the mouse is in the canvas
		if(mouse.inCanvas()) {
			// calculate grid coordinates for current mouse position
			var xPos = Math.floor(mousePos.x / xDist);
			var yPos = Math.floor(mousePos.y / yDist);

			// iterate through towers, if you find one with the same coordinates as mouse set towerUnderMouse to it and mark it an invalid place for pathing
			for(var i = 0; i < towers.length; i++) {
				if(towers[i].x == xPos && towers[i].y == yPos) {
					towerUnderMouse = i;
					validPlace = false;
					break;
				}
			}

			// if we're building and already don't have a tower under the mouse
			if(build_mode && towerUnderMouse == undefined) {
				// create temporary array and fill it to game dimensions
				var testArray = [];

				for(i = 0; i < rows; i++) {
					var current = [];

					for(var j = 0; j < cols; j++) {
						current.push(' ');
					}

					testArray.push(current);
				}

				// do pathing with temporary array and proposed coordinates.  Then set validPlace accordingly if there isn't a path
				blobPath(testArray, xPos, yPos);
				if(testArray[6][0] == ' ' || testArray[6][0] == 'N') {
					validPlace = false;
				}
			}
		}

		// now update the creeps in the array
		for(i = creeps.length - 1; i >= 0; i--) {
			creeps[i].update(timePassed, pathArray);
			if(creeps[i].x > canvasRect.width) {
				//console.log('Creep deleted!');
				creeps.splice(i, 1);
			}
		}

		// put creeps into a quadtree for tower targeting
		var creepTree = new Quadtree({
			x: 0,
			y: 0,
			w: canvasRect.width,
			h: canvasRect.height
		});

		// now put our creeps into a quadtree for easier hitbox detection
		for(i = 0; i < creeps.length; i++) {
			creeps[i].setIdxNo(i);
			creepTree.insert(creeps[i]);
		}

		// now iterate through all the towers to shoot at creeps
		for(i = 0; i < towers.length; i++) {
			var creepArray = creepTree.retrieve({
				x:(towers[i].x + .5) * xDist,
				y:(towers[i].y + .5) * yDist,
				w:2 * towers[i].r * xDist,
				h:2 * towers[i].r * yDist
			});

			var targets = [];

			// now for every creep that can be targeted test for in range
			// if so put it into an array to feed to the tower for targeting
			for(j = 0; j < creepArray.length; j++) {
				if(collides(creepArray[j], {x:(towers[i].x + .5) * xDist, y:(towers[i].y + .5) * yDist, r:towers[i].r * xDist})) {
					//DEBUG ONLY, SEVERELY HURTS PERFORMANCE TO USE THIS LOG OUTPUT
					//console.log("Creep " + creepArray[j].type + " in range of " + towers[i].type);
					targets.push(creepArray[j]);
				}
			}

			// now have the tower shoot at potential targets
			towers[i].shoot(targets, xDist, yDist, timePassed);
		}

		// now iterate through all existing bullets to update, retrieve potential collision candidates,
		// hit detect on those candidates, and then manage accordingly
		for(i = bullets.length - 1; i >= 0; i--) {
			bullets[i].update(timePassed);
			targets = creepTree.retrieve({
				x:bullets[i].x - bullets[i].r,
				y:bullets[i].y - bullets[i].r,
				w:bullets[i].r * 2,
				h:bullets[i].r * 2
			});

			var hit = false;
			// if we hit someone indicate that we did, deal damage, and then break out because each bullet deals damage once
			for(j = 0; j < targets.length; j++) {
				if(collides(targets[j], bullets[i])) {
					creeps[targets[j].idxNo].giveDamage(bullets[i].dmg);
					hit = true;
					break;
				}
			}

			// if a bullet has hit someone or gone out of range delete.
			if(hit || bullets[i].traveled >= bullets[i].range) {
				bullets.splice(i, 1);
			}
		}

		// Then we'll finally delete creeps from the array when they die
		for(i = creeps.length - 1; i >= 0; i--) {
			if(creeps[i].HP <= 0) {
				for(j = 0; j < 20; j++) { // spawn death particles
					graphics.spawnParticle({x:creeps[i].x + creeps[i].w / 2, y:creeps[i].y + creeps[i].h / 2});
				}
				creeps.splice(i, 1);
			}
		}
	}

	// render function (all output goes through the graphics object)
	function render() {
		if(creeps.length == 0) {  // clear gameinfo if creep array is empty
			document.getElementById('gameinfo').innerHTML = '';
		}
		
		graphics.clear();

		var mousePos = mouse.getMouse();

		// if we're building we want to draw a grid, show a preview sprite of a tower under the mouse cursor, draw a range indicator, and draw a validity indicator
		if(build_mode) {
			graphics.drawGrid({rows: rows, cols: cols});
			var canvasRect = mouse.getCanvasBounds();
			var mousePos = mouse.getMouse();

			if(mouse.inCanvas()) {
				graphics.highlightRange({x:mousePos.x, y:mousePos.y, rows:rows, cols:cols, r:rangeSelected});
				graphics.highlightSquare({x:mousePos.x, y:mousePos.y, rows:rows, cols:cols, validPlace:validPlace});
				graphics.drawTower({x:mousePos.x, y:mousePos.y, type:typeSelectedBuild, dir:'l', rows:rows, cols:cols});
			}
		}
		else if(towerUnderMouse != undefined) {  //otherwise show data for tower underneath the mouse
			graphics.highlightRange({x:mousePos.x, y:mousePos.y, rows:rows, cols:cols, r:towers[towerUnderMouse].r});
			graphics.highlightSquare({x:mousePos.x, y:mousePos.y, rows:rows, cols:cols, validPlace:true});
		}

		if(towerSelected != undefined) {
			graphics.highlightRange({row:towers[towerSelected].x, col:towers[towerSelected].y, rows:rows, cols:cols, r:towers[towerSelected].r});
			graphics.highlightSquare({row:towers[towerSelected].x, col:towers[towerSelected].y, rows:rows, cols:cols, r:towers[towerSelected].r, validPlace:true});
		}

		// now draw the currently placed towers
		for(var i = 0; i < towers.length; i++) {
			graphics.drawTower({row:towers[i].x, col:towers[i].y, type:towers[i].type, placing:false, dir:towers[i].dir, angle:towers[i].angle, rows:rows, cols:cols});
		}

		// now draw all existing creeps
		for(i = 0; i < creeps.length; i++) {
			graphics.drawCreep(creeps[i]);
		}

		// now draw all of the bullets
		for(i = 0; i < bullets.length; i++) {
			graphics.drawBullet(bullets[i]);
		}

		// and then draw all of our particles
		graphics.drawParticles();
	}

	// standard functions for other classes to interact with
	function initalize() {
		//create mouseover functions for all our towers
		// standard format: set typeSelectedBuild, rangeSelected, and display selected
		document.getElementById('cannon-tower').addEventListener('mouseover', function() {
			if(build_mode) return;

			typeSelectedBuild = 'cannon-tower';
			rangeSelected = 4;
			var temp = TowerFactory({type:typeSelectedBuild, r:rangeSelected})
			document.getElementById('towerinfo').innerHTML = "Cannon Tower" + "<br />Cost: " + towerCosts[typeSelectedBuild] + "<br>Range: " + rangeSelected  + "<br />Damage: " + temp.damage;
		});

		document.getElementById('flame-tower').addEventListener('mouseover', function() {
			if(build_mode) return;

			typeSelectedBuild = 'flame-tower';
			rangeSelected = 2;
			var temp = TowerFactory({type:typeSelectedBuild, r:rangeSelected})
			document.getElementById('towerinfo').innerHTML = 'Flame Tower' + "<br />Cost: " + towerCosts[typeSelectedBuild] + "<br>Range: " + rangeSelected  + "<br />Damage: " + temp.damage;
		});

		document.getElementById('freeze-tower').addEventListener('mouseover', function() {
			if(build_mode) return;

			typeSelectedBuild = 'freeze-tower';
			rangeSelected = 3;
			var temp = TowerFactory({type:typeSelectedBuild, r:rangeSelected})
			document.getElementById('towerinfo').innerHTML = 'Freeze Tower'+"<br />Cost: " + towerCosts[typeSelectedBuild] + "<br>Range: " + rangeSelected  + "<br />Damage: " + temp.damage;
		});

		document.getElementById('anti-air-tower').addEventListener('mouseover', function() {
			if(build_mode) return;

			typeSelectedBuild = 'anti-air-tower';
			rangeSelected = 5;
			var temp = TowerFactory({type:typeSelectedBuild, r:rangeSelected})
			document.getElementById('towerinfo').innerHTML = 'Anti-Air Tower' + "<br />Cost: " + towerCosts[typeSelectedBuild] + "<br>Range: " + rangeSelected  + "<br />Damage: " + temp.damage;
		});

		// assign build functions to all our buttons
		document.getElementById('cannon-tower').addEventListener('click', function() {
			startBuildMode();
		});

		document.getElementById('flame-tower').addEventListener('click', function() {
			startBuildMode();
		});

		document.getElementById('freeze-tower').addEventListener('click', function() {
			startBuildMode();
		});

		document.getElementById('anti-air-tower').addEventListener('click', function() {
			startBuildMode();
		});

		document.getElementById('delete-tower').addEventListener('click', function() {
			console.log('delete-tower called! ' + towerSelected);
			if(towerSelected != undefined) {
				towers.splice(towerSelected, 1);
				towerSelected = undefined;
				blobPath(pathArray);
				document.getElementById('delete-tower').classList.remove('show');
			}
		});

		// set button to spawn creeps
		document.getElementById('start-wave').addEventListener('click', function() {
			var rect = mouse.getCanvasBounds();

			var xDist = rect.width / cols;
			var yDist = rect.height / rows;

			var select = Math.floor(Math.random() * 4);
			var type;

			switch(select) {
			case 0:
				type = 'normal-creep';
				break;
			case 1:
				type = 'armored-creep';
				break;
			case 2:
				type = 'snake-creep';
				break;
			case 3:
				type = 'air-creep';
				break;
			}

			document.getElementById('towerinfo').innerHTML = "";
			document.getElementById('gameinfo').innerHTML = "Get Ready...CREEPS coming...!<br />KILL THEM ALL... Go...Go..Go!!!";
			creeps.push(CreepFactory({type:type, x:0, y:6 * yDist + 4, w:xDist - 8, h:yDist - 8, spd:200, dir:'r'}));
		});
	}

	// initalizes game state and starts game loop
	function run() {
		// register all our keys
		keyboard.registerCommand(KeyEvent.DOM_VK_ESCAPE, quitGame);

		window.addEventListener('mousedown', selectTower);

		// initalize our towers and creeps arrays
		towers = [];
		creeps = [];
		bullets = [];

		// initalize tower selection and placement variables
		towerUnderMouse = undefined;
		towerSelected = undefined;
		validPlace = true;

		// initalize game size
		rows = 15;
		cols = 15;

		// initalize income
		income = 0;

		// initalize the main pathfinding array
		pathArray = [];
		for(var i = 0; i < rows; i++) {
			var row = [];

			for(var j = 0; j < cols; j++) {
				row.push(' ');
			}

			pathArray.push(row);
		}
		blobPath(pathArray);

		// initalize game running variable and start the loop
		running = true;

		currentFrame = window.requestAnimationFrame(gameLoop);
	}

	return {
		initalize: initalize,
		run: run
	};

}(Game.game, Game.graphics, Game.input));
