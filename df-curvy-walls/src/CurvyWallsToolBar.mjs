/// <reference path="./types.d.ts" />
import { CurvyWallToolManager, Mode } from './CurvyWallToolManager.mjs';
import SETTINGS from "../common/Settings.mjs";
import { ToolMode } from './tools/BezierTool.mjs';

export default class CurvyWallsToolBar {
	/** @readonly */static PREF_PRESERVE = 'preserve-tool';

	static init() {
		Hooks.on('getModuleTools', (/**@type {ControlManager}*/_, /**@type {Record<String, Tool>}*/tools) => {
			const enabled = () => ui.controls.control.name === 'walls';
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
			};
			/**@type {ToolSet}*/
			const generalControls = {};
			tools.df_curvy_walls_none = {
				enabled,
				hidden: true,
				tools: generalControls
			};

			generalControls.increment = {
				title: 'df-curvy-walls.increment',
				icon: 'fas fa-plus',
				type: 'button',
				enabled: CurvyWallsToolBar.#toolIsPlaced,
				onClick: () => CurvyWallToolManager.instance.segments++
			};
			generalControls.decrement = {
				title: 'df-curvy-walls.decrement',
				icon: 'fas fa-minus',
				type: 'button',
				enabled: CurvyWallsToolBar.#toolIsPlaced,
				onClick: () => CurvyWallToolManager.instance.segments--
			};
			generalControls.apply = {
				title: 'df-curvy-walls.apply',
				icon: 'fas fa-check',
				class: 'apply',
				type: 'button',
				class: 'dfcw apply',
				enabled: CurvyWallsToolBar.#toolIsPlaced,
				onClick: CurvyWallToolManager.instance.apply.bind(CurvyWallToolManager.instance)
			};
			generalControls.cancel = {
				title: 'df-curvy-walls.cancel',
				icon: 'fas fa-times',
				class: 'cancel',
				type: 'button',
				class: 'dfcw cancel',
				enabled: CurvyWallsToolBar.#toolIsPlaced,
				onClick: CurvyWallToolManager.instance.clearTool.bind(CurvyWallToolManager.instance)
			};
			generalControls.point_map = {
				title: 'df-curvy-walls.trace_curve_with_points',
				icon: 'fas fa-route',
				type: 'toggle',
				enabled: () => [Mode.Circ, Mode.Quad, Mode.Rect].includes(CurvyWallToolManager.instance.mode) && CurvyWallToolManager.instance.activeTool.mode == ToolMode.NotPlaced,
				isActive: () => CurvyWallToolManager.instance.currentlyMappingPoints,
				onClick: () => CurvyWallToolManager.instance.togglePointMapping()
			};
			generalControls.apply_points = {
				title: 'df-curvy-walls.pointmapapply',
				icon: 'fas fa-check',
				class: 'apply',
				type: 'button',
				class: 'dfcw apply',
				enabled: () => CurvyWallToolManager.instance.currentlyMappingPoints && CurvyWallToolManager.instance.canApplyPointMapping,
				onClick: () => CurvyWallToolManager.instance.applyPointMapping()
			};
			const toolControls = CurvyWallToolManager.instance.activeTool?.getTools();
			const activeToolMode = CurvyWallToolManager.instance.mode;
			for (const [_, tool] of Object.entries(toolControls ?? {})) {
				if (tool.enabled) continue;
				tool.enabled = () => CurvyWallToolManager.instance.mode === activeToolMode && CurvyWallToolManager.instance.activeTool?.mode === ToolMode.Placed;
			}
			generalControls.tool_controls = {
				hidden: true,
				tools: toolControls
			};
		});

		CurvyWallToolManager.instance.setModeListener((mode, toolMode) => {
			if (this.#prevToolMode === toolMode) return;
			if (toolMode === ToolMode.Placed || this.#prevToolMode === ToolMode.Placed)
				Hooks.callAll('reloadModuleButtons');
			else
				Hooks.callAll('refreshModuleButtons');
			this.#prevToolMode = toolMode ?? 0;
		});
		CurvyWallToolManager.instance.pointMapper.onchange = () => Hooks.callAll('refreshModuleButtons');
	}

	static #prevToolMode = 0;

	static #toolIsPlaced() {
		return CurvyWallToolManager.instance.mode != Mode.None && CurvyWallToolManager.instance.activeTool.mode != ToolMode.NotPlaced;
	}
}