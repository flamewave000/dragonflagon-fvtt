/// <reference path="../../../fvtt-scripts/foundry.js" />
/// <reference path="../../../fvtt-scripts/foundry-esm.js" />
/// <reference path="./ToolInputHandler.mjs" />
/// <reference path="../CurvyWallsToolBar.mjs" />

import SETTINGS from "../../common/Settings.mjs";

/**
 * @readonly
 * @enum {number}
 */
export const ToolMode = {
	NotPlaced: 0,
	Placing: 1,
	Placed: 2
};

/** @abstract */
export class BezierTool {
	/**@readonly*/static PREF_SMALL_HANDLES = "BezierTool.SmallHandles";
	/**@type {number}*/static get HANDLE_RADIUS() {
		return SETTINGS.get(this.PREF_SMALL_HANDLES) ? 5 : 10;
	}
	/**@readonly @type {number}*/static LINE_SIZE = 2;
	/**@readonly*/static TEXT_STYLE_BASE = new PIXI.TextStyle({
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
	// Define the text style
	/**@type {PIXI.TextStyle}*/
	static get TEXT_STYLE() {
		this.TEXT_STYLE_BASE.fontSize = SETTINGS.get(this.PREF_SMALL_HANDLES) ? 18 : 24;
		return this.TEXT_STYLE_BASE;
	}

	/**@type {keyof ToolMode}*/#_mode = ToolMode.NotPlaced;
	/**@protected @type {PIXI.Point[] | PIXI.Point[][]}*/lastSegmentFetch = [];
	/** @abstract @type {PIXI.Point[]}*/ get handles() { throw new Error("Not Implemented"); }
	/** @abstract @type {PIXI.Bounds}*/ get bounds() { throw new Error("Not Implemented"); }
	/** @abstract @type {PIXI.Point}*/ lineA;
	/** @abstract @type {PIXI.Point}*/ lineB;

	/**@type {number}*/ segments = 8;

	/**@type {PIXI.Point}*/
	get lineCenter() {
		return new PIXI.Point(
			this.lineA.x + ((this.lineB.x - this.lineA.x) / 2),
			this.lineA.y + ((this.lineB.y - this.lineA.y) / 2));
	}

	/**@type {(mode: ToolMode) => void}*/
	#_modeListener = null;
	/**@type {ToolMode}*/
	get mode() { return this.#_mode; }
	/**@protected @param {ToolMode} value*/
	setMode(value) {
		if (this.#_mode === value) return;
		this.#_mode = value;
		if (this.#_modeListener !== null)
			this.#_modeListener(value);
	}

	startedWithCtrlHeld = false;

	constructor(segments = 10) {
		this.segments = segments;
	}

	/** @abstract @param {PIXI.Graphics} context */
	drawHandles(context) { throw new Error("Not Implemented"); }// eslint-disable-line
	/** @abstract @param {PIXI.Point} point @returns {InputHandler | null}*/
	/**@abstract */ checkPointForDrag(point) { throw new Error("Not Implemented"); }// eslint-disable-line
	/** @abstract @param {number} count @returns {PIXI.Point[] | PIXI.Point[][]}*/
	/**@abstract */ getSegments(count) { throw new Error("Not Implemented"); }// eslint-disable-line
	/** @abstract @param {PIXI.Point} point @param {object} data @returns {void}*/
	/**@abstract */ placeTool(point, data) { throw new Error("Not Implemented"); }// eslint-disable-line
	/** @abstract @returns {object}*/
	/**@abstract */ getData() { throw new Error("Not Implemented"); }
	/** @abstract @returns {Record<string, CurvyWallControl>}*/
	/**@abstract */ getTools() { throw new Error("Not Implemented"); }

	/**
	 * @param {PIXI.Point} _point
	 * @param {PIXI.InteractionEvent} _event
	 * @returns {boolean}
	 */
	checkPointForClick(_point, _event) { return false; }
	/**
	 * @param {PIXI.Graphics} _context
	 * @returns {void}
	 */
	clearContext(_context) { }
	clearTool() {
		this.setMode(ToolMode.NotPlaced);
	}
	/**
	 * @param {(toolMode: ToolMode) => void} listener
	 */
	setModeListener(listener) {
		this.#_modeListener = listener;
	}

	/**
	 * @protected
	 * @param {string} text
	 * @returns {PreciseText}
	 */
	static createText(text) {
		const result = new PreciseText(text, BezierTool.TEXT_STYLE);
		result.anchor.set(0.5, 0.5);
		return result;
	}
	/**
	 * @protected
	 * @param {PIXI.Graphics} context
	 */
	drawSegmentLabel(context) {
		const text = BezierTool.createText(`⊷${this.lastSegmentFetch.length - 1}`);
		text.position = this.lineCenter;
		context.addChild(text);
	}
	/**
	 * @protected
	 * @param {PIXI.Graphics} context
	 */
	drawBoundingBox(context) {
		const bounds = this.bounds.getRectangle(PIXI.Rectangle.EMPTY);
		context.beginFill(0, 0)
			.lineStyle(BezierTool.LINE_SIZE, 0xE88D2D, 1, 0.5)
			.drawRoundedRect(bounds.left - 20, bounds.top - 20, bounds.width + 40, bounds.height + 40, 20)
			.endFill();
	}
	/**
	 * @protected
	 * @param {PIXI.Graphics} context
	 * @param {number} fill
	 * @param {PIXI.Point} point
	 * @returns {PIXI.Graphics}
	 */
	drawHandle(context, fill, point) {
		return context.beginFill(fill, 1)
			.lineStyle(BezierTool.LINE_SIZE, 0x0, 1, 0.5)
			.drawCircle(point.x, point.y, BezierTool.HANDLE_RADIUS)
			.endFill();
	}

	/**
	 * @param { { x: number, y: number } } a
	 * @param { { x: number, y: number } } b
	 * @param {number} threshold
	 * @returns {boolean}
	 */
	static pointNearPoint(a, b, threshold) {
		const x = a.x - b.x;
		const y = a.y - b.y;
		return ((x * x) + (y * y)) <= (threshold * threshold); // super simple and efficient Squared Length circle collision
	}
}