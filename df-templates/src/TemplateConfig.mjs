/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../common/foundry.d.ts" />
/// <reference path="./types.d.ts" />
import SETTINGS from "../common/Settings.mjs";

/**
 * @readonly
 * @enum {string}
 */
export const HighlightMode = {
	CENTER: 'center',
	TOUCH: 'touch',
	POINTS: 'points'
};

export class TemplateConfig extends FormApplication {
	/**@readonly*/ static #CONFIG_PREF = 'template-config';
	/**@readonly*/ static #PATCH_5E_PREF = "template-targeting-patch5e";
	/**@readonly*/ static #PATCH_5E_CIRCLE_PREF = "template-targeting-patch5e-circle";
	/**@type {Option[]}*/ static #_options;
	/**@type {Option[]}*/ static get #options() {
		if (!this.#_options) {
			/**@type {Record<string, Option>}*/
			const root = (game.i18n.translations['DF_TEMPLATES'] ?? game.i18n._fallback['DF_TEMPLATES'])['TemplateConfig']['Options'];
			this.#_options = Object.keys(root).map(key => {
				root[key].type = key;
				return root[key];
			});
		}
		return this.#_options;
	}

	/**@type {FormApplicationOptions}*/
	static get defaultOptions() {
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

	/**@type {Config}*/
	static get config() { return SETTINGS.get(this.#CONFIG_PREF); }
	/**@type {boolean}*/
	static get isNotDefault() {
		const config = this.config;
		return config.circle !== HighlightMode.CENTER
			|| config.cone !== HighlightMode.CENTER
			|| config.rect !== HighlightMode.CENTER
			|| config.ray !== HighlightMode.CENTER;
	}

	static init() {
		SETTINGS.register(this.#PATCH_5E_PREF, {
			config: false,
			type: Boolean,
			default: false,
			scope: 'world'
		});
		SETTINGS.register(this.#PATCH_5E_CIRCLE_PREF, {
			config: false,
			type: Boolean,
			default: false,
			scope: 'world'
		});

		const old5ePatch = SETTINGS.get(this.#PATCH_5E_PREF);
		const old5eCirclePatch = SETTINGS.get(this.#PATCH_5E_CIRCLE_PREF);

		SETTINGS.register(this.#CONFIG_PREF, {
			config: false,
			scope: 'world',
			type: Object,
			default: {
				circle: old5eCirclePatch ? HighlightMode.TOUCH : HighlightMode.CENTER,
				cone: old5ePatch ? HighlightMode.TOUCH : HighlightMode.CENTER,
				rect: old5ePatch ? HighlightMode.TOUCH : HighlightMode.CENTER,
				ray: old5ePatch ? HighlightMode.TOUCH : HighlightMode.CENTER
			},
			onChange: () => canvas.templates?.placeables
				.filter((/**@type {MeasuredTemplate}*/t) => t.document.t === "circle")
				.forEach((/**@type {MeasuredTemplate}*/t) => t.draw())
		});

		SETTINGS.registerMenu('template-config', {
			restricted: true,
			type: TemplateConfig,
			label: "DF_TEMPLATES.TemplateConfig.Title"
		});
	}

	/**
	 * @param {*} [_options]
	 * @returns {Data | Promise<Data>}
	 */
	getData(_options) {
		const data = mergeObject(TemplateConfig.config, {
			options: TemplateConfig.#options
		});
		return data;
	}

	/**
	 * @param {JQuery<HTMLElement>} html
	 */
	activateListeners(html) {
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

	/**
	 * @protected
	 * @param {Event} _event
	 * @param {*} [formData]
	 * @returns {Promise<void>}
	 */
	async _updateObject(_event, formData) {
		await SETTINGS.set(TemplateConfig.#CONFIG_PREF, formData);
	}
}