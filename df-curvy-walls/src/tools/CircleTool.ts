
import { BezierTool, ToolMode } from './BezierTool.js';
import { PointArrayInputHandler, InputHandler, PointInputHandler, InitializerInputHandler } from "./ToolInputHandler.js";

const pointNearPoint = BezierTool.pointNearPoint;
declare type Point = PIXI.Point;

class InitializerIH extends InitializerInputHandler {
	constructor(tool: CircleTool, success: () => void, fail: () => void) {
		super(tool.lineA, tool.lineB, success, fail)
	}
}

export default class CircleTool extends BezierTool {
	lineA = new PIXI.Point();
	lineB = new PIXI.Point();

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

	getSegments(count: number): PIXI.Point[] {
		if (this.mode == ToolMode.NotPlaced) return [];
		const bounds = this.bounds;
		const rect = bounds.getRectangle(PIXI.Rectangle.EMPTY);
		var halfWidth = rect.width / 2;
		var halfHeight = rect.height / 2;
		var theta = Math.PI / count;
		var middleX = bounds.minX + halfWidth;
		var middleY = bounds.minY + halfHeight;
		var vecX = 0;
		var vecY = 0;
		const points: PIXI.Point[] = [];
		for (var c = 0; c < count * 2; c++) {
			vecX = middleX + (Math.cos(theta * c) * halfWidth);
			vecY = middleY + (Math.sin(theta * c) * halfHeight);
			points.push(new PIXI.Point(vecX, vecY));
		}
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
		else if (this.polygon.contains(point.x, point.y))
			return new PointArrayInputHandler(point, this.handles);
		return null;
	}
}