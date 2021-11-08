import GroupFilter from "./GroupFilter";
import { Keys } from "./Keys";
import SETTINGS from "./Settings";

/** Simple KeyMap for a Hotkey */
export interface KeyMap {
	/** The key code to be listned for */
	key: string | String;
	/** Does the Alt key need to be pressed at the same time? */
	alt: boolean;
	/** Does the Ctrl key need to be pressed at the same time? */
	ctrl: boolean;
	/** Does the Shift key need to be pressed at the same time? */
	shift: boolean;
}
/** Hotkey Configuration Registration */
export interface HotkeySetting {
	/** optional: Group to be included in with their own header. Default: General Group */
	group?: string | String;
	/** Unique variable name to be used in the layout. Recommend: 'module-name.myHotkey' */
	name: string | String;
	/** Label to be displayed in the layout. This will be localized when injected into the HTML */
	label: string | String;
	/**
	 * Accept repeated KeyDown events, this occurs if the user is holding the key down, it will
	 * send additional events that are spaced out according to the user's key press repeat settings.
	 */
	repeat?: boolean;
	/** The default setting for this hotkey, can be a static KeyMap, or a function that returns the default. */
	default: KeyMap | (() => KeyMap);
	/** Function for retrieving the current hotkey setting. If defined, you must also provide a `set` function. */
	get?(): KeyMap;
	/** Function for saving the new hotkey setting. If defined, you must also provide a `get` function */
	set?(value: KeyMap): Promise<KeyMap>;
	/** Function to handle the execution of the hotkey */
	/** @deprecated Use HotkeySetting.onKeyDown and HotkeySetting.onKeyUp */
	handle?(self: HotkeySetting): void;
	/**
	 * Function to handle the execution of the Hot Key Down event.
	 * @param self Convenience reference to this HotkeySetting object
	 * @param event The original KeyboardEvent
	 * @param repeated	Optional: This will only be defined if `repeat: true` has been set.
	 * 					It will be false on the first Key Down event, but true on any subsequent
	 * 					Key Down events caused by the user holding the key down.
	 */
	onKeyDown?(self: HotkeySetting, event: KeyboardEvent, repeated?: boolean): void;
	/**
	 * Function to handle the execution of the Hot Key Up event.
	 * @param self Convenience reference to this HotkeySetting object
	 * @param event The original KeyboardEvent
	 */
	onKeyUp?(self: HotkeySetting, event: KeyboardEvent): void;
}

/** Hotkey Group Configuration */
export interface HotkeyGroup {
	/** Unique name of the group. */
	name: string | String;
	/** Displayed in the HTML header for the group. */
	label: string | String;
	/** Optional description of the group */
	description?: string | String;
}

interface SettingGroup {
	name: string | String,
	label: string | String,
	description: string | String,
	items: HotkeySetting[]
}

/** This is just a helper for printing the list of errors with a call stack */
function printErrors(errors: string[]) {
	console.error(errors.join(',\n') + '\n' + (new Error().stack));
}

export class _Hotkeys {
	private static readonly GENERAL = 'general';
	private static _handlers = new Map<number, Map<String, HotkeySetting[]>>();
	private static _handled = new Set<String>();
	private static _settings = new Map<String, SettingGroup>();
	private static _settingsNames = new Set<String>();
	static readonly keys = new Keys();
	static get isShim(): boolean { return false; }

	private static _metaKey(event: KeyboardEvent): number {
		return (event.altKey ? 0x1 : 0) | (event.ctrlKey ? 0x2 : 0) | (event.shiftKey ? 0x4 : 0);
	}
	private static _isMeta(event: KeyboardEvent): boolean {
		return event.key === 'Shift' || event.key === 'Ctrl' || event.key === 'Alt';
	}
	private static _handleKeyDown(event: KeyboardEvent) {
		// Ignore the regular meta keys Shift, Ctrl, and Alt
		if (this._isMeta(event)) return;
		// Verify we are not focused on an input or text field, or an editable element
		if (document.activeElement instanceof HTMLInputElement) return;
		if (document.activeElement instanceof HTMLTextAreaElement) return;
		if (document.activeElement.getAttribute('contenteditable') === 'true') return;
		// generate the meta key bit flag
		const metaKey = this._metaKey(event);
		// Get the hotkeys that use the meta key combination
		const metaHandlers = this._handlers.get(metaKey);
		// If there are no hotkeys in this meta-group, return
		if (!metaHandlers || metaHandlers.size == 0) return;
		// Get the event handlers for the given key press
		const eventHandlers = metaHandlers.get(event.code);
		// If there are no handlers for this key, return
		if (!eventHandlers || eventHandlers.length == 0) return;
		// Prevent propagation of the event to other handlers
		event.preventDefault();
		// Make a note that this key has been processed
		this._handled.add(event.code);
		// Notify the event handlers of the key press
		for (let handler of eventHandlers) {
			if (!handler.onKeyDown) continue;
			if (event.repeat && !handler.repeat) continue;
			handler.onKeyDown(handler, event, event.repeat);
		}
	}
	private static _handleKeyUp(event: KeyboardEvent) {
		// If we don't have a Down event for this key, ignore it
		if (!this._handled.has(event.code)) return;
		// Remove the down event from the handled list
		this._handled.delete(event.code);
		// generate the meta key bit flag
		const metaKey = this._metaKey(event);
		// Get the hotkeys that use the meta key combination
		const metaHandlers = this._handlers.get(metaKey);
		// If there are no hotkeys in this meta-group, return
		if (!metaHandlers || metaHandlers.size == 0) return;
		// Get the event handlers for the given key release
		const eventHandlers = metaHandlers.get(event.code);
		// If there are no handlers for this key, return
		if (!eventHandlers || eventHandlers.length == 0) return;
		// Prevent propagation of the event to other handlers
		event.preventDefault();
		// Make a note that this key has been processed
		this._handled.add(event.code);
		// Notify the event handlers of the key release
		for (let handler of eventHandlers) {
			if (!handler.onKeyUp) continue;
			handler.onKeyUp(handler, event);
		}
	}

	private static _init() {
		window.addEventListener("keydown", this._handleKeyDown.bind(this));
		window.addEventListener("keyup", this._handleKeyUp.bind(this));
		this._settings.set(_Hotkeys.GENERAL, {
			name: _Hotkeys.GENERAL,
			label: 'DF_HOTKEYS.GeneralGroup_Label',
			description: '',
			items: []
		});
	}
	private static _getOrDefault<K, V>(map: Map<K, V>, key: K, defValue: () => V): V {
		if (map.has(key)) return map.get(key);
		map.set(key, defValue());
		return map.get(key);
	}

	/**
	 * Displays the HotkeyConfig settings but filters the options available to the ones defined by filter.
	 * @param title The title for the menu window.
	 * @param filters The filters to apply to the HotkeyConfig dialog.
	 */
	static async showConfig(title: string, filters: (string | RegExp | GroupFilter)[]) {
		throw new Error("The Shim does not contain the HotkeysConfig application. Please only use this function when DF Hotkeys is activated.");
	}
	/**
	 * Returns a specialized constructor for the HotkeyConfig settings with filtering.
	 * @param title The title for the menu window.
	 * @param filters The filters to apply to the HotkeyConfig dialog.
	 */
	static createConfig(title: string, filters: (string | RegExp | GroupFilter)[]): any {
		throw new Error("The Shim does not contain the HotkeysConfig application. Please only use this function when DF Hotkeys is activated.");
	}

	/**
	 * Registers a new hotkey configuration.
	 * @param config Hotkey configuration.
	 * @param throwOnFail	If true, will throw an error if a config with that name already exists, or 
	 *						an explicit group was given but does not exist; default true.
	 * @throws Error if the hotkey already exists, or the config is malformed.
	 * @returns The ID for the registration, used for De-Registration, or null if it failed to be registered.
	 */
	static registerShortcut(config: HotkeySetting, throwOnFail: boolean = true): boolean {
		const errors: string[] = [];
		// Validate our data structure
		if (typeof (config.name) !== 'string' && !(config.name instanceof String))
			errors.push('Hotkeys.registerShortcut(): config.name must be a string!');
		if (config.name.includes('::'))
			errors.push('Hotkeys.registerShortcut(): config.name cannot contain "::"');
		if (typeof (config.label) !== 'string' && !(config.label instanceof String))
			errors.push('Hotkeys.registerShortcut(): config.label must be a string!');
		if (config.group !== undefined && config.group !== null && typeof (config.group) !== 'string' && !(config.group instanceof String))
			errors.push('Hotkeys.registerShortcut(): config.group must be null, undefined, or a string!');
		if (!!config.get && !(config.get instanceof Function))
			errors.push('Hotkeys.registerShortcut(): config.get must be a Function!');
		if (!!config.set && !(config.set instanceof Function))
			errors.push('Hotkeys.registerShortcut(): config.set must be a Function!');
		if (!config.set !== !config.get)
			errors.push('Hotkeys.registerShortcut(): If either `get` or `set` is defined, both must be defined!')
		if (!(config.default instanceof Function) && (config.default.key === undefined || config.default.alt === undefined || config.default.ctrl === undefined || config.default.shift === undefined))
			errors.push('Hotkeys.registerShortcut(): config.default must be either a Function or a KeyMap!');
		if (!!config.handle && !(config.handle instanceof Function))
			errors.push('Hotkeys.registerShortcut(): DEPRECATED! config.handle must be a Function!');
		if (!!config.onKeyDown && !(config.onKeyDown instanceof Function))
			errors.push('Hotkeys.registerShortcut(): config.onKeyDown must be a Function!');
		if (!!config.onKeyUp && !(config.onKeyUp instanceof Function))
			errors.push('Hotkeys.registerShortcut(): config.onKeyUp must be a Function!');
		if (this._settingsNames.has(config.name))
			errors.push(`Hotkeys.registerShortcut(): '${config.name}' hotkey has already been registered!`);
		// If there were errors report them
		if (errors.length > 0) {
			if (throwOnFail) throw Error(errors.join(',\n'));
			printErrors(errors);
			return false;
		}
		// Post a warning in the console that the `handle` function is deprecated
		if (!!config.handle) {
			console.warn(`Hotkeys: The configuration "${config.name}" is using the deprecated 'handle()' function. Please use 'onKeyDown' and/or 'onKeyUp' instead.\nThis function will still work for now, but will be removed in a later update.`)
		}
		// If there is no `get` function defined, host the hotkey setting
		if (!config.get) {
			// Register a setting for the hotkey
			SETTINGS.register<KeyMap>('KEYMAP.' + config.name, {
				scope: 'world',
				config: false,
				type: SETTINGS.typeOf(),
				default: config.default instanceof Function ? config.default() : config.default
			});
			// Bind the `get` and `set` to the new setting
			config.get = () => SETTINGS.get('KEYMAP.' + config.name);
			config.set = value => SETTINGS.set('KEYMAP.' + config.name, value);
		}
		// Add the new configuration name to the Quick Lookup Table
		this._settingsNames.add(config.name);
		// If there is no group defined, add it to the general group
		if (!config.group)
			config.group = _Hotkeys.GENERAL;
		// Otherwise, if a custom group is added, verify that it exists
		else if (!this._settings.has(config.group)) {
			if (throwOnFail) throw Error(`Hotkeys.registerShortcut(): '${config.group}' group does not exist. Please make sure you call Hotkeys.registerGroup() before adding hotkeys for a custom group.`);
			else return false;
		}
		// Add the configuration to the assigned group
		this._settings.get(config.group).items.push(config);

		// Add the configuration to the event handlers registry
		const keyMap: KeyMap = config.get();
		const metaKey: number = (keyMap.alt ? 0x1 : 0) | (keyMap.ctrl ? 0x2 : 0) | (keyMap.shift ? 0x4 : 0);
		const metaHandlers: Map<String, HotkeySetting[]> = this._getOrDefault(this._handlers, metaKey, () => new Map());
		const eventHandlers: HotkeySetting[] = this._getOrDefault(metaHandlers, keyMap.key, () => []);
		eventHandlers.push(config)
		return true;
	}

	/**
	 * De-registers the keyboard shortcut previously registered via the ID number returned by the `Hotkeys.registerShortcut` function.
	 * @param id ID of the Hotkey to be de-registered.
	 * @returns true if a handler was found and removed; false if no handler was found for the given key.
	 */
	static deregisterShortcut(name: string | String): boolean {
		var found = false;
		// Remove the configuration from the groups
		for (let group of this._settings.values()) {
			const idx = group.items.findIndex(x => x.name === name);
			if (idx < 0) continue;
			group.items.splice(idx, 1);
			found = true;
			break;
		}
		// If a config with the given name could not be found in the groups, return failure
		if (!found) return false;
		// Remove the configuration from the Meta Key list
		for (let meta of this._handlers.values()) {
			for (let handlers of meta.values()) {
				const idx = handlers.findIndex(x => x.name === name);
				if (idx < 0) continue;
				handlers.splice(idx, 1);
			}
		}
		// Return success
		return true;
	}

	/**
	 * Registers a new Settings Group for hotkeys.
	 * @param group Group settings, requiring the name and label. Description is optional.
	 * @param throwOnFail If true, will throw an error if a group already exists for the given name; default true.
	 * @throws Error if the group already exists, or the config is malformed.
	 * @returns true if the group has been registered; otherwise false if the group already exists.
	 */
	static registerGroup(group: HotkeyGroup, throwOnFail: boolean = true): boolean {
		// Validate HotkeyGroup data structure
		const errors: string[] = [];
		if (typeof (group.name) !== 'string' && !(group.name instanceof String))
			errors.push('Hotkeys.registerGroup(): group.name must be a string!');
		if (group.name.includes('::'))
			errors.push('Hotkeys.registerGroup(): group.name cannot contain "::"');
		if (typeof (group.label) !== 'string' && !(group.label instanceof String))
			errors.push('Hotkeys.registerGroup(): group.label must be a string!');
		if (group.description !== undefined && group.description !== null && typeof (group.description) !== 'string' && !(group.description instanceof String))
			errors.push('Hotkeys.registerGroup(): group.description must be null, undefined, or a string!');
		if (this._settings.has(group.name))
			errors.push(`Hotkeys.registerGroup(): '${group.name}' group has already been registered!`);
		// If there were errors report them
		if (errors.length > 0) {
			if (throwOnFail) throw Error(errors.join(',\n'));
			printErrors(errors);
			return false;
		}
		// Register the new group
		this._settings.set(group.name, {
			name: group.name,
			label: group.label,
			description: group.description ?? '',
			items: []
		});
		return true;
	}
}
