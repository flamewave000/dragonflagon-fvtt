
declare interface Tool {
	name: string;
	title: string;
	icon: string;
	onClick?: Function;
	toggle?: boolean;
	active?: boolean;
}
declare interface Control {
	activeTool: string;
	icon: string;
	layer: string;
	name: string;
	title: string;
	tools: Tool[];
}


/// <reference path="../../node_modules/pixi.js/pixie.js.d.ts" />

declare namespace PIXI {
	declare interface InteractionData {
		origin: PIXI.Point;
		destination: PIXI.Point;
	}
}