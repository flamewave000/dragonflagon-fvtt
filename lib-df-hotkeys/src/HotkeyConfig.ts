import { HotkeySetting, KeyMap, SettingGroup } from './Hotkeys.js';


interface Options {
	keys: { key: string, label: string }[]
	groups: {
		name: string,
		label: string,
		description: string,
		items: {
			name: string,
			label: string,
			map: KeyMap
		}[]
	}[]
}

interface FormData {
	[groupName: string]: {
		[name: string]: KeyMap;
	}
}

export class HotkeyConfig extends FormApplication<Options> {
	private static readonly PREF_MENU = "HotkeySettingsMenu";


	static get defaultOptions(): FormApplication.Options {
		return mergeObject(super.defaultOptions, {
			title: 'DF_HOTKEYS.Config_Title',
			editable: true,
			resizable: true,
			submitOnChange: false,
			submitOnClose: false,
			closeOnSubmit: true,
			width: 525,
			id: 'DFHotkeyConfig',
			template: 'modules/lib-df-hotkeys/templates/HotkeyConfig.hbs'
		});
	}

	static init() {
		game.settings.registerMenu('lib-df-hotkeys', this.PREF_MENU, {
			restricted: true,
			type: HotkeyConfig,
			icon: 'fas fa-keyboard',
			label: 'DF_HOTKEYS.Config_Title'
		});
	}

	getData(options?: Application.RenderOptions): Options {
		return {
			keys: hotkeys.keys.entries,
			groups: [...((hotkeys as any)._settings as Map<string, SettingGroup>).values()]
				.filter(x => x.items.length > 0)
				.map(g => {
					return {
						name: g.name,
						label: g.label,
						description: g.description,
						items: g.items.map(i => {
							return {
								name: i.name,
								label: i.label,
								map: i.get()
							};
						})
					}
				})
		};
	}

	async _updateObject(event: Event, formData?: any) {
		if (!formData) return;
		const data = expandObject(formData) as FormData;
		const groups = (hotkeys as any)._settings as Map<string, SettingGroup>;
		for (let groupKey of Object.keys(data)) {
			const group = groups.get(groupKey);
			if (!group) continue;
			for (let itemKey of Object.keys(data[groupKey])) {
				const item = group.items.find(x => x.name === itemKey);
				if (!itemKey) continue;
				await item.set(data[groupKey][itemKey]);
			}
		}
		HotkeyConfig.requestReload();
	}

	activateListeners(html: JQuery<HTMLElement>) {
		super.activateListeners(html);
		html.find('#reset').on('click', (e) => {
			e.preventDefault();
			const groups = [...((hotkeys as any)._settings as Map<string, SettingGroup>).values()].filter(x => x.items.length > 0);
			for (let group of groups) {
				group.items.forEach(x => {
					const defValue = x.default();
					$(`#DFHotkeyConfig select[name="${group.name}.${x.name}.key"]`).val(defValue.key);
					($(`#DFHotkeyConfig input[name="${group.name}.${x.name}.alt"]`)[0] as HTMLInputElement).checked = defValue.alt;
					($(`#DFHotkeyConfig input[name="${group.name}.${x.name}.ctrl"]`)[0] as HTMLInputElement).checked = defValue.ctrl;
					($(`#DFHotkeyConfig input[name="${group.name}.${x.name}.shift"]`)[0] as HTMLInputElement).checked = defValue.shift;
				});
			}
		});
	}

	private static requestReload() {
		const dialog: Dialog = new Dialog({
			title: game.i18n.localize('DF_HOTKEYS.ReloadRequired_Title'),
			content: game.i18n.localize('DF_HOTKEYS.ReloadRequired_Content'),
			default: 'yes',
			buttons: {
				no: {
					// icon: '<i class="fas fa-times"><╱i>',
					label: game.i18n.localize('DF_HOTKEYS.ReloadRequired_Negative'),
					callback: async () => await dialog.close()
				},
				yes: {
					// icon: '<i class="fas fa-check"><╱i>',
					label: game.i18n.localize('DF_HOTKEYS.ReloadRequired_Positive'),
					callback: () => window.location.reload()
				}
			}
		});
		dialog.render(true);
	}
}

