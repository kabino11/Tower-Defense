// formal particle object so central game system can manage ALL of the particles
function Particle(spec, graphics) {
	var that = {
		get image() { return spec.image;},
		get size() { return spec.size;},
		get center() { return spec.center;},
		get direction() { return spec.direction;},
		get speed() { return spec.speed;},
		get rotation() { return spec.rotation;},
		get lifetime() { return spec.lifetime;},
		get alive() { return spec.alive;}
	};

	that.update = function(timePassed) {
		spec.alive += timePassed / 1000;
			
		//
		// Update its position
		spec.center.x += (timePassed / 1000 * spec.speed * spec.direction.x);
		spec.center.y += (timePassed / 1000 * spec.speed * spec.direction.y);
		
		//
		// Rotate proportional to its speed
		spec.rotation += spec.speed / 500;
	};

	that.render = function() {
		graphics.drawImage(spec);
	}

	return that;
}

/*jslint browser: true, white: true, plusplus: true */
/*global Random */
function ParticleSystem(spec, graphics) {
	'use strict';
	var that = {},
		imageSrc = spec.image;

	spec.image = new Image();
	spec.image.src = imageSrc;

	//------------------------------------------------------------------
	//
	// This creates one new particle
	//
	//------------------------------------------------------------------
	that.create = function(location) {  //use location to specify where you want particles spawned
		// give the user a chance to specify speed & lifetime from location
		if(location.speed != undefined) {
			var speed = location.speed;
		}
		else {
			speed = spec.speed;
		}

		if(location.lifetime != undefined) {
			var lifetime = location.lifetime;
		}
		else {
			lifetime = spec.lifetime
		}

		var p = {
			image: spec.image,
			size: Random.nextGaussian(10, 4),
			center: {x: location.x, y: location.y},
			direction: location.direction,
			speed: Math.max(1, Random.nextGaussian(speed.mean, speed.stdev)), // pixels per second
			rotation: 0,
			lifetime: Random.nextGaussian(lifetime.mean, lifetime.stdev),	// How long the particle should live, in seconds
			alive: 0	// How long the particle has been alive, in seconds
		};
		
		//
		// Ensure we have a valid size - gaussian numbers can be negative
		p.size = Math.max(1, p.size);
		//
		// Same thing with lifetime
		p.lifetime = Math.max(0.01, p.lifetime);

		// return particle object for actual game system to use
		return Particle(p, graphics);
	};
	
	return that;
}
