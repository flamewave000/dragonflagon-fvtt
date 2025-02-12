export default class SETTINGS {
	static MOD_NAME;
	static init(moduleName) {
		this.MOD_NAME = moduleName;
		if (!String.prototype.localize) {
			String.prototype.localize = function () {
				return game.i18n.localize(this.valueOf());
			};
		}
	}
	static register(key, config) { game.settings.register(SETTINGS.MOD_NAME, key, config); }
	static registerMenu(key, config) { game.settings.registerMenu(SETTINGS.MOD_NAME, key, config); }
	static get(key) { return game.settings.get(SETTINGS.MOD_NAME, key); }
	static async set(key, value) { return await game.settings.set(SETTINGS.MOD_NAME, key, value); }
	static default(key) { return game.settings.settings.get((SETTINGS.MOD_NAME + '.' + key)).default; }
}