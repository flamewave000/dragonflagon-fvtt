/// <reference path="../types.d.ts" />
/// <reference path="./ToolInputHandler.mjs" />

import { BezierTool, ToolMode } from './BezierTool.mjs';
import { PointArrayInputHandler, PointInputHandler, InitializerInputHandler } from "./ToolInputHandler.mjs";
import { Bezier } from '../../libs/bezier.js';

const pointNearPoint = BezierTool.pointNearPoint;

class InitializerIH extends InitializerInputHandler {
	/**@type {QuadTool}*/
	get #quadTool() { return this.tool; }
	/**
	 * @param {QuadTool} tool
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
		const cX = (this.tool.lineB.x + this.tool.lineA.x) / 2;
		const cY = (this.tool.lineB.y + this.tool.lineA.y) / 2;
		let nY = -(this.tool.lineB.x - this.tool.lineA.x);
		let nX = this.tool.lineB.y - this.tool.lineA.y;
		// const length = Math.sqrt((nX * nX) + (nY * nY));
		nX *= 0.25;
		nY *= 0.25;
		this.#quadTool.control.set(cX + nX, cY + nY);
	}
}

export default class QuadTool extends BezierTool {
	/**@type {Bezier}*/#bezier;
	lineA = new PIXI.Point();
	lineB = new PIXI.Point();
	control = new PIXI.Point();

	/**@type {Point[]}*/
	get handles() { return [this.lineA, this.control, this.lineB]; }
	/**@type {PIXI.Bounds}*/
	get bounds() {
		const b = new PIXI.Bounds();
		b.addPoint(this.lineA);
		b.addPoint(this.lineB);
		b.addPoint(this.control);
		return b;
	}
	/**@type {PIXI.Polygon}*/
	get polygon() { return new PIXI.Polygon([this.lineA, this.lineB, this.control]); }

	constructor(segments = 10) {
		super(segments);
		// this.#bezier = new Bezier([0, 0, 0, 0, 0, 0]);
	}

	/**
	 * @param {number} count
	 * @returns {PIXI.Point[] | PIXI.Point[][]}
	 */
	getSegments(count) {
		if (this.mode == ToolMode.NotPlaced) return [];
		this.#bezier = Bezier.quadraticFromPoints(this.lineA, this.control, this.lineB);
		// this.#bezier.points = this.handles;
		// this.#bezier.update();
		return (this.lastSegmentFetch = this.#bezier.getLUT(count + 2).map((/**@type {PIXI.Point}*/e) => new PIXI.Point(e.x, e.y)));
	}
	/** @param {PIXI.Graphics} context*/
	drawHandles(context) {
		if (this.mode == ToolMode.NotPlaced) return;
		this.drawBoundingBox(context);
		// context.beginFill(0xffaacc)
		// 	.lineStyle(BezierTool.LINE_SIZE, 0xffaacc, 1, 0.5)
		// 	.moveTo(this.lineA.x, this.lineA.y)
		// 	.lineTo(this.control.x, this.control.y)
		// 	.moveTo(this.lineB.x, this.lineB.y)
		// 	.lineTo(this.control.x, this.control.y)
		// 	.endFill();
		super.drawSegmentLabel(context);
		this.drawHandle(context, 0xff4444, this.lineA);
		this.drawHandle(context, 0xff4444, this.lineB);
		this.drawHandle(context, 0xaaff44, this.control);
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
			return new PointInputHandler(this, this.lineA);
		else if (pointNearPoint(point, this.lineB, BezierTool.HANDLE_RADIUS))
			return new PointInputHandler(this, this.lineB);
		else if (pointNearPoint(point, this.control, BezierTool.HANDLE_RADIUS))
			return new PointInputHandler(this, this.control);
		else if (this.polygon.contains(point.x, point.y))
			return new PointArrayInputHandler(this, point, this.handles);
		return null;
	}

	/** @returns {Record<string, CurvyWallControl>}*/
	getTools() { return {}; }
	/**
	 * @param {PIXI.Point} point
	 * @param { { l1: number[], l2: number[], c: number[] } } data
	 */
	placeTool(point, data) {
		this.lineA.set(data.l1[0] + point.x, data.l1[1] + point.y);
		this.lineB.set(data.l2[0] + point.x, data.l2[1] + point.y);
		this.control.set(data.c[0] + point.x, data.c[1] + point.y);
		this.setMode(ToolMode.Placed);
	}
	getData() {
		const center = this.lineCenter;
		return {
			l1: [this.lineA.x - center.x, this.lineA.y - center.y],
			l2: [this.lineB.x - center.x, this.lineB.y - center.y],
			c: [this.control.x - center.x, this.control.y - center.y]
		};
	}
}