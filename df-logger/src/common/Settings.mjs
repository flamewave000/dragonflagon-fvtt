/// <reference path="../../../node_modules/fvtt-types/src/configuration/globals.d.mts" />
export default class SETTINGS {
	/** @type {string} */static MOD_NAME;
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
	 * @param {ClientSettings.SettingConfig} config 
	 */
	static register(key, config) { game.settings.register(SETTINGS.MOD_NAME, key, config); }
	/**
	 * @param {string} key 
	 * @param {ClientSettings.SettingSubmenuConfig} config
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
	static default(key) { return game.settings.settings.get(SETTINGS.MOD_NAME + '.' + key).default; }
}
