// Import and declare the classes/interfaces Global
import GroupFilter from './GroupFilter.js';
import { HotkeyConfig } from './HotkeyConfig.js';
import { _Hotkeys } from './Hotkeys.js';
import { KeyMap, HotkeySetting } from './Hotkeys.js';

// Initialize Hotkeys on the global scope
export const Hotkeys: typeof _Hotkeys = _Hotkeys;
{
	// @ts-expect-error
	window.Hotkeys = Hotkeys;
	// @ts-expect-error
	Hotkeys._init();
	Hotkeys.showConfig = async function (title: string, filters: (string | RegExp | GroupFilter)[]) {
		if (!title || title === '')
			throw new Error('You must provide a title for the config menu');
		if (!filters || filters.length === 0)
			throw new Error('You must provide at least one filter');
		const config = new HotkeyConfig(title, filters);
		await config.render(true);
	}
	Hotkeys.createConfig = function (title: string, filters: (string | RegExp | GroupFilter)[]) {
		if (!title || title === '')
			throw new Error('You must provide a title for the config menu');
		if (!filters || filters.length === 0)
			throw new Error('You must provide at least one filter');
		return class Sepcialized extends HotkeyConfig {
			constructor() {
				super(title, filters);
			}
		};
	}
}


import SETTINGS from './Settings.js';
// Initializes the SETTINGS helper with the name of this module
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

	Hotkeys.registerGroup({
		name: 'monks-little-details.tool-swap',
		label: 'Monks Litle Details, Tool Swap',
		description: 'Use these keys to swap between tools'
	});
	Hotkeys.registerShortcut({
		name: 'monks-little-details.change-token-control',
		label: 'Change To Token Layer',
		group: 'monks-little-details.tool-swap',
		default: { key: Hotkeys.keys.KeyG, alt: false, ctrl: false, shift: true },
		onKeyDown: (e) => { console.log('test'); }
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
	// 	type: SETTINGS.typeOf<KeyMap>()
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
	// 	type: SETTINGS.typeOf<KeyMap>()
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
	// 	type: SETTINGS.typeOf<KeyMap>()
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
	// 	onKeyDown: (self: HotkeySetting, event: KeyboardEvent, repeat: boolean) => {
	// 		console.log(`You hit Alt + 3 exactly ${++count} ${count > 1 ? 'times' : 'time'}, repeat flag: ${repeat}`)
	// 	},
	// });
	// #endregion
});