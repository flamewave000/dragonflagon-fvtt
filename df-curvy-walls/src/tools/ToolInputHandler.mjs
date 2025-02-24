/// <reference path="../types.d.ts" />
/// <reference path="../../../fvtt-scripts/foundry.js" />
/// <reference path="./BezierTool.mjs" />

/** @abstract */
export class InputHandler {
	/**@type {BezierTool}*/#_tool;
	/**@type {BezierTool}*/get tool() { return this.#_tool; }
	/**@param {BezierTool} tool*/
	constructor(tool) {
		this.#_tool = tool;
	}


	/**@abstract @param {PIXI.Point} origin @param {PIXI.Point} destination @param {PIXI.InteractionEvent} event*/
	start(origin, destination, event) { throw new Error("Not Implemented"); } // eslint-disable-line
	/**@abstract @param {PIXI.Point} origin @param {PIXI.Point} destination @param {PIXI.InteractionEvent} event*/
	move(origin, destination, event) { throw new Error("Not Implemented"); } // eslint-disable-line
	/**@abstract @param {PIXI.Point} origin @param {PIXI.Point} destination @param {PIXI.InteractionEvent} event*/
	stop(origin, destination, event) { throw new Error("Not Implemented"); } // eslint-disable-line
	/**@abstract*/
	cancel() { throw new Error("Not Implemented"); }
	/**@param {PIXI.Point} point*/
	static finalPoint(point, snap = true) {
		return canvas.walls._getWallEndpointCoordinates(point, { snap: snap });
	}

	/**@protected @type {WallsLayer}*/
	get walls() { return canvas.walls; }

	/**
	 * @param {PIXI.InteractionEvent} event
	 * @returns {boolean}
	 */
	shouldSnap(event) {
		const { originalEvent } = event.data;
		return this.walls._forceSnap || !originalEvent.shiftKey;
	}

	/**
	 * @param {PIXI.Point} origin
	 * @param {boolean} snap
	 * @returns {PIXI.Point}
	 */
	getWallEndPoint(origin, snap) {
		// Determine the starting coordinates
		return new PIXI.Point(...this.walls._getWallEndpointCoordinates(origin, { snap }));
	}

	/**
	 * @param {PIXI.Point} origin
	 * @param {PIXI.Point} destination
	 * @returns {PIXI.Point}
	 */
	static squarePoint(origin, destination) {
		/*	╔═══╦═══╗
			║ 4 ║ 1 ║
			╠═══╬═══╣
			║ 3 ║ 2 ║
			╚═══╩═══╝	*/
		const min = Math.max(Math.abs(destination.x - origin.x), Math.abs(destination.y - origin.y));
		if (destination.x > origin.x) {
			// Quadrant 1
			if (destination.y < origin.y)
				return new PIXI.Point(origin.x + min, origin.y - min);
			// Quadrant 2
			else return new PIXI.Point(origin.x + min, origin.y + min);
		}
		// Quadrant 3
		else if (destination.y > origin.y)
			return new PIXI.Point(origin.x - min, origin.y + min);
		// Quadrant 4
		else return new PIXI.Point(origin.x - min, origin.y - min);
	}
}

/**@abstract*/
export class InitializerInputHandler extends InputHandler {
	/**@type {PIXI.Point}*/lineA;
	/**@type {PIXI.Point}*/lineB;
	/**@protected @type {boolean}*/squaring;
	/**@protected @type {() => void}*/success;
	/**@protected @type {() => void}*/fail;
	/**
	 * @param {BezierTool} tool 
	 * @param {boolean} squaring 
	 * @param {PIXI.Point} lineA 
	 * @param {PIXI.Point} lineB 
	 * @param {() => void} success 
	 * @param {() => void} fail 
	 */
	constructor(tool, squaring, lineA, lineB, success, fail) {
		super(tool);
		this.lineA = lineA;
		this.lineB = lineB;
		this.squaring = squaring;
		this.success = success;
		this.fail = fail;
	}
	/**@param {PIXI.Point} origin @param {PIXI.Point} destination @param {PIXI.InteractionEvent} event*/
	start(origin, destination, event) {
		const snap = this.shouldSnap(event);
		this.lineA.copyFrom(this.getWallEndPoint(origin, snap));
		this.lineB.copyFrom(this.getWallEndPoint(destination, snap));
	}
	/**@param {PIXI.Point} origin @param {PIXI.Point} destination @param {PIXI.InteractionEvent} event*/
	move(origin, destination, event) {
		const snap = this.shouldSnap(event);
		const destPoint = this.squaring && event.data.originalEvent.altKey ? InputHandler.squarePoint(origin, destination) : destination;
		const origPoint = !this.tool.startedWithCtrlHeld && event.data.originalEvent.ctrlKey ? new PIXI.Point(origin.x - (destPoint.x - origin.x), origin.y - (destPoint.y - origin.y)) : origin;
		this.lineA.copyFrom(this.getWallEndPoint(origPoint, snap));
		this.lineB.copyFrom(this.getWallEndPoint(destPoint, snap));
	}
	/**@param {PIXI.Point} origin @param {PIXI.Point} destination @param {PIXI.InteractionEvent} event*/
	stop(origin, destination, event) {
		const snap = this.shouldSnap(event);
		if (this.squaring && event.data.originalEvent.altKey)
			this.lineB.copyFrom(this.getWallEndPoint(InputHandler.squarePoint(origin, destination), snap));
		else
			this.lineB.copyFrom(this.getWallEndPoint(destination, snap));
		this.success();
	}
	cancel() {
		this.fail();
	}
}

export class PointInputHandler extends InputHandler {
	/**@type {PIXI.Point}*/#_origin;
	/**@type {PIXI.Point}*/#_originalPoint = new PIXI.Point(0, 0);
	/**@type {PIXI.Point}*/point;
	/**@type {((sender: PointInputHandler) => void)|null}*/
	completion = null;
	/**
	 * @param {BezierTool} tool
	 * @param {PIXI.Point} destination
	 * @param {(sender: PointInputHandler) => void} [completion]
	 * @param {PIXI.Point} [origin]
	 */
	constructor(tool, destination, completion = null, origin) {
		super(tool);
		this.#_originalPoint.copyFrom(destination);
		this.#_origin = origin;
		this.point = destination;
		this.completion = completion;
	}
	/**@param {PIXI.Point} _origin @param {PIXI.Point} destination @param {PIXI.InteractionEvent} event*/
	start(_origin, destination, event) {
		this.move(null, destination, event);
	}
	/**@param {PIXI.Point} _origin @param {PIXI.Point} destination @param {PIXI.InteractionEvent} event*/
	move(_origin, destination, event) {
		if (!!this.#_origin && event.data.originalEvent.altKey)
			this.point.copyFrom(this.getWallEndPoint(InputHandler.squarePoint(this.#_origin, destination), this.shouldSnap(event)));
		else
			this.point.copyFrom(this.getWallEndPoint(destination, this.shouldSnap(event)));
	}
	/**@param {PIXI.Point} _origin @param {PIXI.Point} destination @param {PIXI.InteractionEvent} event*/
	stop(_origin, destination, event) {
		if (!!this.#_origin && event.data.originalEvent.altKey)
			this.point.copyFrom(this.getWallEndPoint(InputHandler.squarePoint(this.#_origin, destination), this.shouldSnap(event)));
		else
			this.point.copyFrom(this.getWallEndPoint(destination, this.shouldSnap(event)));
		if (this.completion != null)
			this.completion(this);
	}
	cancel() {
		this.point.copyFrom(this.#_originalPoint);
		if (this.completion != null)
			this.completion(this);
	}
}

export class PointArrayInputHandler extends InputHandler {
	/**@type {PIXI.Point[]}*/#originalPoints = [];
	/**@type {PIXI.Point[]}*/points;
	/**@type {PIXI.Point}*/ #_start;
	/**@type {(sender: PointArrayInputHandler) => void}*/
	completion;
	/**
	 * @param {BezierTool} tool
	 * @param {PIXI.Point} start
	 * @param {PIXI.Point[]} points
	 * @param {(sender: PointArrayInputHandler) => void} [completion]
	 */
	constructor(tool, start, points, completion = null) {
		super(tool);
		points.forEach(e => this.#originalPoints.push(e.clone()));
		this.points = points;
		this.#_start = start;
		this.completion = completion;
	}
	/**
	 * @param {PIXI.Point} to
	 * @param {PIXI.InteractionEvent} event
	 */
	#moveAll(to, event) {
		const delta = new PIXI.Point(to.x - this.#_start.x, to.y - this.#_start.y);
		const snap = this.shouldSnap(event);
		/**@type {PIXI.Point}*/ let o;
		this.points.forEach((e, i) => {
			o = this.#originalPoints[i];
			e.copyFrom(this.getWallEndPoint(new PIXI.Point(o.x + delta.x, o.y + delta.y), snap));
		});
	}
	/**@param {PIXI.Point} _origin @param {PIXI.Point} destination @param {PIXI.InteractionEvent} event*/
	start(_origin, destination, event) {
		this.#moveAll(destination, event);
	}
	/**@param {PIXI.Point} _origin @param {PIXI.Point} destination @param {PIXI.InteractionEvent} event*/
	move(_origin, destination, event) {
		this.#moveAll(destination, event);
	}
	/**@param {PIXI.Point} _origin @param {PIXI.Point} destination @param {PIXI.InteractionEvent} event*/
	stop(_origin, destination, event) {
		this.#moveAll(destination, event);
		if (this.completion != null)
			this.completion(this);
	}
	cancel() {
		this.#originalPoints.forEach((e, i) => e.copyTo(this.points[i]));
		if (this.completion != null)
			this.completion(this);
	}
}

export class MagnetPointInputHandler extends InputHandler {
	#originalPoint = new PIXI.Point(0, 0);
	/**@protected @type {PIXI.Point}*/ masterPoint;
	/**@protected @type {PIXI.Point}*/ slavePoint;
	/**@protected @type {number}*/ offsetX;
	/**@protected @type {number}*/ offsetY;
	/**@type {((sender: MagnetPointInputHandler) => void)|null}*/
	completion = null;
	/**
	 * @param {BezierTool} tool
	 * @param {Point} masterPoint
	 * @param {Point} slavePoint
	 * @param {(sender: MagnetPointInputHandler) => void} [completion]
	 */
	constructor(tool, masterPoint, slavePoint, completion = null) {
		super(tool);
		this.#originalPoint.copyFrom(masterPoint);
		this.masterPoint = masterPoint;
		this.slavePoint = slavePoint;
		this.offsetX = slavePoint.x - masterPoint.x;
		this.offsetY = slavePoint.y - masterPoint.y;
		this.completion = completion;
	}
	/**@param {PIXI.Point} _origin @param {PIXI.Point} destination @param {PIXI.InteractionEvent} event*/
	start(_origin, destination, event) {
		this.move(null, destination, event);
	}
	/**@param {PIXI.Point} _origin @param {PIXI.Point} destination @param {PIXI.InteractionEvent} event*/
	move(_origin, destination, event) {
		this.masterPoint.copyFrom(this.getWallEndPoint(destination, this.shouldSnap(event)));
		this.slavePoint.set(this.masterPoint.x + this.offsetX, this.masterPoint.y + this.offsetY);
	}
	/**@param {PIXI.Point} _origin @param {PIXI.Point} destination @param {PIXI.InteractionEvent} event*/
	stop(_origin, destination, event) {
		this.masterPoint.copyFrom(this.getWallEndPoint(destination, this.shouldSnap(event)));
		this.slavePoint.set(this.masterPoint.x + this.offsetX, this.masterPoint.y + this.offsetY);
		if (this.completion != null)
			this.completion(this);
	}
	cancel() {
		this.masterPoint.copyFrom(this.#originalPoint);
		this.slavePoint.set(this.masterPoint.x + this.offsetX, this.masterPoint.y + this.offsetY);
		if (this.completion != null)
			this.completion(this);
	}
}