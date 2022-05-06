

enum OutCode {
	INSIDE = 0x0000,
	LEFT = 0x0001,
	RIGHT = 0x0010,
	BOTTOM = 0x0100,
	TOP = 0x1000
}
/**
 * Uses the highly optimized Cohen–Sutherland algorithm for detecting if a line segment passes through a rectangle on a 2D plane.
 * https://en.wikipedia.org/wiki/Cohen%E2%80%93Sutherland_algorithm
 */
export default class LineToBoxCollision {
	private static _computeOutCode(x: number, y: number, bounds: { left: number, right: number, top: number, bottom: number }): OutCode {
		let code: OutCode;
		code = OutCode.INSIDE;          // initialised as being inside of [[clip window]]
		if (x <= bounds.left)           // to the left of clip window
			code |= OutCode.LEFT;
		else if (x >= bounds.right)      // to the right of clip window
			code |= OutCode.RIGHT;
		if (y <= bounds.top)           // below the clip window
			code |= OutCode.BOTTOM;
		else if (y >= bounds.bottom)      // above the clip window
			code |= OutCode.TOP;
		return code;
	}

	// Cohen–Sutherland clipping algorithm clips a line from
	// P0 = (x0, y0) to P1 = (x1, y1) against a rectangle with 
	// diagonal from (left, top) to (right, bottom).
	static cohenSutherlandLineClipAndDraw(x0: number, y0: number, x1: number, y1: number,
		bounds: { left: number, right: number, top: number, bottom: number }): boolean {
		// compute outcodes for P0, P1, and whatever point lies outside the clip rectangle
		let outcode0: OutCode = this._computeOutCode(x0, y0, bounds);
		let outcode1: OutCode = this._computeOutCode(x1, y1, bounds);
		let accept = false;

		while (true) {
			if (!(outcode0 | outcode1)) {
				// bitwise OR is 0: both points inside window; trivially accept and exit loop
				accept = true;
				break;
			} else if (outcode0 & outcode1) {
				// bitwise AND is not 0: both points share an outside zone (LEFT, RIGHT, TOP,
				// or BOTTOM), so both must be outside window; exit loop (accept is false)
				break;
			} else {
				// failed both tests, so calculate the line segment to clip
				// from an outside point to an intersection with clip edge
				let [x, y] = [0, 0];

				// At least one endpoint is outside the clip rectangle; pick it.
				const outcodeOut: OutCode = outcode1 > outcode0 ? outcode1 : outcode0;

				// Now find the intersection point;
				// use formulas:
				//   slope = (y1 - y0) / (x1 - x0)
				//   x = x0 + (1 / slope) * (ym - y0), where ym is top or bottom
				//   y = y0 + slope * (xm - x0), where xm is left or right
				// No need to worry about divide-by-zero because, in each case, the
				// outcode bit being tested guarantees the denominator is non-zero
				if (outcodeOut & OutCode.TOP) {           // point is above the clip window
					x = x0 + (x1 - x0) * (bounds.bottom - y0) / (y1 - y0);
					y = bounds.bottom - 1;
				} else if (outcodeOut & OutCode.BOTTOM) { // point is below the clip window
					x = x0 + (x1 - x0) * (bounds.top - y0) / (y1 - y0);
					y = bounds.top + 1;
				} else if (outcodeOut & OutCode.RIGHT) {  // point is to the right of clip window
					y = y0 + (y1 - y0) * (bounds.right - x0) / (x1 - x0);
					x = bounds.right - 1;
				} else if (outcodeOut & OutCode.LEFT) {   // point is to the left of clip window
					y = y0 + (y1 - y0) * (bounds.left - x0) / (x1 - x0);
					x = bounds.left + 1;
				}

				// Now we move outside point to intersection point to clip
				// and get ready for next pass.
				if (outcodeOut == outcode0) {
					x0 = x;
					y0 = y;
					outcode0 = this._computeOutCode(x0, y0, bounds);
				} else {
					x1 = x;
					y1 = y;
					outcode1 = this._computeOutCode(x1, y1, bounds);
				}
			}
		}
		return accept;
	}
}