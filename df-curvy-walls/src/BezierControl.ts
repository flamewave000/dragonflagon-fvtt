import { hotkeys } from './lib/lib-df-hotkeys.shim.js';
import { BezierTool, ToolMode } from './tools/BezierTool.js';
import CircleTool from './tools/CircleTool.js';
import RectangleTool from './tools/RectangleTool.js';
import CubicTool from './tools/CubicTool.js';
import QuadTool from './tools/QuadTool.js';
import { InputHandler } from './tools/ToolInputHandler.js';

declare global {
	namespace PIXI {
		interface InteractionData {
			origin: PIXI.Point;
			destination: PIXI.Point;
		}
	}
}

export enum Mode {
	None,
	Cube,
	Quad,
	Circ,
	Rect
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
MODE_NAMES[Mode.Rect] = 'bezierrect';
const unsetters: { [key: number]: Function } = {};
unsetters[Mode.None] = () => { }
unsetters[Mode.Quad] = () => unsetTool(MODE_NAMES[Mode.Quad]);
unsetters[Mode.Cube] = () => unsetTool(MODE_NAMES[Mode.Cube]);
unsetters[Mode.Circ] = () => unsetTool(MODE_NAMES[Mode.Circ]);
unsetters[Mode.Rect] = () => unsetTool(MODE_NAMES[Mode.Rect]);

class WallPool {
	static readonly walls: Wall[] = [];
	static acquire(wallData: Wall.Data): Wall {
		const result = this.walls.pop() ?? new Wall(wallData);
		result.data = wallData;
		return result;
	}
	static release(wall: Wall) { this.walls.push(wall); }
}

export class BezierControl {
	private static _instance: BezierControl;
	private _mode = Mode.None;
	private wallsLayer: WallsLayer;
	private walls: Wall[] = [];
	private currentHandler?: InputHandler = null;
	private _activeTool?: BezierTool = null;
	get segments(): number { return this._activeTool.segments; }
	set segments(value: number) {
		this._activeTool.segments = Math.clamped(value, 1, 64);
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
		this.setMode(enabled, Mode.Cube);
		this._activeTool = new CubicTool();
	}
	toggleQuadratic(enabled: boolean) {
		this.setMode(enabled, Mode.Quad);
		this._activeTool = new QuadTool();
	}
	toggleCircle(enabled: boolean) {
		this.setMode(enabled, Mode.Circ);
		this._activeTool = new CircleTool();
	}
	toggleRectangle(enabled: boolean) {
		this.setMode(enabled, Mode.Rect);
		this._activeTool = new RectangleTool();
	}

	async apply() {
		if (!this.activeTool || this.activeTool.mode != ToolMode.Placed) return;
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

	injectControls(controls: SceneControl[]) {
		const curveTools: SceneControlTool[] = [
			{
				name: MODE_NAMES[Mode.Cube],
				title: "df-curvy-walls.cubic",
				icon: 'fas fa-bezier-curve',
				onClick: (toggled: boolean) => this.toggleCubic(toggled),
				toggle: true
			},
			{
				name: MODE_NAMES[Mode.Quad],
				title: "df-curvy-walls.quadratic",
				icon: 'fas fa-project-diagram',
				onClick: (toggled: boolean) => this.toggleQuadratic(toggled),
				toggle: true
			},
			{
				name: MODE_NAMES[Mode.Circ],
				title: "df-curvy-walls.circle",
				icon: 'fas fa-circle',
				onClick: (toggled: boolean) => this.toggleCircle(toggled),
				toggle: true
			},
			{
				name: MODE_NAMES[Mode.Rect],
				title: "df-curvy-walls.rectangle",
				icon: 'fas fa-vector-square',
				onClick: (toggled: boolean) => this.toggleRectangle(toggled),
				toggle: true
			}
		];
		const tools = controls.find(e => e.name === 'walls').tools;
		tools.splice(tools.findIndex(e => e.name === 'clone') + 1, 0, ...curveTools);

		// We are only called when we first load, or if the user left and came back
		// Clear all of our state when that happens
		this._mode = Mode.None
		this._activeTool = null;
		this.walls = [];
	}

	static _onClickLeft(wrapped: Function, event: PIXI.InteractionEvent) {
		const self = BezierControl.instance;
		if (self.mode == Mode.None || self.activeTool == null) return wrapped(event);
		if (self.activeTool.checkPointForClick(event.data.origin))
			self.render();
	}
	static _onDragLeftStart(wrapped: Function, event: PIXI.InteractionEvent) {
		const self = BezierControl.instance;
		if (self.mode == Mode.None || self.activeTool == null) return wrapped(event);
		self.currentHandler = self.activeTool.checkPointForDrag(event.data.origin);
		if (self.currentHandler == null) return;
		self.currentHandler.start(event.data.origin, event.data.destination, event);
		self.render();
	}
	static _onDragLeftMove(wrapped: Function, event: PIXI.InteractionEvent) {
		const self = BezierControl.instance;
		if (self.mode == Mode.None || !self.currentHandler) return wrapped(event);
		self.currentHandler.move(event.data.origin, event.data.destination, event);
		self.render();
	}
	static _onDragLeftDrop(wrapped: Function, event: PIXI.InteractionEvent) {
		const self = BezierControl.instance;
		if (self.mode == Mode.None || !self.currentHandler) return wrapped(event);
		self.currentHandler.stop(event.data.origin, event.data.destination, event);
		self.currentHandler = null;
		self.render();
	}
	static _onDragLeftCancel(wrapped: Function, event: PIXI.InteractionEvent) {
		const self = BezierControl.instance;
		if (self.mode == Mode.None) return wrapped(event);
		else if (!self.currentHandler) return;
		self.currentHandler.cancel();
		self.currentHandler = null;
		self.render();
	}

	private graphicsContext = new PIXI.Graphics(null);
	render() {
		this.wallsLayer.preview.removeChildren()
		if (this.activeTool == null) return;
		const pointData = this.activeTool?.getSegments(this.segments);
		if (pointData.length == 0) return;
		this.walls.length
		const wallData = (<any>this.wallsLayer)._getWallDataFromActiveTool(game.activeTool) as Wall.Data;

		while (this.walls.length > pointData.length - 1) {
			const wall = this.walls.pop();
			WallPool.release(wall);
			this.wallsLayer.preview.removeChild(wall);
		}
		if ((<PIXI.Point>pointData[0]).x !== undefined) {
			const points = pointData as PIXI.Point[];
			for (var c = 0; c < points.length - 1; c++) {
				const data = duplicate(wallData) as Wall.Data;
				data.c = [points[c].x, points[c].y, points[c + 1].x, points[c + 1].y]
				if (c == this.walls.length) {
					this.walls.push(WallPool.acquire(data));
					this.wallsLayer.preview.addChild(this.walls[c]);
					this.walls[c].draw();
				} else {
					this.walls[c].data = data;
					this.wallsLayer.preview.addChild(this.walls[c]);
					this.walls[c].refresh();
				}
			}
		}
		else if ((<PIXI.Point>(<PIXI.Point[]>pointData[0])[0]).x !== undefined) {
			const points = pointData as PIXI.Point[][];
			if (this.walls.length > points.length) {
				const wall = this.walls.pop();
				WallPool.release(wall);
				this.wallsLayer.preview.removeChild(wall);
			}
			for (var c = 0; c < points.length; c++) {
				const data = duplicate(wallData) as Wall.Data;
				data.c = [points[c][0].x, points[c][0].y, points[c][1].x, points[c][1].y]
				if (c == this.walls.length) {
					this.walls.push(WallPool.acquire(data));
					this.wallsLayer.preview.addChild(this.walls[c]);
					this.walls[c].draw();
				} else {
					this.walls[c].data = data;
					this.wallsLayer.preview.addChild(this.walls[c]);
					this.walls[c].refresh();
				}
			}
		}

		this.activeTool.clearContext(this.graphicsContext);
		this.graphicsContext.removeChildren().forEach(x => x.destroy());
		this.graphicsContext.clear();
		this.wallsLayer.preview.addChild(this.graphicsContext);
		this.activeTool.drawHandles(this.graphicsContext);
	}

	patchWallsLayer() {
		const layer = (<Canvas>canvas).getLayer("WallsLayer");
		this.wallsLayer = layer as WallsLayer;
		const MOD_NAME = 'df-curvy-walls';
		libWrapper.register(MOD_NAME, 'WallsLayer.prototype._onClickLeft', BezierControl._onClickLeft, 'MIXED');
		libWrapper.register(MOD_NAME, 'WallsLayer.prototype._onDragLeftStart', BezierControl._onDragLeftStart, 'MIXED');
		libWrapper.register(MOD_NAME, 'WallsLayer.prototype._onDragLeftMove', BezierControl._onDragLeftMove, 'MIXED');
		libWrapper.register(MOD_NAME, 'WallsLayer.prototype._onDragLeftDrop', BezierControl._onDragLeftDrop, 'MIXED');
		libWrapper.register(MOD_NAME, 'WallsLayer.prototype._onDragLeftCancel', BezierControl._onDragLeftCancel, 'MIXED');

		if (!game.modules.get('lib-df-hotkeys')?.active) {
			console.error('Missing lib-df-hotkeys module dependency');
			if (game.user.isGM)
				ui.notifications.notify("DF Curvy Walls recommends you install the 'Library: DF Hotkeys' module");
		}

		hotkeys.registerGroup({
			name: MOD_NAME,
			label: 'DF Curvy Walls'
		})
		hotkeys.registerShortcut({
			name: `${MOD_NAME}.apply`,
			label: 'df-curvy-walls.apply',
			group: MOD_NAME,
			default: { key: hotkeys.keys.Enter, alt: false, ctrl: false, shift: false },
			onKeyDown: () => BezierControl.instance.apply()
		});
		hotkeys.registerShortcut({
			name: `${MOD_NAME}.cancel`,
			label: 'df-curvy-walls.cancel',
			group: MOD_NAME,
			default: { key: hotkeys.keys.Delete, alt: false, ctrl: false, shift: false },
			onKeyDown: () => BezierControl.instance.clearTool()
		});
		hotkeys.registerShortcut({
			name: `${MOD_NAME}.increment`,
			label: 'df-curvy-walls.increment',
			group: MOD_NAME,
			default: { key: hotkeys.keys.Equal, alt: false, ctrl: false, shift: false },
			onKeyDown: () => BezierControl.instance.segments++
		});
		hotkeys.registerShortcut({
			name: `${MOD_NAME}.decrement`,
			label: 'df-curvy-walls.decrement',
			group: MOD_NAME,
			default: { key: hotkeys.keys.Minus, alt: false, ctrl: false, shift: false },
			onKeyDown: () => BezierControl.instance.segments--
		});
		Hooks.on('requestCurvyWallsRedraw', () => this.render());
	}

	static findControl(name: string): SceneControl | undefined {
		return ui.controls.controls.find(e => e.name === name);
	}
	static findTool(name: string, control?: string): SceneControlTool | undefined {
		if (control != undefined)
			return ui.controls.controls.find(e => e.name === control).tools.find(e => e.name === name);
		for (var c = 0; c < ui.controls.controls.length; c++) {
			const control = ui.controls.controls[c];
			const tool = control.tools.find(e => e.name === name);
			if (tool != undefined) return tool;
		}
		return undefined;
	}
}
