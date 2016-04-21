Game.screens['game-play'] = (function(game, graphics, objects, input) {
	'use strict';

	// Define variables for game state

	// Game information variables
	// base tower costs variable
	var towerCosts = {
		'cannon-tower': 5,
		'flame-tower': 10,
		'freeze-tower': 10,
		'anti-air-tower': 15
	};
	var creepTypes = ['normal-creep', 'armored-creep', 'snake-creep', 'air-creep'];

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
	var bullets;
	var missiles;

	var creepSpawns;

	// keep track of player data
	var income;
	var score;
	var lives;
	var wave;

	var gameOver;

	// keep track of tower under mouse cursor and bool for keeping track of pathfinding state
	var towerUnderMouse;
	var validPlace;

	var towerSelected;

	// 2d arrays for pathfinding
	var pathArray;
	var pathArrayVertical;

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
	function blobPath(data, dir, x, y) {
		// initalize data array
		for(var i = 0; i < data.length; i++) {
			for(var j = 0; j < data[i].length; j++) {
				data[i][j] = ' ';
			}
		}

		// create objective markers to path to
		if(dir == 'r') {
			for(i = 0; i < rows; i++) {
				data[i][data[i].length - 1] = 'r';
			}
		}
		else if(dir == 'd') {
			for(i = 0; i < data[data.length - 1].length; i++) {
				data[data.length - 1][i] = 'd';
			}
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

		console.log("Now for vertical");

		for(var i = 0; i < pathArrayVertical.length; i++) {
			var rowOut = '';

			for(var j = 0; j < pathArrayVertical[i].length; j++) {
				rowOut += pathArrayVertical[i][j] + ' ';
			}

			console.log(rowOut);
		}

		console.log(pathArray[0].length);
		console.log(pathArrayVertical.length);
	}

	// Functions invoked via mouse listeners
	function selectTower() {
		if(mouse.inCanvas()) {
			towerSelected = undefined;

			if(!build_mode && towerUnderMouse != undefined) {
				console.log("Tower select method called!");

				towerSelected = towerUnderMouse;
				document.getElementById('delete-tower').classList.add('show');
				document.getElementById('upgrade-tower').classList.add('show');
				towers[towerSelected].showInfo();
			}
			else {
				document.getElementById('delete-tower').classList.remove('show');
				document.getElementById('upgrade-tower').classList.remove('show');
				document.getElementById('towerinfo').innerHTML = '';
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

			towers.push(objects.TowerFactory({type:typeSelectedBuild, x:xLoc, y:yLoc, r:rangeSelected, dir:'r', moneyInvested:towerCosts[typeSelectedBuild]}));

			// update pathfinding for creeps
			blobPath(pathArray, 'r');
			blobPath(pathArrayVertical, 'd');
			printPaths();

			//console.log(typeSelectedBuild + ' tower built');

			// Decrement from user income
			income -= towerCosts[typeSelectedBuild];

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

	// functions for keys/buttons to invoke

	// Starts the wave
	function startWave() {
		if(creeps.length != 0) return;

		var rect = mouse.getCanvasBounds();

		var colDist = rect.width / cols;
		var rowDist = rect.height / rows;

		//var select = Math.floor(Math.random() * 4);
		var type = creepTypes[wave % 4];

		wave++;

		var hp = 25;
		hp += 20 * Math.floor(wave / 4);
		var numToSpawn = Math.ceil(wave / 4);

		for(var i = 0; i < numToSpawn; i++) {
			creepSpawns.push({type:type, dir:'r', goalDir:'r', x:0, y:6 * rowDist + 4, w:colDist - 8, h:rowDist - 8, totalHp:hp, time:i * .1});
			creepSpawns.push({type:type, dir:'d', goalDir:'d', x:6 * colDist + 4, y:0, w:colDist - 8, h:rowDist - 8, totalHp:hp, time:0});
		}

		document.getElementById('towerinfo').innerHTML = "";
		document.getElementById('gameinfo').innerHTML = "Get Ready...CREEPS coming...!<br />KILL THEM ALL... Go...Go..Go!!!";
	}

	// upgrades a turret
	function upgradeTower() {
		if(towerSelected != undefined && income >= towers[towerSelected].moneyInvested && towers[towerSelected].level < 3) {
			income -= towers[towerSelected].moneyInvested;
			towers[towerSelected].levelUp();
			towers[towerSelected].showInfo();
		}
		else {
			if(towers[towerSelected].level >= 3) {
				document.getElementById('towerinfo').innerHTML = "Tower is at MAX level.";
			}
			else if(income < towers[towerSelected].moneyInvested) {
				document.getElementById('towerinfo').innerHTML = "Can't afford that";
			}
			else {
				document.getElementById('towerinfo').innerHTML = "ERROR";
			}
			
			towerSelected = undefined;
		}
	}

	function sellTower() {
		console.log('delete-tower called! ' + towerSelected);
		if(towerSelected != undefined) {
			income += Math.floor(towers[towerSelected].moneyInvested / 2);
			towers.splice(towerSelected, 1);
			towerSelected = undefined;
			blobPath(pathArray, 'r');
			blobPath(pathArrayVertical, 'd');
			document.getElementById('towerinfo').innerHTML = '';
			document.getElementById('delete-tower').classList.remove('show');
			document.getElementById('upgrade-tower').classList.remove('show');
		}
	}

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

		if(gameOver == false) {
			update(currentTime - prevTime);
		}

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
				var testArray2 = [];

				for(i = 0; i < rows; i++) {
					var current = [];
					var current2 = [];

					for(var j = 0; j < cols; j++) {
						current.push(' ');
						current2.push(' ');
					}

					testArray.push(current);
					testArray2.push(current2);
				}

				// do pathing with temporary array and proposed coordinates.  Then set validPlace accordingly if there isn't a path
				blobPath(testArray, 'r', xPos, yPos);
				blobPath(testArray2, 'd', xPos, yPos);
				if(testArray[6][0] == ' ' || testArray[6][0] == 'N' || testArray2[0][6] == ' ' || testArray2[0][6] == 'N') {
					validPlace = false;
				}
			}
		}

		// now see if we should spawn creeps
		var spawnTime = timePassed / 1000;
		while(spawnTime > 0 && creepSpawns.length > 0) {
			if(spawnTime >= creepSpawns[0].time) {
				spawnTime -= creepSpawns[0].time;
				creeps.push(objects.CreepFactory(creepSpawns[0]));
				creepSpawns.splice(0, 1);
			}
			else {
				creepSpawns[0].time -= spawnTime;
				spawnTime = 0;
			}
		}

		// now update the creeps in the array
		for(i = creeps.length - 1; i >= 0; i--) {
			if(creeps[i].goalDir == 'r') {
				creeps[i].update(timePassed, pathArray);
			}
			else if(creeps[i].goalDir == 'd') {
				creeps[i].update(timePassed, pathArrayVertical);
			}

			if(creeps[i].x > canvasRect.width || creeps[i].y > canvasRect.height) {
				//console.log('Creep deleted!');
				creeps.splice(i, 1);
				lives--;
				if(lives < 0) {
					lives = 0;
				}
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
			if(towers[i].type != 'anti-air-tower') {
				towers[i].shoot(targets, xDist, yDist, timePassed, bullets);
			}
			else {
				towers[i].shoot(targets, xDist, yDist, timePassed, missiles);
			}
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
				if(targets[j].type != 'air-creep' && collides(targets[j], bullets[i])) {
					document.getElementById('creep-hit').play();
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

		// Now to iterate through all the missiles to update them
		for(i = missiles.length - 1; i >= 0; i--) {
			targets = creepTree.retrieve({
				x:missiles[i].x - missiles[i].r,
				y:missiles[i].y - missiles[i].r,
				w:missiles[i].r * 2,
				h:missiles[i].r * 2
			});
			missiles[i].update(timePassed, targets);

			var hit = false;
			// if we hit someone indicate that we did, deal damage, and then break out because each bullet deals damage once
			for(j = 0; j < targets.length; j++) {
				if((targets[j].type == 'air-creep' || targets[j].type == 'armored-creep') && collides(targets[j], missiles[i])) {
					document.getElementById('creep-hit').play();
					creeps[targets[j].idxNo].giveDamage(missiles[i].dmg);
					hit = true;
					break;
				}
			}

			// if a missile has hit someone or gone out of canvas delete.
			if(hit || missiles[i].x + missiles[i].r < 0 || missiles[i].x - missiles[i].r > canvasRect.width || missiles[i].y + missiles[i].r < 0 || missiles[i].y - missiles[i].r > canvasRect.height) {
				missiles.splice(i, 1);
			}
		}

		// Then we'll finally delete creeps from the array when they die
		for(i = creeps.length - 1; i >= 0; i--) {
			if(creeps[i].HP <= 0) {
				for(j = 0; j < 20; j++) { // spawn death particles
					graphics.spawnParticle({x:creeps[i].x + creeps[i].w / 2, y:creeps[i].y + creeps[i].h / 2});
				}
				income += creeps[i].reward;
				score += creeps[i].score;
				creeps.splice(i, 1);
			}
		}

		// determine if we should trigger the game over flag
		if(lives <= 0) {
			lives = 0;
			gameOver = true;

			for(i = 0; i < towers.length; i++) {
				for(j = 0; j < 20; j++) {
					graphics.spawnParticle({x:xDist * (towers[i].x + .5), y:yDist * (towers[i].y + .5)});
				}
			}
		}
	}

	// render function (all output goes through the graphics object)
	function render() {
		if(creeps.length == 0) {  // clear gameinfo if creep array is empty
			document.getElementById('gameinfo').innerHTML = '';
		}

		graphics.clear();

		if(!gameOver) {
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
			for(var i = 0; i < creeps.length; i++) {
				graphics.drawCreep(creeps[i]);
			}

			// now draw all of the bullets
			for(i = 0; i < bullets.length; i++) {
				graphics.drawBullet(bullets[i]);
			}

			// now draw all of the missiles
			for(i = 0; i < missiles.length; i++) {
				graphics.drawBullet(missiles[i]);
			}
		}
		else {
			graphics.drawGameOver();
		}

		// and then draw all of our particles
		graphics.drawParticles();

		// and then draw our UI
		graphics.drawMoney(income);
		graphics.drawLives(lives);
		graphics.drawScore(score);
		graphics.drawWaves(wave);
	}

	// standard functions for other classes to interact with
	function initalize() {
		//create mouseover functions for all our towers
		// standard format: set typeSelectedBuild, rangeSelected, and display selected
		document.getElementById('cannon-tower').addEventListener('mouseover', function() {
			if(build_mode) return;

			typeSelectedBuild = 'cannon-tower';
			rangeSelected = 4;
			var temp = objects.TowerFactory({type:typeSelectedBuild, r:rangeSelected})
			document.getElementById('towerinfo').innerHTML = "Cannon Tower" + "<br />Cost: " + towerCosts[typeSelectedBuild] + "<br>Range: " + rangeSelected  + "<br />Damage: " + temp.damage;
		});

		document.getElementById('flame-tower').addEventListener('mouseover', function() {
			if(build_mode) return;

			typeSelectedBuild = 'flame-tower';
			rangeSelected = 2;
			var temp = objects.TowerFactory({type:typeSelectedBuild, r:rangeSelected})
			document.getElementById('towerinfo').innerHTML = 'Flame Tower' + "<br />Cost: " + towerCosts[typeSelectedBuild] + "<br>Range: " + rangeSelected  + "<br />Damage: " + temp.damage;
		});

		document.getElementById('freeze-tower').addEventListener('mouseover', function() {
			if(build_mode) return;

			typeSelectedBuild = 'freeze-tower';
			rangeSelected = 3;
			var temp = objects.TowerFactory({type:typeSelectedBuild, r:rangeSelected})
			document.getElementById('towerinfo').innerHTML = 'Freeze Tower'+"<br />Cost: " + towerCosts[typeSelectedBuild] + "<br>Range: " + rangeSelected  + "<br />Damage: " + temp.damage;
		});

		document.getElementById('anti-air-tower').addEventListener('mouseover', function() {
			if(build_mode) return;

			typeSelectedBuild = 'anti-air-tower';
			rangeSelected = 5;
			var temp = objects.TowerFactory({type:typeSelectedBuild, r:rangeSelected})
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

		// set up main gameplay buttons
		document.getElementById('upgrade-tower').addEventListener('click', upgradeTower);	
		document.getElementById('delete-tower').addEventListener('click', sellTower);
		document.getElementById('start-wave').addEventListener('click', startWave);

		//Muting the the audio
		document.getElementById('mute_unmute_button').addEventListener('click', function(){
			var path = document.getElementById("mute_unmute").src;

			if(path.substring(path.lastIndexOf('/')) === "/unmute.png"){
				document.getElementById("mute_unmute").src = "textures/mute.png";
				document.getElementById('bg-music').muted = true;
			}else{
				document.getElementById("mute_unmute").src = "textures/unmute.png";
				document.getElementById('bg-music').muted = false;
			}
		});
	}

	// initalizes game state and starts game loop
	function run() {
		//Playing background music.
		document.getElementById('bg-music').play();

		// register all our keys
		keyboard.registerCommand(KeyEvent.DOM_VK_ESCAPE, quitGame);

		window.addEventListener('mousedown', selectTower);

		// initalize our towers and creeps arrays
		towers = [];
		creeps = [];
		bullets = [];
		missiles = [];

		creepSpawns = [];

		// initalize tower selection and placement variables
		towerUnderMouse = undefined;
		towerSelected = undefined;
		validPlace = true;

		// initalize game size
		rows = 14;
		cols = 15;

		// initalize income
		income = 20;
		score = 0;
		lives = 20;
		wave = 0;

		gameOver = false;

		// initalize the main pathfinding array
		pathArray = [];
		for(var i = 0; i < rows; i++) {
			var row = [];

			for(var j = 0; j < cols; j++) {
				row.push(' ');
			}

			pathArray.push(row);
		}

		//this is the path Array for vertical waves.
		pathArrayVertical = [];
		for(var i = 0; i < rows; i++) {
			var row = [];

			for(var j = 0; j < cols; j++) {
				row.push(' ');
			}

			pathArrayVertical.push(row);
		}

		//Calling blobPath() for horizontal waves.
		blobPath(pathArray, 'r');
		//calling blobPath() for vertical waves.
		blobPath(pathArrayVertical, 'd');

		// initalize game running variable and start the loop
		running = true;

		currentFrame = window.requestAnimationFrame(gameLoop);
	}

	return {
		initalize: initalize,
		run: run
	};

}(Game.game, Game.graphics, Game.gameObjects, Game.input));