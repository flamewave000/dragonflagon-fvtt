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

// class SETTINGS {
// 	static readonly MOD_NAME = 'lib-df-hotkeys';
// 	static register<T>(key: string, config: ClientSettings.PartialData<T>) { game.settings.register(SETTINGS.MOD_NAME, key, config); }
// 	static get<T>(key: string): T { return game.settings.get(SETTINGS.MOD_NAME, key); }
// 	static async set<T>(key: string, value: T): Promise<T> { return await game.settings.set(SETTINGS.MOD_NAME, key, value); }
// 	static default<T>(key: string): T { return game.settings.settings.get(`${SETTINGS.MOD_NAME}.${key}`).default; }
// 	static typeOf<T>(): ConstructorOf<T> { return Object as any; }
// }

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
		handle: (self: HotkeySetting) => (ui.controls as any)._onClickTool({ preventDefault: function () { }, currentTarget: { dataset: { tool: PREF_SELECT } } }),
	});

	
	// SETTINGS.register<KeyMap>('test1', {
	// 	scope: 'world',
	// 	config: false,
	// 	default: {
	// 		key: Hotkeys.keys.Digit1,
	// 		alt: true,
	// 		ctrl: false,
	// 		shift: false
	// 	},
	// 	type: Object as any
	// });
	// SETTINGS.register<KeyMap>('test2', {
	// 	scope: 'world',
	// 	config: false,
	// 	default: {
	// 		key: Hotkeys.keys.Digit2,
	// 		alt: true,
	// 		ctrl: false,
	// 		shift: false
	// 	},
	// 	type: Object as any
	// });
	// SETTINGS.register<KeyMap>('test3', {
	// 	scope: 'world',
	// 	config: false,
	// 	default: {
	// 		key: Hotkeys.keys.Digit3,
	// 		alt: true,
	// 		ctrl: false,
	// 		shift: false
	// 	},
	// 	type: Object as any
	// });

	// Hotkeys.registerShortcut({
	// 	name: 'test1',
	// 	label: 'Example General Hotkey',
	// 	get: () => SETTINGS.get<KeyMap>('test1'),
	// 	set: async (value: KeyMap) => await SETTINGS.set('test1', value),
	// 	default: () => SETTINGS.default('test1'),
	// 	handle: (self: HotkeySetting) => { console.log('You hit Alt + 1') },
	// });
	// Hotkeys.registerGroup({
	// 	name: 'group1',
	// 	label: 'Custom Group',
	// 	description: 'Optional description for the custom group goes here'
	// });
	// Hotkeys.registerShortcut({
	// 	name: 'test2',
	// 	label: 'Example Custom Group Hotkey 1',
	// 	group: 'group1',
	// 	get: () => SETTINGS.get<KeyMap>('test2'),
	// 	set: async (value: KeyMap) => await SETTINGS.set('test2', value),
	// 	default: () => SETTINGS.default('test2'),
	// 	handle: (self: HotkeySetting) => { console.log('You hit Alt + 2') },
	// });
	// Hotkeys.registerShortcut({
	// 	name: 'test3',
	// 	label: 'Example Custom Group Hotkey 1',
	// 	group: 'group1',
	// 	get: () => SETTINGS.get<KeyMap>('test3'),
	// 	set: async (value: KeyMap) => await SETTINGS.set('test3', value),
	// 	default: () => SETTINGS.default('test3'),
	// 	handle: (self: HotkeySetting) => { console.log('You hit Alt + 3') },
	// });
});