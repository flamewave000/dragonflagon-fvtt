import { CurvyWallControl } from '../CurvyWallsToolBar.js';
import { Bezier } from '../lib/bezier.js';
import { BezierTool, ToolMode } from './BezierTool.js';
import { PointArrayInputHandler, InputHandler, PointInputHandler, InitializerInputHandler, MagnetPointInputHandler } from "./ToolInputHandler.js";

const pointNearPoint = BezierTool.pointNearPoint;
declare type Point = PIXI.Point;

class InitializerIH extends InitializerInputHandler {
	private get cubicTool(): CubicTool { return this.tool as CubicTool; }
	constructor(tool: CubicTool, success: () => void, fail: () => void) {
		super(tool, false, tool.lineA, tool.lineB, success, fail);
	}
	move(origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		super.move(origin, destination, event);
		var dx = this.tool.lineB.x - this.tool.lineA.x;
		var dy = this.tool.lineB.y - this.tool.lineA.y;
		const length = Math.sqrt((dx * dx) + (dy * dy));
		dx /= length;
		dy /= length;
		const barLength = length * (2 / 3);
		this.cubicTool.controlA.set(this.tool.lineA.x + (dy * barLength), this.tool.lineA.y + (-dx * barLength));
		this.cubicTool.controlB.set(this.tool.lineB.x + (dy * barLength), this.tool.lineB.y + (-dx * barLength));
	}
}

export default class CubicTool extends BezierTool {
	static lockHandles = true;
	private bezier: Bezier;
	lineA = new PIXI.Point();
	lineB = new PIXI.Point();
	controlA = new PIXI.Point();
	controlB = new PIXI.Point();

	get handles(): Point[] { return [this.lineA, this.controlA, this.controlB, this.lineB]; }
	get bounds(): PIXI.Bounds {
		const b = new PIXI.Bounds();
		b.addPoint(this.lineA);
		b.addPoint(this.lineB);
		b.addPoint(this.controlA);
		b.addPoint(this.controlB);
		return b;
	}
	get polygon(): PIXI.Polygon { return new PIXI.Polygon([this.lineA, this.lineB, this.controlA, this.controlB]); }

	constructor(segments: number = 10) {
		super(segments);
		this.bezier = new Bezier([0, 0, 0, 0, 0, 0, 0, 0]);
	}
	getSegments(count: number): PIXI.Point[] | PIXI.Point[][] {
		if (this.mode == ToolMode.NotPlaced) return [];
		this.bezier.points = this.handles;
		this.bezier.update();
		return (this.lastSegmentFetch = this.bezier.getLUT(count + 2).map((e: { x: number, y: number }) => new PIXI.Point(e.x, e.y)));
	}
	drawHandles(context: PIXI.Graphics): void {
		if (this.mode == ToolMode.NotPlaced) return;
		this.drawBoundingBox(context);
		context.beginFill(0xffaacc)
			.lineStyle(BezierTool.LINE_SIZE, 0xffaacc, 1, 0.5)
			.moveTo(this.lineA.x, this.lineA.y)
			.lineTo(this.controlA.x, this.controlA.y)
			.moveTo(this.lineB.x, this.lineB.y)
			.lineTo(this.controlB.x, this.controlB.y)
			.endFill();
		super.drawSegmentLabel(context);
		this.drawHandle(context, 0xff4444, this.lineA);
		this.drawHandle(context, 0xff4444, this.lineB);
		this.drawHandle(context, 0xaaff44, this.controlA);
		this.drawHandle(context, 0xaaff44, this.controlB);
	}
	checkPointForDrag(point: Point): InputHandler | null {
		if (this.mode == ToolMode.NotPlaced) {
			this.setMode(ToolMode.Placing);
			return new InitializerIH(this, () => this.setMode(ToolMode.Placed), () => this.setMode(ToolMode.NotPlaced));
		}
		if (pointNearPoint(point, this.lineA, BezierTool.HANDLE_RADIUS))
			return CubicTool.lockHandles
				? new MagnetPointInputHandler(this, this.lineA, this.controlA)
				: new PointInputHandler(this, this.lineA);
		else if (pointNearPoint(point, this.lineB, BezierTool.HANDLE_RADIUS))
			return CubicTool.lockHandles
				? new MagnetPointInputHandler(this, this.lineB, this.controlB)
				: new PointInputHandler(this, this.lineB);
		else if (pointNearPoint(point, this.controlA, BezierTool.HANDLE_RADIUS))
			return new PointInputHandler(this, this.controlA);
		else if (pointNearPoint(point, this.controlB, BezierTool.HANDLE_RADIUS))
			return new PointInputHandler(this, this.controlB);
		else if (this.polygon.contains(point.x, point.y))
			return new PointArrayInputHandler(this, point, this.handles);
		return null;
	}

	getTools(): Record<string, CurvyWallControl> {
		return {
			cubiclock: {
				icon: 'fas fa-lock',
				title: 'df-curvy-walls.cubic_lock_handles',
				toggleable: true,
				isActive: () => CubicTool.lockHandles,
				onClick: enabled => CubicTool.lockHandles = enabled
			}
		};
	}
	placeTool(point: PIXI.Point, data: { l1: number[], l2: number[], c1: number[], c2: number[] }) {
		this.lineA.set(data.l1[0] + point.x, data.l1[1] + point.y);
		this.lineB.set(data.l2[0] + point.x, data.l2[1] + point.y);
		this.controlA.set(data.c1[0] + point.x, data.c1[1] + point.y);
		this.controlB.set(data.c2[0] + point.x, data.c2[1] + point.y);
		this.setMode(ToolMode.Placed);
	}
	getData() {
		const center = this.lineCenter;
		return {
			l1: [this.lineA.x - center.x, this.lineA.y - center.y],
			l2: [this.lineB.x - center.x, this.lineB.y - center.y],
			c1: [this.controlA.x - center.x, this.controlA.y - center.y],
			c2: [this.controlB.x - center.x, this.controlB.y - center.y]
		};
	}
}