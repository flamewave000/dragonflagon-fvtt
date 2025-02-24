/// <reference path="../types.d.ts" />
import { BezierTool, ToolMode } from './BezierTool.mjs';
import { PointArrayInputHandler, InputHandler, PointInputHandler, InitializerInputHandler } from "./ToolInputHandler.mjs";

const pointNearPoint = BezierTool.pointNearPoint;
const PI2 = Math.PI * 2;


// Helper function log outputs
// function degrees(radians: number) { return (radians / Math.PI) * 180.0; }

class InitializerIH extends InitializerInputHandler {
	/**
	 * @param {CircleTool} tool
	 * @param {() => void} success
	 * @param {() => void} fail
	 */
	constructor(tool, success, fail) {
		super(tool, true, tool.lineA, tool.lineB, success, fail);
	}
}

export default class CircleTool extends BezierTool {
	/**@readonly @type {[number,number,number,number,number]}*/
	static ANGLE_SNAP_STEPS = [Math.PI / 4, Math.PI / 6, Math.PI / 12, Math.PI / 24, Math.PI / 48];
	static snapSetIndex = 2;
	static finishSliceIfShort = true;
	static closeLoopIfSliced = false;
	lineA = new PIXI.Point();
	lineB = new PIXI.Point();
	arcHandle = new RotatorHandle(100);
	sliceHandle = new RotatorHandle(75, this.arcHandle);

	/**@type {PIXI.Point[]}*/
	get handles() { return [this.lineA, this.lineB]; }
	/**@type {PIXI.Bounds}*/
	get bounds() {
		const b = new PIXI.Bounds();
		b.addPoint(this.lineA);
		b.addPoint(this.lineB);
		return b;
	}
	/**@type {PIXI.Polygon}*/
	get polygon() {
		const bounds = this.bounds;
		return new PIXI.Polygon([
			bounds.minX, bounds.minY,
			bounds.maxX, bounds.minY,
			bounds.minX, bounds.maxY,
			bounds.maxX, bounds.maxY]);
	}

	/**@type {Record<string, CurvyWallControl>}*/
	#_tools = {
		ellipseclose: {
			icon: 'fas fa-adjust',
			title: 'df-curvy-walls.ellipse_close',
			toggleable: true,
			isActive: () => CircleTool.closeLoopIfSliced,
			onClick: enabled => {
				CircleTool.closeLoopIfSliced = enabled;
				Hooks.call('requestCurvyWallsRedraw');
			}
		},
		ellipsefinish: {
			icon: 'fas fa-compress-alt',
			title: 'df-curvy-walls.ellipse_finish_slice',
			toggleable: true,
			isActive: () => CircleTool.finishSliceIfShort,
			onClick: enabled => {
				CircleTool.finishSliceIfShort = enabled;
				Hooks.call('requestCurvyWallsRedraw');
			}
		},
		ellipseinc: {
			icon: 'dfcw ellipseinc',
			title: 'df-curvy-walls.ellipse_increment',
			onClick: () => {
				CircleTool.snapSetIndex = Math.clamp(CircleTool.snapSetIndex + 1, 0, CircleTool.ANGLE_SNAP_STEPS.length - 1);
				Hooks.call('requestCurvyWallsRedraw');
			}
		},
		ellipsedec: {
			icon: 'dfcw ellipsedec',
			title: 'df-curvy-walls.ellipse_decrement',
			onClick: () => {
				CircleTool.snapSetIndex = Math.clamp(CircleTool.snapSetIndex - 1, 0, CircleTool.ANGLE_SNAP_STEPS.length - 1);
				Hooks.call('requestCurvyWallsRedraw');
			}
		}
	};
	/**
	 * @returns {Record<string, CurvyWallControl>}
	 */
	getTools() { return this.#_tools; }
	/**
	 * @param {PIXI.Point} point
	 * @param { { l1: number[], l2: number[], a1: number, a2: number } } data
	 */
	placeTool(point, data) {
		this.lineA.set(data.l1[0] + point.x, data.l1[1] + point.y);
		this.lineB.set(data.l2[0] + point.x, data.l2[1] + point.y);
		this.arcHandle.angle = data.a1;
		this.sliceHandle.angle = data.a2;
		this.setMode(ToolMode.Placed);
	}
	getData() {
		const center = this.lineCenter;
		return {
			l1: [this.lineA.x - center.x, this.lineA.y - center.y],
			l2: [this.lineB.x - center.x, this.lineB.y - center.y],
			a1: this.arcHandle.angle, a2: this.sliceHandle.angle
		};
	}

	/**
	 * @returns PIXI.Point
	 */
	getCenter() {
		const bounds = this.bounds;
		const rect = bounds.getRectangle(PIXI.Rectangle.EMPTY);
		const halfWidth = rect.width / 2;
		const halfHeight = rect.height / 2;
		return new PIXI.Point(bounds.minX + halfWidth, bounds.minY + halfHeight);
	}

	/**
	 * @param {number} theta
	 * @param {PIXI.Point} magnitude
	 * @param {PIXI.Point} origin
	 * @returns {PIXI.Point}
	 */
	#createVector(theta, magnitude, origin) {
		return new PIXI.Point(
			origin.x + (Math.cos(theta) * magnitude.x),
			origin.y + (Math.sin(theta) * magnitude.y)
		);
	}

	/**
	 * @param {number} count
	 * @returns {PIXI.Point[]}
	 */
	getSegments(count) {
		if (this.mode == ToolMode.NotPlaced) return [];
		const bounds = this.bounds;
		const rect = bounds.getRectangle(PIXI.Rectangle.EMPTY);
		const deltaTheta = Math.PI / count;
		// Calculate the magnitude per axis based on the scalar of the circle's x,y radius
		const magnitude = new PIXI.Point(rect.width / 2, rect.height / 2);
		// Find the exact middle point of the circle
		const origin = new PIXI.Point(bounds.minX + magnitude.x, bounds.minY + magnitude.y);
		// initialize with the first point
		/**@type {PIXI.Point[]}*/const points = [];
		// Start at full rotation and work our way back CCW
		let angle = PI2;
		const sliceAngle = this.sliceHandle.rawAngle != PI2 ? this.sliceHandle.rawAngle : 0.0;
		// console.log(`Slice: ${degrees(sliceAngle)}, Arc: ${degrees(this.#arcHandle.rawAngle)}`);
		while (angle >= sliceAngle) {
			points.push(this.#createVector(this.arcHandle.rawAngle + angle, magnitude, origin));
			angle -= deltaTheta;
			if (angle < 1e-10 && angle > -1e-10)
				angle = 0;
		}
		// If we stopped short of the slice handle, add a small step to go the rest of the way
		if (CircleTool.finishSliceIfShort && angle != sliceAngle && sliceAngle != 0) {
			points.push(this.#createVector(this.arcHandle.rawAngle + sliceAngle, magnitude, origin));
		}
		// Close loop if there is no slice, or if the user has locked loop closing
		if (CircleTool.closeLoopIfSliced && sliceAngle != 0)
			points.push(points[0]);
		return (this.lastSegmentFetch = points);
	}

	/**
	 * @returns {number[]}
	 */
	initialPoints() { return [0, 0, 0, 0, 0, 0]; }
	/**
	 * @param {PIXI.Graphics} context 
	 * @returns {void}
	 */
	drawHandles(context) {
		if (this.mode == ToolMode.NotPlaced) return;
		this.drawBoundingBox(context);
		const middle = this.getCenter();
		const arc = this.arcHandle.getHandlePoint(middle);
		const slice = this.sliceHandle.getHandlePoint(middle);
		context.beginFill(0xffaacc)
			.lineStyle(BezierTool.LINE_SIZE, 0xffaacc, 1, 0.5)
			.moveTo(this.lineA.x, this.lineA.y)
			.lineTo(this.lineB.x, this.lineB.y)
			.moveTo(middle.x, middle.y)
			.lineTo(arc.x, arc.y)
			.moveTo(middle.x, middle.y)
			.lineTo(slice.x, slice.y)
			.endFill();
		this.drawSegmentLabel(context);
		const snapAngle = Math.toDegrees(CircleTool.ANGLE_SNAP_STEPS[CircleTool.snapSetIndex]).toFixed(2);
		const arcLabel = BezierTool.createText(`⇲${snapAngle}°   ◶${180 / parseFloat(snapAngle)}`);
		arcLabel.position.copyFrom(this.lineCenter);
		arcLabel.position.y += BezierTool.TEXT_STYLE.fontSize + 4;
		context.addChild(arcLabel);
		this.drawHandle(context, 0xff4444, this.lineA);
		this.drawHandle(context, 0xff4444, this.lineB);
		this.drawHandle(context, 0x44ff44, this.arcHandle.getHandlePoint(this.getCenter()));
		this.drawHandle(context, 0x4444ff, this.sliceHandle.getHandlePoint(this.getCenter()));
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
		else if (pointNearPoint(point, this.arcHandle.getHandlePoint(this.getCenter()), BezierTool.HANDLE_RADIUS))
			return new PointRotationHandler(this, this.arcHandle, this.getCenter());
		else if (pointNearPoint(point, this.sliceHandle.getHandlePoint(this.getCenter()), BezierTool.HANDLE_RADIUS))
			return new PointRotationHandler(this, this.sliceHandle, this.getCenter());
		else if (this.polygon.contains(point.x, point.y))
			return new PointArrayInputHandler(this, point, this.handles);
		return null;
	}
}

class RotatorHandle {
	/**@type {number}*/#_angle = 0.0;
	/**@type {number}*/
	get rawAngle() { return this.#_angle; }
	set rawAngle(value) { this.#_angle = value; }
	/**@type {number}*/
	get angle() { return this.magnet ? this.#_angle + this.magnet.#_angle : this.#_angle; }
	set angle(value) { this.#_angle = this.magnet ? value - this.magnet.#_angle : this.#_angle = value; }
	/**@type {number}*/#length = 0.0;
	/**@type {RotatorHandle}*/magnet;
	/**
	 * @param {number} length
	 * @param {RotatorHandle} [magnet]
	 */
	constructor(length, magnet) {
		this.#length = length;
		this.magnet = magnet;
	}
	/**
	 * @param {PIXI.Point} center
	 * @returns {PIXI.Point}
	 */
	getHandlePoint(center) {
		const magnet = this.magnet ? this.magnet.#_angle : 0;
		const ax = Math.cos(magnet + this.#_angle) * this.#length;
		const ay = Math.sin(magnet + this.#_angle) * this.#length;
		return new PIXI.Point(center.x + ax, center.y + ay);
	}
}

class PointRotationHandler extends InputHandler {
	/**@type {number}*/#original;
	/**@type {RotatorHandle}*/#arcHandle;
	/**@type {PIXI.Point}*/#center;
	/**
	 * @param {BezierTool} tool 
	 * @param {RotatorHandle} arcHandle 
	 * @param {PIXI.Point} center 
	 */
	constructor(tool, arcHandle, center) {
		super(tool);
		this.#arcHandle = arcHandle;
		this.#original = this.#arcHandle.angle;
		this.#center = center;
	}

	/**
	 * @param {PIXI.Point} to
	 * @param {PIXI.InteractionEvent} event
	 */
	setAngle(to, event) {
		const vecX = to.x - this.#center.x;
		const vecY = to.y - this.#center.y;
		// calculate the reference angle theta bar (͞θ)
		let angle = Math.atan(vecY / vecX);
		// If on the -X axis (2nd and 3rd quadrants)
		if (vecX < 0) angle += Math.PI;
		// Specifically the +X,-Y quadrant (4th quadrant)
		else if (vecY < 0) angle += PI2;
		// Perform snapping if enabled
		if (this.shouldSnap(event)) {
			const snapAngle = CircleTool.ANGLE_SNAP_STEPS[CircleTool.snapSetIndex];
			// Whole number of angle snaps
			const whole = Math.trunc(angle / snapAngle);
			// Round to the nearest whole angle snap
			angle = (angle - (whole * snapAngle)) < (snapAngle / 2)
				? whole * snapAngle
				: (whole + 1) * snapAngle;
		}
		const magnet = this.#arcHandle.magnet ? (PI2 - this.#arcHandle.magnet.rawAngle) : 0;
		this.#arcHandle.rawAngle = (magnet + angle) % PI2;
	}

	/**
	 * @param {PIXI.Point} _origin
	 * @param {PIXI.Point} destination
	 * @param {PIXI.InteractionEvent} event
	 */
	start(_origin, destination, event) {
		this.setAngle(destination, event);
	}
	/**
	 * @param {PIXI.Point} _origin
	 * @param {PIXI.Point} destination
	 * @param {PIXI.InteractionEvent} event
	 */
	move(_origin, destination, event) {
		this.setAngle(destination, event);
	}
	/**
	 * @param {PIXI.Point} _origin
	 * @param {PIXI.Point} destination
	 * @param {PIXI.InteractionEvent} event
	 */
	stop(_origin, destination, event) {
		this.setAngle(destination, event);
	}
	cancel() {
		this.#arcHandle.angle = this.#original;
	}
}