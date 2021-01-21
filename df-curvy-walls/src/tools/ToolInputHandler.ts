declare type Point = PIXI.Point;
export abstract class InputHandler {
	abstract start(origin: Point, destination: Point, event: PIXI.InteractionEvent): void;
	abstract move(origin: Point, destination: Point, event: PIXI.InteractionEvent): void;
	abstract stop(origin: Point, destination: Point, event: PIXI.InteractionEvent): void;
	abstract cancel(): void;
	static finalPoint(point: Point, snap: boolean = true) {
		return ((canvas as any).walls as WallsLayer)._getWallEndpointCoordinates(point, { snap: snap });
	}

	protected get walls(): WallsLayer { return (canvas as any).walls as WallsLayer; }

	shouldSnap(event: PIXI.InteractionEvent) {
		const { origin, originalEvent } = event.data;
		return this.walls._forceSnap || !originalEvent.shiftKey;
	}

	getWallEndPoint(origin: PIXI.Point, snap: boolean): PIXI.Point {
		// Determine the starting coordinates
		return new PIXI.Point(...this.walls._getWallEndpointCoordinates(origin, { snap }));
	}
}

export abstract class InitializerInputHandler extends InputHandler {
	lineA: Point;
	lineB: Point;
	private success: () => void;
	private fail: () => void;
	constructor(lineA: Point, lineB: Point, success: () => void, fail: () => void) {
		super();
		this.lineA = lineA;
		this.lineB = lineB;
		this.success = success;
		this.fail = fail;
	}
	start(origin: Point, destination: Point, event: PIXI.InteractionEvent) {
		const snap = this.shouldSnap(event);
		this.lineA.copyFrom(this.getWallEndPoint(origin, snap) as PIXI.Point);
		this.lineB.copyFrom(this.getWallEndPoint(destination, snap) as PIXI.Point);
	}
	move(_origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		this.lineB.copyFrom(this.getWallEndPoint(destination, this.shouldSnap(event)) as PIXI.Point);
	}
	stop(_origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		this.lineB.copyFrom(this.getWallEndPoint(destination, this.shouldSnap(event)) as PIXI.Point);
		this.success();
	}
	cancel() {
		this.fail();
	}
}

export class PointInputHandler extends InputHandler {
	private originalPoint = new PIXI.Point(0, 0);
	point: Point;
	completion?: (sender: PointInputHandler) => void = null;
	constructor(point: Point, completion: (sender: PointInputHandler) => void = null) {
		super();
		this.originalPoint.copyFrom(point);
		this.point = point;
		this.completion = completion;
	}
	start(_origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		this.move(null, destination, event);
	}
	move(_origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		this.point.copyFrom(this.getWallEndPoint(destination, this.shouldSnap(event)) as PIXI.Point);
	}
	stop(_origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		this.point.copyFrom(this.getWallEndPoint(destination, this.shouldSnap(event)) as PIXI.Point);
		if (this.completion != null)
			this.completion(this);
	}
	cancel() {
		this.point.copyFrom(this.originalPoint);
		if (this.completion != null)
			this.completion(this);
	}
}

export class PointArrayInputHandler extends InputHandler {
	private originalPoints: Point[] = [];
	points: PIXI.Point[];
	private last: Point;
	completion: (sender: PointArrayInputHandler) => void;
	constructor(start: Point, points: Point[], completion: (sender: PointArrayInputHandler) => void = null) {
		super();
		points.forEach(e => this.originalPoints.push(e.clone()));
		this.points = points;
		this.last = start;
		this.completion = completion;
	}
	private moveAll(to: Point, event: PIXI.InteractionEvent) {
		const delta = new PIXI.Point(to.x - this.last.x, to.y - this.last.y);
		const snap = this.shouldSnap(event);
		this.last.copyFrom(to);
		this.points.forEach(e => {
			e.copyFrom(this.getWallEndPoint(new PIXI.Point(e.x + delta.x,
				e.y + delta.y), snap));
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
	constructor(masterPoint: Point, slavePoint: Point,  completion: (sender: MagnetPointInputHandler) => void = null) {
		super();
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