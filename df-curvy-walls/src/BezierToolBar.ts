import { BezierControl, Mode } from "./BezierControl.js";
import { ToolMode } from "./tools/BezierTool.js";

export interface ToolUI {
	name: String
	title: String
	icon: String
	style?: String
	onClick?: (control: JQuery<HTMLButtonElement>) => void
	class?: String
	html?: String
}
export class BezierToolBar extends FormApplication {
	static get defaultOptions() {
		const options: Application.Options = {
			classes: ['form'],
			left: 98,
			popOut: false,
			template: 'modules/df-curvy-walls/templates/segment-controls.html',
			id: 'bezier-config',
			title: game.i18n.localize('Curvy Walls Options'),
		};
		(options as any)['editable'] = game.user.isGM;
		(options as any)['closeOnSubmit'] = false;
		(options as any)['submitOnChange'] = true;
		(options as any)['submitOnClose'] = true;
		return mergeObject(super.defaultOptions, options);
	}

	/** @override */
	activateListeners(html: JQuery<HTMLElement>) {
		super.activateListeners(html);
		// this.
		// html.find('.control-tool').each((self, index, element) {
		// 	this.
		// });
	}

	getData(options?: any): FormApplication.Data<any> {
		const tools: ToolUI[] = [{
			name: "bezierinc",
			title: "df-curvy-walls.increment",
			icon: "fas fa-plus",
			onClick: () => { BezierControl.instance.segments++ }
		}, {
			name: "bezierdec",
			title: "df-curvy-walls.decrement",
			icon: "fas fa-minus",
			onClick: () => { BezierControl.instance.segments-- }
		}, {
			name: "bezierapply",
			title: "df-curvy-walls.apply",
			icon: "fas fa-check",
			style: "display:none",
			onClick: () => { BezierControl.instance.apply() },
			class: "apply"
		}, {
			name: "beziercancel",
			title: "df-curvy-walls.cancel",
			icon: "fas fa-times",
			style: "display:none",
			onClick: () => { BezierControl.instance.clearTool() },
			class: "cancel"
		}];
		return { coreTools: tools, extraTools: BezierControl.instance.activeTool.getTools() } as any as FormApplication.Data<any>;
	}
	/**
	 * This method is called upon form submission after form data is validated
	 * @param event {Event}       The initial triggering submission event
	 * @private
	 */
	async _updateObject(event: any) {
		if (!event.submitter) return;
		const data = this.getData();
		const coreTools = ((data as any).coreTools as Array<ToolUI>);
		const extraTools = ((data as any).extraTools as Array<ToolUI>);
		coreTools.concat(...extraTools)
			.find(e => e.name === event.submitter.dataset.tool)
			.onClick($(event.submitter));
	}
}