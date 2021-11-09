
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

export default function () {
	if (!String.prototype.localize) {
		String.prototype.localize = function () {
			return game.i18n.localize(this.valueOf());
		};
	}
}
