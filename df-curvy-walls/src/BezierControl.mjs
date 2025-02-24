/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../fvtt-scripts/foundry-esm.js" />
/// <reference path="./types.d.ts" />
/// <reference path="./tools/BezierTool.mjs" />

import { ToolMode } from './tools/BezierTool.mjs';
import CircleTool from './tools/CircleTool.mjs';
import RectangleTool from './tools/RectangleTool.mjs';
import CubicTool from './tools/CubicTool.mjs';
import QuadTool from './tools/QuadTool.mjs';

export const Mode = Object.freeze({
	None: 0,
	Cube: 1,
	Quad: 2,
	Circ: 3,
	Rect: 4
});

/**@type { { [key: number]: string } }*/
const MODE_NAMES = {};
MODE_NAMES[Mode.None] = 'undefined';
MODE_NAMES[Mode.Quad] = 'bezierquad';
MODE_NAMES[Mode.Cube] = 'beziercube';
MODE_NAMES[Mode.Circ] = 'beziercirc';
MODE_NAMES[Mode.Rect] = 'bezierrect';
class WallPool {
	/**@type {Wall[]}*/static walls = [];
	/**
	 * @param {WallData} wallData
	 * @returns {Wall}
	 */
	static acquire(wallData) {
		const result = this.walls.pop() ?? new Wall(new WallDocument(wallData));
		result.document = wallData;
		return result;
	}
	/**
	 * @param {Wall} wall 
	 */
	static release(wall) { this.walls.push(wall); }
}

export class CurvyWallToolManager {
	/**@type {CurvyWallToolManager}*/ static #_instance;
	#_mode = Mode.None;
	/**@type {WallsLayer;}*/ #wallsLayer;
	/**@type {Wall[] = [];}*/ #walls = [];
	/**@type {BezierTool|undefined}*/ #_activeTool = null;
	/**@type {(mode: Mode, toolMode: ToolMode | null) => void}*/ #_modeListener = null;
	#_ignoreNextToolModeChange = false;

	/**@type {number}*/
	get segments() { return this.#_activeTool.segments; }
	set segments(value) {
		this.#_activeTool.segments = Math.clamp(value, 1, 64);
		if (this.mode != Mode.None)
			this.render();
	}
	/**@type {BezierTool | null}*/
	get activeTool() { return this.#_activeTool; }

	/** @private */ constructor() {}
	/**@type {CurvyWallToolManager}*/
	static get instance() {
		return this.#_instance || (this.#_instance = new this());
	}

	/**@type {Mode}*/
	get mode() { return this.#_mode; }
	set mode(value) {
		if (this.#_mode === value) return;
		this.#_ignoreNextToolModeChange = true;
		this.clearTool();
		this.#_mode = value;
		switch (value) {
			case Mode.None:
				this.#_activeTool = null;
				break;
			case Mode.Cube:
				this.#_activeTool = new CubicTool();
				break;
			case Mode.Quad:
				this.#_activeTool = new QuadTool();
				break;
			case Mode.Circ:
				this.#_activeTool = new CircleTool();
				break;
			case Mode.Rect:
				this.#_activeTool = new RectangleTool();
				break;
		}
		this.#_activeTool?.setModeListener((/**@type {ToolMode}*/toolMode) => {
			if (this.#_ignoreNextToolModeChange) {
				this.#_ignoreNextToolModeChange = false;
				return;
			}
			if (this.#_modeListener !== null)
				this.#_modeListener(this.#_mode, toolMode);
		});
		if (this.#_modeListener !== null)
			this.#_modeListener(value, this.activeTool?.mode);
	}
	/**
	 * @param {(mode: Mode, toolMode: ToolMode | null) => void} listener
	 */
	setModeListener(listener) {
		this.#_modeListener = listener;
	}

	async apply() {
		if (!this.activeTool || this.activeTool.mode != ToolMode.Placed) return;
		await WallDocument.createDocuments(this.#walls.map(e => e.document));
		this.clearTool();
	}

	clearTool() {
		if (!this.#_activeTool) return;
		this.#_activeTool.clearTool();
		this.#walls = [];
		this.#wallsLayer.preview.removeChildren();
		this.render();
	}

	#graphicsContext = new PIXI.Graphics(null);
	render() {
		this.#wallsLayer.preview.removeChildren();
		if (this.activeTool == null) return;
		const pointData = this.activeTool?.getSegments(this.segments);
		if (pointData.length == 0) return;
		this.#walls.length;
		/**@type {WallData}*/const wallData = this.#wallsLayer._getWallDataFromActiveTool(game.activeTool);

		while (this.#walls.length > pointData.length - 1) {
			const wall = this.#walls.pop();
			WallPool.release(wall);
			this.#wallsLayer.preview.removeChild(wall);
		}
		if ((/**@type {PIXI.Point}*/pointData[0]).x !== undefined) {
			/**@type {PIXI.Point[]}*/const points = pointData;
			for (let c = 0; c < points.length - 1; c++) {
				/**@type {WallData}*/const document = foundry.utils.duplicate(wallData);
				document.c = [points[c].x, points[c].y, points[c + 1].x, points[c + 1].y];
				if (c == this.#walls.length) {
					this.#walls.push(WallPool.acquire(document));
					this.#wallsLayer.preview.addChild(this.#walls[c]);
					this.#walls[c].draw();
				} else {
					this.#walls[c].document = document;
					this.#wallsLayer.preview.addChild(this.#walls[c]);
					this.#walls[c].refresh();
				}
			}
		}
		else if (pointData[0][0].x !== undefined) {
			/**@type {PIXI.Point[][];}*/const points = pointData;
			if (this.#walls.length > points.length) {
				const wall = this.#walls.pop();
				WallPool.release(wall);
				this.#wallsLayer.preview.removeChild(wall);
			}
			for (let c = 0; c < points.length; c++) {
				/**@type {WallData}*/const document = foundry.utils.duplicate(wallData);
				document.c = [points[c][0].x, points[c][0].y, points[c][1].x, points[c][1].y];
				if (c == this.#walls.length) {
					this.#walls.push(WallPool.acquire(document));
					this.#wallsLayer.preview.addChild(this.#walls[c]);
					this.#walls[c].draw();
				} else {
					this.#walls[c].document = document;
					this.#wallsLayer.preview.addChild(this.#walls[c]);
					this.#walls[c].refresh();
				}
			}
		}

		this.activeTool.clearContext(this.#graphicsContext);
		this.#graphicsContext.removeChildren().forEach(x => x.destroy());
		this.#graphicsContext.clear();
		this.#wallsLayer.preview.addChild(this.#graphicsContext);
		this.activeTool.drawHandles(this.#graphicsContext);
	}
}
