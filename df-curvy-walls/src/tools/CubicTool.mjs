/// <reference path="../CurvyWallsToolBar.mjs" />
/// <reference path="./ToolInputHandler.mjs" />
import { Bezier } from '../../libs/bezier.js';
import { BezierTool, ToolMode } from './BezierTool.mjs';
import { PointArrayInputHandler, PointInputHandler, InitializerInputHandler, MagnetPointInputHandler } from "./ToolInputHandler.mjs";

const pointNearPoint = BezierTool.pointNearPoint;

class InitializerIH extends InitializerInputHandler {
	/**@type {CubicTool}*/ get #cubicTool() { return this.tool; }
	/**
	 * @param {CubicTool} tool
	 * @param {() => void} success
	 * @param {() => void} fail
	 */
	constructor(tool, success, fail) {
		super(tool, false, tool.lineA, tool.lineB, success, fail);
	}
	/**
	 * @param {PIXI.Point} origin
	 * @param {PIXI.Point} destination
	 * @param {PIXI.InteractionEvent} event
	 */
	move(origin, destination, event) {
		super.move(origin, destination, event);
		let dx = this.tool.lineB.x - this.tool.lineA.x;
		let dy = this.tool.lineB.y - this.tool.lineA.y;
		const length = Math.sqrt((dx * dx) + (dy * dy));
		dx /= length;
		dy /= length;
		const barLength = length * (2 / 3);
		this.#cubicTool.controlA.set(this.tool.lineA.x + (dy * barLength), this.tool.lineA.y + (-dx * barLength));
		this.#cubicTool.controlB.set(this.tool.lineB.x + (dy * barLength), this.tool.lineB.y + (-dx * barLength));
	}
}

export default class CubicTool extends BezierTool {
	static lockHandles = true;
	/**@type {Bezier}*/ #bezier;
	lineA = new PIXI.Point();
	lineB = new PIXI.Point();
	controlA = new PIXI.Point();
	controlB = new PIXI.Point();

	/**@type {PIXI.Point[]}*/
	get handles() { return [this.lineA, this.controlA, this.controlB, this.lineB]; }
	/**@type {PIXI.Bounds}*/
	get bounds() {
		const b = new PIXI.Bounds();
		b.addPoint(this.lineA);
		b.addPoint(this.lineB);
		b.addPoint(this.controlA);
		b.addPoint(this.controlB);
		return b;
	}
	get polygon() { return new PIXI.Polygon([this.lineA, this.lineB, this.controlA, this.controlB]); }

	constructor(segments = 10) {
		super(segments);
		this.bezier = new Bezier([0, 0, 0, 0, 0, 0, 0, 0]);
	}
	/**
	 * @param {number} count
	 * @returns {PIXI.Point[] | PIXI.Point[][]}
	 */
	getSegments(count) {
		if (this.mode == ToolMode.NotPlaced) return [];
		this.bezier.points = this.handles;
		this.bezier.update();
		return (this.lastSegmentFetch = this.bezier.getLUT(count + 2).map((/**@type {PIXI.Point}*/ e) => new PIXI.Point(e.x, e.y)));
	}
	/**
	 * @param {PIXI.Graphics} context
	 * @returns {void}
	 */
	drawHandles(context) {
		if (this.mode == ToolMode.NotPlaced) return;
		this.drawBoundingBox(context);
		context.beginFill(0xffaacc)
			.lineStyle(BezierTool.LINE_SIZE, 0xffaacc, 1, 0.5)
			.moveTo(this.lineA.x, this.lineA.y)
			.lineTo(this.controlA.x, this.controlA.y)
			.moveTo(this.lineB.x, this.lineB.y)
			.lineTo(this.controlB.x, this.controlB.y)
			.endFill();
		super.drawSegmentLabel(context);
		this.drawHandle(context, 0xff4444, this.lineA);
		this.drawHandle(context, 0xff4444, this.lineB);
		this.drawHandle(context, 0xaaff44, this.controlA);
		this.drawHandle(context, 0xaaff44, this.controlB);
	}
	/**
	 * 
	 * @param {PIXI.Point} point 
	 * @returns {InputHandler | null}
	 */
	checkPointForDrag(point) {
		if (this.mode == ToolMode.NotPlaced) {
			this.setMode(ToolMode.Placing);
			return new InitializerIH(this, () => this.setMode(ToolMode.Placed), () => this.setMode(ToolMode.NotPlaced));
		}
		if (pointNearPoint(point, this.lineA, BezierTool.HANDLE_RADIUS))
			return CubicTool.lockHandles
				? new MagnetPointInputHandler(this, this.lineA, this.controlA)
				: new PointInputHandler(this, this.lineA);
		else if (pointNearPoint(point, this.lineB, BezierTool.HANDLE_RADIUS))
			return CubicTool.lockHandles
				? new MagnetPointInputHandler(this, this.lineB, this.controlB)
				: new PointInputHandler(this, this.lineB);
		else if (pointNearPoint(point, this.controlA, BezierTool.HANDLE_RADIUS))
			return new PointInputHandler(this, this.controlA);
		else if (pointNearPoint(point, this.controlB, BezierTool.HANDLE_RADIUS))
			return new PointInputHandler(this, this.controlB);
		else if (this.polygon.contains(point.x, point.y))
			return new PointArrayInputHandler(this, point, this.handles);
		return null;
	}

	/**
	 * @returns {Record<string, CurvyWallControl>}
	 */
	getTools() {
		return {
			cubiclock: {
				icon: 'fas fa-lock',
				title: 'df-curvy-walls.cubic_lock_handles',
				toggleable: true,
				isActive: () => CubicTool.lockHandles,
				onClick: enabled => CubicTool.lockHandles = enabled
			}
		};
	}
	/**
	 * @param {PIXI.Point} point 
	 * @param { { l1: number[], l2: number[], c1: number[], c2: number[] } } data 
	 */
	placeTool(point, data) {
		this.lineA.set(data.l1[0] + point.x, data.l1[1] + point.y);
		this.lineB.set(data.l2[0] + point.x, data.l2[1] + point.y);
		this.controlA.set(data.c1[0] + point.x, data.c1[1] + point.y);
		this.controlB.set(data.c2[0] + point.x, data.c2[1] + point.y);
		this.setMode(ToolMode.Placed);
	}
	getData() {
		const center = this.lineCenter;
		return {
			l1: [this.lineA.x - center.x, this.lineA.y - center.y],
			l2: [this.lineB.x - center.x, this.lineB.y - center.y],
			c1: [this.controlA.x - center.x, this.controlA.y - center.y],
			c2: [this.controlB.x - center.x, this.controlB.y - center.y]
		};
	}
}