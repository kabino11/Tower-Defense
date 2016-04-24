//function to compute collision between a circle and a rectangle
//taken from http://stackoverflow.com/questions/21089959/detecting-collision-of-rectangle-with-circle-in-html5-canvas
function collides (rect, circle) {
	// compute a center-to-center vector
	var half = { x: rect.w/2, y: rect.h/2 };
	var center = {
		x: circle.x - (rect.x+half.x),
		y: circle.y - (rect.y+half.y)
	};

	// check circle position inside the rectangle quadrant
	var side = {
		x: Math.abs (center.x) - half.x,
		y: Math.abs (center.y) - half.y
	};

	if (side.x >  circle.r || side.y >  circle.r) // outside
		return false;
	if (side.x < 0 || side.y < 0) // intersects side or corner
		return true;

	// circle is near the corner
	return side.x*side.x + side.y*side.y  < circle.r*circle.r;
}