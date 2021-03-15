
import { KeyMap, Hotkeys } from './Hotkeys.js';

import { HotkeyConfig } from './HotkeyConfig.js';


declare global {
	const hotkeys: typeof Hotkeys
}

Object.freeze(Hotkeys);

// Define as property so that it can't be deleted
delete (globalThis as any).hotkeys;
Object.defineProperty(globalThis, 'hotkeys', {
	get: () => Hotkeys,
	set: (value) => { throw `Hotkeys: Not allowed to re-assign the global instance of Hotkeys` },
	configurable: false
});

{
	(Hotkeys as any)._init();
}


class SETTINGS {
	static readonly MOD_NAME = 'lib-df-hotkeys';
	static register<T>(key: string, config: ClientSettings.PartialData<T>) { game.settings.register(SETTINGS.MOD_NAME, key, config); }
	static get<T>(key: string): T { return game.settings.get(SETTINGS.MOD_NAME, key); }
	static async set<T>(key: string, value: T): Promise<T> { return await game.settings.set(SETTINGS.MOD_NAME, key, value); }
	static default<T>(key: string): T { return game.settings.settings.get(`${SETTINGS.MOD_NAME}.${key}`).default; }
	static typeOf<T>(): ConstructorOf<T> { return Object as any; }
}

Hooks.once('init', function () {
	HotkeyConfig.init();

	SETTINGS.register<KeyMap>('test1', {
		scope: 'world',
		config: false,
		default: {
			key: hotkeys.keys.Digit1,
			alt: true,
			ctrl: false,
			shift: false
		},
		type: Object as any
	});
	SETTINGS.register<KeyMap>('test2', {
		scope: 'world',
		config: false,
		default: {
			key: hotkeys.keys.Digit2,
			alt: true,
			ctrl: false,
			shift: false
		},
		type: Object as any
	});
	SETTINGS.register<KeyMap>('test3', {
		scope: 'world',
		config: false,
		default: {
			key: hotkeys.keys.Digit3,
			alt: true,
			ctrl: false,
			shift: false
		},
		type: Object as any
	});

	hotkeys.registerShortcut({
		name: 'test1',
		label: 'Test 1',
		get: () => SETTINGS.get<KeyMap>('test1'),
		set: async (value: KeyMap) => await SETTINGS.set('test1', value),
		default: () => SETTINGS.default('test1'),
		handle: _ => { console.log('You hit Alt + 1') },
	});
	hotkeys.registerShortcut({
		name: 'test2',
		label: 'Test 2',
		get: () => SETTINGS.get<KeyMap>('test2'),
		set: async (value: KeyMap) => await SETTINGS.set('test2', value),
		default: () => SETTINGS.default('test2'),
		handle: _ => { console.log('You hit Alt + 2') },
	});
	hotkeys.registerGroup({
		name: 'group1',
		label: 'Group 1',
		description: 'Optional description goes here'
	});
	hotkeys.registerShortcut({
		name: 'test3',
		label: 'Test 3',
		group: 'group1',
		get: () => SETTINGS.get<KeyMap>('test3'),
		set: async (value: KeyMap) => await SETTINGS.set('test3', value),
		default: () => SETTINGS.default('test3'),
		handle: _ => { console.log('You hit Alt + 3') },
	});
});