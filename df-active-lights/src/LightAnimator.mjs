/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../common/foundry.d.ts" />
/// <reference path="../../common/libWrapper.d.ts" />
/// <reference path="./types.d.ts" />
import EaseFunctions from "./EaseFunctions.mjs";
import SETTINGS from "../common/Settings.mjs";

export default class LightAnimator {
	/**@readonly*/ static FLAG_ANIMS = 'anims';

	static ready() {
		libWrapper.register(SETTINGS.MOD_NAME, 'AmbientLight.prototype._onUpdate',
			/**
			 * @this {AmbientLight}
			 * @param {(..._: any) => void} wrapped
			 * @param  {...any} args
			 */
			function (wrapped, ...args) {
			wrapped(...args);
			delete this.animator;
		}, 'WRAPPER');
		canvas.app.ticker.add(this.#_LightingLayer_animateSource, this);
	}
	/**
	 * @param {number} _
	 * @returns {void}
	 */
	static #_LightingLayer_animateSource(_) {
		// If we are not enabled, return immediately
		if (!SETTINGS.get('enabled')) return;
		let atLeastOneLight = false;

		for (const source of canvas.effects.lightSources) {
			if (!(source.object instanceof AmbientLight) || source.object.document.hidden) continue;
			if (LightAnimator.#_PointSource_animate.bind(source)(source.object))
				atLeastOneLight = true;
		}
		if (atLeastOneLight) {
			canvas.perception.update({
				refreshLighting: true,
				refreshVision: true
			}, true);
		}
	}
	/**
	 * @this {PointSource}
	 * @param {import("./types").AmbientLightExt} light
	 * @returns {boolean}
	 */
	static #_PointSource_animate(light) {
		try {
			// If the light has not had an animator created for it yet
			if (!light.animator) {
				// Get the animation data
				/**@type {AnimatorData}*/
				const animData = this.object.document.getFlag(SETTINGS.MOD_NAME, LightAnimator.FLAG_ANIMS);
				// Ignore any light that has no animations
				if (!animData || animData.keys.length <= 1) return false;
				if (animData.keys[0].time !== 0) {
					console.warn('Malformed first keyframe! Time was not 0, setting to zero for now.');
					animData.keys[0].time = 0;
				}
				// Create a light animator
				light.animator = new LightAnimator(light, animData);
			}
			// Update the animation state
			if (!light.animator.tick())
				return false;

			// hold onto the original data
			const origConfig = light.document.config;
			const origRotation = light.document.rotation;
			// Merge a duplicate of the original data with the modified animation data
			light.document.config = foundry.utils.mergeObject(foundry.utils.duplicate(light.document.config), {
				dim: light.animData.dim !== undefined ? light.animData.dim : light.document.config.dim,
				bright: light.animData.bright !== undefined ? light.animData.bright : light.document.config.bright,
				angle: light.animData.angle ?? light.document.config.angle,
				color: light.animData.tintColor ?? light.document.config.color,
				alpha: light.animData.tintAlpha ?? light.document.config.alpha
			});
			light.document.rotation = light.animData.rotation ?? light.document.rotation;
			light.document.config.toObject = function () { return this; };
			// Update the light source with the new data
			light.initializeLightSource({deleted:false});
			// If we are on the LightingLayer, refresh the light's controls
			if (canvas.lighting.active)
				light.refresh();
			// Restore the original data
			light.document.config = origConfig;
			light.document.rotation = origRotation;
			return true;
		}
		// We catch all errors that might occur and print them to the console to
		// prevent them from propagating up and crashing the lighting system
		catch (e) {
			console.error(e);
			return false;
		}
	}

	/**@type {import("./types").AnimatorData}*/ #_data;
	/**@type {import("./types").AmbientLightExt}*/ #_object;
	/**@type {Map<string, import("./types").PropertyKeyFrame>}*/ #_props;

	get offset() { return this.#_data.offset; }
	get duration() { return this.#_data.keys[this.#_data.keys.length - 1].time; }
	get keys() { return this.#_data.keys; }

	/**
	 * @param {import("./types").AmbientLightExt} object
	 * @param {import("./types").AnimatorData} data
	 */
	constructor(object, data) {
		this.#_data = data;
		this.#_object = object;
		data.keys.sort((a, b) => a.time < b.time ? -1 : 1);
		const keys = data.keys.slice(0).reverse();
		this.#_props = new Map();
		object.animData = {};

		for (let c = 0; c < keys.length; c++) {
			const props = Object.keys(keys[c]).filter(x => x !== 'time');
			for (const deltaName of props) {
				// Ignore disabled property animators
				if (!keys[c][deltaName].enabled) continue;
				// create the new head
				/**@type {PropertyKeyFrame}*/
				const newProp = {
					name: deltaName,
					value: keys[c][deltaName].value,
					func: keys[c][deltaName].func,
					isColor: keys[c][deltaName].isColor,
					time: keys[c].time,
					enabled: true,
					next: this.#_props.get(deltaName),
				};
				// Link the old head to this new one
				if (newProp.next)
					newProp.next.prev = newProp;
				this.#_props.set(deltaName, newProp);
			}
		}
	}

	/**@returns {boolean}*/
	tick() {
		if (this.#_data.keys.length <= 1 || this.#_data.keys[0].time !== 0) return false;
		// Calculate the current time relative to the animation loop
		const time = (game.time.serverTime + this.offset) % this.duration;
		for (const value of this.#_props.values()) {
			if (value.next === null) continue;
			this.#_process(value, time);
		}
		return true;
	}

	/**
	 * @param {string} value
	 * @returns {number}
	 */
	#fromColorHex(value) {
		if (value[0] == '#')
			return parseInt(value.substring(1), 16);
		return parseInt(value, 16);
	}

	/**
	 * @param {number|string} value
	 * @returns {number}
	 */
	#_convert(value) {
		return typeof value === "string" ? this.#fromColorHex(value) : value;
	}

	/**
	 * @param {PropertyKeyFrame} prop
	 * @param {number} time
	 * @returns {void}
	 */
	#_process(prop, time) {
		let frame = prop;
		// Find the frame we are currently in
		while (!!frame.next && frame.next.time <= time) frame = frame.next;
		// Skip if the time has gone past the last key frame containing something to change here
		if (frame.time < time && !frame.next) return;
		// If our frame does not have a next, clamp the time to the current frame
		if (!frame.next)
			time = frame.time;
		// Collect the start value
		const startValue = this.#_convert(frame.value);
		// Collect the end value, if there is no next frame, use the current one
		const endValue = frame.time >= time ? this.#_convert(frame.value) : this.#_convert(frame.next.value);
		// Calculate the time factor (0-1) to be passed into the easing function
		let timeFactor = Math.clamp(frame.time >= time ? (time / frame.time) : ((time - frame.time) / (frame.next.time - frame.time)), 0, 1);
		// If the time calculation produces a NaN (which can happen), we just set it to 0 and move on
		if (isNaN(timeFactor))
			timeFactor = 0;
		if (this.#_data.bounce)
			timeFactor = timeFactor <= 0.5
				? timeFactor / 0.5
				: (0.5 - (timeFactor - 0.5)) / 0.5;
		// Calculate the value factor from the easing function
		const valueFactor = (frame.func ? EaseFunctions[frame.func] : EaseFunctions['linear'])(timeFactor);
		// Set the animation data for this property
		if (prop.isColor) {
			const r = ((startValue >> 16) & 0xff) + Math.round((((endValue >> 16) & 0xff) - ((startValue >> 16) & 0xff)) * valueFactor);
			const g = ((startValue >> 8) & 0xff) + Math.round((((endValue >> 8) & 0xff) - ((startValue >> 8) & 0xff)) * valueFactor);
			const b = (startValue & 0xff) + Math.round(((endValue & 0xff) - (startValue & 0xff)) * valueFactor);
			this.#_object.animData[prop.name] = '#' + ((r << 16) | (g << 8) | b).toString(16);
		} else {
			this.#_object.animData[prop.name] = startValue + ((endValue - startValue) * valueFactor);
		}
	}
}