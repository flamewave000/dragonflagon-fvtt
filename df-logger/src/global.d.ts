// import '@types/jquery';
import 'fvtt-types';

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

declare interface Message {
	tog: boolean;
	msg: string;
}

declare interface FilePickerResponse {
	path?: string;
	message?: string;
}

declare interface Messages { LoginMsg: string[], LogoutMsg: string[] }

declare interface Payload {
	type: string,
	id: string,
	msg: string
}

// declare namespace ClientSettings {
// 	interface SettingConfig {
// 		name?: string,
// 		hint?: string,
// 		scope: 'client'|'world',
// 		config: boolean,
// 		requiresReload?: boolean
// 		type: any,
// 		choices?: { [key: string]: string },
// 		default?: "a",
// 		onChange?: (value: any) => void
// 	}
// }