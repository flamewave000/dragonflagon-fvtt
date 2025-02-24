import "../../fvtt-scripts/foundry";
import "../../fvtt-scripts/foundry-esm";

declare interface WallData {
	c: [number, number, number, number];
	dir: number;
	door: number;
	doorSound?: string;
	ds: number;
	flags: object;
	light: number;
	move: number;
	sight: number;
	sound: number;
	threshold: {
		light: number | null;
		sight: number | null;
		sound: number | null;
		attenuation: boolean;
	};
}
declare interface CurvyWallControl {
	title: string;
	icon: string;
	toggleable?: boolean;
	class?: string;
	isActive?: () => boolean;
	onClick: (enabled?: boolean) => void;
}

declare interface CurvyWallControlUI {
	name: string;
	title: string;
	icon: string;
	toggleable?: boolean;
	class?: string;
	isActive?: boolean;
}


declare interface CurvyWallsToolsOptions {
	tools: CurvyWallControlUI[];
	general: CurvyWallControlUI[];
	controls: CurvyWallControlUI[];
}

declare interface WallData {
	c: [number, number, number, number]
	light: number
	move: number
	sight: number
	sound: number
}

declare global {
	namespace PIXI {
		interface InteractionData {
			origin: PIXI.Point;
			destination: PIXI.Point;
		}
		class Point {
			x: number;
			y: number;
			constructor();
			constructor(x: number, y: number);
		}
	}
}