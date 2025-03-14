/// <reference path="../types.d.ts" />
/// <reference path="./ToolInputHandler.mjs" />
import { BezierTool, ToolMode } from "./BezierTool.mjs";
import { InitializerInputHandler, PointArrayInputHandler, PointInputHandler } from "./ToolInputHandler.mjs";

const pointNearPoint = BezierTool.pointNearPoint;

class InitializerIH extends InitializerInputHandler {
	/**
	 * @param {RectangleTool} tool
	 * @param {() => void} success
	 * @param {() => void} fail
	 */
	constructor(tool, success, fail) {
		super(tool, true, tool.lineA, tool.lineB, success, fail);
	}
}

export default class RectangleTool extends BezierTool {
	/**@type {PIXI.Point}*/ lineA = new PIXI.Point();
	/**@type {PIXI.Point}*/ lineB = new PIXI.Point();
	/**@type {number}*/ #lastCount = 0;
	/**@type {number}*/ #topCount = 0;
	/**@type {number}*/ #rightCount = 0;
	/**@type {number}*/ #bottomCount = 0;
	/**@type {number}*/ #leftCount = 0;
	/**@type {number}*/ #buttonRadius = 50;
	/**@type {number}*/ #buttonOffset = 15;
	/**@type {PreciseText}*/ #incTop;
	/**@type {PreciseText}*/ #decTop;
	/**@type {PreciseText}*/ #incRight;
	/**@type {PreciseText}*/ #decRight;
	/**@type {PreciseText}*/ #incBottom;
	/**@type {PreciseText}*/ #decBottom;
	/**@type {PreciseText}*/ #incLeft;
	/**@type {PreciseText}*/ #decLeft;
	/**@type {PreciseText}*/ #textTop;
	/**@type {PreciseText}*/ #textRight;
	/**@type {PreciseText}*/ #textBottom;
	/**@type {PreciseText}*/ #textLeft;

	/**@readonly*/static #STYLE = new PIXI.TextStyle({
		fontFamily: CONFIG.defaultFontFamily,
		fontSize: 48,
		fill: "#BBBBBB",
		stroke: "#111111",
		strokeThickness: 4,
		dropShadow: true,
		dropShadowColor: "#000000",
		dropShadowBlur: Math.max(Math.round(24 / 16), 2),
		dropShadowAngle: 0,
		dropShadowDistance: 0,
		padding: 1
	});

	/**@type {PIXI.Point[]}*/
	get handles() { return [this.lineA, this.lineB]; }
	/**@type {PIXI.Bounds}*/
	get bounds() {
		const b = new PIXI.Bounds();
		b.addPoint(this.lineA);
		b.addPoint(this.lineB);
		return b;
	}
	/**@type {PIXI.Rectangle}*/
	get rect() { return new PIXI.Rectangle(this.lineA.x, this.lineA.y, this.lineB.x, this.lineB.y); }

	constructor() {
		super(1);
		this.#incTop = RectangleTool.#createLineLabel('+');
		this.#decTop = RectangleTool.#createLineLabel('-');
		this.#incRight = RectangleTool.#createLineLabel('+');
		this.#decRight = RectangleTool.#createLineLabel('-');
		this.#incBottom = RectangleTool.#createLineLabel('+');
		this.#decBottom = RectangleTool.#createLineLabel('-');
		this.#incLeft = RectangleTool.#createLineLabel('+');
		this.#decLeft = RectangleTool.#createLineLabel('-');
		this.#textTop = BezierTool.createText('');
		this.#textRight = BezierTool.createText('');
		this.#textBottom = BezierTool.createText('');
		this.#textLeft = BezierTool.createText('');
		this.#incTop.tint = 0xaaff44;
		this.#incBottom.tint = 0xaaff44;
		this.#incRight.tint = 0xaaff44;
		this.#incLeft.tint = 0xaaff44;
		this.#decTop.tint = 0xff4444;
		this.#decBottom.tint = 0xff4444;
		this.#decRight.tint = 0xff4444;
		this.#decLeft.tint = 0xff4444;
		this.#textRight.rotation = Math.PI / 2;
		this.#textLeft.rotation = -Math.PI / 2;
	}

	/**
	 * @param {string} text
	 * @returns {PreciseText}
	 */
	static #createLineLabel(text) {
		const result = new PreciseText(text, RectangleTool.#STYLE);
		result.anchor.set(0.5, 0.5);
		return result;
	}

	/** @param {PIXI.Graphics} context */
	clearContext(context) {
		super.clearContext(context);
		context.removeChild(this.#incTop);
		context.removeChild(this.#decTop);
		context.removeChild(this.#incRight);
		context.removeChild(this.#decRight);
		context.removeChild(this.#incBottom);
		context.removeChild(this.#decBottom);
		context.removeChild(this.#incLeft);
		context.removeChild(this.#decLeft);
		context.removeChild(this.#textTop);
		context.removeChild(this.#textRight);
		context.removeChild(this.#textBottom);
		context.removeChild(this.#textLeft);
	}
	/** @param {PIXI.Graphics} context*/
	drawHandles(context) {
		if (this.mode == ToolMode.NotPlaced) return;
		this.drawBoundingBox(context);
		context.beginFill(0xffaacc)
			.lineStyle(BezierTool.LINE_SIZE, 0xffaacc, 1, 0.5)
			.moveTo(this.lineA.x, this.lineA.y)
			.lineTo(this.lineB.x, this.lineB.y)
			.endFill();
		this.drawSegmentLabels(context);
		this.drawButtons(context);
		this.drawHandle(context, 0xff4444, this.lineA);
		this.drawHandle(context, 0xaaff44, this.lineB);
	}
	/**
	 * @protected
	 * @param {PIXI.Graphics} context
	 */
	drawSegmentLabels(context) {
		this.#textTop.text = `⊷${Math.trunc(this.#topCount + this.#lastCount)}`;
		this.#textRight.text = `⊷${Math.trunc(this.#rightCount + this.#lastCount)}`;
		this.#textBottom.text = `⊷${Math.trunc(this.#bottomCount + this.#lastCount)}`;
		this.#textLeft.text = `⊷${Math.trunc(this.#leftCount + this.#lastCount)}`;
		const offset = 25;
		const bounds = this.bounds;
		this.#textTop.position = new PIXI.Point(this.lineCenter.x, bounds.minY - offset);
		this.#textBottom.position = new PIXI.Point(this.lineCenter.x, bounds.maxY + offset);
		this.#textLeft.position = new PIXI.Point(bounds.minX - offset, this.lineCenter.y);
		this.#textRight.position = new PIXI.Point(bounds.maxX + offset, this.lineCenter.y);
		context.addChild(this.#textTop, this.#textRight, this.#textBottom, this.#textLeft);
	}
	/**
	 * @protected
	 * @param {PIXI.Graphics} context
	 */
	drawButtons(context) {
		// Add buttons to each side for inc/dec segment count on that side.
		const center = this.lineCenter;

		this.#incTop.position = new PIXI.Point(center.x + this.#buttonOffset, center.y - this.#buttonRadius);
		this.#decTop.position = new PIXI.Point(center.x - this.#buttonOffset, center.y - this.#buttonRadius);
		this.#incBottom.position = new PIXI.Point(center.x + this.#buttonOffset, center.y + this.#buttonRadius);
		this.#decBottom.position = new PIXI.Point(center.x - this.#buttonOffset, center.y + this.#buttonRadius);
		this.#incLeft.position = new PIXI.Point(center.x - this.#buttonRadius, center.y - this.#buttonOffset);
		this.#decLeft.position = new PIXI.Point(center.x - this.#buttonRadius, center.y + this.#buttonOffset);
		this.#incRight.position = new PIXI.Point(center.x + this.#buttonRadius, center.y - this.#buttonOffset);
		this.#decRight.position = new PIXI.Point(center.x + this.#buttonRadius, center.y + this.#buttonOffset);

		context.addChild(this.#incTop, this.#decTop, this.#incRight, this.#decRight,
			this.#incBottom, this.#decBottom, this.#incLeft, this.#decLeft);
	}
	/**
	 * @param {number} count
	 * @returns { PIXI.Point[] | PIXI.Point[][] }
	 */
	getSegments(count) {
		if (this.mode == ToolMode.NotPlaced) return [];
		this.#lastCount = count;
		const bounds = this.bounds;

		const width = bounds.maxX - bounds.minX;
		const height = bounds.maxY - bounds.minY;
		/**@type {PIXI.Point[][]}*/
		const points = [];
		// top
		let size = width / (count + this.#topCount);
		for (let c = 0; c < count + this.#topCount; c++) {
			points.push([
				new PIXI.Point(bounds.minX + (c * size), bounds.minY),
				new PIXI.Point(bounds.minX + ((c + 1) * size), bounds.minY)
			]);
		}
		// right
		size = height / (count + this.#rightCount);
		for (let c = 0; c < count + this.#rightCount; c++) {
			points.push([
				new PIXI.Point(bounds.maxX, bounds.minY + (c * size)),
				new PIXI.Point(bounds.maxX, bounds.minY + ((c + 1) * size))
			]);
		}
		// bottom
		size = width / (count + this.#bottomCount);
		for (let c = 0; c < count + this.#bottomCount; c++) {
			points.push([
				new PIXI.Point(bounds.maxX - (c * size), bounds.maxY),
				new PIXI.Point(bounds.maxX - ((c + 1) * size), bounds.maxY)
			]);
		}
		// left
		size = height / (count + this.#leftCount);
		for (let c = 0; c < count + this.#leftCount; c++) {
			points.push([
				new PIXI.Point(bounds.minX, bounds.maxY - (c * size)),
				new PIXI.Point(bounds.minX, bounds.maxY - ((c + 1) * size))
			]);
		}
		return (this.lastSegmentFetch = points);
	}
	/**
	 * @param {PIXI.Point} point
	 * @returns {InputHandler | null}
	 */
	checkPointForDrag(point) {
		if (this.mode == ToolMode.NotPlaced) {
			this.setMode(ToolMode.Placing);
			return new InitializerIH(this, () => this.setMode(ToolMode.Placed), () => this.setMode(ToolMode.NotPlaced));
		}
		if (pointNearPoint(point, this.lineA, BezierTool.HANDLE_RADIUS))
			return new PointInputHandler(this, this.lineA, null, this.lineB);
		else if (pointNearPoint(point, this.lineB, BezierTool.HANDLE_RADIUS))
			return new PointInputHandler(this, this.lineB, null, this.lineA);
		else if (this.rect.contains(point.x, point.y))
			return new PointArrayInputHandler(this, point, this.handles);
		return null;
	}

	/**
	 * @param {PIXI.Point} point
	 * @returns {boolean}
	 */
	checkPointForClick(point) {
		if (pointNearPoint(point, this.#incTop.position, BezierTool.HANDLE_RADIUS * 2)) {
			this.#topCount = Math.clamp(this.#topCount + 1, -64, 64);
			return true;
		}
		if (pointNearPoint(point, this.#decTop.position, BezierTool.HANDLE_RADIUS * 2)) {
			this.#topCount = Math.clamp(this.#topCount - 1, -64, 64);
			return true;
		}
		if (pointNearPoint(point, this.#incRight.position, BezierTool.HANDLE_RADIUS * 2)) {
			this.#rightCount = Math.clamp(this.#rightCount + 1, -64, 64);
			return true;
		}
		if (pointNearPoint(point, this.#decRight.position, BezierTool.HANDLE_RADIUS * 2)) {
			this.#rightCount = Math.clamp(this.#rightCount - 1, -64, 64);
			return true;
		}
		if (pointNearPoint(point, this.#incBottom.position, BezierTool.HANDLE_RADIUS * 2)) {
			this.#bottomCount = Math.clamp(this.#bottomCount + 1, -64, 64);
			return true;
		}
		if (pointNearPoint(point, this.#decBottom.position, BezierTool.HANDLE_RADIUS * 2)) {
			this.#bottomCount = Math.clamp(this.#bottomCount - 1, -64, 64);
			return true;
		}
		if (pointNearPoint(point, this.#incLeft.position, BezierTool.HANDLE_RADIUS * 2)) {
			this.#leftCount = Math.clamp(this.#leftCount + 1, -64, 64);
			return true;
		}
		if (pointNearPoint(point, this.#decLeft.position, BezierTool.HANDLE_RADIUS * 2)) {
			this.#leftCount = Math.clamp(this.#leftCount - 1, -64, 64);
			return true;
		}
		return false;
	}

	/**@returns {Record<string, CurvyWallControl>}*/
	getTools() { return {}; }
	/**
	 * @param {PIXI.Point} point
	 * @param { { l1: number[], l2: number[], t: number, r: number, b: number, l: number } } data
	 */
	placeTool(point, data) {
		this.lineA.set(data.l1[0] + point.x, data.l1[1] + point.y);
		this.lineB.set(data.l2[0] + point.x, data.l2[1] + point.y);
		this.#topCount = data.t;
		this.#rightCount = data.r;
		this.#bottomCount = data.b;
		this.#leftCount = data.l;
		this.setMode(ToolMode.Placed);
	}
	getData() {
		const center = this.lineCenter;
		return {
			l1: [this.lineA.x - center.x, this.lineA.y - center.y],
			l2: [this.lineB.x - center.x, this.lineB.y - center.y],
			t: this.#topCount,
			r: this.#rightCount,
			b: this.#bottomCount,
			l: this.#leftCount
		};
	}
	/**@returns {[number,number,number,number,number,number]} */
	initialPoints() { return [0, 0, 0, 0, 0, 0]; }
}