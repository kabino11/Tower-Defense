// Game object to use for game objects because object definitions were making the code too difficult to follow

Game.gameObjects = (function(mouse) {
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
			get moneyInvested() { return spec.moneyInvested; },
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

		if(spec.moneyInvested == undefined) {
			spec.moneyInvested = 5;
		}

		if(spec.damage == undefined) {
			spec.damage = 5;
		}

		that.setDir = function(dir) {
			if(dir == 'u' || dir == 'd' || dir == 'r' || dir == 'l') {
				spec.dir = dir;
			}
		};

		that.shoot = function(targets, xDist, yDist, timePassed, projectiles) {
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
						projectiles.push(Bullet({x:xPos, y:yPos, r:5, spd:850, range:spec.r * xDist, dmg:spec.damage, angle:spec.angle}));
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

		that.levelUp = function() {
			spec.level++;

			spec.damage += 5;
			spec.moneyInvested *= 2;
		};

		that.showInfo = function() {
			var type = spec.type.replace(/-/g, ' ')
			type = type.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
			document.getElementById('towerinfo').innerHTML = type + "<br/>Level: " + spec.level + "<br />Sell Value: " + Math.floor(spec.moneyInvested / 2) + "<br/>Upgrade Cost: " + spec.moneyInvested + "<br>Range: " + spec.r  + "<br />Damage: " + spec.damage;
		};

		return that;
	}

	function FlameTower(spec) {
		var that = Tower(spec);

		spec.damage = 8;
		spec.timeBetweenShots = 1;

		var oldLevelUp = that.levelUp;
		that.levelUp = function() {
			oldLevelUp();
			spec.damage -= 2;
		}

		// make flameTowers stop shooting at air-creeps
		that.shoot = function(targets, xDist, yDist, timePassed, projectiles) {
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
						projectiles.push(Bomb({x:xPos, y:yPos, r:15, spd:700, range:spec.r * xDist, dmg:spec.damage, angle:spec.angle}));
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
		};

		return that;
	}

	function FreezeTower(spec) {
		var that = Tower(spec);

		// Define a getter for giving slow
		Object.defineProperty(that, 'slowToGive', { get: function() { return spec.slowToGive; } });

		if(spec.slowToGive == undefined) {
			spec.slowToGive = 1;
		}

		that.shoot = function(targets, xDist, yDist, timePassed) {
			for(var i = 0; i < targets.length; i++) {
				if(targets[i].type != 'air-creep') {
					targets[i].giveSlow(spec.slowToGive * timePassed / 1000);
				}
			}
		};

		that.showInfo = function() {
			var type = spec.type.replace(/-/g, ' ')
			type = type.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
			document.getElementById('towerinfo').innerHTML = type + "<br/>Level: " + spec.level + "<br />Sell Value: " + Math.floor(spec.moneyInvested / 2) + "<br/>Upgrade Cost: " + spec.moneyInvested + "<br>Range: " + spec.r  + "<br />Freeze/sec: " + spec.slowToGive;
		};

		that.levelUp = function() {
			spec.level++;

			spec.slowToGive += .05;
			spec.moneyInvested *= 2;
		}

		return that;
	}

	function AntiAirTower(spec) {
		var that = Tower(spec);

		spec.damage = 10;

		// same as normal tower, but shoots missiles instead, and it only targets air-creeps
		that.shoot = function(targets, xDist, yDist, timePassed, projectiles) {
			//first we find the centerpoint of our tower
			var xPos = (spec.x + .5) * xDist,
				yPos = (spec.y + .5) * yDist;

			//if we're able to fire another shot then try to shoot
			if(spec.shotTimer <= 0) {
				//find if there's a creep in front of our gun
				for(var i = 0; i < targets.length; i++) {
					if(targets[i].type == 'air-creep') {
						var cXpos = targets[i].x + targets[i].w / 2;
						var cYpos = targets[i].y + targets[i].h / 2;
						var dist = Math.sqrt(Math.pow(xPos - cXpos, 2) + Math.pow(yPos - cYpos, 2));

						var fireAngle = Math.acos((cXpos - xPos) / dist);

						if(Math.asin((cYpos - yPos) / dist) < 0) {
							fireAngle = (2 * Math.PI) - fireAngle;
						}

						// if so shoot at it
						if(Math.abs(spec.angle - fireAngle) < .3) {
							spec.shotTimer = spec.timeBetweenShots;
							projectiles.push(Missile({x:xPos, y:yPos, r:10, spd:850, range:spec.r * xDist, dmg:spec.damage, angle:spec.angle}));
							return;
						}
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
				if(targets[i].type == 'air-creep') {
					var cxCenter = targets[i].x + targets[i].w / 2;
					var cyCenter = targets[i].y + targets[i].h / 2;
					var dist = Math.sqrt(Math.pow(cxCenter - xPos, 2) + Math.pow(cyCenter - yPos, 2));

					if(dist < closestDist) {
						closestDist = dist;
						closest = targets[i];
					}
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
		};

		return that;
	}

	function TowerFactory(spec) {
		var that;

		if(spec.type === 'flame-tower') {
			that = FlameTower(spec);
		}
		else if(spec.type === 'freeze-tower') {
			that = FreezeTower(spec);
		}
		else if(spec.type === 'anti-air-tower') {
			that = AntiAirTower(spec);
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

			get goalDir() { return spec.goalDir; },

			get totalHP() { return spec.totalHP; },
			get HP() { return spec.HP; },

			get slowTime() { return spec.slowTime; },

			get reward() { return spec.reward; },
			get score() { return spec.score; },

			get numFrames() { return spec.numFrames; },
			get frameNo() { return spec.frameNo; },

			get idxNo() { return spec.idxNo; }
		};

		if(spec.spd == undefined) {
			spec.spd = 200;
		}

		if(spec.goalDir == undefined) {
			spec.goalDir = 'r';
		}

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
		if(spec.slowTime == undefined) {
			spec.slowTime = 0;
		}
		if(spec.reward == undefined) {
			spec.reward = 4;
		}
		if(spec.score == undefined) {
			spec.score = 5;
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
				spec.x += spec.spd / (spec.slowTime > 0 ? 2 : 1) * (timePassed / 1000);
			}
			else if(spec.dir == 'l') {
				spec.x -= spec.spd / (spec.slowTime > 0 ? 2 : 1) * (timePassed / 1000);
			}
			else if(spec.dir == 'u') {
				spec.y -= spec.spd / (spec.slowTime > 0 ? 2 : 1) * (timePassed / 1000);
			}
			else if(spec.dir == 'd') {
				spec.y += spec.spd / (spec.slowTime > 0 ? 2 : 1) * (timePassed / 1000);
			}
			else {
				spec.x += spec.spd * (timePassed / 1000);
			}

			nextFrame += timePassed / (spec.slowTime > 0 ? 2 : 1) / 1000;

			if(spec.slowTime > 0) {
				spec.slowTime -= timePassed / 1000;
			}

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
		};

		that.giveSlow = function(time) {
			spec.slowTime += time;
			if(spec.slowTime > .5) {
				spec.slowTime = .5;
			}
		};

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

	// Takes half damage, moves slower, and is immune to slow.
	function ArmoredCreep(spec) {
		var that = Creep(spec);

		spec.spd = spec.spd * 2 / 3;

		that.giveDamage = function(dmgIn) {
			spec.HP -= dmgIn / 2;
			if(spec.HP < 0) {
				spec.hp = 0;
			}
		}

		// give immunity to slow
		that.giveSlow = function() {
			return;
		}

		return that;
	}

	// moves faster, but freezes for longer (cap from normal creep class still applies)
	function SnakeCreep(spec) {
		var that = Creep(spec);

		spec.spd = 300;

		var oldGiveSlow = that.giveSlow;

		that.giveSlow = function(time) {
			time *= 2;
			oldGiveSlow(time);
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
		else if(spec.type == 'snake-creep') {
			that = SnakeCreep(spec);
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

	function Missile(spec) {
		var that = Bullet(spec);

		var prevUpdate = that.update;

		if(spec.rotRate == undefined) {
			spec.rotRate = Math.PI;
		}

		that.update = function(timePassed, targets) {
			var closest = undefined;
			var closestDist = 99999;

			for(var i = 0; i < targets.length; i++) {
				if(targets[i].type == 'air-creep' || targets[i].type == 'armored-creep') {
					var cxCenter = targets[i].x + targets[i].w / 2;
					var cyCenter = targets[i].y + targets[i].h / 2;
					var dist = Math.sqrt(Math.pow(cxCenter - spec.x, 2) + Math.pow(cyCenter - spec.y, 2));

					if(dist < closestDist) {
						closestDist = dist;
						closest = targets[i];
					}
				}
			}

			// if there's a trackable target near me
			if(closest != undefined) {
				// otherwise rotate to closest (in final will rotate by set speet)
				var cXpos = closest.x + closest.w / 2;
				var cYpos = closest.y + closest.h / 2;

				var targetAngle = Math.acos((cXpos - spec.x) / closestDist);

				if(Math.asin((cYpos - spec.y) / closestDist) < 0) {
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
			}

			// then call previous update method for actual movement
			prevUpdate(timePassed);
		}

		return that;
	}

	function Bomb(spec) {
		var that = Bullet(spec);

		that.explode = function(targets) {
			for(var i = 0; i < targets.length; i++) {
				if(targets[i].type != 'air-creep') {
					targets[i].giveDamage(spec.dmg);
				}
			}
		};

		return that;
	}

	return {
		Tower: Tower,
		FlameTower: FlameTower,
		FreezeTower: FreezeTower,
		AntiAirTower: AntiAirTower,
		TowerFactory: TowerFactory,
		Creep: Creep,
		AirCreep: AirCreep,
		ArmoredCreep: ArmoredCreep,
		SnakeCreep: SnakeCreep,
		CreepFactory: CreepFactory,
		Bullet: Bullet,
		Missile: Missile,
		Bomb: Bomb
	};
}(Game.input.Mouse()));