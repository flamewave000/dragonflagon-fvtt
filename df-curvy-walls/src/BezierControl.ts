import { hotkeys } from '../libs/lib-df-hotkeys.shim';
import { BezierTool, ToolMode } from './tools/BezierTool';
import CircleTool from './tools/CircleTool';
import RectangleTool from './tools/RectangleTool';
import CubicTool from './tools/CubicTool';
import QuadTool from './tools/QuadTool';
import { InputHandler } from './tools/ToolInputHandler';
import { WallData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs';

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
MODE_NAMES[Mode.Quad] = 'bezierquad';
MODE_NAMES[Mode.Cube] = 'beziercube';
MODE_NAMES[Mode.Circ] = 'beziercirc';
MODE_NAMES[Mode.Rect] = 'bezierrect';
class WallPool {
	static readonly walls: Wall[] = [];
	static acquire(wallData: WallData): Wall {
		const result = this.walls.pop() ?? new Wall(new WallDocument(wallData));
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
	private _activeTool?: BezierTool = null;
	private _modeListener: (mode: Mode, toolMode: ToolMode | null) => void = null;
	private _ignoreNextToolModeChange = false;

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
		this._ignoreNextToolModeChange = true;
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
		await WallDocument.createDocuments(this.walls.map(e => e.data));
		this.clearTool();
	}

	clearTool() {
		if (!this._activeTool) return;
		this._activeTool.clearTool();
		this.walls = [];
		this.wallsLayer.preview.removeChildren();
		this.render();
	}

	private graphicsContext = new PIXI.Graphics(null);
	render() {
		this.wallsLayer.preview.removeChildren()
		if (this.activeTool == null) return;
		const pointData = this.activeTool?.getSegments(this.segments);
		if (pointData.length == 0) return;
		this.walls.length
		const wallData = (<any>this.wallsLayer)._getWallDataFromActiveTool(game.activeTool) as WallData;

		while (this.walls.length > pointData.length - 1) {
			const wall = this.walls.pop();
			WallPool.release(wall);
			this.wallsLayer.preview.removeChild(wall);
		}
		if ((<PIXI.Point>pointData[0]).x !== undefined) {
			const points = pointData as PIXI.Point[];
			for (var c = 0; c < points.length - 1; c++) {
				const data = duplicate(wallData) as WallData;
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
				const data = duplicate(wallData) as WallData;
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
}
