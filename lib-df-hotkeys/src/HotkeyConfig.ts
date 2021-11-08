import GroupFilter from "./GroupFilter";
import { KeyMap, HotkeySetting, _Hotkeys } from "./Hotkeys";

interface Options {
	title: string | undefined;
	keys: { key: String, label: String }[];
	groups: {
		name: String,
		label: String,
		description: String,
		items: {
			name: String,
			label: String,
			map: KeyMap
		}[]
	}[];
}

interface SettingGroup {
	name: String,
	label: String,
	description: String,
	items: HotkeySetting[]
}

function isGroupFilter(object: string | RegExp | GroupFilter): object is GroupFilter {
	return object instanceof Object && 'group' in object && 'hotkeys' in object;
}
function isStringRegex(object: string | RegExp | GroupFilter): object is (string | RegExp) {
	return typeof (object) === 'string' || object instanceof RegExp || object instanceof String;
}

export class HotkeyConfig extends FormApplication<FormApplication.Options, Options> {
	private static readonly PREF_MENU = "HotkeySettingsMenu";
	private _filters: (string | RegExp | GroupFilter)[];


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

	constructor(titleOverride:string, filter?: (string | RegExp | GroupFilter)[]) {
		super({}, {
			title: titleOverride
		});
		this._filters = filter;
	}

	private _filterGroups(groups: SettingGroup[]): SettingGroup[] {
		if (!this._filters || !(this._filters instanceof Array) || this._filters.length === 0) return groups;
		// Start by filtering groups by name
		return groups.filter(group => this._filters.some(pattern =>
			isGroupFilter(pattern)
				? group.name.match(pattern.group)
				: group.name.match(pattern)))
			.map(group => <SettingGroup>{
				name: group.name,
				description: group.description,
				label: group.label,
				items: group.items.filter(item => this._filters.some(pattern => {
					if (isGroupFilter(pattern) && item.group.match(pattern.group) !== null) {
						// If the groupFilter has no hotkey filters, auto-success
						return pattern.hotkeys.length === 0
							// If any of the hotkey patterns match
							|| pattern.hotkeys.some(gfPattern => item.name.match(gfPattern) !== null);
					}
					// If we are a string/regex and the pattern matches the group name
					else if (isStringRegex(pattern))
						return item.group.match(pattern) !== null;
					return false;
				}))
			});
	}

	getData(options?: Application.RenderOptions): Options {
		return {
			title: !!this._filters ? this.options.title : undefined,
			keys: _Hotkeys.keys.entries,
			// @ts-expect-error
			groups: this._filterGroups([...Hotkeys._settings.values()])
				// filter out empty groups
				.filter(x => x.items.length > 0)
				// map the group items into view data
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
		// @ts-expect-error
		const settings = _Hotkeys._settings;
		const groups = new Map<String, Map<String, HotkeySetting>>();
		settings.forEach(x => groups.set(x.name, new Map(x.items.map(x => [x.name, x]))));

		const saveData = new Map<String, Map<String, String[]>>();
		for (let entry of Object.keys(formData)) {
			const tokens = entry.split('::');
			const group = saveData.has(tokens[0]) ? saveData.get(tokens[0]) : saveData.set(tokens[0], new Map()).get(tokens[0]);
			const key = tokens[1];
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
				const rootKey: string = `${groupName}::${itemName}::`;
				const keyMap: Partial<KeyMap> = {
					key: formData[rootKey + 'key'],
					alt: formData[rootKey + 'alt'],
					ctrl: formData[rootKey + 'ctrl'],
					shift: formData[rootKey + 'shift']
				}
				if (keyMap.key === undefined || typeof (keyMap.key) !== 'string') { console.error(`HotkeyConfig: "${itemName}" was missing 'key' field`); continue; }
				if (keyMap.alt === undefined || typeof (keyMap.alt) !== 'boolean') { console.error(`HotkeyConfig: "${itemName}" was missing 'alt' field`); continue; }
				if (keyMap.ctrl === undefined || typeof (keyMap.ctrl) !== 'boolean') { console.error(`HotkeyConfig: "${itemName}" was missing 'ctrl' field`); continue; }
				if (keyMap.shift === undefined || typeof (keyMap.shift) !== 'boolean') { console.error(`HotkeyConfig: "${itemName}" was missing 'shift' field`); continue; }
				await item.set(keyMap as KeyMap);
			}
		}
		HotkeyConfig.requestReload();
	}

	activateListeners(html: JQuery<HTMLElement>) {
		super.activateListeners(html);
		html.find('#reset').on('click', (e) => {
			e.preventDefault();
			// @ts-expect-error
			const groups = this._filterGroups([..._Hotkeys._settings.values()]).filter(x => x.items.length > 0);
			for (let group of groups) {
				group.items.forEach(x => {
					const defValue = x.default instanceof Function ? x.default() : x.default;
					$(`#DFHotkeyConfig select[name="${group.name}::${x.name}::key"]`).val(defValue.key.toString());
					($(`#DFHotkeyConfig input[name="${group.name}::${x.name}::alt"]`)[0] as HTMLInputElement).checked = defValue.alt;
					($(`#DFHotkeyConfig input[name="${group.name}::${x.name}::ctrl"]`)[0] as HTMLInputElement).checked = defValue.ctrl;
					($(`#DFHotkeyConfig input[name="${group.name}::${x.name}::shift"]`)[0] as HTMLInputElement).checked = defValue.shift;
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

