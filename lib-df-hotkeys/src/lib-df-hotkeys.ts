import * as HotkeysModule from './Hotkeys.js';
declare global {
	export type Hotkeys = HotkeysModule.Hotkeys;
	export const Hotkeys: typeof HotkeysModule.Hotkeys;
	export type KeyMap = HotkeysModule.KeyMap;
	export type HotkeyGroup = HotkeysModule.HotkeyGroup;
	export type HotkeySetting = HotkeysModule.HotkeySetting;
}
(<any>window).Hotkeys = HotkeysModule.Hotkeys;
{
	(Hotkeys as any)._init();
}

import { HotkeyConfig } from './HotkeyConfig.js';
Hooks.once('init', function () {
	HotkeyConfig.init();
	const MOD_NAME = 'lib-df-hotkeys';
	const PREF_SELECT = 'select';
	game.settings.register(MOD_NAME, PREF_SELECT, {
		scope: 'world',
		config: false,
		default: {
			key: Hotkeys.keys.KeyS,
			alt: false,
			ctrl: false,
			shift: false
		},
		type: Object as any
	});
	Hotkeys.registerShortcut({
		name: MOD_NAME + '.' + PREF_SELECT,
		label: 'DF_HOTKEYS.SelectTool',
		get: () => game.settings.get(MOD_NAME, PREF_SELECT),
		set: async (value: KeyMap) => game.settings.set(MOD_NAME, PREF_SELECT, value),
		default: () => { return { key: Hotkeys.keys.KeyS, alt: false, ctrl: false, shift: false } },
		handle: _ => (ui.controls as any)._onClickTool({ preventDefault: function () { }, currentTarget: { dataset: { tool: PREF_SELECT } } }),
	});
});