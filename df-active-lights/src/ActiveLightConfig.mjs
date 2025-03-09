/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../common/foundry.d.ts" />
/// <reference path="./types.d.ts" />
import SETTINGS from "../common/Settings.mjs";
import LightAnimator from "./LightAnimator.mjs";

export default class ActiveLightConfig extends Application {
	static ready() {
		if (game.user.isGM)
			Hooks.on('renderAmbientLightConfig', this.#_renderAmbientLightConfig);
	}

	/**
	 * @param {import("./types").AmbientLightConfigExt} config
	 * @param {JQuery<HTMLElement} html
	 * @returns {void}
	 */
	static #_renderAmbientLightConfig(config, html) {
		if (!(config.document instanceof AmbientLightDocument)) return;
		if (!config.anims) {
			config.anims = new ActiveLightConfig(config);
		}
		config.anims._inject(html);
		config.element[0].style.height = '';
		config.setPosition({});
	}

	/** @type {ApplicationOptions} */
	static get defaultOptions() {
		return foundry.utils.mergeObject(Application.defaultOptions, {
			template: `modules/${SETTINGS.MOD_NAME}/templates/active-light-config.hbs`,
			width: 600,
			resizable: false,
			height: 465,
		});
	}

	/**@type {AmbientLightDocument}*/ #_document;
	/**@type {AnimatorData}*/ #_data;

	/**
	 * @param {AmbientLightConfigExt} app
	 */
	constructor(app) {
		const document = app.document;
		super({
			id: document.id + '-anims',
			title: game.i18n.localize('DF_ACTIVE_LIGHTS.Config.Title') + document.id,
		});
		this.#_document = document;
		this.#_data = document.getFlag(SETTINGS.MOD_NAME, LightAnimator.FLAG_ANIMS);
		if (!this.#_data) {
			this.#_data = {
				bounce: false,
				offset: 0,
				keys: [ActiveLightConfig.#_createKeyFrame(0, document.data)]
			};
		} else this.#_data = foundry.utils.duplicate(this.#_data);

		//? When the light config closes it overwrites the current light preview.
		//? This just makes sure the active light animation is refreshed as well.
		const orig_reset = app._resetPreview;
		app._resetPreview = () => {
			orig_reset.apply(app);
			this.#_save();
		};
	}

	/**
	 * @param {object} [_options]
	 * @returns {any}
	 */
	getData(_options) {
		return {
			bounce: this.#_data.bounce,
			offset: this.#_data.offset === 0 ? '' : this.#_data.offset
		};
	}

	/**@param {HTMLElement} html*/
	_inject(html) {
		const animConfigButton = $(`<button type="button" style="margin:0.25em 0" name="anim-config"><i class="fas fa-cogs"></i> ${game.i18n.localize('DF_ACTIVE_LIGHTS.Config.OpenButton')}</button>`);
		animConfigButton.on('click', (e) => {
			e.preventDefault();
			if (this._state === Application.RENDER_STATES.RENDERED)
				this.bringToTop();
			else
				this.render(true);
		});
		html.querySelector('section[data-tab="animation"]>fieldset').appendChild(animConfigButton[0]);
	}

	/**
	 * @param {number} time
	 * @param {import("./types").AmbientLightDataExt} [data]
	 * @returns {import("./types").KeyFrame}
	 */
	static #_createKeyFrame(time, data) {
		return {
			time,
			angle: { enabled: false, value: data?.config?.angle ?? 0 },
			bright: { enabled: false, value: data?.config?.bright ?? 0 },
			dim: { enabled: false, value: data?.config?.dim ?? 0 },
			rotation: { enabled: false, value: data?.rotation ?? 0 },
			tintAlpha: { enabled: false, value: data?.config?.alpha ?? 0 },
			tintColor: { enabled: false, value: data?.config?.color ?? '#000000', isColor: true }
		};
	}

	/**@param {JQuery<HTMLElement>} html*/
	async activateListeners(html) {
		/**@type {JQuery<HTMLElement>}*/ const propContainer = html.find('main>section');
		/**@type {JQuery<HTMLOListElement>}*/ const keysContainer = html.find('aside>ol');

		// Listen for changes to the Bounce and Offset fields
		html.find('input[name="bounce"]').on('change', (e) => {
			this.#_data.bounce = /** @type {HTMLInputElement}*/(e.currentTarget).checked;
			this.#_save();
		});
		html.find('input[name="offset"]').on('change', (e) => {
			this.#_data.offset = /**@type {HTMLInputElement}*/ (e.currentTarget).valueAsNumber;
			this.#_save();
		});

		// Listen for Add KeyFrame button
		html.find('button[name="add-keyframe"]').on('click', async () => {
			this.#_data.keys[this.#_data.keys.length - 1].time;
			// Create KeyFrame and set time to Duration + 1
			const keyFrame = ActiveLightConfig.#_createKeyFrame(this.#_data.keys[this.#_data.keys.length - 1].time + 1000);
			// Add new Key Frame to the keys list
			this.#_data.keys.push(keyFrame);
			// Append a new KeyFrame element to the UI
			await this.#_appendKeyFrame(propContainer, keysContainer, keyFrame);
			// Save the new data structure
			await this.#_save();
		});

		// Inject all the keyframe buttons
		for (const key of this.#_data.keys.slice(1)) {
			await this.#_appendKeyFrame(propContainer, keysContainer, key);
		}

		$(html.find('aside>ol>li')[0]).on('click', async e => {
			if (e.currentTarget.classList.contains('active')) return;
			keysContainer.find('li.active').removeClass('active');
			e.currentTarget.classList.add('active');
			await this.#_loadDataForKeyFrame(propContainer, keysContainer, this.#_data.keys[$(e.currentTarget).index()], $(e.currentTarget).index() === 0);
		});

		// Activate the first keyframe
		this.#_loadDataForKeyFrame(propContainer, keysContainer, this.#_data.keys[0], true);
	}

	/**
	 * @param {JQuery<HTMLElement>} propContainer
	 * @param {JQuery<HTMLOListElement>} keysContainer
	 * @param {import("./types").KeyFrame} keyFrame
	 * @param {boolean} first
	 */
	async #_loadDataForKeyFrame(propContainer, keysContainer, keyFrame, first) {
		// Render the property html
		const propsElement = $(await renderTemplate(`modules/${SETTINGS.MOD_NAME}/templates/active-light-props.hbs`,
			foundry.utils.mergeObject({ first: first }, keyFrame)));

		// Inject the property data into the properties container
		propContainer.empty();
		propContainer.append(propsElement);

		// Listen to Time input changes
		propsElement.find('input[name="time"]').on('change', async (e) => {
			const newValue = /**@type {HTMLInputElement}*/(e.currentTarget).valueAsNumber;
			// If the value is zero, reset it! No keyframes can be manually set to zero
			if (newValue === 0) {
				e.currentTarget.setAttribute('value', keyFrame.time.toString());
				ui.notifications.warn(game.i18n.localize('DF_ACTIVE_LIGHTS.Warnings.KeyFrame_Zero'));
				return;
			}
			// If the value is equal to another keyframe, reset it it to previous value
			const conflict = this.#_data.keys.find(x => x.time === newValue);
			if (conflict) {
				e.currentTarget.setAttribute('value', keyFrame.time.toString());
				ui.notifications.warn(game.i18n.localize('DF_ACTIVE_LIGHTS.Warnings.KeyFrame_Exists').replace('{0}', newValue.toString()));
				return;
			}
			// Set the time ID for the keyframe UI
			e.currentTarget.setAttribute('data-time', newValue.toString());
			/**@type {HTMLInputElement[]}*/
			const keys = Array.from(keysContainer[0].children);
			const keyElement = keys.find(x => parseInt(x.getAttribute('data-time')) === keyFrame.time);
			keyElement.setAttribute('data-time', newValue.toString());
			keyElement.querySelector('span').innerHTML = (newValue / 1000).toNearest(0.001).toString() + ' ' + game.i18n.localize('DF_ACTIVE_LIGHTS.Seconds');
			keys.sort((a, b) => parseInt(a.getAttribute('data-time')) < parseInt(b.getAttribute('data-time')) ? -1 : 1);
			keysContainer.append(keys);
			// Set the new time value
			keyFrame.time = newValue;
			// Resort the keys
			this.#_data.keys.sort((a, b) => a.time < b.time ? -1 : 1);
			// Save the animations
			await this.#_save();
		});

		// Helper function for accessing a given property delta for the current key frame
		/**@type {(propName: string) => PropertyDelta}*/
		const getPropDelta = (propName) => this.#_data.keys[keysContainer.find('.active').index()][propName];

		// Listen to the property elements
		propsElement.find('input[data-type="prop"]').on('change', async e => {
			const propName = e.currentTarget.parentElement.id;
			/**@type {HTMLInputElement}*/
			const input = $(e.currentTarget.parentElement).find(`input[name="${propName}"]`)[0];
			const value = propName !== 'tintColor' ? input.valueAsNumber : input.value;
			getPropDelta(propName).value = value;
			await this.#_save();
		});
		propsElement.find('select').on('change', async e => {
			const propName = e.currentTarget.parentElement.id;
			const value = e.currentTarget.value;
			getPropDelta(propName).func = value;
			await this.#_save();
		});
		propsElement.find('input[type="checkbox"]').on('click', async e => {
			const propName = e.currentTarget.parentElement.id;
			const input = $(e.currentTarget.parentElement).find(`input[name="${propName}"]`);
			const select = $(e.currentTarget.parentElement).find(`select`);
			if (/**@type {HTMLInputElement}*/(e.currentTarget).checked) {
				input.removeAttr('disabled');
				select.removeAttr('disabled');
			}
			else {
				input.attr('disabled', '');
				select.attr('disabled', '');
			}
			getPropDelta(propName).enabled = /**@type {HTMLInputElement}*/(e.currentTarget).checked;
			await this.#_save();
		});

		/*
		- Listen to all checkboxes
			- Ignore Enable/Disable if on first keyframe
			- Enable/Disable the row items on check/uncheck
			- Save key frame when changed
		- Listen to all prop value inputs
			- Save key frame whenever a change occurs
		*/
	}

	/**
	 * @param {JQuery<HTMLElement>} propContainer
	 * @param {JQuery<HTMLOListElement>} keysContainer
	 * @param {import("./types").KeyFrame} keyFrame
	 */
	async #_appendKeyFrame(propContainer, keysContainer, keyFrame) {
		// Add keyframe to list
		const keyElement = $(await renderTemplate(`modules/${SETTINGS.MOD_NAME}/templates/active-light-key.hbs`, {
			time: keyFrame.time,
			label: (keyFrame.time / 1000).toNearest(0.001)
		}));
		// Listen for click
		keyElement.on('click', async (e) => {
			if (e.currentTarget.classList.contains('active')) return;
			keysContainer.find('li.active').removeClass('active');
			e.currentTarget.classList.add('active');
			await this.#_loadDataForKeyFrame(propContainer, keysContainer, this.#_data.keys[$(e.currentTarget).index()], $(e.currentTarget).index() === 0);
		});
		keyElement.find('a').on('click', async e => {
			e.stopPropagation();
			await this.#_deleteKeyframe(propContainer, keysContainer, e.currentTarget.parentElement);
		});
		keysContainer.append(keyElement);
	}

	/**
	 * @param {JQuery<HTMLElement>} propContainer
	 * @param {JQuery<HTMLOListElement>} keysContainer
	 * @param {HTMLElement} element
	 */
	async #_deleteKeyframe(propContainer, keysContainer, element) {
		// Prompt for deletion confirmation
		// Delete keyframe
		// If the keyframe was the current one, activate the previous keyframe. This will always work because the 0 second keyframe cannot be deleted.
		const index = $(element).index();
		if (element.classList.contains('active')) {
			keysContainer.find('li')[index - 1].classList.add('active');
			this.#_loadDataForKeyFrame(propContainer, keysContainer, this.#_data.keys[index - 1], (index - 1) === 0);
		}
		$(element).remove();
		this.#_data.keys.splice(index, 1);
		await this.#_save();
	}

	async #_save() {
		if (this.#_data.keys.length <= 1)
			await this.#_document.setFlag(SETTINGS.MOD_NAME, LightAnimator.FLAG_ANIMS, null);
		else
			await this.#_document.setFlag(SETTINGS.MOD_NAME, LightAnimator.FLAG_ANIMS, foundry.utils.duplicate(this.#_data));
		const pointSource = canvas.effects.lightSources.get("AmbientLight." + this.#_document.id) ??
			canvas.effects.lightSources.get("AmbientLight." + this.#_document.id + ".preview");
		delete /**@type {import("./types").AmbientLightExt}*/(pointSource.object).animator;
	}

	/**@param {object} [options]*/
	async close(options) {
		super.close(options);
		this.#_document.update({ id: this.#_document.id }, { diff: false });
	}
}