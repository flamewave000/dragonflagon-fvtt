declare type Point = PIXI.Point;
export abstract class InputHandler {
	abstract start(origin: Point, destination: Point): void;
	abstract move(origin: Point, destination: Point): void;
	abstract stop(origin: Point, destination: Point): void;
	abstract cancel(): void;
	static finalPoint(point: Point, snap: boolean = true) {
		return ((canvas as any).walls as WallsLayer)._getWallEndpointCoordinates(point, { snap: snap });
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
	start(origin: Point, destination: Point) {
		this.lineA.copyFrom(origin);
		this.lineB.copyFrom(destination);
	}
	move(_origin: Point, destination: Point): void {
		this.lineB.copyFrom(destination);
	}
	stop(_origin: Point, destination: Point): void {
		this.lineB.copyFrom(destination);
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
	start(_origin: Point, destination: Point): void { return this.move(null, destination); }
	move(_origin: Point, destination: Point): void {
		this.point.copyFrom(destination);
	}
	stop(_origin: Point, destination: Point): void {
		this.point.copyFrom(destination);
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
	points: Point[];
	private last: Point;
	completion: (sender: PointArrayInputHandler) => void;
	constructor(start: Point, points: Point[], completion: (sender: PointArrayInputHandler) => void = null) {
		super();
		points.forEach(e => this.originalPoints.push(e.clone()));
		this.points = points;
		this.last = start;
		this.completion = completion;
	}
	private moveAll(to: Point) {
		const delta = new PIXI.Point(to.x - this.last.x, to.y - this.last.y);
		this.last.copyFrom(to);
		this.points.forEach(e => e.set(e.x + delta.x, e.y + delta.y));
	}
	start(_origin: Point, destination: Point): void { this.moveAll(destination); }
	move(_origin: Point, destination: Point): void {
		this.moveAll(destination);
	}
	stop(_origin: Point, destination: Point): void {
		this.moveAll(destination);
		if (this.completion != null)
			this.completion(this);
	}
	cancel() {
		this.originalPoints.forEach((e, i) => e.copyTo(this.points[i]));
		if (this.completion != null)
			this.completion(this);
	}
}