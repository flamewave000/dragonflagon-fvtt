import { Bezier } from "../lib/bezier.js";
import { InputHandler } from "./ToolInputHandler.js";
import { ToolUI } from '../BezierToolBar.js';

export enum ToolMode {
	NotPlaced,
	Placing,
	Placed
}

export abstract class BezierTool {
	public static readonly HANDLE_RADIUS: number = 6;
	public static readonly LINE_SIZE: number = 2;
	// Define the text style
	public static readonly TEXT_STYLE = new PIXI.TextStyle({
		fontFamily: CONFIG.defaultFontFamily,
		fontSize: 24,
		fill: "#BBBBBB",
		stroke: "#111111",
		strokeThickness: 1,
		dropShadow: false,
		dropShadowColor: "#000000",
		dropShadowBlur: Math.max(Math.round(24 / 16), 2),
		dropShadowAngle: 0,
		dropShadowDistance: 0,
		padding: 1
	});

	private _mode: ToolMode = ToolMode.NotPlaced;
	protected bezier: Bezier;
	protected lastSegmentFetch: PIXI.Point[] = [];
	abstract get handles(): PIXI.Point[]
	abstract get bounds(): PIXI.Bounds;
	abstract lineA: PIXI.Point;
	abstract lineB: PIXI.Point;

	get lineCenter(): PIXI.Point {
		return new PIXI.Point(
			this.lineA.x + ((this.lineB.x - this.lineA.x) / 2),
			this.lineA.y + ((this.lineB.y - this.lineA.y) / 2));
	}
	get mode(): ToolMode { return this._mode; };
	protected setMode(value: ToolMode) {
		this._mode = value;
		if (this._mode == ToolMode.Placed) {
			$(`button[data-tool="bezierapply"]`).show();
			$(`button[data-tool="beziercancel"]`).show();
			this.showTools();
		}
		else {
			$(`button[data-tool="bezierapply"]`).hide();
			$(`button[data-tool="beziercancel"]`).hide();
			this.hideTools();
		}
	};

	constructor() {
		this.bezier = new Bezier(this.initialPoints());
	}
	abstract initialPoints(): number[];
	abstract drawHandles(context: PIXI.Graphics): void;
	abstract checkPointForDrag(point: PIXI.Point): InputHandler | null;

	getSegments(count: number): PIXI.Point[] {
		if (this.mode == ToolMode.NotPlaced) return [];
		this.bezier.points = this.handles;
		this.bezier.update();
		return (this.lastSegmentFetch = this.bezier.getLUT(count + 2).map((e: { x: number, y: number }) => new PIXI.Point(e.x, e.y)));
	}

	abstract getTools(): ToolUI[]
	abstract showTools(): void
	abstract hideTools(): void

	clearTool() {
		this.setMode(ToolMode.NotPlaced);
	}

	protected static createText(text: string): PreciseText {
		const result = new PreciseText(text, BezierTool.TEXT_STYLE);
		result.anchor.set(0.5, 0.5);
		return result;
	}
	protected drawSegmentLabel(context: PIXI.Graphics) {
		const text = BezierTool.createText(`⊷${this.lastSegmentFetch.length - 1}`);
		text.position = this.lineCenter;
		context.addChild(text);
	}
	protected drawBoundingBox(context: PIXI.Graphics) {
		const bounds = this.bounds.getRectangle(PIXI.Rectangle.EMPTY);
		context.beginFill(0, 0)
			.lineStyle(BezierTool.LINE_SIZE, 0xE88D2D, 1, 0.5)
			.drawRoundedRect(bounds.left - 10, bounds.top - 10, bounds.width + 20, bounds.height + 20, 10)
			.endFill()
	}
	protected drawHandle(context: PIXI.Graphics, fill: number, point: PIXI.Point): PIXI.Graphics {
		return context.beginFill(fill, 1)
			.lineStyle(BezierTool.LINE_SIZE, 0x0, 1, 0.5)
			.drawCircle(point.x, point.y, BezierTool.HANDLE_RADIUS)
			.endFill();
	}

	static pointNearPoint(a: { x: number, y: number }, b: { x: number, y: number }, threshold: number): boolean {
		var x = a.x - b.x;
		var y = a.y - b.y;
		return ((x * x) + (y * y)) <= (threshold * threshold); // super simple and efficient Squared Length circle collision
	}
}