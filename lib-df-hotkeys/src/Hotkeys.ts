import { Keys } from "./Keys.js";

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
	/** The default setting for this hotkey */
	default(): KeyMap;
	/** Function for retrieving the current hotkey setting */
	get(): KeyMap;
	/** Function for saving the new hotkey setting */
	set(value: KeyMap): Promise<KeyMap>;
	/** Function to handle the execution of the hotkey */
	/** @deprecated Use HotkeySetting.onKeyDown and HotkeySetting.onKeyUp */
	handle?(self: HotkeySetting): void;
	/**
	 * Function to handle the execution of the Hot Key Down event.
	 * @param self Convenience reference to this HotkeySetting object
	 * @param repeated	Optional: This will only be defined if `repeat: true` has been set.
	 * 					It will be false on the first Key Down event, but true on any subsequent
	 * 					Key Down events caused by the user holding the key down.
	 */
	onKeyDown?(self: HotkeySetting, repeated?: boolean): void;
	/**
	 * Function to handle the execution of the Hot Key Up event.
	 * @param self Convenience reference to this HotkeySetting object
	 */
	onKeyUp?(self: HotkeySetting): void;
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

export class Hotkeys {
	private static readonly GENERAL = 'general';
	private static _id_iterator = 0;
	private static _handlers = new Map<number, Map<String, HotkeySetting[]>>();
	private static _handled = new Set<String>();
	private static _settings = new Map<String, SettingGroup>();
	private static _settingsNames = new Set<String>();
	static readonly keys = new Keys();

	private static _metaKey(event: KeyboardEvent): number {
		return (event.altKey ? 0x1 : 0) | (event.ctrlKey ? 0x2 : 0) | (event.shiftKey ? 0x4 : 0);
	}
	private static _isMeta(event: KeyboardEvent): boolean {
		return event.key === 'Shift'
			|| event.key === 'Ctrl'
			|| event.key === 'Alt';
	}
	private static _genId(meta: number, key: String): String {
		return `${++this._id_iterator}:${meta.toString(16)}:${key}`;
	}
	private static _parseId(id: String): { meta: number, key: String, id: number } {
		const first = id.indexOf(':');
		const second = id.indexOf(':', first + 1);
		const idNum = id.substr(0, first);
		const meta = id.substr(first + 1, second - (first + 1));
		const key = id.substr(second + 1, id.length - (second + 1));
		return {
			id: parseInt(idNum),
			meta: parseInt(meta, 16),
			key: key
		};
	}
	private static _handleKeyDown(event: KeyboardEvent) {
		if (/*this._handled.has(event.code) || */this._isMeta(event)) return;
		const metaKey = this._metaKey(event);
		const metaHandlers = this._handlers.get(metaKey);
		if (!metaHandlers) {
			this._handled.add(event.code);
			return;
		}
		const eventHandlers = metaHandlers.get(event.code);
		if (!eventHandlers || eventHandlers.length == 0) {
			this._handled.add(event.code);
			return;
		}
		event.preventDefault();
		for (let handler of eventHandlers) {
			if (event.repeat && !handler.repeat) continue;
			if (!!handler.onKeyDown) handler.repeat ? handler.onKeyDown(handler, event.repeat ?? false) : handler.onKeyDown(handler)
			else if (!!handler.handle) handler.handle(handler);
		}
		this._handled.add(event.code);
	}
	private static _handleKeyUp(event: KeyboardEvent) {
		if (!this._handled.has(event.code)) return;
		this._handled.delete(event.code);
	}
	private static _init() {
		window.addEventListener("keydown", this._handleKeyDown.bind(this));
		window.addEventListener("keyup", this._handleKeyUp.bind(this));
		this._settings.set(Hotkeys.GENERAL, {
			name: Hotkeys.GENERAL,
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
	 * Registers a new hotkey configuration.
	 * @param config Hotkey configuration.
	 * @param throwOnFail	If true, will throw an error if a config with that name already exists, or 
	 *						an explicit group was given but does not exist; default true.
	 * @returns The ID for the registration, used for De-Registration, or null if it failed to be registered.
	 */
	static registerShortcut(config: HotkeySetting, throwOnFail: boolean = true): boolean {
		const errors: string[] = [];
		// Validate our data structure
		if (typeof (config.name) !== 'string' && !((<any>config.name) instanceof String))
			errors.push('Hotkeys.registerShortcut(): config.name must be a string!');
		if (typeof (config.label) !== 'string' && !((<any>config.label) instanceof String))
			errors.push('Hotkeys.registerShortcut(): config.label must be a string!');
		if (config.group !== undefined && config.group !== null && typeof (config.group) !== 'string' && !((<any>config.group) instanceof String))
			errors.push('Hotkeys.registerShortcut(): config.group must be null, undefined, or a string!');
		if (!(config.get instanceof Function))
			errors.push('Hotkeys.registerShortcut(): config.get must be a Function!');
		if (!(config.set instanceof Function))
			errors.push('Hotkeys.registerShortcut(): config.set must be a Function!');
		if (!(config.default instanceof Function))
			errors.push('Hotkeys.registerShortcut(): config.default must be a Function!');
		if (!!config.handle && !(config.handle instanceof Function))
			errors.push('Hotkeys.registerShortcut(): config.handle must be a Function!');
		if (!!config.onKeyDown && !(config.onKeyDown instanceof Function))
			errors.push('Hotkeys.registerShortcut(): config.onKeyDown must be a Function!');
		if (!!config.onKeyUp && !(config.onKeyUp instanceof Function))
			errors.push('Hotkeys.registerShortcut(): config.onKeyUp must be a Function!');
		if (this._settingsNames.has(config.name))
			errors.push(`Hotkeys.registerShortcut(): '${config.name}' hotkey has already been registered!`);
		if (errors.length > 0) {
			if (throwOnFail)
				throw Error(errors.join(',\n'));
			this._printErrors(errors, new Error().stack);
			return false;
		}

		if (!!config.handle) {
			console.warn(`Hotkeys: The configuration "${config.name}" is using the deprecated 'handle()' function. Please use 'onKeyDown' and/or 'onKeyUp' instead.\nThis function will still work for now, but will be removed in a later update.`)
		}

		this._settingsNames.add(config.name);
		if (!config.group)
			config.group = Hotkeys.GENERAL;
		else if (!this._settings.has(config.group)) {
			if (throwOnFail) throw Error(`Hotkeys.registerShortcut(): '${config.group}' group does not exist. Please make sure you call Hotkeys.registerGroup() before adding hotkeys for a custom group.`);
			else return false;
		}
		this._settings.get(config.group).items.push(config);

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
		for (let group of this._settings.values()) {
			const idx = group.items.findIndex(x => x.name === name);
			if (idx < 0) continue;
			group.items.splice(idx, 1);
			found = true;
			break;
		}
		if (!found) return false;
		for (let meta of this._handlers.values()) {
			for (let handlers of meta.values()) {
				const idx = handlers.findIndex(x => x.name === name);
				if (idx < 0) continue;
				handlers.splice(idx, 1);
			}
		}
		return found;
	}

	/**
	 * Registers a new Settings Group for hotkeys.
	 * @param group Group settings, requiring the name and label. Description is optional.
	 * @param throwOnFail If true, will throw an error if a group already exists for the given name; default true.
	 * @returns true if the group has been registered; otherwise false if the group already exists.
	 */
	static registerGroup(group: HotkeyGroup, throwOnFail: boolean = true): boolean {
		// Validate HotkeyGroup data structure
		const errors: string[] = [];
		if (typeof (group.name) !== 'string' && !((<any>group.name) instanceof String))
			errors.push('Hotkeys.registerGroup(): group.name must be a string!');
		if (typeof (group.label) !== 'string' && !((<any>group.label) instanceof String))
			errors.push('Hotkeys.registerGroup(): group.label must be a string!');
		if (group.description !== undefined && group.description !== null && typeof (group.description) !== 'string' && !((<any>group.description) instanceof String))
			errors.push('Hotkeys.registerGroup(): group.description must be null, undefined, or a string!');
		if (this._settings.has(group.name))
			errors.push(`Hotkeys.registerGroup(): '${group.name}' group has already been registered!`);
		if (errors.length > 0) {
			if (throwOnFail)
				throw Error(errors.join(',\n'));
			this._printErrors(errors, new Error().stack);
			return false;
		}

		this._settings.set(group.name, {
			name: group.name,
			label: group.label,
			description: group.description ?? '',
			items: []
		});
		return true;
	}

	private static _printErrors(errors: string[], stack: string) {
		console.error(errors.join(',\n') + '\n' + stack);
	}
}
