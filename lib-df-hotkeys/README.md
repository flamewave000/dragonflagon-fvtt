# DragonFlagon Hotkeys Library

Library for Foundry VTT module developers to use. It allows modules to register their own Keyboard Shortcuts and gives way for users to then customize those hotkey bindings.

## How to Use

All modules that wish to use the library should declare a dependency in their manifest as follows:

```json
"dependencies": [
	{
		"name": "lib-df-hotkeys"
	}
]
```

### Important Data Types

#### KeyMap

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
	handle(name: string): void;
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

To register a new Hotkey, simply add the following to your code. It must be during or after the `init` event.

JavaScript:
```JavaScript
Hooks.once('init', function() {
	/* Hotkeys.registerShortcut(config: HotkeySetting) */
	hotkeys.registerShortcut({
		name: 'my-module.my-hotkey', // <- Must be unique
		label: 'My Hotkey',
		get: () => game.settings.get('my-module', 'my-hotkey'),
		set: async value => await game.settings.set('my-module', 'my-hotkey', value),
		default: () => { return { key: hotkeys.keys.KeyQ, alt: false, ctrl: false, shift: false }; },
		handle: name => { console.log('You hit my custom hotkey!') },
	});
});
```

TypeScript:
```TypeScript
Hooks.once('init', function() {
	/* Hotkeys.registerShortcut(config: HotkeySetting) */
	hotkeys.registerShortcut({
		name: 'my-module.my-hotkey', // <- Must be unique
		label: 'My Hotkey',
		get: () => game.settings.get('my-module', 'my-hotkey'),
		set: async (value: KeyMap) => await game.settings.set('my-module', 'my-hotkey', value),
		default: () => { return { key: hotkeys.keys.KeyQ, alt: false, ctrl: false, shift: false }; },
		handle: (name: string) => { console.log('You hit my custom hotkey!') },
	});
});
```

### Register a Group

This is only recommended if you have multiple hotkeys to group together. Otherwise hotkeys are added to the General Hotkeys section.

JavaScript:
```JavaScript
Hooks.once('init', function() {
	// You must register the group before adding hotkeys to it
	/* Hotkeys.registerGroup(group: HotkeyGroup) */
	hotkeys.registerGroup({
		name: 'my-module.my-group', // <- Must be unique
		label: 'My Awesome Group',
		description: 'Optional description goes here' // <-- Optional
	});

	/* Hotkeys.registerShortcut(config: HotkeySetting) */
	hotkeys.registerShortcut({
		name: 'my-module.my-hotkey', // <- Must be unique
		label: 'My Hotkey',
		group: 'my-module.my-group', // <- target your custom group
		get: () => game.settings.get('my-module', 'my-hotkey'),
		set: async value => await game.settings.set('my-module', 'my-hotkey', value),
		default: () => { return { key: hotkeys.keys.KeyQ, alt: false, ctrl: false, shift: false }; },
		handle: name => { console.log('You hit my custom hotkey!') },
	});
});
```

##### [![become a patron](../.assets/patreon-image.png)](https://www.patreon.com/bePatron?u=46113583) If you want to support me or just help me buy doggy treats! Also, you can keep up to date on what I'm working on. I will be announcing any new modules or pre-releases there for anyone wanting to help me test things out!
