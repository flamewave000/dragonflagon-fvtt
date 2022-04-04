import SETTINGS from "../../common/Settings";


interface Option {
	type?: string;
	label: string;
	desc: string;
}

interface Config {
	circle: string;
	cone: string;
	rect: string;
	ray: string;
}

interface Data extends Config {
	options: Option[];
}

export enum HighlightMode {
	CENTER = 'center',
	TOUCH = 'touch',
	POINTS = 'points'
}

export class TemplateConfig extends FormApplication<any, Data> {
	private static readonly CONFIG_PREF = 'template-config';
	private static readonly PATCH_5E_PREF = "template-targeting-patch5e";
	private static readonly PATCH_5E_CIRCLE_PREF = "template-targeting-patch5e-circle";
	private static _options: Option[];
	private static get options(): Option[] {
		if (!this._options) {
			this._options = Object.entries<Option>((game.i18n.translations['DF_TEMPLATES'] as any)['TemplateConfig']['Options'])
				.map(x => {
					x[1].type = x[0];
					return x[1];
				});
		}
		return this._options;
	}

	static get defaultOptions(): FormApplication.Options {
		const options = mergeObject(super.defaultOptions, {
			resizable: false,
			submitOnChange: false,
			closeOnSubmit: true,
			editable: true,
			submitOnClose: false,
			width: 500,
			popOut: true,
			minimizable: false,
			title: 'DF_TEMPLATES.TemplateConfig.Title',
			template: 'modules/df-templates/templates/template-config.hbs'
		});
		return options;
	}

	static get config(): Config { return SETTINGS.get(this.CONFIG_PREF); }
	static get isNotDefault(): boolean {
		const config = this.config;
		return config.circle !== HighlightMode.CENTER
			|| config.cone !== HighlightMode.CENTER
			|| config.rect !== HighlightMode.CENTER
			|| config.ray !== HighlightMode.CENTER;
	}

	static init() {
		SETTINGS.register(this.PATCH_5E_PREF, {
			config: false,
			type: Boolean,
			default: false,
			scope: 'world'
		});
		SETTINGS.register(this.PATCH_5E_CIRCLE_PREF, {
			config: false,
			type: Boolean,
			default: false,
			scope: 'world'
		});

		const old5ePatch = SETTINGS.get<boolean>(this.PATCH_5E_PREF);
		const old5eCirclePatch = SETTINGS.get<boolean>(this.PATCH_5E_CIRCLE_PREF);

		SETTINGS.register<Config>(this.CONFIG_PREF, {
			config: false,
			scope: 'world',
			type: <any>Object,
			default: {
				circle: old5eCirclePatch ? HighlightMode.TOUCH : HighlightMode.CENTER,
				cone: old5ePatch ? HighlightMode.TOUCH : HighlightMode.CENTER,
				rect: old5ePatch ? HighlightMode.TOUCH : HighlightMode.CENTER,
				ray: old5ePatch ? HighlightMode.TOUCH : HighlightMode.CENTER
			},
			onChange: () => canvas.templates?.placeables.filter((t: MeasuredTemplate) => t.data.t === "circle")
				.forEach((t: MeasuredTemplate) => t.draw())
		});

		SETTINGS.registerMenu('template-config', {
			restricted: true,
			type: TemplateConfig,
			label: "DF_TEMPLATES.TemplateConfig.Title"
		});
	}

	getData(_options?: Partial<any>): Data | Promise<Data> {
		const data = mergeObject(TemplateConfig.config, {
			options: TemplateConfig.options
		});
		return data;
	}

	activateListeners(html: JQuery<HTMLElement>): void {
		html.find('#dfte-set-foundry').on('click', e => {
			e.preventDefault();
			html.find(`select[name="circle"]`).val(HighlightMode.CENTER);
			html.find(`select[name="cone"]`).val(HighlightMode.CENTER);
			html.find(`select[name="rect"]`).val(HighlightMode.CENTER);
			html.find(`select[name="ray"]`).val(HighlightMode.CENTER);
		});
		html.find('#dfte-set-dnd5e').on('click', e => {
			e.preventDefault();
			html.find(`select[name="circle"]`).val(HighlightMode.CENTER);
			html.find(`select[name="cone"]`).val(HighlightMode.TOUCH);
			html.find(`select[name="rect"]`).val(HighlightMode.TOUCH);
			html.find(`select[name="ray"]`).val(HighlightMode.TOUCH);
		});
		html.find('#cancel').on('click', e => {
			e.preventDefault();
			this.close();
		});
	}

	protected async _updateObject(_event: Event, formData?: any): Promise<void> {
		await SETTINGS.set(TemplateConfig.CONFIG_PREF, formData);
	}
}