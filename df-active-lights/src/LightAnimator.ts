import EaseFunctions from "./EaseFunctions";
import SETTINGS from "../../common/Settings";
import { AmbientLightData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";

interface AmbientLightDataExt extends Partial<AmbientLightData> {
	[key: string]: any;
	animation?: any;
	alpha?: number;
	darkness?: any;
	type?: any;
}

export declare class AmbientLightExt extends AmbientLight {
	animator?: LightAnimator;
	animData: AmbientLightDataExt;
	origData: AmbientLightDataExt;
}

export interface KeyFrame {
	[key: string]: PropertyDelta | number;
	time: number;
	angle: PropertyDelta;
	bright: PropertyDelta;
	dim: PropertyDelta;
	rotation: PropertyDelta;
	tintAlpha: PropertyDelta;
	tintColor: PropertyDelta;
}
export interface PropertyDelta {
	value: number | string;
	enabled: boolean;
	func?: string;
	isColor?: boolean;
}
export interface AnimatorData {
	offset: number;
	bounce: boolean;
	keys: KeyFrame[];
}

interface PropertyKeyFrame extends PropertyDelta {
	name: string;
	time: number;
	next?: PropertyKeyFrame;
	prev?: PropertyKeyFrame;
}

export class LightAnimator {
	static readonly FLAG_ANIMS = 'anims';

	static init() {
		libWrapper.register(SETTINGS.MOD_NAME, 'LightingLayer.prototype._animateSource', this._LightingLayer_animateSource, 'WRAPPER');
	}
	static ready() {
		libWrapper.register(SETTINGS.MOD_NAME, 'AmbientLight.prototype._onUpdate', function (this: AmbientLight, wrapped: (..._: any) => void, ...args: any) {
			wrapped(...args);
			delete (this as AmbientLightExt).animator;
		}, 'WRAPPER');
	}
	private static _LightingLayer_animateSource(this: LightingLayer, wrapper: (dt: number) => void, dt: number) {
		for (const source of this.sources) {
			if (!(source.object instanceof AmbientLight) || !source.active) continue;
			LightAnimator._PointSource_animate.bind(source)(<AmbientLightExt>source.object);
		}
		(canvas as any).perception.schedule({ lighting: { refresh: true }, sight: { refresh: true } });
		wrapper(dt);
	}
	private static _PointSource_animate(this: PointSource, light: AmbientLightExt) {
		try {
			// If the light has not had an animator created for it yet
			if (!light.animator) {
				// Get the animation data
				const animData: AnimatorData = (<any>this.object).document.getFlag(SETTINGS.MOD_NAME, LightAnimator.FLAG_ANIMS);
				// Ignore any light that has no animations
				if (!animData || animData.keys.length <= 1) return;
				if (animData.keys[0].time !== 0) {
					console.warn('Malformed first keyframe! Time was not 0, setting to zero for now.');
					animData.keys[0].time = 0;
				}
				// Create a light animator
				light.animator = new LightAnimator(light, animData);
			}
			// Update the animation state
			light.animator.tick();

			// hold onto the original data
			const origData = light.data;
			// Merge a duplicate of the original data with the modified animation data
			light.data = <AmbientLightData>mergeObject(duplicate(light.data), light.animData);
			// Update the light source with the new data
			LightAnimator._updateSource.bind(light)();
			// If we are on the LightingLayer, refresh the light's controls
			if ((<any>canvas).lighting._active)
				light.refresh();
			// Restore the original data
			light.data = origData;
		}
		// We catch all errors that might occur and print them to the console to
		// prevent them from propagating up and crashing the lighting system
		catch (e) {
			console.error(e);
		}
	}

	/**
	 * Update the point source object associated with this light
	 */
	private static _updateSource(this: AmbientLight) {
		// Update source data
		this.source.initialize(<PointSource.Data>{
			x: this.data.x,
			y: this.data.y,
			z: (<any>this).document.getFlag("core", "priority") || null,
			dim: this.dimRadius,
			bright: this.brightRadius,
			angle: this.data.config.angle,
			rotation: this.data.rotation,
			color: this.data.config.color,
			alpha: this.data.config.alpha,
			animation: this.data.config.animation,
			seed: (<any>this).document.getFlag("core", "animationSeed"),
			darkness: (<any>this).data.darkness
		});
		// Update the lighting layer sources
		if (!this.data.hidden) (<any>this).layer.sources.set(this.sourceId, this.source);
		else (<any>this).layer.sources.delete(this.sourceId);
	}

	private _data: AnimatorData;
	private _object: AmbientLightExt;
	private _props: Map<string, PropertyKeyFrame>;

	get offset() { return this._data.offset; }
	get duration() { return this._data.keys[this._data.keys.length - 1].time; }
	get keys() { return this._data.keys; }

	constructor(object: AmbientLightExt, data: AnimatorData) {
		this._data = data;
		this._object = object;
		data.keys.sort((a, b) => a.time < b.time ? -1 : 1);
		const keys = data.keys.slice(0).reverse();
		this._props = new Map<string, PropertyKeyFrame>();
		object.animData = {};

		for (let c = 0; c < keys.length; c++) {
			const props = Object.keys(keys[c]).filter(x => x !== 'time');
			for (const deltaName of props) {
				// Ignore disabled property animators
				if (!(<PropertyDelta>keys[c][deltaName]).enabled) continue;
				// create the new head
				const newProp: PropertyKeyFrame = {
					name: deltaName,
					value: (<PropertyDelta>keys[c][deltaName]).value,
					func: (<PropertyDelta>keys[c][deltaName]).func,
					isColor: (<PropertyDelta>keys[c][deltaName]).isColor,
					time: keys[c].time,
					enabled: true,
					next: this._props.get(deltaName),
				};
				// Link the old head to this new one
				if (newProp.next)
					newProp.next.prev = newProp;
				this._props.set(deltaName, newProp);
			}
		}
	}

	tick() {
		if (this._data.keys.length <= 1 || this._data.keys[0].time !== 0) return;
		// Calculate the current time relative to the animation loop
		const time = (game.time.serverTime + this.offset) % this.duration;
		for (const value of this._props.values()) {
			if (value.next === null) continue;
			this._process(value, time);
		}
	}

	private _convert(value: number | string): number {
		return typeof value === "string" ? foundry.utils.colorStringToHex(value) : value;
	}

	private _process(prop: PropertyKeyFrame, time: number) {
		let frame = prop;
		// Find the frame we are currently in
		while (!!frame.next && frame.next.time <= time) frame = frame.next;
		// Skip if the time has gone past the last key frame containing something to change here
		if (frame.time < time && !frame.next) return;
		// Collect the start value
		const startValue = this._convert(frame.value);
		// Collect the end value
		const endValue = frame.time > time ? this._convert(frame.value) : this._convert(frame.next.value);
		// Calculate the time factor (0-1) to be passed into the easing function
		let timeFactor = Math.clamped(frame.time > time ? (time / frame.time) : ((time - frame.time) / (frame.next.time - frame.time)), 0, 1);
		if (this._data.bounce)
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
			this._object.animData[prop.name] = '#' + ((r << 16) | (g << 8) | b).toString(16);
		} else
			this._object.animData[prop.name] = startValue + ((endValue - startValue) * valueFactor);
	}
}