/// <reference path="./types.d.ts" />
import { CurvyWallToolManager, Mode } from './CurvyWallToolManager.mjs';
import SETTINGS from "../common/Settings.mjs";
import { ToolMode } from './tools/BezierTool.mjs';

export class CurvyWallsToolBar extends Application {
	static init() {
		Hooks.on('getModuleToolGroups', (/**@type {ControlManager}*/controlManager, /**@type {ToolGroup[]}*/groups) => {
			groups.push(
				{
					name: SETTINGS.MOD_NAME,
					icon: '<i class="fas fa-bezier-curve"></i>',
					title: 'Curvy Walls Tools',
					visible: () => {
						return ui.controls.activeControl === 'walls';
					},
					tools: [
						{
							name: 'cubic',
							title: "df-curvy-walls.cubic",
							icon: '<i class="fas fa-bezier-curve"></i>',
							toggle: true,
							isActive: () => CurvyWallToolManager.instance.mode === Mode.Cube,
							onClick: active => { CurvyWallToolManager.instance.mode = active ? Mode.Cube : Mode.None; }
						},
						{
							name: 'quadratic',
							title: "df-curvy-walls.quadratic",
							icon: '<i class="fas fa-project-diagram"></i>',
							toggle: true,
							isActive: () => CurvyWallToolManager.instance.mode === Mode.Quad,
							onClick: active => { CurvyWallToolManager.instance.mode = active ? Mode.Quad : Mode.None; }
						},
						{
							name: 'circle',
							title: "df-curvy-walls.circle",
							icon: '<i class="fas fa-circle"></i>',
							toggle: true,
							isActive: () => CurvyWallToolManager.instance.mode === Mode.Circ,
							onClick: active => { CurvyWallToolManager.instance.mode = active ? Mode.Circ : Mode.None; }
						},
						{
							name: 'rectangle',
							title: "df-curvy-walls.rectangle",
							icon: '<i class="fas fa-vector-square"></i>',
							toggle: true,
							isActive: () => CurvyWallToolManager.instance.mode === Mode.Rect,
							onClick: active => { CurvyWallToolManager.instance.mode = active ? Mode.Rect : Mode.None; }
						}
					]
				}
			);
		});
	}

	/** @readonly */static PREF_PRESERVE = 'preserve-tool';

	/**@type {ApplicationOptions}*/
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			popOut: false,
			template: 'modules/df-curvy-walls/templates/curvy-walls-controls.hbs'
		});
	}

	#_closing = false;

	/**@type {Record<string, CurvyWallControl>}*/#_tools = {
		beziercube: {
			title: "df-curvy-walls.cubic",
			icon: "fas fa-bezier-curve",
			isActive: function () { return CurvyWallToolManager.instance.mode == Mode.Cube; },
			onClick: function () { return CurvyWallToolManager.instance.mode = this.isActive() ? Mode.None : Mode.Cube; }
		},
		bezierquad: {
			title: "df-curvy-walls.quadratic",
			icon: "fas fa-project-diagram",
			isActive: function () { return CurvyWallToolManager.instance.mode == Mode.Quad; },
			onClick: function () { return CurvyWallToolManager.instance.mode = this.isActive() ? Mode.None : Mode.Quad; }
		},
		beziercirc: {
			title: "df-curvy-walls.circle",
			icon: "fas fa-circle",
			isActive: function () { return CurvyWallToolManager.instance.mode == Mode.Circ; },
			onClick: function () { return CurvyWallToolManager.instance.mode = this.isActive() ? Mode.None : Mode.Circ; }
		},
		bezierrect: {
			title: "df-curvy-walls.rectangle",
			icon: "fas fa-vector-square",
			isActive: function () { return CurvyWallToolManager.instance.mode == Mode.Rect; },
			onClick: function () { return CurvyWallToolManager.instance.mode = this.isActive() ? Mode.None : Mode.Rect; }
		}
	};
	/**@type {Record<string, CurvyWallControl>}*/
	#_generalControls = {
		increment: {
			title: 'df-curvy-walls.increment',
			icon: 'fas fa-plus',
			onClick: () => CurvyWallToolManager.instance.segments++
		},
		decrement: {
			title: 'df-curvy-walls.decrement',
			icon: 'fas fa-minus',
			onClick: () => CurvyWallToolManager.instance.segments--
		},
		apply: {
			title: 'df-curvy-walls.apply',
			icon: 'fas fa-check',
			class: 'apply',
			onClick: CurvyWallToolManager.instance.apply.bind(CurvyWallToolManager.instance)
		},
		cancel: {
			title: 'df-curvy-walls.cancel',
			icon: 'fas fa-times',
			class: 'cancel',
			onClick: CurvyWallToolManager.instance.clearTool.bind(CurvyWallToolManager.instance)
		}
	};
	/**@type {Record<string, CurvyWallControl>}*/
	#_placementControls = {
		pointconstruct: {
			title: 'df-curvy-walls.trace_curve_with_points',
			icon: 'fas fa-route',
			toggleable: true,
			isActive: () => CurvyWallToolManager.instance.currentlyMappingPoints,
			onClick: () => {
				CurvyWallToolManager.instance.togglePointMapping();
				this.render(false);
			}
		},
		applyplacement: {
			title: 'df-curvy-walls.pointmapapply',
			icon: 'fas fa-check',
			class: 'apply',
			onClick: () => { CurvyWallToolManager.instance.applyPointMapping(); }
		}
	};

	/**
	 * @param {ApplicationOptions} [options]
	 */
	constructor(options) {
		super(options);
		CurvyWallToolManager.instance.setModeListener(() => {
			if (this.#_closing) {
				this.#_closing = false;
				return;
			}
			this.render(false);
		});
	}

	/**
	 * @returns {CurvyWallsToolsOptions}
	 */
	getData() {
		const toolIsPlaced = CurvyWallToolManager.instance.mode != Mode.None && CurvyWallToolManager.instance.activeTool.mode != ToolMode.NotPlaced;
		const toolControls = CurvyWallToolManager.instance.activeTool?.getTools();
		/**@type {CurvyWallControlUI[]}*/
		const placementControls = [{
			name: 'pointconstruct',
			title: this.#_placementControls.pointconstruct.title,
			icon: this.#_placementControls.pointconstruct.icon,
			class: this.#_placementControls.pointconstruct.class,
			toggleable: true,
			isActive: this.#_placementControls.pointconstruct.isActive()
		}];
		if (CurvyWallToolManager.instance.currentlyMappingPoints && CurvyWallToolManager.instance.canApplyPointMapping) {
			placementControls.push({
				name: 'applyplacement',
				title: this.#_placementControls.applyplacement.title,
				icon: this.#_placementControls.applyplacement.icon,
				class: this.#_placementControls.applyplacement.class
			});
		}

		/**@type {CurvyWallsToolsOptions}*/
		const data = {
			tools: Object.keys(this.#_tools).map(it => {
				return {
					name: it,
					title: this.#_tools[it].title,
					icon: this.#_tools[it].icon,
					toggleable: true,
					isActive: this.#_tools[it].isActive()
				};
			}),
			general: toolIsPlaced ? Object.keys(this.#_generalControls).map(it => {
				return {
					name: it,
					title: this.#_generalControls[it].title,
					icon: this.#_generalControls[it].icon,
					class: this.#_generalControls[it].class
				};
			}) : [Mode.Quad, Mode.Circ, Mode.Rect].includes(CurvyWallToolManager.instance.mode) ? placementControls : [],
			controls: toolIsPlaced && !!toolControls ? Object.keys(toolControls).map(it => {
				return {
					name: it,
					title: toolControls[it].title,
					icon: toolControls[it].icon,
					class: toolControls[it].class,
					toggleable: toolControls[it].toggleable,
					isActive: toolControls[it].toggleable ? toolControls[it].isActive() : undefined
				};
			}) : []
		};

		return data;
	}

	/**
	 * @param {JQuery<HTMLElement>} html
	 */
	activateListeners(html) {
		const toolbarPosition = game.settings.get('lib-df-buttons', 'position');
		switch (toolbarPosition) {
			case 'top':
				html.remove();
				$(document.querySelector('#moduleControls')).append(html);
				html.css('position', 'unset');
				break;
			case 'left':
				html.remove();
				$(document.querySelector('#moduleControls')).append(html);
				html.css('top', '0');
				html.css('left', '46px');
				break;
			case 'right':
			case 'bottom':
				html.remove();
				$(document.querySelector('body')).append(html);
				html.css('left', (ui.moduleControls.getLeftWidth() + 5) + 'px');
				html.css('top', ui.moduleControls.getTopHeight(true) + 'px');
				break;
		}
		html.find('li').on("click", (/**@type {JQuery.ClickEvent}*/event) => {
			const element = $(event.currentTarget);
			const name = element.attr('data-tool');

			const tool = this.#_tools[name];
			if (tool !== undefined) {
				tool.onClick();
				return;
			}

			const generalControl = this.#_generalControls[name];
			if (generalControl !== undefined) generalControl.onClick();

			const placementControl = this.#_placementControls[name];
			if (placementControl !== undefined) placementControl.onClick();

			const toolControl = CurvyWallToolManager.instance.activeTool?.getTools()[name];
			if (toolControl !== undefined) {
				if (!toolControl.toggleable) toolControl.onClick();
				else toolControl.onClick(!toolControl.isActive());
			}

			this.render(false);
		});
	}

	/**
	 * @param {Application.CloseOptions} [options]
	 * @returns {Promise<void>}
	 */
	close(options) {
		if (!SETTINGS.get(CurvyWallsToolBar.PREF_PRESERVE)) {
			this.#_closing = true;
			CurvyWallToolManager.instance.mode = Mode.None;
		}
		return super.close(options);
	}
}