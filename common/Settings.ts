
declare global {
	interface LenientGlobalVariableTypes {
		game: never;
		canvas: never;
	}
	interface String {
		/** Localizes the string via the global `game.i18n.localize()` function. */
		localize(): string
	}
	type AnyFunction = (...args: any) => any;
}

export default class SETTINGS {
	static MOD_NAME: string;
	static init(moduleName: string) {
		this.MOD_NAME = moduleName;
		if (!String.prototype.localize) {
			String.prototype.localize = function () {
				return game.i18n.localize(this.valueOf());
			};
		}
	}
	static register<T>(key: string, config: ClientSettings.PartialSettingConfig<T>) { game.settings.register(SETTINGS.MOD_NAME, key, config); }
	static registerMenu(key: string, config: ClientSettings.PartialSettingSubmenuConfig) { game.settings.registerMenu(SETTINGS.MOD_NAME, key, config); }
	static get<T>(key: string): T { return <T>game.settings.get(SETTINGS.MOD_NAME, key); }
	static async set<T>(key: string, value: T): Promise<T> { return await game.settings.set(SETTINGS.MOD_NAME, key, value); }
	static default<T>(key: string): T { return <T>game.settings.settings.get(SETTINGS.MOD_NAME + '.' + key).default; }
	/** helper for referencing a Typed constructor for the `type` field of a setting { type: SETTINGS.typeOf<MyClass>() } */
	static typeOf<T>(): ConstructorOf<T> { return Object as any; }
}
