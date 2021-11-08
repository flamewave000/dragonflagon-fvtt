
import { BezierTool, ToolMode } from './BezierTool';
import { PointArrayInputHandler, InputHandler, PointInputHandler, InitializerInputHandler } from "./ToolInputHandler";
import { CurvyWallControl } from '../CurvyWallsToolBar';
import { Bezier } from '../lib/bezier';

const pointNearPoint = BezierTool.pointNearPoint;
declare type Point = PIXI.Point;

class InitializerIH extends InitializerInputHandler {
	private get quadTool(): QuadTool { return this.tool as QuadTool; }
	constructor(tool: QuadTool, success: () => void, fail: () => void) {
		super(tool, false, tool.lineA, tool.lineB, success, fail)
	}
	move(origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		super.move(origin, destination, event);
		const cX = (this.tool.lineB.x + this.tool.lineA.x) / 2;
		const cY = (this.tool.lineB.y + this.tool.lineA.y) / 2;
		var nY = -(this.tool.lineB.x - this.tool.lineA.x);
		var nX = this.tool.lineB.y - this.tool.lineA.y;
		// const length = Math.sqrt((nX * nX) + (nY * nY));
		nX *= 0.25;
		nY *= 0.25;
		this.quadTool.control.set(cX + nX, cY + nY);
	}
}

export default class QuadTool extends BezierTool {
	private bezier: Bezier;
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

	constructor(segments: number = 10) {
		super(segments);
		// this.bezier = new Bezier([0, 0, 0, 0, 0, 0]);
	}

	getSegments(count: number): PIXI.Point[] | PIXI.Point[][] {
		if (this.mode == ToolMode.NotPlaced) return [];
		this.bezier = Bezier.quadraticFromPoints(this.lineA, this.control, this.lineB);
		// this.bezier.points = this.handles;
		// this.bezier.update();
		return (this.lastSegmentFetch = this.bezier.getLUT(count + 2).map((e: { x: number, y: number }) => new PIXI.Point(e.x, e.y)));
	}
	drawHandles(context: PIXI.Graphics): void {
		if (this.mode == ToolMode.NotPlaced) return;
		this.drawBoundingBox(context);
		// context.beginFill(0xffaacc)
		// 	.lineStyle(BezierTool.LINE_SIZE, 0xffaacc, 1, 0.5)
		// 	.moveTo(this.lineA.x, this.lineA.y)
		// 	.lineTo(this.control.x, this.control.y)
		// 	.moveTo(this.lineB.x, this.lineB.y)
		// 	.lineTo(this.control.x, this.control.y)
		// 	.endFill();
		super.drawSegmentLabel(context);
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
			return new PointInputHandler(this, this.lineA);
		else if (pointNearPoint(point, this.lineB, BezierTool.HANDLE_RADIUS))
			return new PointInputHandler(this, this.lineB);
		else if (pointNearPoint(point, this.control, BezierTool.HANDLE_RADIUS))
			return new PointInputHandler(this, this.control);
		else if (this.polygon.contains(point.x, point.y))
			return new PointArrayInputHandler(this, point, this.handles);
		return null;
	}

	getTools(): Record<string, CurvyWallControl> { return {}; }
	placeTool(point: PIXI.Point, data: { l1: number[], l2: number[], c: number[] }) {
		this.lineA.set(data.l1[0] + point.x, data.l1[1] + point.y);
		this.lineB.set(data.l2[0] + point.x, data.l2[1] + point.y);
		this.control.set(data.c[0] + point.x, data.c[1] + point.y);
		this.setMode(ToolMode.Placed);
	}
	getData() {
		const center = this.lineCenter;
		return {
			l1: [this.lineA.x - center.x, this.lineA.y - center.y],
			l2: [this.lineB.x - center.x, this.lineB.y - center.y],
			c: [this.control.x - center.x, this.control.y - center.y]
		};
	}
}