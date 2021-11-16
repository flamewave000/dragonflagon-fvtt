import { InputHandler } from "./ToolInputHandler";
import { CurvyWallControl } from '../CurvyWallsToolBar';

export enum ToolMode {
	NotPlaced,
	Placing,
	Placed
}

export abstract class BezierTool {
	public static readonly HANDLE_RADIUS: number = 10;
	public static readonly LINE_SIZE: number = 2;
	// Define the text style
	public static readonly TEXT_STYLE = new PIXI.TextStyle({
		fontFamily: CONFIG.defaultFontFamily,
		fontSize: 24,
		fill: "#BBBBBB",
		stroke: "#111111",
		strokeThickness: 4,
		dropShadow: false,
		dropShadowColor: "#000000",
		dropShadowBlur: Math.max(Math.round(24 / 16), 2),
		dropShadowAngle: 0,
		dropShadowDistance: 0,
		padding: 1
	});

	private _mode: ToolMode = ToolMode.NotPlaced;
	protected lastSegmentFetch: PIXI.Point[] | PIXI.Point[][] = [];
	abstract get handles(): PIXI.Point[]
	abstract get bounds(): PIXI.Bounds;
	abstract lineA: PIXI.Point;
	abstract lineB: PIXI.Point;

	public segments: number = 8;

	get lineCenter(): PIXI.Point {
		return new PIXI.Point(
			this.lineA.x + ((this.lineB.x - this.lineA.x) / 2),
			this.lineA.y + ((this.lineB.y - this.lineA.y) / 2));
	}

	private _modeListener: (mode: ToolMode) => void = null;
	get mode(): ToolMode { return this._mode; }
	protected setMode(value: ToolMode) {
		if (this._mode === value) return;
		this._mode = value;
		if (this._modeListener !== null)
			this._modeListener(value);
	}

	startedWithCtrlHeld: boolean = false;

	constructor(segments: number = 10) {
		this.segments = segments;
	}

	abstract drawHandles(context: PIXI.Graphics): void;
	abstract checkPointForDrag(point: PIXI.Point): InputHandler | null;
	abstract getSegments(count: number): PIXI.Point[] | PIXI.Point[][];
	abstract placeTool(point: PIXI.Point, data: object): void;
	abstract getData(): object;
	abstract getTools(): Record<string, CurvyWallControl>

	checkPointForClick(_point: PIXI.Point, _event: PIXI.InteractionEvent): boolean { return false; }
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	clearContext(_context: PIXI.Graphics): void { }
	clearTool() {
		this.setMode(ToolMode.NotPlaced);
	}
	setModeListener(listener: (toolMode: ToolMode) => void) {
		this._modeListener = listener;
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
			.drawRoundedRect(bounds.left - 20, bounds.top - 20, bounds.width + 40, bounds.height + 40, 20)
			.endFill();
	}
	protected drawHandle(context: PIXI.Graphics, fill: number, point: PIXI.Point): PIXI.Graphics {
		return context.beginFill(fill, 1)
			.lineStyle(BezierTool.LINE_SIZE, 0x0, 1, 0.5)
			.drawCircle(point.x, point.y, BezierTool.HANDLE_RADIUS)
			.endFill();
	}

	static pointNearPoint(a: { x: number, y: number }, b: { x: number, y: number }, threshold: number): boolean {
		const x = a.x - b.x;
		const y = a.y - b.y;
		return ((x * x) + (y * y)) <= (threshold * threshold); // super simple and efficient Squared Length circle collision
	}
}