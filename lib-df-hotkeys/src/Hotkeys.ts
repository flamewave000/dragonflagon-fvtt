import { Keys } from "./Keys.js";

/** Simple KeyMap for a Hotkey */
export interface KeyMap {
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
export interface HotkeySetting {
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
export interface HotkeyGroup {
	/** Unique name of the group. */
	name: string;
	/** Displayed in the HTML header for the group. */
	label: string;
	/** Optional description of the group */
	description?: string;
}

export interface SettingGroup {
	name: string,
	label: string,
	description: string,
	items: HotkeySetting[]
}

export class Hotkeys {
	private static readonly GENERAL = 'general';
	private static _id_iterator = 0;
	private static _handlers = new Map<number, Map<string, HotkeySetting[]>>();
	private static _handled = new Set<string>();
	private static _settings = new Map<string, SettingGroup>();
	private static _settingsNames = new Set<string>();

	static get keys(): typeof Keys { return Keys; }

	private static _metaKey(event: KeyboardEvent): number {
		return (event.altKey ? 0x1 : 0) | (event.ctrlKey ? 0x2 : 0) | (event.shiftKey ? 0x4 : 0);
	}
	private static _isMeta(event: KeyboardEvent): boolean {
		return event.key === 'Shift'
			|| event.key === 'Ctrl'
			|| event.key === 'Alt';
	}
	private static _genId(meta: number, key: string): string {
		return `${++this._id_iterator}:${meta.toString(16)}:${key}`;
	}
	private static _parseId(id: string): { meta: number, key: string, id: number } {
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
		if (this._handled.has(event.code) || this._isMeta(event)) return;
		const metaKey = this._metaKey(event);
		const metaHandlers = this._handlers.get(metaKey);
		if (!metaHandlers) {
			this._handled.add(event.code);
			return;
		}
		const eventHandlers = metaHandlers.get(event.code);
		if (!eventHandlers) {
			this._handled.add(event.code);
			return;
		}
		event.preventDefault();
		eventHandlers.forEach(x => x.handle(x.name));
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
	 * @param throwIfExists If true, will throw an error if a config with that name already exists; default true.
	 * @returns The ID for the registration, used for De-Registration, or null if it failed to be registered.
	 */
	static registerShortcut(config: HotkeySetting, throwIfExists: boolean = false): boolean {
		if (this._settingsNames.has(config.name)) {
			if (throwIfExists) throw Error(`'${config.name}' has already been registered`);
			else return false;
		}
		this._settingsNames.add(config.name);
		if (!config.group)
			config.group = Hotkeys.GENERAL;
		else if (!this._settings.has(config.group)) {
			if (throwIfExists) throw Error(`'${config.group}' does not exist. Please make sure you call registerConfigGroup() before adding configurations for a custom group.`);
			else return false;
		}
		this._settings.get(config.group).items.push(config);

		const keyMap: KeyMap = config.get();
		const metaKey: number = (keyMap.alt ? 0x1 : 0) | (keyMap.ctrl ? 0x2 : 0) | (keyMap.shift ? 0x4 : 0);
		const metaHandlers: Map<string, HotkeySetting[]> = this._getOrDefault(this._handlers, metaKey, () => new Map());
		const eventHandlers: HotkeySetting[] = this._getOrDefault(metaHandlers, keyMap.key, () => []);
		eventHandlers.push(config)
		return true;
	}

	/**
	 * De-registers the keyboard shortcut previously registered via the ID number returned by the `Hotkeys.registerShortcut` function.
	 * @param id ID of the Hotkey to be de-registered.
	 * @returns true if a handler was found and removed; false if no handler was found for the given key.
	 */
	static deregisterShortcut(name: string): boolean {
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
	 * @param throwIfExists If true, will throw an error if a group already exists for the given name; default false.
	 * @returns true if the group has been registered; otherwise false if the group already exists.
	 */
	static registerGroup(group: HotkeyGroup, throwIfExists: boolean = false): boolean {
		if (this._settings.has(group.name)) {
			if (throwIfExists) throw Error(`'${group.name}' has already been registered`);
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
}
