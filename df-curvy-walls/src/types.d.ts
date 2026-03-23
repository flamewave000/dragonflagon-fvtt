import "../../fvtt-scripts/foundry.mjs";
import "../../common/libWrapper"
import "../../lib-df-buttons/src/ToolType";

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