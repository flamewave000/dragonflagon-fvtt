
import { BezierTool } from './tools/BezierTool.js';
import CircleTool from './tools/CircleTool.js';
import CubicTool from './tools/CubicTool.js';
import QuadTool from './tools/QuadTool.js';
import { InputHandler } from './tools/ToolInputHandler.js';

declare interface WallsLayerExt extends WallsLayer {
	dfWallCurves_onDragLeftStart(event: PIXI.InteractionEvent): void
	dfWallCurves_onDragLeftMove(event: PIXI.InteractionEvent): void
	dfWallCurves_onDragLeftDrop(event: PIXI.InteractionEvent): void
	dfWallCurves_onDragLeftCancel(event: PIXI.InteractionEvent): void
}

export enum Mode {
	None,
	Cube,
	Quad,
	Circ
}

function unsetTool(name: string) {
	delete BezierControl.findTool(name, "walls")?.active;
	ui.controls.render();
}
const MODE_NAMES: { [key: number]: string } = {};
MODE_NAMES[Mode.None] = 'undefined';
MODE_NAMES[Mode.Quad] = 'bezierquad';
MODE_NAMES[Mode.Cube] = 'beziercube';
MODE_NAMES[Mode.Circ] = 'beziercirc';
const unsetters: { [key: number]: Function } = {};
unsetters[Mode.None] = () => { }
unsetters[Mode.Quad] = () => unsetTool(MODE_NAMES[Mode.Quad]);
unsetters[Mode.Cube] = () => unsetTool(MODE_NAMES[Mode.Cube]);
unsetters[Mode.Circ] = () => unsetTool(MODE_NAMES[Mode.Circ]);

export class BezierControl {
	private static _instance: BezierControl;
	private _mode = Mode.None;
	private wallsLayer: WallsLayerExt;
	private walls: Wall[] = [];
	private currentHandler?: InputHandler = null;
	private _activeTool?: BezierTool = null;
	private _segments = 10;
	get segments(): number { return this._segments; }
	set segments(value: number) {
		this._segments = Math.clamped(value, 1, 64);
		if (this.mode != Mode.None)
			this.render();
	}
	get activeTool(): BezierTool | null { return this._activeTool; }

	private constructor() { }
	public static get instance(): BezierControl {
		return this._instance || (this._instance = new this());
	}

	get mode(): Mode { return this._mode; }

	private setMode(enabled: boolean, mode: Mode) {
		this.clearTool()
		if (enabled) {
			unsetters[this._mode]();
			this._mode = mode;
			this.wallsLayer.preview.sortableChildren = true;
			this.render();
		}
		else {
			if (this._mode != mode) return;
			this._mode = Mode.None
			this._activeTool = null;
			this.wallsLayer.preview.sortableChildren = false;
		}
	}

	toggleCubic(enabled: boolean) {
		this._activeTool = new CubicTool();
		this.setMode(enabled, Mode.Cube);
	}
	toggleQuadratic(enabled: boolean) {
		this._activeTool = new QuadTool();
		this.setMode(enabled, Mode.Quad);
	}
	toggleCircle(enabled: boolean) {
		this._activeTool = new CircleTool();
		this.setMode(enabled, Mode.Circ);
	}

	async apply() {
		// APPLY WALLS HERE SOMEHOW
		await Wall.create(this.walls.map(e => e.data), {});
		this.clearTool();
	}

	clearTool() {
		if (!this._activeTool) return;
		this._activeTool.clearTool();
		this.walls = [];
		this.wallsLayer.preview.removeChildren();
		this.render();
	}

	injectControls(controls: Control[]) {
		const curveTools: Tool[] = [
			{
				name: MODE_NAMES[Mode.Cube],
				title: "df-curvy-walls.cubic",
				icon: 'fas fa-bezier-curve',
				onClick: (newToggleState: boolean) => this.toggleCubic(newToggleState),
				toggle: true
			},
			{
				name: MODE_NAMES[Mode.Quad],
				title: "df-curvy-walls.quadratic",
				icon: 'fas fa-project-diagram',
				onClick: (newToggleState: boolean) => this.toggleQuadratic(newToggleState),
				toggle: true
			},
			{
				name: MODE_NAMES[Mode.Circ],
				title: "df-curvy-walls.circle",
				icon: 'fas fa-circle',
				onClick: (newToggleState: boolean) => this.toggleCircle(newToggleState),
				toggle: true
			}
		];
		const tools = controls.find(e => e.name === 'walls').tools;
		tools.splice(tools.findIndex(e => e.name === 'clone') + 1, 0, ...curveTools);

		// We are only called when we first load, or if the user left and came back
		// Clear all of our state when that happens
		this._mode = Mode.None
		this._activeTool = null;
		this.wallsLayer.preview.sortableChildren = false;
		this.walls = [];
	}

	static _onDragLeftStart(event: PIXI.InteractionEvent) {
		const self = BezierControl.instance;
		if (self.mode == Mode.None || self.activeTool == null) return self.wallsLayer.dfWallCurves_onDragLeftStart(event);
		self.currentHandler = self.activeTool.checkPointForDrag(event.data.origin);
		if (self.currentHandler == null) return;
		self.currentHandler.start(event.data.origin, event.data.destination, event);
		self.render();
	}
	static _onDragLeftMove(event: PIXI.InteractionEvent) {
		const self = BezierControl.instance;
		if (self.mode == Mode.None || !self.currentHandler) return self.wallsLayer.dfWallCurves_onDragLeftMove(event);
		self.currentHandler.move(event.data.origin, event.data.destination, event);
		self.render();
	}
	static _onDragLeftDrop(event: PIXI.InteractionEvent) {
		const self = BezierControl.instance;
		if (self.mode == Mode.None || !self.currentHandler) return self.wallsLayer.dfWallCurves_onDragLeftDrop(event);
		self.currentHandler.stop(event.data.origin, event.data.destination, event);
		self.currentHandler = null;
		self.render();
	}
	static _onDragLeftCancel(event: PIXI.InteractionEvent) {
		const self = BezierControl.instance;
		if (self.mode == Mode.None) return self.wallsLayer.dfWallCurves_onDragLeftCancel(event);
		else if (!self.currentHandler) return;
		self.currentHandler.cancel();
		self.currentHandler = null;
		self.clearTool();
	}

	private render() {
		this.wallsLayer.preview.removeChildren();
		if (this.activeTool == null) return;
		const points = this.activeTool?.getSegments(this.segments);
		if (points.length == 0) return;
		this.walls.length
		const wallData = this.wallsLayer._getWallDataFromActiveTool(game.activeTool);

		while (this.walls.length > points.length - 1) {
			const wall = this.walls.pop();
			this.wallsLayer.preview.removeChild(wall);
		}
		for (var c = 0; c < points.length - 1; c++) {
			const data = duplicate(wallData);
			data.c = [points[c].x, points[c].y, points[c + 1].x, points[c + 1].y]
			if (c == this.walls.length) {
				this.walls.push(new Wall(data, undefined));
				this.wallsLayer.preview.addChild(this.walls[c]);
				this.walls[c].draw();
			} else {
				this.walls[c].data = data;
				this.wallsLayer.preview.addChild(this.walls[c]);
				this.walls[c].refresh();
			}
		}
		const graphics = new PIXI.Graphics(null);
		this.wallsLayer.preview.addChild(graphics);
		this.activeTool.drawHandles(graphics);
	}

	patchWallsLayer() {
		const layer = canvas.getLayer("WallsLayer");
		this.wallsLayer = layer as WallsLayerExt;
		this.wallsLayer.dfWallCurves_onDragLeftStart = this.wallsLayer._onDragLeftStart;
		this.wallsLayer.dfWallCurves_onDragLeftMove = this.wallsLayer._onDragLeftMove;
		this.wallsLayer.dfWallCurves_onDragLeftDrop = this.wallsLayer._onDragLeftDrop;
		this.wallsLayer.dfWallCurves_onDragLeftCancel = this.wallsLayer._onDragLeftCancel;
		this.wallsLayer._onDragLeftStart = BezierControl._onDragLeftStart;
		this.wallsLayer._onDragLeftMove = BezierControl._onDragLeftMove;
		this.wallsLayer._onDragLeftDrop = BezierControl._onDragLeftDrop;
		this.wallsLayer._onDragLeftCancel = BezierControl._onDragLeftCancel;
	}

	static findControl(name: string): Control | undefined {
		return (ui.controls.controls as Control[]).find(e => e.name === name);
	}
	static findTool(name: string, control?: string): Tool | undefined {
		if (control != undefined)
			return (ui.controls.controls as Control[]).find(e => e.name === control).tools.find(e => e.name === name);
		for (var c = 0; c < ui.controls.controls.length; c++) {
			const control = ui.controls.controls[c] as Control;
			const tool = control.tools.find(e => e.name === name);
			if (tool != undefined) return tool;
		}
		return undefined;
	}
}
