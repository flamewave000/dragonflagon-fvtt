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

const MODE_NAMES: { [key: number]: string } = {};
MODE_NAMES[Mode.None] = 'undefined';
MODE_NAMES[Mode.Cube] = 'beziercube';
MODE_NAMES[Mode.Quad] = 'bezierquad';
MODE_NAMES[Mode.Circ] = 'beziercirc';
MODE_NAMES[Mode.Rect] = 'bezierrect';
class WallPool {
	static readonly walls: Wall[] = [];
	static acquire(wallData: Wall.Data): Wall {
		const result = this.walls.pop() ?? new Wall(wallData);
		result.data = wallData;
		return result;
	}
	static release(wall: Wall) { this.walls.push(wall); }
}

export class CurvyWallToolManager {
	private static _instance: CurvyWallToolManager;
	private _mode = Mode.None;
	private wallsLayer: WallsLayer;
	private walls: Wall[] = [];
	private currentHandler?: InputHandler = null;
	private _activeTool?: BezierTool = null;
	private _modeListener: (mode: Mode, toolMode: ToolMode | null) => void = null;
	private _ignoreNextToolModeChange = false;
	private _previousToolData = new Map<Mode, object>([
		[Mode.Cube, { l1: [-100, 0], l2: [100, 0], c1: [-100, -132], c2: [100, -132] }],
		[Mode.Quad, { l1: [-100, 0], l2: [100, 0], c: [0, -132] }],
		[Mode.Circ, { l1: [-100, -100], l2: [100, 100], a1: 0, a2: 0 }],
		[Mode.Rect, { l1: [-100, -100], l2: [100, 100], t: 1, r: 1, b: 1, l: 1 }],
	]);

	get segments(): number { return this._activeTool.segments; }
	set segments(value: number) {
		this._activeTool.segments = Math.clamped(value, 1, 64);
		if (this.mode != Mode.None)
			this.render();
	}
	get activeTool(): BezierTool | null { return this._activeTool; }

	private constructor() { }
	public static get instance(): CurvyWallToolManager {
		return this._instance || (this._instance = new this());
	}

	get mode(): Mode { return this._mode; }
	set mode(value: Mode) {
		if (this._mode === value) return;
		this._ignoreNextToolModeChange = this.activeTool?.mode !== ToolMode.NotPlaced;
		this.clearTool();
		this._mode = value;
		switch (value) {
			case Mode.None:
				this._activeTool = null;
				break;
			case Mode.Cube:
				this._activeTool = new CubicTool();
				break;
			case Mode.Quad:
				this._activeTool = new QuadTool();
				break;
			case Mode.Circ:
				this._activeTool = new CircleTool();
				break;
			case Mode.Rect:
				this._activeTool = new RectangleTool();
				break;
		}
		this._activeTool?.setModeListener((toolMode: ToolMode) => {
			if (this._ignoreNextToolModeChange) {
				this._ignoreNextToolModeChange = false;
				return;
			}
			if (this._modeListener !== null)
				this._modeListener(this._mode, toolMode);
		});
		if (this._modeListener !== null)
			this._modeListener(value, this.activeTool?.mode);
	}
	setModeListener(listener: (mode: Mode, toolMode: ToolMode | null) => void) {
		this._modeListener = listener;
	}

	async apply() {
		if (!this.activeTool || this.activeTool.mode != ToolMode.Placed) return;
		await Wall.create(this.walls.map(e => e.data), {});
		this.clearTool();
	}

	clearTool() {
		if (!this._activeTool) {
			this._ignoreNextToolModeChange = false;
			return;
		}
		this._activeTool.clearTool();
		this.walls = [];
		this.wallsLayer.preview.removeChildren();
		this.render();
	}

	static _onClickLeft(wrapped: Function, event: PIXI.InteractionEvent) {
		const self = CurvyWallToolManager.instance;
		if (self.mode == Mode.None || self.activeTool == null) return wrapped(event);
		if (self.activeTool.checkPointForClick(event.data.origin)) {
			self.render();
			return;
		}
		if (!event.data.originalEvent.ctrlKey) return;
		self.activeTool.placeTool(event.data.origin, self._previousToolData.get(self._mode));
		self.render();
	}
	static _onDragLeftStart(wrapped: Function, event: PIXI.InteractionEvent) {
		const self = CurvyWallToolManager.instance;
		if (self.mode == Mode.None || self.activeTool == null) return wrapped(event);
		self.currentHandler = self.activeTool.checkPointForDrag(event.data.origin);
		if (self.currentHandler == null) return;
		self.currentHandler.start(event.data.origin, event.data.destination, event);
		self.render();
	}
	static _onDragLeftMove(wrapped: Function, event: PIXI.InteractionEvent) {
		const self = CurvyWallToolManager.instance;
		if (self.mode == Mode.None || !self.currentHandler) return wrapped(event);
		self.currentHandler.move(event.data.origin, event.data.destination, event);
		self.render();
	}
	static _onDragLeftDrop(wrapped: Function, event: PIXI.InteractionEvent) {
		const self = CurvyWallToolManager.instance;
		if (self.mode == Mode.None || !self.currentHandler) return wrapped(event);
		self.currentHandler.stop(event.data.origin, event.data.destination, event);
		self.currentHandler = null;
		self.render();
	}
	static _onDragLeftCancel(wrapped: Function, event: PIXI.InteractionEvent) {
		const self = CurvyWallToolManager.instance;
		if (self.mode == Mode.None) return wrapped(event);
		else if (!self.currentHandler) return;
		self.currentHandler.cancel();
		self.currentHandler = null;
		self.render();
	}
	static _onClickRight(wrapped: Function, event: PIXI.InteractionEvent) {
		const self = CurvyWallToolManager.instance;
		if (!event.data.originalEvent.ctrlKey || self.mode == Mode.None) return wrapped(event);
		self.mode = Mode.None;
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
		this._previousToolData.set(this._mode, this.activeTool.getData());
	}

	patchWallsLayer() {
		const layer = (<Canvas>canvas).getLayer("WallsLayer");
		this.wallsLayer = layer as WallsLayer;
		const MOD_NAME = 'df-curvy-walls';
		libWrapper.register(MOD_NAME, 'WallsLayer.prototype._onClickLeft', CurvyWallToolManager._onClickLeft, 'MIXED');
		libWrapper.register(MOD_NAME, 'WallsLayer.prototype._onDragLeftStart', CurvyWallToolManager._onDragLeftStart, 'MIXED');
		libWrapper.register(MOD_NAME, 'WallsLayer.prototype._onDragLeftMove', CurvyWallToolManager._onDragLeftMove, 'MIXED');
		libWrapper.register(MOD_NAME, 'WallsLayer.prototype._onDragLeftDrop', CurvyWallToolManager._onDragLeftDrop, 'MIXED');
		libWrapper.register(MOD_NAME, 'WallsLayer.prototype._onDragLeftCancel', CurvyWallToolManager._onDragLeftCancel, 'MIXED');
		libWrapper.register(MOD_NAME, 'WallsLayer.prototype._onClickRight', CurvyWallToolManager._onClickRight, 'MIXED');

		if (!game.modules.get('lib-df-hotkeys')?.active) {
			console.error('Missing lib-df-hotkeys module dependency');
			if (game.user.isGM)
				ui.notifications.notify("DF Curvy Walls recommends you install the 'Library: DF Hotkeys' module");
		}

		hotkeys.registerGroup({
			name: MOD_NAME,
			label: 'DF Curvy Walls'
		});
		hotkeys.registerShortcut({
			name: `${MOD_NAME}.apply`,
			label: 'df-curvy-walls.apply',
			group: MOD_NAME,
			default: { key: hotkeys.keys.Enter, alt: false, ctrl: false, shift: false },
			onKeyDown: () => CurvyWallToolManager.instance.apply()
		});
		hotkeys.registerShortcut({
			name: `${MOD_NAME}.cancel`,
			label: 'df-curvy-walls.cancel',
			group: MOD_NAME,
			default: { key: hotkeys.keys.Delete, alt: false, ctrl: false, shift: false },
			onKeyDown: () => CurvyWallToolManager.instance.clearTool()
		});
		hotkeys.registerShortcut({
			name: `${MOD_NAME}.increment`,
			label: 'df-curvy-walls.increment',
			group: MOD_NAME,
			default: { key: hotkeys.keys.Equal, alt: false, ctrl: false, shift: false },
			onKeyDown: () => CurvyWallToolManager.instance.segments++
		});
		hotkeys.registerShortcut({
			name: `${MOD_NAME}.decrement`,
			label: 'df-curvy-walls.decrement',
			group: MOD_NAME,
			default: { key: hotkeys.keys.Minus, alt: false, ctrl: false, shift: false },
			onKeyDown: () => CurvyWallToolManager.instance.segments--
		});
		Hooks.on('requestCurvyWallsRedraw', () => this.render());
	}
}
