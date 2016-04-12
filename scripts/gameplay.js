Game.screens['game-play'] = (function(game, graphics, input) {
	'use strict';

	// basic definition for tower, returns the basic info needed for rendering.  Towers that can shoot will be a subclass and will have a update function
	function Tower(spec) {
		var that = {
			get type() { return spec.type; },
			get x() { return spec.x; },
			get y() { return spec.y; },
			get r() { return spec.r; },
			get dir() { return spec.dir }
		};

		that.setDir = function(dir) {
			if(dir == 'u' || dir == 'd' || dir == 'r' || dir == 'l') {
				spec.dir = dir;
			}
		};

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

			get numFrames() { return spec.numFrames; },
			get frameNo() { return spec.frameNo; }
		};

		if(spec.frameNo == undefined) {
			spec.frameNo = 0;
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

	function CreepFactory(spec) {
		var that;

		if(spec.type == 'air-creep') {
			that = AirCreep(spec);
		}
		else {
			that = Creep(spec);
		}

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

	// actual game variables to use
	var rows;
	var cols;

	// keeps track of towers and creeps in game
	var towers;
	var creeps;

	// keep track of tower under mouse cursor and bool for keeping track of pathfinding state
	var towerUnderMouse;
	var validPlace;

	// 2d array for pathfinding
	var pathArray;

	// variables for enabling build mode as well as turret range and type to build
	var typeSelectedBuild;
	var rangeSelected;
	var build_mode;

	// functions used for game operation

	// starts build mode if it hasn't been started yet
	function startBuildMode() {
		if(!build_mode) {
			build_mode = true;

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

			towers.push(Tower({type:typeSelectedBuild, x:xLoc, y:yLoc, r:rangeSelected, dir:'r'}));

			// update pathfinding for creeps
			blobPath(pathArray);
			//printPaths();

			//console.log(typeSelectedBuild + ' tower built');

			// turn off build mode, deselect build option, and remove the event listener for this function
			build_mode = false;
			typeSelectedBuild = undefined;

			document.getElementById('selection-display').innerHTML = '';

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
		document.getElementById('selection-display').innerHTML = '';

		typeSelectedBuild = undefined;

		if(build_mode) {
			build_mode = false;

			window.removeEventListener('mousedown', buildClick);
		}
		
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
					towerUnderMouse = towers[i];
					validPlace = false;
					break;
				}

				var towX = (towers[i].x + .5) * xDist;
				var towY = (towers[i].y + .5) * yDist;

				if(Math.abs(towX - mousePos.x) > Math.abs(towY - mousePos.y)) {
					if(towX > mousePos.x) {
						towers[i].setDir('l');
					}
					else {
						towers[i].setDir('r');
					}
				}
				else {
					if(towY > mousePos.y) {
						towers[i].setDir('u');
					}
					else {
						towers[i].setDir('d');
					}
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
				console.log('Creep deleted!');
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

		for(i = 0; i < creeps.length; i++) {
			creepTree.insert(creeps[i]);
		}

		for(i = 0; i < towers.length; i++) {
			var creepArray = creepTree.retrieve({
				x:(towers[i].x + .5) * xDist,
				y:(towers[i].y + .5) * yDist,
				w:2 * towers[i].r * xDist,
				h:2 * towers[i].r * yDist
			})

			for(j = 0; j < creepArray.length; j++) {
				if(collides(creepArray[j], {x:(towers[i].x + .5) * xDist, y:(towers[i].y + .5) * yDist, r:towers[i].r * xDist})) {
					console.log("Creep " + creepArray[j].type + " in range of " + towers[i].type);
				}
			}
		}
	}

	// render function (all output goes through the graphics object)
	function render() {
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
			graphics.highlightRange({x:mousePos.x, y:mousePos.y, rows:rows, cols:cols, r:towerUnderMouse.r});
			graphics.highlightSquare({x:mousePos.x, y:mousePos.y, rows:rows, cols:cols, validPlace:true});
		}

		// now draw the currently placed towers
		for(var i = 0; i < towers.length; i++) {
			graphics.drawTower({row:towers[i].x, col:towers[i].y, type:towers[i].type, placing:false, dir:towers[i].dir, rows:rows, cols:cols});
		}

		// now draw all existing creeps
		for(i = 0; i < creeps.length; i++) {
			graphics.drawCreep(creeps[i]);
		}

		// and then draw all of our particles
		graphics.drawParticles();
	}

	// standard functions for other classes to interact with
	function initalize() {
		// create build buttons for all our towers
		// standard format: set typeSelectedBuild, rangeSelected, display selected, and start build mode
		document.getElementById('cannon-tower').addEventListener('click', function() {
			typeSelectedBuild = 'cannon-tower';
			rangeSelected = 4;
			document.getElementById('selection-display').innerHTML = document.getElementById('cannon-tower').innerHTML + ' tower selected';
			console.log(typeSelectedBuild + ' tower selected');

			startBuildMode();
		});

		document.getElementById('flame-tower').addEventListener('click', function() {
			typeSelectedBuild = 'flame-tower';
			rangeSelected = 2;
			document.getElementById('selection-display').innerHTML = document.getElementById('flame-tower').innerHTML + ' tower selected';
			console.log(typeSelectedBuild + ' tower selected');

			startBuildMode();
		});

		document.getElementById('freeze-tower').addEventListener('click', function() {
			typeSelectedBuild = 'freeze-tower';
			rangeSelected = 3;
			document.getElementById('selection-display').innerHTML = document.getElementById('freeze-tower').innerHTML + ' tower selected';
			console.log(typeSelectedBuild + ' tower selected');

			startBuildMode();
		});

		document.getElementById('anti-air-tower').addEventListener('click', function() {
			typeSelectedBuild = 'anti-air-tower';
			rangeSelected = 5;
			document.getElementById('selection-display').innerHTML = document.getElementById('anti-air-tower').innerHTML + ' tower selected';
			console.log(typeSelectedBuild + ' tower selected');

			startBuildMode();
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

			creeps.push(CreepFactory({type:type, x:0, y:6 * yDist + 4, w:xDist - 8, h:yDist - 8, spd:200, dir:'r'}));

			console.log(creeps[creeps.length - 1].type);

			console.log('Creep button pressed!');
		});
	}

	// initalizes game state and starts game loop
	function run() {
		// register all our keys
		keyboard.registerCommand(KeyEvent.DOM_VK_ESCAPE, quitGame);

		// initalize our towers and creeps arrays
		towers = [];
		creeps = [];

		// initalize tower selection and placement variables
		towerUnderMouse = undefined;
		validPlace = true;

		// initalize game size
		rows = 15;
		cols = 15;

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