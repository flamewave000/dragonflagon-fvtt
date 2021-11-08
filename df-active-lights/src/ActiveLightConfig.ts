import SETTINGS from "../../common/SETTINGS";
import { AmbientLightExt, AnimatorData, KeyFrame, LightAnimator, PropertyDelta } from "./LightAnimator";

declare class LightConfigExt extends LightConfig {
	anims: ActiveLightConfig;
}
declare class AmbientLightDocument { }

export default class ActiveLightConfig extends Application {
	static init() {
	}

	static ready() {
		if (game.user.isGM)
			Hooks.on('renderLightConfig', this._renderLightConfig);
	}

	private static _renderLightConfig(app: LightConfig, html: JQuery<HTMLElement>, data: any) {
		if (!(app.object instanceof AmbientLightDocument)) return;
		const config = app as LightConfigExt
		if (!config.anims) {
			config.anims = new ActiveLightConfig(app);
		}
		config.anims._inject(html);
		app.element[0].style.height = '';
		app.setPosition({});
	}

	static get defaultOptions(): Application.Options {
		return <any>mergeObject(Application.defaultOptions as Partial<Application.Options>, {
			template: `modules/${SETTINGS.MOD_NAME}/templates/active-light-config.hbs`,
			width: 600,
			resizable: false,
			height: 465,
		});
	}

	private _object: AmbientLight;
	private _data: AnimatorData;

	constructor(app: LightConfig) {
		const obj = app.object as AmbientLightDocument;
		super({
			id: obj.id + '-anims',
			title: game.i18n.localize('DF_ACTIVE_LIGHTS.Config.Title') + obj.id,
		});
		this._object = obj;
		this._data = <AnimatorData>obj.getFlag(SETTINGS.MOD_NAME, LightAnimator.FLAG_ANIMS);
		if (!this._data) {
			this._data = {
				bounce: false,
				offset: 0,
				keys: [ActiveLightConfig._createKeyFrame(0, obj.data)]
			}
		} else this._data = <any>duplicate(this._data);
	}

	getData(options?: Application.RenderOptions): any {
		return {
			bounce: this._data.bounce,
			offset: this._data.offset === 0 ? '' : this._data.offset
		};
	}

	private _inject(html: JQuery<HTMLElement>) {
		const animConfigButton = $(`<button type="button" style="margin:0.25em 0" name="anim-config"><i class="fas fa-cogs"></i> ${game.i18n.localize('DF_ACTIVE_LIGHTS.Config.OpenButton')}</button>`);
		animConfigButton.on('click', (e) => {
			e.preventDefault();
			if (this._state === Application.RENDER_STATES.RENDERED)
				this.bringToTop();
			else
				this.render(true);
		});
		html.find('button').before(animConfigButton);
	}

	private static _createKeyFrame(time: number, data?: Partial<AmbientLight.Data>): KeyFrame {
		return {
			time,
			angle: { enabled: false, value: data?.angle ?? 0 },
			bright: { enabled: false, value: data?.bright ?? 0 },
			dim: { enabled: false, value: data?.dim ?? 0 },
			rotation: { enabled: false, value: data?.rotation ?? 0 },
			tintAlpha: { enabled: false, value: data?.tintAlpha ?? 0 },
			tintColor: { enabled: false, value: data?.tintColor ?? '#000000', isColor: true }
		}
	}

	async activateListeners(html: JQuery<HTMLElement>) {
		const propContainer = <JQuery<HTMLElement>>html.find('main>section');
		const keysContainer = <JQuery<HTMLOListElement>>html.find('aside>ol');

		// Listen for changes to the Bounce and Offset fields
		html.find('input[name="bounce"]').on('change', (e) => {
			this._data.bounce = (e.currentTarget as HTMLInputElement).checked;
			this._save();
		});
		html.find('input[name="offset"]').on('change', (e) => {
			this._data.offset = (e.currentTarget as HTMLInputElement).valueAsNumber;
			this._save();
		});

		// Listen for Add KeyFrame button
		html.find('button[name="add-keyframe"]').on('click', async () => {
			this._data.keys[this._data.keys.length - 1].time
			// Create KeyFrame and set time to Duration + 1
			const keyFrame = ActiveLightConfig._createKeyFrame(this._data.keys[this._data.keys.length - 1].time + 1000);
			// Add new Key Frame to the keys list
			this._data.keys.push(keyFrame);
			// Append a new KeyFrame element to the UI
			await this._appendKeyFrame(propContainer, keysContainer, keyFrame);
			// Save the new data structure
			await this._save();
		});

		// Inject all the keyframe buttons
		for (let key of this._data.keys.slice(1)) {
			await this._appendKeyFrame(propContainer, keysContainer, key);
		}

		$(html.find('aside>ol>li')[0]).on('click', async e => {
			if (e.currentTarget.classList.contains('active')) return;
			keysContainer.find('li.active').removeClass('active');
			e.currentTarget.classList.add('active');
			await this._loadDataForKeyFrame(propContainer, keysContainer, this._data.keys[$(e.currentTarget).index()], $(e.currentTarget).index() === 0);
		});

		// Activate the first keyframe
		this._loadDataForKeyFrame(propContainer, keysContainer, this._data.keys[0], true);
	}

	private async _loadDataForKeyFrame(propContainer: JQuery<HTMLElement>, keysContainer: JQuery<HTMLOListElement>, keyFrame: KeyFrame, first: boolean) {
		// Render the property html
		const propsElement = $(await renderTemplate(`modules/${SETTINGS.MOD_NAME}/templates/active-light-props.hbs`,
			mergeObject({ first: first }, <any>keyFrame)));

		// Inject the property data into the properties container
		propContainer.empty();
		propContainer.append(propsElement);

		// Listen to Time input changes
		propsElement.find('input[name="time"]').on('change', async (e) => {
			var newValue = (e.currentTarget as HTMLInputElement).valueAsNumber;
			// If the value is zero, reset it! No keyframes can be manually set to zero
			if (newValue === 0) {
				e.currentTarget.setAttribute('value', keyFrame.time.toString());
				ui.notifications.warn(game.i18n.localize('DF_ACTIVE_LIGHTS.Warnings.KeyFrame_Zero'));
				return;
			}
			// If the value is equal to another keyframe, reset it it to previous value
			const conflict = this._data.keys.find(x => x.time === newValue);
			if (!!conflict) {
				e.currentTarget.setAttribute('value', keyFrame.time.toString());
				ui.notifications.warn(game.i18n.localize('DF_ACTIVE_LIGHTS.Warnings.KeyFrame_Exists').replace('{0}', newValue.toString()));
				return;
			}
			// Set the time ID for the keyframe UI
			e.currentTarget.setAttribute('data-time', newValue.toString());
			const keys = <HTMLInputElement[]>Array.from(keysContainer[0].children);
			const keyElement = keys.find(x => parseInt(x.getAttribute('data-time')) === keyFrame.time)
			keyElement.setAttribute('data-time', newValue.toString());
			keyElement.querySelector('span').innerHTML = (newValue / 1000).toNearest(0.001).toString() + ' ' + game.i18n.localize('DF_ACTIVE_LIGHTS.Seconds');
			keys.sort((a, b) => parseInt(a.getAttribute('data-time')) < parseInt(b.getAttribute('data-time')) ? -1 : 1);
			keysContainer.append(keys);
			// Set the new time value
			keyFrame.time = newValue;
			// Resort the keys
			this._data.keys.sort((a, b) => a.time < b.time ? -1 : 1);
			// Save the animations
			await this._save();
		});

		// Helper function for accessing a given property delta for the current key frame
		const getPropDelta: (propName: string) => PropertyDelta =
			(propName: string) => <PropertyDelta>this._data.keys[keysContainer.find('.active').index()][propName];

		// Listen to the property elements
		propsElement.find('input[data-type="prop"]').on('change', async e => {
			const propName = e.currentTarget.parentElement.id;
			const input = $(e.currentTarget.parentElement).find(`input[name="${propName}"]`)[0] as HTMLInputElement;
			const value = propName !== 'tintColor' ? input.valueAsNumber : input.value;
			getPropDelta(propName).value = value;
			await this._save();
		});
		propsElement.find('select').on('change', async e => {
			const propName = e.currentTarget.parentElement.id;
			const value = e.currentTarget.value;
			getPropDelta(propName).func = value;
			await this._save();
		});
		propsElement.find('input[type="checkbox"]').on('click', async e => {
			const propName = e.currentTarget.parentElement.id;
			const input = $(e.currentTarget.parentElement).find(`input[name="${propName}"]`);
			const select = $(e.currentTarget.parentElement).find(`select`);
			if ((e.currentTarget as HTMLInputElement).checked) {
				input.removeAttr('disabled');
				select.removeAttr('disabled');
			}
			else {
				input.attr('disabled', '');
				select.attr('disabled', '');
			}
			getPropDelta(propName).enabled = (e.currentTarget as HTMLInputElement).checked;
			await this._save();
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

	private async _appendKeyFrame(propContainer: JQuery<HTMLElement>, keysContainer: JQuery<HTMLOListElement>, keyFrame: KeyFrame) {
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
			await this._loadDataForKeyFrame(propContainer, keysContainer, this._data.keys[$(e.currentTarget).index()], $(e.currentTarget).index() === 0);
		});
		keyElement.find('a').on('click', async e => {
			e.stopPropagation();
			await this._deleteKeyframe(propContainer, keysContainer, e.currentTarget.parentElement);
		});
		keysContainer.append(keyElement);
	}

	private async _deleteKeyframe(propContainer: JQuery<HTMLElement>, keysContainer: JQuery<HTMLOListElement>, element: HTMLElement) {
		// Prompt for deletion confirmation
		// Delete keyframe
		// If the keyframe was the current one, activate the previous keyframe. This will always work because the 0 second keyframe cannot be deleted.
		const index = $(element).index();
		if (element.classList.contains('active')) {
			keysContainer.find('li')[index - 1].classList.add('active');
			this._loadDataForKeyFrame(propContainer, keysContainer, this._data.keys[index - 1], (index - 1) === 0);
		}
		$(element).remove()
		this._data.keys.splice(index, 1);
		await this._save();
	}

	private async _save() {
		if (this._data.keys.length <= 1)
			await this._object.setFlag(SETTINGS.MOD_NAME, LightAnimator.FLAG_ANIMS, null);
		else
			await this._object.setFlag(SETTINGS.MOD_NAME, LightAnimator.FLAG_ANIMS, duplicate(this._data));
		const pointSource = (canvas.getLayer('LightingLayer') as LightingLayer).sources.find(x => x.object.id === this._object.id);
		delete (pointSource.object as AmbientLightExt).animator;
	}

	async close(options?: Application.CloseOptions) {
		super.close(options);
		this._object.update(<any>{ id: this._object.id }, { diff: false });
	}
}