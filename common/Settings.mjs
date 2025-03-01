/**
 * @typedef {object} SettingSubmenuConfig
 * @property {string} 				name		Primary text displayed as a labal for the input
 * @property {string} 				hint		Hint text displayed as a sublabel
 * @property {string} 				label		The text label used in the button
 * @property {string} 				icon		A Font Awesome icon used in the submenu button
 * @property {FormApplicationClass}	type		A FormApplication subclass which should be created
 * @property {boolean}				restricted	Restrict this submenu to gamemaster only?
 */

/**
 * @template Type
 * @typedef SettingsConfig
 * @property {string} 						name			Primary text displayed as a labal for the input
 * @property {string} 						hint			Hint text displayed as a sublabel
 * @property {"world" | "client"}			scope			This specifies a client-stored setting
 * @property {boolean}						config			This specifies that the setting appears in the configuration view
 * @property {() => Type}					type			The type constructor for the setting (ie: Boolean, String, Number, MyClass)
 * @property {boolean}						requiresReload 	This will prompt the GM to have all clients reload the application for the setting to take effect.
 * @property {Type}							default			The default value for the setting
 * @property { {[key: string]: string } }	choices			If choices are defined, the resulting setting will be a select menu. The {@link type} should be `String`
 * @property {(newValue: Type) => void}		onChange		A callback function which triggers when the setting is changed
 */

export default class SETTINGS {
	static MOD_NAME;
	/** @param {string} moduleName */
	static init(moduleName) {
		this.MOD_NAME = moduleName;
		if (!String.prototype.localize) {
			String.prototype.localize = function () {
				return game.i18n.localize(this.valueOf());
			};
		}
	}
	/**
	 * @param {string} key
	 * @param {SettingsConfig<*>} config
	 */
	static register(key, config) { game.settings.register(SETTINGS.MOD_NAME, key, config); }
	/**
	 * @param {string} key
	 * @param {SettingSubmenuConfig} config
	 */
	static registerMenu(key, config) { game.settings.registerMenu(SETTINGS.MOD_NAME, key, config); }
	/**
	 * @param {string} key
	 * @returns {any}
	 */
	static get(key) { return game.settings.get(SETTINGS.MOD_NAME, key); }
	/**
	 * @param {string} key
	 * @param {any} value
	 * @returns {Promise<any>}
	 */
	static async set(key, value) { return await game.settings.set(SETTINGS.MOD_NAME, key, value); }
	/**
	 * @param {string} key
	 * @returns {any}
	 */
	static default(key) { return game.settings.settings.get((SETTINGS.MOD_NAME + '.' + key)).default; }
}