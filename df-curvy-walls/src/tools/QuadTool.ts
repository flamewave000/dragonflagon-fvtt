
import { BezierTool, ToolMode } from './BezierTool.js';
import { ToolUI } from '../BezierToolBar.js';
import { PointArrayInputHandler, InputHandler, PointInputHandler, InitializerInputHandler } from "./ToolInputHandler.js";

const pointNearPoint = BezierTool.pointNearPoint;
declare type Point = PIXI.Point;

class InitializerIH extends InitializerInputHandler {
	private tool: QuadTool;
	constructor(tool: QuadTool, success: () => void, fail: () => void) {
		super(tool.lineA, tool.lineB, success, fail)
		this.tool = tool;
	}
	move(origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		super.move(origin, destination, event);
		var dx = this.tool.lineB.x - this.tool.lineA.x;
		var dy = this.tool.lineB.y - this.tool.lineA.y;
		const length = Math.sqrt((dx * dx) + (dy * dy));
		dx *= 0.5;
		dy *= 0.5;
		this.tool.control.set(this.tool.lineA.x + dx + dy, this.tool.lineA.y + dy - dx);
	}
}

export default class QuadTool extends BezierTool {
	lineA = new PIXI.Point();
	lineB = new PIXI.Point();
	control = new PIXI.Point();

	get handles(): Point[] { return [this.lineA, this.control, this.lineB]; }
	get bounds(): PIXI.Bounds {
		const b = new PIXI.Bounds();
		b.addPoint(this.lineA);
		b.addPoint(this.lineB);
		b.addPoint(this.control);
		return b;
	}
	get polygon(): PIXI.Polygon { return new PIXI.Polygon([this.lineA, this.lineB, this.control]); }

	initialPoints(): number[] { return [0, 0, 0, 0, 0, 0]; }
	drawHandles(context: PIXI.Graphics): void {
		if (this.mode == ToolMode.NotPlaced) return;
		this.drawBoundingBox(context);
		context.beginFill(0xffaacc)
			.lineStyle(BezierTool.LINE_SIZE, 0xffaacc, 1, 0.5)
			.moveTo(this.lineA.x, this.lineA.y)
			.lineTo(this.control.x, this.control.y)
			.moveTo(this.lineB.x, this.lineB.y)
			.lineTo(this.control.x, this.control.y)
			.endFill();
		this.drawHandle(context, 0xff4444, this.lineA);
		this.drawHandle(context, 0xff4444, this.lineB);
		this.drawHandle(context, 0xaaff44, this.control);
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
		else if (pointNearPoint(point, this.control, BezierTool.HANDLE_RADIUS))
			return new PointInputHandler(this.control);
		else if (this.polygon.contains(point.x, point.y))
			return new PointArrayInputHandler(point, this.handles);
		return null;
	}

	getTools(): ToolUI[] { return []; }
	showTools() { }
	hideTools() { }
}