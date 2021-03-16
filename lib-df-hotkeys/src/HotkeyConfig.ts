
interface Options {
	keys: { key: String, label: String }[]
	groups: {
		name: String,
		label: String,
		description: String,
		items: {
			name: String,
			label: String,
			map: KeyMap
		}[]
	}[]
}

interface SettingGroup {
	name: String,
	label: String,
	description: String,
	items: HotkeySetting[]
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
		} as FormApplication.Options);
	}

	static init() {
		game.settings.registerMenu('lib-df-hotkeys', this.PREF_MENU, {
			restricted: true,
			type: HotkeyConfig,
			icon: 'fas fa-keyboard',
			label: 'DF_HOTKEYS.Config_Title',
			name: 'DF_HOTKEYS.Config_Title'
		});
	}

	getData(options?: Application.RenderOptions): Options {
		return {
			keys: Hotkeys.keys.entries,
			groups: [...((Hotkeys as any)._settings as Map<String, SettingGroup>).values()]
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

	async _updateObject(event: Event, formData?: { [key: string]: any }) {
		if (!formData) return;

		// Process group settings
		const settings = (Hotkeys as any)._settings as Map<String, SettingGroup>;
		const groups = new Map<String, Map<String, HotkeySetting>>();
		settings.forEach(x => groups.set(x.name, new Map(x.items.map(x => [x.name, x]))));

		var key = '';
		const saveData = new Map<String, Map<String, String[]>>();
		for (let entry of Object.keys(formData)) {

			const tokens = entry.split('.');
			const group = saveData.has(tokens[0]) ? saveData.get(tokens[0]) : saveData.set(tokens[0], new Map()).get(tokens[0]);
			const key = tokens.slice(1, tokens.length - 1).join('.');
			const item = group.has(key) ? group.get(key) : group.set(key, []).get(key);
			item.push(tokens[tokens.length - 1]);
		}
		for (let groupName of saveData.keys()) {
			if (!groups.has(groupName)) {
				console.error(`Did not find hotkey group with the name "${groupName}"`);
				continue;
			}
			const group = groups.get(groupName);
			for (let itemName of saveData.get(groupName).keys()) {
				if (!group.has(itemName)) {
					console.error(`Did not find hotkey with the name "${itemName}"`);
					continue;
				}
				const item = group.get(itemName);
				const rootKey: string = `${groupName}.${itemName}.`;
				const keyMap: Partial<KeyMap> = {
					key: formData[rootKey + 'key'],
					alt: formData[rootKey + 'alt'],
					ctrl: formData[rootKey + 'ctrl'],
					shift: formData[rootKey + 'shift']
				}
				if (keyMap.key === undefined || typeof(keyMap.key) !== 'string') { console.error(`HotkeyConfig: "${itemName}" was missing 'key' field`); continue; }
				if (keyMap.alt === undefined || typeof(keyMap.alt) !== 'boolean') { console.error(`HotkeyConfig: "${itemName}" was missing 'alt' field`); continue; }
				if (keyMap.ctrl === undefined || typeof(keyMap.ctrl) !== 'boolean') { console.error(`HotkeyConfig: "${itemName}" was missing 'ctrl' field`); continue; }
				if (keyMap.shift === undefined || typeof(keyMap.shift) !== 'boolean') { console.error(`HotkeyConfig: "${itemName}" was missing 'shift' field`); continue; }
				await item.set(keyMap as KeyMap);
			}
		}
		HotkeyConfig.requestReload();
	}

	activateListeners(html: JQuery<HTMLElement>) {
		super.activateListeners(html);
		html.find('#reset').on('click', (e) => {
			e.preventDefault();
			const groups = [...((Hotkeys as any)._settings as Map<String, SettingGroup>).values()].filter(x => x.items.length > 0);
			for (let group of groups) {
				group.items.forEach(x => {
					const defValue = x.default();
					$(`#DFHotkeyConfig select[name="${group.name}.${x.name}.key"]`).val(defValue.key.toString());
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

