import '../../fvtt-scripts/foundry';
import ActiveLightConfig from './ActiveLightConfig.mjs';
import LightAnimator from './LightAnimator.mjs';

declare type EaseFunction = (x: number) => number;

declare interface EaseFunctionRegister {
	linear: EaseFunction;
	linearLoop: EaseFunction;
	quadIn: EaseFunction;
	quadOut: EaseFunction;
	quadFull: EaseFunction;
	quadLoop: EaseFunction;
	ellipseIn: EaseFunction;
	ellipseOut: EaseFunction;
	ellipseFull: EaseFunction;
	ellipseLoop: EaseFunction;
	fixedStart: EaseFunction;
	fixedEnd: EaseFunction;
}

declare interface AmbientLightDataExt extends Partial<AmbientLightDocument> {
	[key: string]: any;
	animation?: any;
	alpha?: number;
	darkness?: any;
	type?: any;
}
declare interface AmbientLightExt extends AmbientLight {
	animator?: LightAnimator;
	animData: AmbientLightDataExt;
	origData: AmbientLightDataExt;
	// document: AmbientLightDocument;
}
declare interface KeyFrame {
	[key: string]: PropertyDelta | number;
	time: number;
	angle: PropertyDelta;
	bright: PropertyDelta;
	dim: PropertyDelta;
	rotation: PropertyDelta;
	alpha: PropertyDelta;
	color: PropertyDelta;
}
declare interface PropertyDelta {
	value: number | string;
	enabled: boolean;
	func?: string;
	isColor?: boolean;
}
declare interface AnimatorData {
	offset: number;
	bounce: boolean;
	keys: KeyFrame[];
	manual: boolean;
	tempOffset?: number;
}
declare interface PropertyKeyFrame extends PropertyDelta {
	name: string;
	time: number;
	next?: PropertyKeyFrame;
	prev?: PropertyKeyFrame;
}

declare interface AmbientLightConfigExt extends foundry.applications.sheets.AmbientLightConfig {
	anims: ActiveLightConfig;
}