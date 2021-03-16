# DragonFlagon Hotkeys Library

Library for Foundry VTT module developers to use. It allows modules to register their own Keyboard Shortcuts and gives way for users to then customize those hotkey bindings.

This module comes with a single hotkey pre-assigned for the Select Tool mapped to the `S` key.

![Base module settings](../.assets/lib-df-hotkeys-base.png)

## Example of Hotkeys

Here is an example of hotkeys registered to both the General group, and a Custom Group

![Example of hotkeys](../.assets/lib-df-hotkeys-example.png)

##### [![become a patron](../.assets/patreon-image.png)](https://www.patreon.com/bePatron?u=46113583) If you want to support me or just help me buy doggy treats! Also, you can keep up to date on what I'm working on. I will be announcing any new modules or pre-releases there for anyone wanting to help me test things out!

## How to Use

All modules that wish to use the library should declare a dependency in their manifest as follows:

```json
"dependencies": [
	{
		"name": "lib-df-hotkeys"
	}
]
```

## For TypeScript Projects

You will find the Typing Definitions file `lib-df-hotkeys.d.ts` in the [latest release](https://github.com/flamewave000/dragonflagon-fvtt/releases/tag/lib-df-hotkeys_1.0.1) that you can include in your project.

### Important Data Types

```TypeScript
/** Simple KeyMap for a Hotkey */
interface KeyMap {
	/** The key code to be listned for */
	key: string;
	/** Does the Alt key need to be pressed at the same time? */
	alt: boolean;
	/** Does the Ctrl key need to be pressed at the same time? */
	ctrl: boolean;
	/** Does the Shift key need to be pressed at the same time? */
	shift: boolean;
}

/** Hotkey Configuration Registration */
interface HotkeySetting {
	/** optional: Group to be included in with their own header. Default: General Group */
	group?: string;
	/** Unique variable name to be used in the layout. Recommend: 'module-name.myHotkey' */
	name: string;
	/** Label to be displayed in the layout. This will be localized when injected into the HTML */
	label: string;
	/** The default setting for this hotkey */
	default(): KeyMap;
	/** Function for retrieving the current hotkey setting */
	get(): KeyMap;
	/** Function for saving the new hotkey setting */
	set(value: KeyMap): Promise<KeyMap>;
	/** Function to handle the execution of the hotkey */
	handle(self: HotkeySetting): void;
}

/** Hotkey Group Configuration */
interface HotkeyGroup {
	/** Unique name of the group. */
	name: string;
	/** Displayed in the HTML header for the group. */
	label: string;
	/** Optional description of the group */
	description?: string;
}
```

### Register Hotkey

To register a new Hotkey, simply add the following to your code. It must be during or after the `init` event. If you add a hotkey that has the same name as one that has already been registered, it will by default throw an error. If you do not wish an error to be thrown, you can pass `false` to the `throwOnError` parameter and it will instead simply return `true` for success and `false` on error.

```JavaScript
// JavaScript Implementation
Hooks.once('init', function() {
	/* Hotkeys.registerShortcut(config: HotkeySetting): void */
	hotkeys.registerShortcut({
		name: 'my-module.my-hotkey', // <- Must be unique
		label: 'My Hotkey',
		get: () => game.settings.get('my-module', 'my-hotkey'),
		set: async value => await game.settings.set('my-module', 'my-hotkey', value),
		default: () => { return { key: hotkeys.keys.KeyQ, alt: false, ctrl: false, shift: false }; },
		handle: self => { console.log('You hit my custom hotkey!') },
	});
    /* Hotkeys.registerShortcut(config: HotkeySetting, throwOnError?: boolean): boolean */
    hotkeys.registerShortcut({...}, false);
});
```

```TypeScript
// TypeScript Implementation
Hooks.once('init', function() {
	/* Hotkeys.registerShortcut(config: HotkeySetting): void */
	hotkeys.registerShortcut({
		name: 'my-module.my-hotkey', // <- Must be unique
		label: 'My Hotkey',
		get: () => game.settings.get('my-module', 'my-hotkey'),
		set: async (value: KeyMap) => await game.settings.set('my-module', 'my-hotkey', value),
		default: () => { return { key: hotkeys.keys.KeyQ, alt: false, ctrl: false, shift: false }; },
		handle: (self: HotkeySetting) => { console.log('You hit my custom hotkey!') },
	});
    /* Hotkeys.registerShortcut(config: HotkeySetting, throwOnError?: boolean): boolean */
    hotkeys.registerShortcut({...}, false);
});
```

### Register a Group

This is only recommended if you have multiple hotkeys to group together. Otherwise hotkeys are added to the General Hotkeys section. If you add a group that has the same name as one that has already been registered, it will by default throw an error. If you do not wish an error to be thrown, you can pass `false` to the `throwOnError` parameter and it will instead simply return `true` for success and `false` on error.

```JavaScript
// JavaScript Implementation
Hooks.once('init', function() {
	// You must register the group before adding hotkeys to it
	/* Hotkeys.registerGroup(group: HotkeyGroup): void */
	hotkeys.registerGroup({
		name: 'my-module.my-group', // <- Must be unique
		label: 'My Awesome Group',
		description: 'Optional description goes here' // <-- Optional
	});
	/* Hotkeys.registerGroup(group: HotkeyGroup, throwOnError?: boolean): boolean */
	hotkeys.registerGroup({...}, false);

	/* Hotkeys.registerShortcut(config: HotkeySetting, throwOnError?: boolean) */
	hotkeys.registerShortcut({
		name: 'my-module.my-hotkey', // <- Must be unique
		label: 'My Hotkey',
		group: 'my-module.my-group', // <- target your custom group
		get: () => game.settings.get('my-module', 'my-hotkey'),
		set: async value => await game.settings.set('my-module', 'my-hotkey', value),
		default: () => { return { key: hotkeys.keys.KeyQ, alt: false, ctrl: false, shift: false }; },
		handle: self => { console.log('You hit my custom hotkey!') },
	});
});
```

```TypeScript
// TypeScript Implementation
Hooks.once('init', function() {
	// You must register the group before adding hotkeys to it
	/* Hotkeys.registerGroup(group: HotkeyGroup): void */
	hotkeys.registerGroup({
		name: 'my-module.my-group', // <- Must be unique
		label: 'My Awesome Group',
		description: 'Optional description goes here' // <-- Optional
	});
	/* Hotkeys.registerGroup(group: HotkeyGroup, throwOnError?: boolean): boolean */
	hotkeys.registerGroup({...}, false);

	/* Hotkeys.registerShortcut(config: HotkeySetting, throwOnError?: boolean) */
	hotkeys.registerShortcut({
		name: 'my-module.my-hotkey', // <- Must be unique
		label: 'My Hotkey',
		group: 'my-module.my-group', // <- target your custom group
		get: () => game.settings.get('my-module', 'my-hotkey'),
		set: async (value: KeyMap) => await game.settings.set('my-module', 'my-hotkey', value),
		default: () => { return { key: hotkeys.keys.KeyQ, alt: false, ctrl: false, shift: false }; },
		handle: (self: HotkeySetting) => { console.log('You hit my custom hotkey!') },
	});
});
```
