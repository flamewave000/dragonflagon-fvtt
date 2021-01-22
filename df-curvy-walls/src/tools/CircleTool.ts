
import { BezierTool, ToolMode } from './BezierTool.js';
import { PointArrayInputHandler, InputHandler, PointInputHandler, InitializerInputHandler } from "./ToolInputHandler.js";

const pointNearPoint = BezierTool.pointNearPoint;
declare type Point = PIXI.Point;

// Helper function log outputs
// function degrees(radians: number) { return (radians / Math.PI) * 180.0; }

class InitializerIH extends InitializerInputHandler {
	constructor(tool: CircleTool, success: () => void, fail: () => void) {
		super(tool.lineA, tool.lineB, success, fail)
	}
}

export default class CircleTool extends BezierTool {
	static readonly ANGLE_SNAP = (30 / 180) * Math.PI;
	lineA = new PIXI.Point();
	lineB = new PIXI.Point();
	arcHandle = new RotatorHandle(100);
	sliceHandle = new RotatorHandle(75, this.arcHandle);
	finishSliceIfShort = true;

	get handles(): Point[] { return [this.lineA, this.lineB]; }
	get bounds(): PIXI.Bounds {
		const b = new PIXI.Bounds();
		b.addPoint(this.lineA);
		b.addPoint(this.lineB);
		return b;
	}
	get polygon(): PIXI.Polygon {
		const bounds = this.bounds;
		return new PIXI.Polygon([
			bounds.minX, bounds.minY,
			bounds.maxX, bounds.minY,
			bounds.minX, bounds.maxY,
			bounds.maxX, bounds.maxY]);
	}

	showTools() { }
	hideTools() { }

	getCenter(): PIXI.Point {
		const bounds = this.bounds;
		const rect = bounds.getRectangle(PIXI.Rectangle.EMPTY);
		var halfWidth = rect.width / 2;
		var halfHeight = rect.height / 2;
		return new PIXI.Point(bounds.minX + halfWidth, bounds.minY + halfHeight)
	}

	private createVector(theta: number, magnitude: Point, origin: Point): Point {
		return new PIXI.Point(
			origin.x + (Math.cos(theta) * magnitude.x),
			origin.y + (Math.sin(theta) * magnitude.y)
		);
	}

	getSegments(count: number): PIXI.Point[] {
		if (this.mode == ToolMode.NotPlaced) return [];
		const bounds = this.bounds;
		const rect = bounds.getRectangle(PIXI.Rectangle.EMPTY);
		var deltaTheta = Math.PI / count;
		// Calculate the magnitude per axis based on the scalar of the circle's x,y radius
		const magnitude = new PIXI.Point(rect.width / 2, rect.height / 2);
		// Find the exact middle point of the circle
		const origin = new PIXI.Point(bounds.minX + magnitude.x, bounds.minY + magnitude.y);
		// initialize with the first point
		const points: PIXI.Point[] = [];
		// Start at full rotation and work our way back CCW
		var angle = Math.PI * 2;
		var sliceAngle = this.sliceHandle.rawAngle != Math.PI*2 ? this.sliceHandle.rawAngle : 0.0;
		while (angle >= this.sliceHandle.rawAngle) {
			points.push(this.createVector(this.arcHandle.rawAngle + angle, magnitude, origin));
			angle -= deltaTheta;
		}
		// If we stopped short of the slice handle, add a small step to go the rest of the way
		if (this.finishSliceIfShort && angle != this.sliceHandle.rawAngle) {
			points.push(this.createVector(this.arcHandle.rawAngle + this.sliceHandle.rawAngle, magnitude, origin));
		}
		// If there is no slice, close the loop
		if (this.sliceHandle.rawAngle == 0)
			points.push(points[0]);
		return points;
	}

	initialPoints(): number[] { return [0, 0, 0, 0, 0, 0]; }
	drawHandles(context: PIXI.Graphics): void {
		if (this.mode == ToolMode.NotPlaced) return;
		this.drawBoundingBox(context);
		context.beginFill(0xffaacc)
			.lineStyle(BezierTool.LINE_SIZE, 0xffaacc, 1, 0.5)
			.moveTo(this.lineA.x, this.lineA.y)
			.lineTo(this.lineB.x, this.lineB.y)
			.endFill();
		this.drawHandle(context, 0xff4444, this.lineA);
		this.drawHandle(context, 0xff4444, this.lineB);
		this.drawHandle(context, 0x44ff44, this.arcHandle.getHandlePoint(this.getCenter()));
		this.drawHandle(context, 0x4444ff, this.sliceHandle.getHandlePoint(this.getCenter()));
	}
	checkPointForDrag(point: Point): InputHandler | null {
		if (this.mode == ToolMode.NotPlaced) {
			this.setMode(ToolMode.Placing);
			return new InitializerIH(this, () => this.setMode(ToolMode.Placed), () => this.setMode(ToolMode.NotPlaced));
		}
		if (pointNearPoint(point, this.lineA, BezierTool.HANDLE_RADIUS))
			return new PointInputHandler(this.lineA);
		else if (pointNearPoint(point, this.lineB, BezierTool.HANDLE_RADIUS))
			return new PointInputHandler(this.lineB);
		else if (pointNearPoint(point, this.arcHandle.getHandlePoint(this.getCenter()), BezierTool.HANDLE_RADIUS))
			return new PointRotationHandler(this.arcHandle, this.getCenter());
		else if (pointNearPoint(point, this.sliceHandle.getHandlePoint(this.getCenter()), BezierTool.HANDLE_RADIUS))
			return new PointRotationHandler(this.sliceHandle, this.getCenter());
		else if (this.polygon.contains(point.x, point.y))
			return new PointArrayInputHandler(point, this.handles);
		return null;
	}
}

class RotatorHandle {
	private _angle: number = 0.0;
	get rawAngle(): number { return this._angle; }
	get angle(): number {
		return !!this.magnet ? this._angle + this.magnet._angle : this._angle;
	}
	set angle(value: number) {
		this._angle = !!this.magnet ? value - this.magnet._angle : this._angle = value;
	}
	private length: number = 0.0;
	private magnet: RotatorHandle;
	constructor(length: number, magnet?: RotatorHandle) {
		this.length = length;
		this.magnet = magnet;
	}
	getHandlePoint(center: PIXI.Point): PIXI.Point {
		const magnet = !!this.magnet ? this.magnet._angle : 0;
		const ax = Math.cos(magnet + this._angle) * this.length;
		const ay = Math.sin(magnet + this._angle) * this.length;
		return new PIXI.Point(center.x + ax, center.y + ay);
	}
}

class PointRotationHandler extends InputHandler {
	private original: number;
	private arcHandle: RotatorHandle;
	private center: PIXI.Point;
	constructor(arcHandle: RotatorHandle, center: PIXI.Point) {
		super();
		this.arcHandle = arcHandle;
		this.original = this.arcHandle.angle;
		this.center = center;
	}

	setAngle(to: PIXI.Point, event: PIXI.InteractionEvent) {
		const vecX = to.x - this.center.x;
		const vecY = to.y - this.center.y;
		// calculate the reference angle theta bar (͞θ)
		var angle = Math.atan(vecY / vecX);
		// If on the -X axis (2nd and 3rd quadrants)
		if (vecX < 0) angle += Math.PI;
		// Specifically the +X,-Y quadrant (4th quadrant)
		else if (vecY < 0) angle += (Math.PI * 2);
		// Perform snapping if enabled
		if (this.shouldSnap(event)) {
			// Whole number of angle snaps
			const whole = Math.trunc(angle / CircleTool.ANGLE_SNAP);
			// Round to the nearest whole angle snap
			angle = (angle - (whole * CircleTool.ANGLE_SNAP)) < (CircleTool.ANGLE_SNAP / 2)
				? whole * CircleTool.ANGLE_SNAP
				: (whole + 1) * CircleTool.ANGLE_SNAP;
		}
		this.arcHandle.angle = angle;
	}

	start(_origin: PIXI.Point, destination: PIXI.Point, event: PIXI.InteractionEvent): void {
		this.setAngle(destination, event);
	}
	move(_origin: PIXI.Point, destination: PIXI.Point, event: PIXI.InteractionEvent): void {
		this.setAngle(destination, event);
	}
	stop(_origin: PIXI.Point, destination: PIXI.Point, event: PIXI.InteractionEvent): void {
		this.setAngle(destination, event);
	}
	cancel(): void {
		this.arcHandle.angle = this.original;
	}
}