// Import and declare the classes/interfaces Global
import * as HotkeysModule from './Hotkeys.js';
// This is mainly just to generate proper Type Definitions files
declare global {
	export type Hotkeys = HotkeysModule.Hotkeys;
	export const Hotkeys: typeof HotkeysModule.Hotkeys;
	export type KeyMap = HotkeysModule.KeyMap;
	export type HotkeyGroup = HotkeysModule.HotkeyGroup;
	export type HotkeySetting = HotkeysModule.HotkeySetting;
}
// Initialize Hotkeys on the global scope
{
	(<any>window).Hotkeys = HotkeysModule.Hotkeys;
	(<any>Hotkeys)._init();
}


import { HotkeyConfig } from './HotkeyConfig.js';
import SETTINGS from './Settings.js';
SETTINGS.init('lib-df-hotkeys')
Hooks.once('init', function () {
	HotkeyConfig.init();
	const PREF_SELECT = 'select';
	SETTINGS.register(PREF_SELECT, {
		scope: 'world',
		config: false,
		default: {
			key: Hotkeys.keys.KeyS,
			alt: false,
			ctrl: false,
			shift: false
		},
		type: SETTINGS.typeOf<KeyMap>()
	});
	Hotkeys.registerShortcut({
		name: `${SETTINGS.MOD_NAME}.${PREF_SELECT}`,
		label: 'DF_HOTKEYS.SelectTool',
		get: () => SETTINGS.get(PREF_SELECT),
		set: async (value: KeyMap) => SETTINGS.set(PREF_SELECT, value),
		default: () => SETTINGS.default(PREF_SELECT),
		onKeyDown: (self: HotkeySetting) =>
			(<any>ui.controls)._onClickTool({ preventDefault: () => { }, currentTarget: { dataset: { tool: PREF_SELECT } } }),
	});


	// #region ****** Demo Hotkeys ******
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
	// 	onKeyDown: (self: HotkeySetting) => { console.log('You pressed Alt + 1') },
	// 	onKeyUp: (self: HotkeySetting) => { console.log('You released Alt + 1') },
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
	// 	onKeyUp: (self: HotkeySetting) => { console.log('You released Alt + 2') },
	// });
	// var count = 0;
	// Hotkeys.registerShortcut({
	// 	name: 'test3',
	// 	label: 'Example Custom Group Hotkey 1',
	// 	group: 'group1',
	// 	repeat: true,
	// 	get: () => SETTINGS.get<KeyMap>('test3'),
	// 	set: async (value: KeyMap) => await SETTINGS.set('test3', value),
	// 	default: () => SETTINGS.default('test3'),
	// 	onKeyDown: (self: HotkeySetting, repeat: boolean) => {
	// 		console.log(`You hit Alt + 3 exactly ${++count} ${count > 1 ? 'times' : 'time'}, repeat flag: ${repeat}`)
	// 	},
	// });
	// #endregion
});