/// <reference path="./types.d.ts" />
import { CurvyWallToolManager, Mode } from './CurvyWallToolManager.mjs';
import SETTINGS from "../common/Settings.mjs";
import { ToolMode } from './tools/BezierTool.mjs';

export default class CurvyWallsToolBar {
	/** @readonly */static PREF_PRESERVE = 'preserve-tool';

	static init() {
		Hooks.on('getModuleTools', (/**@type {ControlManager}*/_, /**@type {Record<String, Tool>}*/tools) => {
			const enabled = () => ui.controls.control.name === 'walls';
			tools.df_curvy_walls_none = {
				title: "df-curvy-walls.cubic",
				icon: 'fas fa-expand',
				enabled,
				hidden: true,
				tools: CurvyWallsToolBar.#_generalControls,
				isActive: () => CurvyWallToolManager.instance.mode === Mode.Cube,
				onClick: active => { CurvyWallToolManager.instance.mode = active ? Mode.Cube : Mode.None; }
			};
			tools.df_curvy_walls_cubic = {
				title: "df-curvy-walls.cubic",
				icon: 'fas fa-bezier-curve',
				type: 'toggle',
				enabled,
				isActive: () => CurvyWallToolManager.instance.mode === Mode.Cube,
				onClick: active => { CurvyWallToolManager.instance.mode = active ? Mode.Cube : Mode.None; }
			};
			tools.df_curvy_walls_quadratic = {
				title: "df-curvy-walls.quadratic",
				icon: 'fas fa-project-diagram',
				type: 'toggle',
				enabled,
				isActive: () => CurvyWallToolManager.instance.mode === Mode.Quad,
				onClick: active => { CurvyWallToolManager.instance.mode = active ? Mode.Quad : Mode.None; }
			};
			tools.df_curvy_walls_circle = {
				title: "df-curvy-walls.circle",
				icon: 'fas fa-circle',
				type: 'toggle',
				enabled,
				isActive: () => CurvyWallToolManager.instance.mode === Mode.Circ,
				onClick: active => { CurvyWallToolManager.instance.mode = active ? Mode.Circ : Mode.None; }
			};
			tools.df_curvy_walls_rectangle = {
				title: "df-curvy-walls.rectangle",
				icon: 'fas fa-vector-square',
				type: 'toggle',
				enabled,
				isActive: () => CurvyWallToolManager.instance.mode === Mode.Rect,
				onClick: active => { CurvyWallToolManager.instance.mode = active ? Mode.Rect : Mode.None; }
			}
		});
	}

	/**@type {ToolSet}*/
	static #_generalControls = {
		increment: {
			title: 'df-curvy-walls.increment',
			icon: 'fas fa-plus',
			enabled: CurvyWallsToolBar.#toolIsPlaced,
			onClick: () => CurvyWallToolManager.instance.segments++
		},
		decrement: {
			title: 'df-curvy-walls.decrement',
			icon: 'fas fa-minus',
			enabled: CurvyWallsToolBar.#toolIsPlaced,
			onClick: () => CurvyWallToolManager.instance.segments--
		},
		apply: {
			title: 'df-curvy-walls.apply',
			icon: 'fas fa-check',
			class: 'apply',
			enabled: CurvyWallsToolBar.#toolIsPlaced,
			onClick: CurvyWallToolManager.instance.apply.bind(CurvyWallToolManager.instance)
		},
		cancel: {
			title: 'df-curvy-walls.cancel',
			icon: 'fas fa-times',
			class: 'cancel',
			enabled: CurvyWallsToolBar.#toolIsPlaced,
			onClick: CurvyWallToolManager.instance.clearTool.bind(CurvyWallToolManager.instance)
		},
		point_map: {
			title: 'df-curvy-walls.trace_curve_with_points',
			icon: 'fas fa-route',
			type: 'toggle',
			enabled: () => CurvyWallToolManager.instance.mode != Mode.None && CurvyWallToolManager.instance.activeTool.mode == ToolMode.NotPlaced,
			isActive: () => CurvyWallToolManager.instance.currentlyMappingPoints,
			onClick: () => CurvyWallToolManager.instance.togglePointMapping()
		},
		apply_points: {
			title: 'df-curvy-walls.pointmapapply',
			icon: 'fas fa-check',
			class: 'apply',
			type: 'button',
			enabled: () => CurvyWallToolManager.instance.currentlyMappingPoints && CurvyWallToolManager.instance.canApplyPointMapping,
			onClick: () => CurvyWallToolManager.instance.applyPointMapping()
		}
	};

	static #toolIsPlaced() {
		return CurvyWallToolManager.instance.mode != Mode.None && CurvyWallToolManager.instance.activeTool.mode != ToolMode.NotPlaced;
	}
		

	// /**
	//  * @returns {CurvyWallsToolsOptions}
	//  */
	// getData() {
	// 	const toolIsPlaced = CurvyWallToolManager.instance.mode != Mode.None && CurvyWallToolManager.instance.activeTool.mode != ToolMode.NotPlaced;
	// 	const toolControls = CurvyWallToolManager.instance.activeTool?.getTools();
	// 	/**@type {CurvyWallControlUI[]}*/
	// 	const placementControls = [{
	// 		name: 'pointconstruct',
	// 		title: this.#_placementControls.pointconstruct.title,
	// 		icon: this.#_placementControls.pointconstruct.icon,
	// 		class: this.#_placementControls.pointconstruct.class,
	// 		toggleable: true,
	// 		isActive: this.#_placementControls.pointconstruct.isActive()
	// 	}];
	// 	if (CurvyWallToolManager.instance.currentlyMappingPoints && CurvyWallToolManager.instance.canApplyPointMapping) {
	// 		placementControls.push({
	// 			name: 'applyplacement',
	// 			title: this.#_placementControls.applyplacement.title,
	// 			icon: this.#_placementControls.applyplacement.icon,
	// 			class: this.#_placementControls.applyplacement.class
	// 		});
	// 	}

	// 	/**@type {CurvyWallsToolsOptions}*/
	// 	const data = {
	// 		tools: Object.keys(this.#_tools).map(it => {
	// 			return {
	// 				name: it,
	// 				title: this.#_tools[it].title,
	// 				icon: this.#_tools[it].icon,
	// 				toggleable: true,
	// 				isActive: this.#_tools[it].isActive()
	// 			};
	// 		}),
	// 		general: toolIsPlaced ? Object.keys(this.#_generalControls).map(it => {
	// 			return {
	// 				name: it,
	// 				title: this.#_generalControls[it].title,
	// 				icon: this.#_generalControls[it].icon,
	// 				class: this.#_generalControls[it].class
	// 			};
	// 		}) : [Mode.Quad, Mode.Circ, Mode.Rect].includes(CurvyWallToolManager.instance.mode) ? placementControls : [],
	// 		controls: toolIsPlaced && !!toolControls ? Object.keys(toolControls).map(it => {
	// 			return {
	// 				name: it,
	// 				title: toolControls[it].title,
	// 				icon: toolControls[it].icon,
	// 				class: toolControls[it].class,
	// 				toggleable: toolControls[it].toggleable,
	// 				isActive: toolControls[it].toggleable ? toolControls[it].isActive() : undefined
	// 			};
	// 		}) : []
	// 	};

	// 	return data;
	// }
}