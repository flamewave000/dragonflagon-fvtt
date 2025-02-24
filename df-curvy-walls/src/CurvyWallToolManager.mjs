/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../fvtt-scripts/foundry-esm.js" />
/// <reference path="./types.d.ts" />
/// <reference path="./tools/BezierTool.mjs" />
/// <reference path="./tools/ToolInputHandler.mjs" />
/// <reference path="../common/libWrapper.d.ts" />

import { ToolMode } from './tools/BezierTool.mjs';
import CircleTool from './tools/CircleTool.mjs';
import RectangleTool from './tools/RectangleTool.mjs';
import CubicTool from './tools/CubicTool.mjs';
import QuadTool from './tools/QuadTool.mjs';
import PointMapper from './tools/PointMapper.mjs';
import SETTINGS from "../common/Settings.mjs";

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
MODE_NAMES[Mode.Cube] = 'beziercube';
MODE_NAMES[Mode.Quad] = 'bezierquad';
MODE_NAMES[Mode.Circ] = 'beziercirc';
MODE_NAMES[Mode.Rect] = 'bezierrect';

class WallPool {
	/**@readonly @type {Wall[]}*/ static walls = [];
	/**
	 * @param {WallData} wallData
	 * @returns {Wall}
	 */
	static acquire(wallData) {
		const result = new Wall(new WallDocument(wallData, { parent: canvas.scene }));
		wallData = foundry.utils.deepClone(wallData);
		delete wallData._id;
		result.document = foundry.utils.mergeObject(result.document, wallData);
		delete result.parent;
		return result;
	}
}

export class CurvyWallToolManager {
	/** @readonly */
	static PREF_DROP_KEY = 'drop-key';
	/**@type {CurvyWallToolManager}*/ static #_instance;
	#_mode = Mode.None;
	/**@type {WallsLayer}*/ #wallsLayer;
	/**@type {Wall[]}*/ #walls = [];
	/**@type {InputHandler|null}*/ #currentHandler = null;
	/**@type {BezierTool|null}*/ #_activeTool = null;
	/**@type { (mode: Mode, toolMode: ToolMode | null) => void }*/
	#_modeListener = null;
	#_ignoreNextToolModeChange = false;
	/**@type {Map<Mode, object>}*/ #_previousToolData = new Map([
		[Mode.Cube, { l1: [-100, 0], l2: [100, 0], c1: [-100, -132], c2: [100, -132] }],
		[Mode.Quad, { l1: [-100, 0], l2: [100, 0], c: [0, -132] }],
		[Mode.Circ, { l1: [-100, -100], l2: [100, 100], a1: 0, a2: 0 }],
		[Mode.Rect, { l1: [-100, -100], l2: [100, 100], t: 1, r: 1, b: 1, l: 1 }],
	]);
	#_pointMapper = new PointMapper();

	/**@type {number}*/
	get segments() { return this.#_activeTool.segments; }
	set segments(value) {
		this.#_activeTool.segments = Math.clamp(value, 1, 64);
		if (this.mode != Mode.None)
			this.render();
	}
	/**@type {BezierTool | null}*/
	get activeTool() { return this.#_activeTool; }

	#_inPointMapMode = false;
	/**@type {boolean}*/
	get currentlyMappingPoints() { return this._inPointMapMode; }

	/**@private*/constructor() { }
	/**@type {CurvyWallToolManager}*/
	static get instance() {
		return this.#_instance || (this.#_instance = new this());
	}

	/**@type {Mode}*/
	get mode() { return this.#_mode; }
	set mode(value) {
		if (this.#_mode === value) return;
		this.#_ignoreNextToolModeChange = this.activeTool?.mode !== ToolMode.NotPlaced;
		this.clearTool();
		if (this._inPointMapMode)
			this.togglePointMapping();
		this.#_mode = value;
		if (this._inPointMapMode)
			this.#_pointMapper.points = [];
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
		await game.scenes.viewed.createEmbeddedDocuments("Wall", this.#_getCurrentWallData());
		this.clearTool();
	}

	clearTool() {
		if (!this.#_activeTool) {
			this.#_ignoreNextToolModeChange = false;
			return;
		}
		this.#_activeTool.clearTool();
		this.#walls = [];
		this.#wallsLayer.preview.removeChildren();
		this.render();
	}

	togglePointMapping() {
		this._inPointMapMode = !this._inPointMapMode;
		if (this._inPointMapMode) {
			this.#_pointMapper.points = [];
			ui.notifications.info(game.i18n.localize(this.#_pointMapper.getTooltipMessage()), { permanent: true });
		} else {
			ui.notifications.active.forEach(x => x.remove());
			ui.notifications.active = [];
		}
		this.render();
	}
	/**@type {boolean}*/
	get canApplyPointMapping() {
		return this.#_pointMapper.hasEnoughData();
	}
	applyPointMapping() {
		if (!this._inPointMapMode) return;
		this._inPointMapMode = false;
		this.#_pointMapper.bindData(this.#_activeTool);
		this.#_activeTool.setMode(ToolMode.Placed);
		ui.notifications.active.forEach(x => x.remove());
		ui.notifications.active = [];
		this.render();
	}

	/**
	 * @param {Function} wrapped
	 * @param {PIXI.InteractionEvent} event
	 * @returns {void}
	 */
	static _onClickLeft(wrapped, event) {
		const self = CurvyWallToolManager.instance;
		if (self._inPointMapMode) {
			if (!self.#_pointMapper.checkPointForClick(event.interactionData.origin, event))
				return;
			if (self.#_pointMapper.hasEnoughData())
				self.#_modeListener(self.mode, ToolMode.NotPlaced);
			self.render();
			return;
		}

		if (self.mode == Mode.None || self.activeTool == null) return wrapped(event);
		if (self.activeTool.checkPointForClick(event.interactionData.origin, event)) {
			self.render();
			return;
		}
		if (event.data.originalEvent.ctrlKey) {
			self.activeTool.startedWithCtrlHeld = true;
		}
		if (SETTINGS.get(CurvyWallToolManager.PREF_DROP_KEY) === 'ctrl' && !event.data.originalEvent.ctrlKey) return;
		if (SETTINGS.get(CurvyWallToolManager.PREF_DROP_KEY) === 'alt' && !event.data.originalEvent.altKey) return;
		self.activeTool.placeTool(event.interactionData.origin, self.#_previousToolData.get(self.#_mode));
		self.render();
	}
	/**
	 * @param {Function} wrapped
	 * @param {PIXI.InteractionEvent} event
	 * @returns {void}
	 */
	static _onDragLeftStart(wrapped, event) {
		const self = CurvyWallToolManager.instance;
		if (self._inPointMapMode) {
			self.#currentHandler = self.#_pointMapper.checkPointForDrag(event.interactionData.origin);
			if (self.#currentHandler == null) return;
			self.#currentHandler.start(event.interactionData.origin, event.interactionData.destination, event);
			self.render();
			return;
		}
		if (self.mode == Mode.None || self.activeTool == null) return wrapped(event);
		self.#currentHandler = self.activeTool.checkPointForDrag(event.interactionData.origin);
		if (self.#currentHandler == null) return;
		self.#currentHandler.start(event.interactionData.origin, event.interactionData.destination, event);
		self.render();
	}
	/**
	 * @param {Function} wrapped
	 * @param {PIXI.InteractionEvent} event
	 * @returns {void}
	 */
	static _onDragLeftMove(wrapped, event) {
		const self = CurvyWallToolManager.instance;
		if (self.mode == Mode.None || !self.#currentHandler) return wrapped(event);
		if (self.activeTool.startedWithCtrlHeld && !event.data.originalEvent.ctrlKey) {
			self.activeTool.startedWithCtrlHeld = false;
		}
		self.#currentHandler.move(event.interactionData.origin, event.interactionData.destination, event);
		self.render();
	}
	/**
	 * @param {Function} wrapped
	 * @param {PIXI.InteractionEvent} event
	 * @returns {void}
	 */
	static _onDragLeftDrop(wrapped, event) {
		const self = CurvyWallToolManager.instance;
		if (self.mode == Mode.None || !self.#currentHandler) return wrapped(event);
		self.activeTool.startedWithCtrlHeld = false;
		self.#currentHandler.stop(event.interactionData.origin, event.interactionData.destination, event);
		self.#currentHandler = null;
		self.render();
	}
	/**
	 * @param {Function} wrapped
	 * @param {PIXI.InteractionEvent} event
	 * @returns {void}
	 */
	static _onDragLeftCancel(wrapped, event) {
		const self = CurvyWallToolManager.instance;
		if (self.mode == Mode.None) return wrapped(event);
		else if (!self.#currentHandler) return;
		self.#currentHandler.cancel();
		self.#currentHandler = null;
		self.render();
	}
	/**
	 * @param {Function} wrapped
	 * @param {PIXI.InteractionEvent} event
	 * @returns {void}
	 */
	static _onClickRight(wrapped, event) {
		const self = CurvyWallToolManager.instance;
		if (!event.data.originalEvent.ctrlKey || self.mode == Mode.None) return wrapped(event);
		self.mode = Mode.None;
		self.render();
	}

	#graphicsContext = new PIXI.Graphics(null);
	render() {
		this.#wallsLayer.preview.removeChildren();
		if (this.currentlyMappingPoints) {
			this.#_pointMapper.clearContext(this.#graphicsContext);
			this.#graphicsContext.clear();
			this.#graphicsContext.removeChildren();
			this.#wallsLayer.preview.addChild(this.#graphicsContext);
			this.#_pointMapper.drawHandles(this.#graphicsContext);
			return;
		}

		if (this.activeTool == null) return;
		const pointData = this.activeTool?.getSegments(this.segments);
		if (pointData.length == 0) return;
		this.#walls.length;
		/**@type {WallData}*/const wallData = this.#wallsLayer._getWallDataFromActiveTool(game.activeTool);

		while (this.#walls.length > pointData.length - 1) {
			const wall = this.#walls.pop();
			this.#wallsLayer.preview.removeChild(wall);
		}
		if (pointData[0].x !== undefined) {
			/**@type {PIXI.Point[]}*/const points = pointData;
			for (let c = 0; c < points.length - 1; c++) {
				/**@type {WallData}*/const data = foundry.utils.duplicate(wallData);
				delete data._id;
				data.c = [points[c].x, points[c].y, points[c + 1].x, points[c + 1].y];
				if (c == this.#walls.length) {
					this.#walls.push(WallPool.acquire(data));
					this.#wallsLayer.preview.addChild(this.#walls[c]);
					this.#walls[c].draw();
				} else {
					this.#walls[c].document = foundry.utils.mergeObject(this.#walls[c].document, data);
					this.#wallsLayer.preview.addChild(this.#walls[c]);
					this.#walls[c].refresh();
				}
			}
		}
		else if (pointData[0][0].x !== undefined) {
			/**@type {PIXI.Point[][]}*/const points = pointData;
			if (this.#walls.length > points.length) {
				const wall = this.#walls.pop();
				this.#wallsLayer.preview.removeChild(wall);
			}
			for (let c = 0; c < points.length; c++) {
				/**@type {WallData}*/const data = foundry.utils.duplicate(wallData);
				delete data._id;
				data.c = [points[c][0].x, points[c][0].y, points[c][1].x, points[c][1].y];
				if (c == this.#walls.length) {
					this.#walls.push(WallPool.acquire(data));
					this.#wallsLayer.preview.addChild(this.#walls[c]);
					this.#walls[c].draw();
				} else {
					this.#walls[c].document = foundry.utils.mergeObject(this.#walls[c].document, data);
					this.#wallsLayer.preview.addChild(this.#walls[c]);
					this.#walls[c].refresh();
				}
			}
		}

		this.activeTool.clearContext(this.#graphicsContext);
		this.#graphicsContext.removeChildren().forEach(x => x.destroy());
		this.#graphicsContext.clear();
		this.#graphicsContext.visible = true;
		this.#wallsLayer.preview.addChild(this.#graphicsContext);
		this.activeTool.drawHandles(this.#graphicsContext);
		this.#_previousToolData.set(this.#_mode, this.activeTool.getData());
	}

	init() {
		libWrapper.register(SETTINGS.MOD_NAME, 'Wall.prototype._onDragLeftStart', (/**@type {any}*/wrapper,/**@type {any[]}*/...args) => {
			this.clearTool();
			wrapper(...args);
		}, 'WRAPPER');
		libWrapper.register(SETTINGS.MOD_NAME, 'WallsLayer.prototype.clearPreviewContainer', (/**@type {Function}*/wrapped) => {
			this.clearTool();
			return wrapped();
		}, 'WRAPPER');
	}

	patchWallsLayer() {
		this.#wallsLayer = canvas.walls;
		libWrapper.register(SETTINGS.MOD_NAME, 'WallsLayer.prototype._onClickLeft', CurvyWallToolManager._onClickLeft, 'MIXED');
		libWrapper.register(SETTINGS.MOD_NAME, 'WallsLayer.prototype._onDragLeftStart', CurvyWallToolManager._onDragLeftStart, 'MIXED');
		libWrapper.register(SETTINGS.MOD_NAME, 'WallsLayer.prototype._onDragLeftMove', CurvyWallToolManager._onDragLeftMove, 'MIXED');
		libWrapper.register(SETTINGS.MOD_NAME, 'WallsLayer.prototype._onDragLeftDrop', CurvyWallToolManager._onDragLeftDrop, 'MIXED');
		libWrapper.register(SETTINGS.MOD_NAME, 'WallsLayer.prototype._onDragLeftCancel', CurvyWallToolManager._onDragLeftCancel, 'MIXED');
		libWrapper.register(SETTINGS.MOD_NAME, 'WallsLayer.prototype._onClickRight', CurvyWallToolManager._onClickRight, 'MIXED');
		Hooks.on('requestCurvyWallsRedraw', () => this.render());
	}

	/**
	 * @returns {Record<string, unknown>[]}
	 */
	#_getCurrentWallData() {
		return this.#walls
			.map(x => ({
				c: x.document.c,
				light: x.document.light,
				move: x.document.move,
				sight: x.document.sight,
				sound: x.document.sound,
				dir: x.document.dir,
				door: x.document.door,
				ds: x.document.ds,
				flags: x.document.flags
			}));
	}
}
/*
	c: [x0: number, y0: number, x1: number, y1: number];
	light: foundry.CONST.WALL_SENSE_TYPES;
	move: foundry.CONST.WALL_MOVEMENT_TYPES;
	sight: foundry.CONST.WALL_SENSE_TYPES;
	sound: foundry.CONST.WALL_SENSE_TYPES;
	dir: foundry.CONST.WALL_DIRECTIONS;
	door: foundry.CONST.WALL_DOOR_TYPES;
	ds: foundry.CONST.WALL_DOOR_STATES;
	flags: ConfiguredFlags<'Wall'>;
*/