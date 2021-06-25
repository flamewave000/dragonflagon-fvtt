import SETTINGS from './libs/Settings.js';

export default class TemplateTargeting {
	static init() {
		SETTINGS.register('template-targeting-toggle', {
			config: false,
			scope: 'client',
			type: Boolean,
			default: true,
			onChange: (newValue: Boolean) => {
				if (SETTINGS.get('template-targeting') !== 'toggle') return;
				if (newValue) this.patch(); else this.unpatch();
			}
		});
		SETTINGS.register('template-targeting', {
			config: true,
			scope: 'world',
			name: game.i18n.localize('DRAGON_FLAGON_QOL.TemplateTargeting.SettingName'),
			hint: 'DRAGON_FLAGON_QOL.TemplateTargeting.SettingHint',
			type: String,
			choices: {
				never: 'Never',
				toggle: 'Toggle (Add toggle button)',
				always: 'Always'
			},
			default: 'toggle',
			onChange: (newValue: String) => {
				if (newValue === 'never') this.unpatch();
				else if (newValue === 'always') this.patch();
				else if (SETTINGS.get('template-targeting-toggle')) this.patch();
				else this.unpatch();
				ui.controls.initialize();
				ui.controls.render(true);
			}
		});
		const current = SETTINGS.get('template-targeting');
		if (current === 'always' || (current === 'toggle' && SETTINGS.get('template-targeting-toggle')))
			libWrapper.register(SETTINGS.MOD_NAME, 'MeasuredTemplate.prototype.highlightGrid', this.UPDATE_TARGETS, 'WRAPPER');


		Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
			if (SETTINGS.get('template-targeting') !== 'toggle') return;
			const control = controls.find(x => x.name === 'measure');
			control.tools.splice(0, 0, {
				icon: 'fas fa-bullseye',
				name: 'autoTarget',
				title: 'DRAGON_FLAGON_QOL.TemplateTargeting.ToggleTitle',
				visible: true,
				toggle: true,
				active: SETTINGS.get('template-targeting-toggle'),
				onClick: (toggled: boolean) => { SETTINGS.set('template-targeting-toggle', toggled) }
			});
		});
	}

	static patch() {
		libWrapper.register(SETTINGS.MOD_NAME, 'MeasuredTemplate.prototype.highlightGrid', this.UPDATE_TARGETS, 'WRAPPER');
	}
	static unpatch() {
		libWrapper.unregister(SETTINGS.MOD_NAME, 'MeasuredTemplate.prototype.highlightGrid', false);
	}

	static UPDATE_TARGETS(this: MeasuredTemplate, wrapped: Function) {
		wrapped();
		if (!canvas.tokens.objects) return;
		// Release all previously targeted tokens
		for (let t of game.user.targets) {
			t.setTarget(false, { releaseOthers: false, groupSelection: true });
		}
		// Get the offset of the template origin relative to the top-left grid space
		const hx = canvas.grid.w / 2;
		const hy = canvas.grid.h / 2;
		// Iterate over all existing tokens and target the ones within the template area
		for (let token of canvas.tokens.placeables) {
			if (this.shape.contains((token.x + hx) - this.data.x, (token.y + hy) - this.data.y)) {
				token.setTarget(true, { user: game.user, releaseOthers: false, groupSelection: true });
			}
		}
	}
}