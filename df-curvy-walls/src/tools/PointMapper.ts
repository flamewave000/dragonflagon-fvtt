import { CurvyWallControl } from "../CurvyWallsToolBar";
import { CurvyWallToolManager, Mode } from "../CurvyWallToolManager";
import { Bezier } from "../lib/bezier";
import { BezierTool } from "./BezierTool";
import { InputHandler, PointInputHandler } from "./ToolInputHandler";

const pointNearPoint = BezierTool.pointNearPoint;

export default class PointMapper extends BezierTool {
	get handles(): PIXI.Point[] {
		throw new Error("Method not implemented.");
	}
	get bounds(): PIXI.Bounds {
		const b = new PIXI.Bounds();
		this.points.forEach(x => b.addPoint(x));
		return b;
	}
	lineA = new PIXI.Point();
	lineB = new PIXI.Point();
	points: PIXI.Point[] = [];

	drawHandles(context: PIXI.Graphics): void {
		this.drawBoundingBox(context);
		switch (CurvyWallToolManager.instance.mode) {
			// case Mode.Cube:
			// 	if (this.points.length < 3) break;
			// 	var lines = Bezier.cubicFromPoints(this.points[0], this.points[1], this.points[2])
			// 		.getLUT().map((p: { x: number, y: number }) => new PIXI.Point(p.x, p.y));
			// 	context.beginFill(0, 0).lineStyle(6, 0xffaacc, 1, 0.5)
			// 	context.moveTo(lines[0].x, lines[0].y)
			// 	for (let c = 1; c < lines.length; c++)
			// 		context.lineTo(lines[c].x, lines[c].y)
			// 	context.endFill();
			// 	break;
			case Mode.Quad:
				if (this.points.length < 3) break;
				var lines = Bezier.quadraticFromPoints(this.points[0], this.points[1], this.points[2])
					.getLUT().map((p: { x: number, y: number }) => new PIXI.Point(p.x, p.y));
				context.beginFill(0, 0).lineStyle(6, 0xffaacc, 1, 0.5)
				context.moveTo(lines[0].x, lines[0].y)
				for (let c = 1; c < lines.length; c++)
					context.lineTo(lines[c].x, lines[c].y)
				context.endFill();
				break;
			case Mode.Circ:
				if (this.points.length < 2) break;
				const dimensions = this._calculateCircle();
				context.beginFill(0, 0)
					.lineStyle(6, 0xffaacc, 1, 0.5)
					.drawEllipse(dimensions.x, dimensions.y, dimensions.w, dimensions.h)
					.endFill();
				break;
			case Mode.Rect:
				if (this.points.length == 0) break;
				const bounds = this.bounds;
				context.beginFill(0, 0)
					.lineStyle(6, 0xffaacc, 1, 0.5)
					.drawRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY)
					.endFill();
				break;
		};
		var fill = [0x44ffaa, 0xff4444, 0x4444ff, 0xdd44dd, 0xdddd44];
		this.points.forEach((x, idx) => this.drawHandle(context, fill[idx], x));
	}
	checkPointForClick(point: PIXI.Point, event: PIXI.InteractionEvent): boolean {
		const utility = new PointInputHandler(this, point);
		const snap = utility.shouldSnap(event);

		if (event.data.originalEvent.ctrlKey) {
			const handle = this.points.findIndex(e => pointNearPoint(point, e, BezierTool.HANDLE_RADIUS));
			if (handle < 0) return false;
			this.points.splice(handle, 1);
			return true;
		}
		// If we are clicking on an already existing point, or we have max points
		if (!!this.points.find(e => pointNearPoint(point, e, BezierTool.HANDLE_RADIUS))) return false;

		switch (CurvyWallToolManager.instance.mode) {
			// case Mode.Cube:
			case Mode.Quad:
				if (this.points.length == 3) return false;
				this.points.push(utility.getWallEndPoint(point, snap));
				return true;
			case Mode.Circ:
			// if (this.points.length == 4) return false;
			// this.points.push(utility.getWallEndPoint(point, snap));
			// return true;
			case Mode.Rect:
				if (this.points.length == 4) return false;
				this.points.push(utility.getWallEndPoint(point, snap));
				return true;
		}
		return false;
	}
	checkPointForDrag(point: PIXI.Point): InputHandler | null {
		const target = this.points.find(x => pointNearPoint(point, x, BezierTool.HANDLE_RADIUS));
		if (!target) return null;
		return new PointInputHandler(this, target);
	}

	getTooltipMessage(): string {
		switch (CurvyWallToolManager.instance.mode) {
			// case Mode.Cube:
			// 	return "You need to place 3 points to generate a Bezier Cubic Curve.";
			case Mode.Quad: return "df-curvy-walls.pointmap_quad";
			case Mode.Circ: return "df-curvy-walls.pointmap_circ";
			case Mode.Rect: return "df-curvy-walls.pointmap_rect";
		}
		return "";
	}
	hasEnoughData(): boolean {
		switch (CurvyWallToolManager.instance.mode) {
			// case Mode.Cube:
			case Mode.Quad:
				return this.points.length == 3;
			case Mode.Circ:
			case Mode.Rect:
				return this.points.length >= 2;
		}
		return false;
	}

	bindData(tool: BezierTool) {
		switch (CurvyWallToolManager.instance.mode) {
			// case Mode.Cube:
			// 	curve = Bezier.cubicFromPoints(this.points[0], this.points[1], this.points[2]);
			// 	tool.lineA.copyFrom(curve.points[0]);
			// 	tool.lineB.copyFrom(curve.points[3]);
			// 	(<PIXI.Point>(<any>tool).controlA).copyFrom(curve.points[1]);
			// 	(<PIXI.Point>(<any>tool).controlB).copyFrom(curve.points[2]);
			// 	break;
			case Mode.Quad:
				tool.lineA.copyFrom(this.points[0]);
				tool.lineB.copyFrom(this.points[2]);
				(<PIXI.Point>(<any>tool).control).copyFrom(this.points[1]);
				break;
			case Mode.Circ:
				const dimens = this._calculateCircle();
				tool.lineA.set(dimens.x - dimens.w, dimens.y - dimens.h);
				tool.lineB.set(dimens.x + dimens.w, dimens.y + dimens.h);
				break;
			case Mode.Rect:
				const bounds = this.bounds;
				tool.lineA.set(bounds.minX, bounds.minY);
				tool.lineB.set(bounds.maxX, bounds.maxY);
				break;
		}
	}

	private _calculateCircle(): { x: number, y: number, w: number, h: number } {
		const result: { x: number, y: number, w: number, h: number } = { x: 0, y: 0, w: 0, h: 0 };
		if (this.points.length == 2) {
			result.x = this.points[0].x;
			result.y = this.points[0].y;
			const size = Math.sqrt(Math.pow(this.points[1].x - result.x, 2) + Math.pow(this.points[1].y - result.y, 2))
			result.w = size;
			result.h = size;
		} else if (this.points.length == 3) {
			const p1 = this.points[0];
			const p2 = this.points[1];
			const p3 = this.points[2];
			const circle = generateCircle(p1, p2, p3);
			result.x = circle.center.x;
			result.y = circle.center.y;
			result.w = circle.radius;
			result.h = circle.radius;
		} else if (this.points.length == 4) {
			const bounds = this.bounds;
			result.x = (bounds.minX + bounds.maxX) / 2;
			result.y = (bounds.minY + bounds.maxY) / 2;
			result.w = (bounds.maxX - bounds.minX) / 2;
			result.h = (bounds.maxY - bounds.minY) / 2;
		}
		return result;
	}

	getSegments(_count: number): PIXI.Point[] | PIXI.Point[][] { throw new Error("Method not implemented."); }
	placeTool(_point: PIXI.Point, _data: object): void { throw new Error("Method not implemented."); }
	getData(): object { throw new Error("Method not implemented."); }
	getTools(): Record<string, CurvyWallControl> { throw new Error("Method not implemented."); }
}

function isPerpendicular(p1: Point, p2: Point, p3: Point): boolean {
	var yDelta_a: number = p2.y - p1.y;
	var xDelta_a: number = p2.x - p1.x;
	var yDelta_b: number = p3.y - p2.y;
	var xDelta_b: number = p3.x - p2.x;
	// checking whether the line of the two pts are vertical
	if (Math.abs(xDelta_a) <= 0.000000001 && Math.abs(yDelta_b) <= 0.000000001) {
		return false;
	}
	if (Math.abs(yDelta_a) <= 0.0000001) return true;
	else if (Math.abs(yDelta_b) <= 0.0000001) return true;
	else if (Math.abs(xDelta_a) <= 0.000000001) return true;
	else if (Math.abs(xDelta_b) <= 0.000000001) return true;
	else return false;
}
function calcCircle(pt1: Point, pt2: Point, pt3: Point): { center: Point, radius: number } {
	var yDelta_a = pt2.y - pt1.y;
	var xDelta_a = pt2.x - pt1.x;
	var yDelta_b = pt3.y - pt2.y;
	var xDelta_b = pt3.x - pt2.x;
	var center = new PIXI.Point();
	var radius = 0;

	if (Math.abs(xDelta_a) <= 0.000000001 && Math.abs(yDelta_b) <= 0.000000001) {
		center.x = 0.5 * (pt2.x + pt3.x);
		center.y = 0.5 * (pt1.y + pt2.y);
		radius = Math.sqrt(Math.pow(pt1.x - center.x, 2) + Math.pow(pt1.y - center.y, 2));
		return { center, radius };
	}

	// IsPerpendicular() assure that xDelta(s) are not zero
	var aSlope = yDelta_a / xDelta_a;
	var bSlope = yDelta_b / xDelta_b;
	if (Math.abs(aSlope - bSlope) <= 0.000000001) {// checking whether the given points are colinear. 	
		return { center, radius: -1 };
	}

	// calc center
	center.x = (aSlope * bSlope * (pt1.y - pt3.y) + bSlope * (pt1.x + pt2.x) - aSlope * (pt2.x + pt3.x)) / (2 * (bSlope - aSlope));
	center.y = -1 * (center.x - (pt1.x + pt2.x) / 2) / aSlope + (pt1.y + pt2.y) / 2;

	radius = Math.sqrt(Math.pow(pt1.x - center.x, 2) + Math.pow(pt1.y - center.y, 2));
	return { center, radius };
}

function generateCircle(pt1: Point, pt2: Point, pt3: Point): { center: Point, radius: number } {
	if (!isPerpendicular(pt1, pt2, pt3)) return calcCircle(pt1, pt2, pt3);
	else if (!isPerpendicular(pt1, pt3, pt2)) return calcCircle(pt1, pt3, pt2);
	else if (!isPerpendicular(pt2, pt1, pt3)) return calcCircle(pt2, pt1, pt3);
	else if (!isPerpendicular(pt2, pt3, pt1)) return calcCircle(pt2, pt3, pt1);
	else if (!isPerpendicular(pt3, pt2, pt1)) return calcCircle(pt3, pt2, pt1);
	else if (!isPerpendicular(pt3, pt1, pt2)) return calcCircle(pt3, pt1, pt2);
	else return { center: null, radius: -1 };
}