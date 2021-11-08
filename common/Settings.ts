export default class SETTINGS {
	static get MOD_NAME(): string { return this._MOD_NAME; }
	private static _MOD_NAME: string;
	static init(modName: string) {
		this._MOD_NAME = modName;
	}
	static register<T>(key: string, config: ClientSettings.PartialSetting<T>) { game.settings.register(SETTINGS._MOD_NAME, key, config); }
	static get<T>(key: string): T { return <T>game.settings.get(SETTINGS._MOD_NAME, key); }
	static async set<T>(key: string, value: T): Promise<T> { return await game.settings.set(SETTINGS._MOD_NAME, key, value); }
	static default<T>(key: string): T { return <T>game.settings.settings.get(`${SETTINGS._MOD_NAME}.${key}`).default; }
	static typeOf<T>(): ConstructorOf<T> { return Object as any; }
}
