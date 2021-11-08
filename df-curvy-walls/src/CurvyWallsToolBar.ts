
import { CurvyWallToolManager, Mode } from './CurvyWallToolManager';
import SETTINGS from "../../common/SETTINGS";
import { ToolMode } from './tools/BezierTool';

export interface CurvyWallControl {
	title: string;
	icon: string;
	toggleable?: boolean;
	class?: string;
	isActive?: () => boolean;
	onClick: (enabled?: boolean) => void;
}
interface CurvyWallControlUI {
	name: string;
	title: string;
	icon: string;
	toggleable?: boolean;
	class?: string;
	isActive?: boolean;
}
interface CurvyWallsToolsOptions {
	tools: CurvyWallControlUI[];
	general: CurvyWallControlUI[];
	controls: CurvyWallControlUI[];
}

export class CurvyWallsToolBar extends Application {
	static readonly PREF_PRESERVE = 'preserve-tool';

	static get defaultOptions(): Application.Options {
		return <Application.Options>mergeObject<Partial<Application.Options>>(
			super.defaultOptions,
			{
				popOut: false,
				template: 'modules/df-curvy-walls/templates/curvy-walls-controls.hbs'
			}
		);
	}

	private _closing = false;

	private _tools: Record<string, CurvyWallControl> = {
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
	}
	private _generalControls: Record<string, CurvyWallControl> = {
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
	}
	private _placementControls: Record<string, CurvyWallControl> = {
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
	}

	constructor(options?: Application.Options) {
		super(options);
		CurvyWallToolManager.instance.setModeListener(() => {
			if (this._closing) {
				this._closing = false;
				return;
			}
			this.render(false)
		});
	}

	getData(options?: Application.RenderOptions): CurvyWallsToolsOptions {
		const toolIsPlaced = CurvyWallToolManager.instance.mode != Mode.None && CurvyWallToolManager.instance.activeTool.mode != ToolMode.NotPlaced
		const toolControls = CurvyWallToolManager.instance.activeTool?.getTools();
		const placementControls: CurvyWallControlUI[] = [{
			name: 'pointconstruct',
			title: this._placementControls.pointconstruct.title,
			icon: this._placementControls.pointconstruct.icon,
			class: this._placementControls.pointconstruct.class,
			toggleable: true,
			isActive: this._placementControls.pointconstruct.isActive()
		}];
		if (CurvyWallToolManager.instance.currentlyMappingPoints && CurvyWallToolManager.instance.canApplyPointMapping)
			placementControls.push({
				name: 'applyplacement',
				title: this._placementControls.applyplacement.title,
				icon: this._placementControls.applyplacement.icon,
				class: this._placementControls.applyplacement.class
			});

		const data: CurvyWallsToolsOptions = {
			tools: Object.keys(this._tools).map(it => {
				return {
					name: it,
					title: this._tools[it].title,
					icon: this._tools[it].icon,
					toggleable: true,
					isActive: this._tools[it].isActive()
				}
			}),
			general: toolIsPlaced ? Object.keys(this._generalControls).map(it => {
				return {
					name: it,
					title: this._generalControls[it].title,
					icon: this._generalControls[it].icon,
					class: this._generalControls[it].class
				}
			}) : [Mode.Quad, Mode.Circ, Mode.Rect].includes(CurvyWallToolManager.instance.mode) ? placementControls : [],
			controls: toolIsPlaced && !!toolControls ? Object.keys(toolControls).map(it => {
				return {
					name: it,
					title: toolControls[it].title,
					icon: toolControls[it].icon,
					class: toolControls[it].class,
					toggleable: toolControls[it].toggleable,
					isActive: !!toolControls[it].toggleable ? toolControls[it].isActive() : undefined
				}
			}) : []
		};

		return data;
	}

	activateListeners(html: JQuery<HTMLElement>) {
		if ((<any>window).buttonOverflow !== undefined) {
			const align = () => {
				const layersHeight = $("ol#controls").height();
				const controlsHeight = $('ol#controls>li[data-control="walls"]>ol').height();
				const layerCount = document.querySelector("ol#controls").childElementCount;
				const controlCount = document.querySelector('ol#controls>li[data-control="walls"]>ol').childElementCount;
				const layers = Math.ceil(((layerCount - ((<any>window).buttonOverflow.hiddenButtons || 0)) / layersHeight) * 46) * 46 + 10;
				const controls = Math.ceil((controlCount / controlsHeight) * 46) * 46;
				// document.body.style.setProperty("--playerlist-offset", `${layers}px`);
				html.css('left', `${layers + controls}px`);
			}
			window.addEventListener("resize", align);
			align();
		}
		html.find('li').on("click", (event: JQuery.ClickEvent) => {
			const element = $(event.currentTarget);
			const name = element.attr('data-tool');

			const tool = this._tools[name];
			if (tool !== undefined) {
				tool.onClick();
				return;
			}

			const generalControl = this._generalControls[name];
			if (generalControl !== undefined) generalControl.onClick();

			const placementControl = this._placementControls[name];
			if (placementControl !== undefined) placementControl.onClick();

			const toolControl = CurvyWallToolManager.instance.activeTool?.getTools()[name];
			if (toolControl !== undefined) {
				if (!toolControl.toggleable) toolControl.onClick()
				else toolControl.onClick(!toolControl.isActive())
			}

			this.render(false);
		});
	}

	close(options?: Application.CloseOptions): Promise<unknown> {
		if (!SETTINGS.get(CurvyWallsToolBar.PREF_PRESERVE)) {
			this._closing = true;
			CurvyWallToolManager.instance.mode = Mode.None;
		}
		return super.close(options)
	}
}