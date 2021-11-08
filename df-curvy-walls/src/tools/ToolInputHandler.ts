import { BezierTool } from "./BezierTool";

declare type Point = PIXI.Point;
export abstract class InputHandler {
	private _tool: BezierTool;
	get tool(): BezierTool { return this._tool; }
	constructor(tool: BezierTool) {
		this._tool = tool;
	}

	abstract start(origin: Point, destination: Point, event: PIXI.InteractionEvent): void;
	abstract move(origin: Point, destination: Point, event: PIXI.InteractionEvent): void;
	abstract stop(origin: Point, destination: Point, event: PIXI.InteractionEvent): void;
	abstract cancel(): void;
	static finalPoint(point: Point, snap: boolean = true) {
		return (<any>(<Canvas>canvas).walls)._getWallEndpointCoordinates(point, { snap: snap });
	}

	protected get walls(): WallsLayer { return (canvas as any).walls as WallsLayer; }

	shouldSnap(event: PIXI.InteractionEvent) {
		const { originalEvent } = event.data;
		return (<any>this.walls)._forceSnap || !originalEvent.shiftKey;
	}

	getWallEndPoint(origin: PIXI.Point, snap: boolean): PIXI.Point {
		// Determine the starting coordinates
		return new PIXI.Point(...(<any>this.walls)._getWallEndpointCoordinates(origin, { snap }));
	}

	static squarePoint(origin: Point, destination: Point): PIXI.Point {
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

export abstract class InitializerInputHandler extends InputHandler {
	lineA: Point;
	lineB: Point;
	protected squaring: boolean;
	protected success: () => void;
	protected fail: () => void;
	constructor(tool: BezierTool, squaring: boolean, lineA: Point, lineB: Point, success: () => void, fail: () => void) {
		super(tool);
		this.lineA = lineA;
		this.lineB = lineB;
		this.squaring = squaring;
		this.success = success;
		this.fail = fail;
	}
	start(origin: Point, destination: Point, event: PIXI.InteractionEvent) {
		const snap = this.shouldSnap(event);
		this.lineA.copyFrom(this.getWallEndPoint(origin, snap) as PIXI.Point);
		this.lineB.copyFrom(this.getWallEndPoint(destination, snap) as PIXI.Point);
	}
	move(origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		const snap = this.shouldSnap(event);
		const destPoint = this.squaring && event.data.originalEvent.altKey ? InputHandler.squarePoint(origin, destination) : destination;
		const origPoint = !this.tool.startedWithCtrlHeld && event.data.originalEvent.ctrlKey ? new PIXI.Point(origin.x - (destPoint.x - origin.x), origin.y - (destPoint.y - origin.y)) : origin;
		this.lineA.copyFrom(this.getWallEndPoint(origPoint, snap) as PIXI.Point);
		this.lineB.copyFrom(this.getWallEndPoint(destPoint, snap) as PIXI.Point);
	}
	stop(origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		const snap = this.shouldSnap(event);
		if (this.squaring && event.data.originalEvent.altKey)
			this.lineB.copyFrom(this.getWallEndPoint(InputHandler.squarePoint(origin, destination), snap) as PIXI.Point);
		else
			this.lineB.copyFrom(this.getWallEndPoint(destination, snap) as PIXI.Point);
		this.success();
	}
	cancel() {
		this.fail();
	}
}

export class PointInputHandler extends InputHandler {
	private _origin: Point;
	private _originalPoint = new PIXI.Point(0, 0);
	point: Point;
	completion?: (sender: PointInputHandler) => void = null;
	constructor(tool: BezierTool, destination: Point, completion: (sender: PointInputHandler) => void = null, origin?: Point) {
		super(tool);
		this._originalPoint.copyFrom(destination);
		this._origin = origin;
		this.point = destination;
		this.completion = completion;
	}
	start(_origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		this.move(null, destination, event);
	}
	move(_origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		if (!!this._origin && event.data.originalEvent.altKey)
			this.point.copyFrom(this.getWallEndPoint(InputHandler.squarePoint(this._origin, destination), this.shouldSnap(event)) as PIXI.Point);
		else
			this.point.copyFrom(this.getWallEndPoint(destination, this.shouldSnap(event)) as PIXI.Point);
	}
	stop(_origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		if (!!this._origin && event.data.originalEvent.altKey)
			this.point.copyFrom(this.getWallEndPoint(InputHandler.squarePoint(this._origin, destination), this.shouldSnap(event)) as PIXI.Point);
		else
			this.point.copyFrom(this.getWallEndPoint(destination, this.shouldSnap(event)) as PIXI.Point);
		if (this.completion != null)
			this.completion(this);
	}
	cancel() {
		this.point.copyFrom(this._originalPoint);
		if (this.completion != null)
			this.completion(this);
	}
}

export class PointArrayInputHandler extends InputHandler {
	private originalPoints: Point[] = [];
	points: PIXI.Point[];
	private _start: Point;
	completion: (sender: PointArrayInputHandler) => void;
	constructor(tool: BezierTool, start: Point, points: Point[], completion: (sender: PointArrayInputHandler) => void = null) {
		super(tool);
		points.forEach(e => this.originalPoints.push(e.clone()));
		this.points = points;
		this._start = start;
		this.completion = completion;
	}
	private moveAll(to: Point, event: PIXI.InteractionEvent) {
		const delta = new PIXI.Point(to.x - this._start.x, to.y - this._start.y);
		const snap = this.shouldSnap(event);
		var o: PIXI.Point;
		this.points.forEach((e, i) => {
			o = this.originalPoints[i];
			e.copyFrom(this.getWallEndPoint(new PIXI.Point(o.x + delta.x, o.y + delta.y), snap));
		})
	}
	start(_origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		this.moveAll(destination, event);
	}
	move(_origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		this.moveAll(destination, event);
	}
	stop(_origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		this.moveAll(destination, event);
		if (this.completion != null)
			this.completion(this);
	}
	cancel() {
		this.originalPoints.forEach((e, i) => e.copyTo(this.points[i]));
		if (this.completion != null)
			this.completion(this);
	}
}

export class MagnetPointInputHandler extends InputHandler {
	private originalPoint = new PIXI.Point(0, 0);
	protected masterPoint: Point;
	protected slavePoint: Point;
	protected offsetX: number;
	protected offsetY: number;
	completion?: (sender: MagnetPointInputHandler) => void = null;
	constructor(tool: BezierTool, masterPoint: Point, slavePoint: Point, completion: (sender: MagnetPointInputHandler) => void = null) {
		super(tool);
		this.originalPoint.copyFrom(masterPoint);
		this.masterPoint = masterPoint;
		this.slavePoint = slavePoint;
		this.offsetX = slavePoint.x - masterPoint.x;
		this.offsetY = slavePoint.y - masterPoint.y;
		this.completion = completion;
	}
	start(_origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		this.move(null, destination, event);
	}
	move(_origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		this.masterPoint.copyFrom(this.getWallEndPoint(destination, this.shouldSnap(event)) as PIXI.Point);
		this.slavePoint.set(this.masterPoint.x + this.offsetX, this.masterPoint.y + this.offsetY)
	}
	stop(_origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		this.masterPoint.copyFrom(this.getWallEndPoint(destination, this.shouldSnap(event)) as PIXI.Point);
		this.slavePoint.set(this.masterPoint.x + this.offsetX, this.masterPoint.y + this.offsetY)
		if (this.completion != null)
			this.completion(this);
	}
	cancel() {
		this.masterPoint.copyFrom(this.originalPoint);
		this.slavePoint.set(this.masterPoint.x + this.offsetX, this.masterPoint.y + this.offsetY)
		if (this.completion != null)
			this.completion(this);
	}
}