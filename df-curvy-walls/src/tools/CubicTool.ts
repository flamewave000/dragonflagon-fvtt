import { CurvyWallControl } from '../CurvyWallsTools.js';
import { BezierTool, ToolMode } from './BezierTool.js';
import { PointArrayInputHandler, InputHandler, PointInputHandler, InitializerInputHandler, MagnetPointInputHandler } from "./ToolInputHandler.js";

const pointNearPoint = BezierTool.pointNearPoint;
declare type Point = PIXI.Point;

class InitializerIH extends InitializerInputHandler {
	private tool: CubicTool;
	constructor(tool: CubicTool, success: () => void, fail: () => void) {
		super(tool.lineA, tool.lineB, success, fail)
		this.tool = tool;
	}
	move(origin: Point, destination: Point, event: PIXI.InteractionEvent): void {
		super.move(origin, destination, event);
		var dx = this.tool.lineB.x - this.tool.lineA.x;
		var dy = this.tool.lineB.y - this.tool.lineA.y;
		const length = Math.sqrt((dx * dx) + (dy * dy));
		dx /= length;
		dy /= length;
		const barLength = length * (2 / 3);
		this.tool.controlA.set(this.tool.lineA.x + (dy * barLength), this.tool.lineA.y + (-dx * barLength));
		this.tool.controlB.set(this.tool.lineB.x + (dy * barLength), this.tool.lineB.y + (-dx * barLength));
	}
}

export default class CubicTool extends BezierTool {
	static lockHandles = true;
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

	initialPoints(): number[] { return [0, 0, 0, 0, 0, 0, 0, 0]; }
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
				? new MagnetPointInputHandler(this.lineA, this.controlA)
				: new PointInputHandler(this.lineA);
		else if (pointNearPoint(point, this.lineB, BezierTool.HANDLE_RADIUS))
			return CubicTool.lockHandles
				? new MagnetPointInputHandler(this.lineB, this.controlB)
				: new PointInputHandler(this.lineB);
		else if (pointNearPoint(point, this.controlA, BezierTool.HANDLE_RADIUS))
			return new PointInputHandler(this.controlA);
		else if (pointNearPoint(point, this.controlB, BezierTool.HANDLE_RADIUS))
			return new PointInputHandler(this.controlB);
		else if (this.polygon.contains(point.x, point.y))
			return new PointArrayInputHandler(point, this.handles);
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
}