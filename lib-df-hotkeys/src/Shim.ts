import { _Hotkeys } from './Hotkeys.js';
import SETTINGS from './Settings.js';

export let hotkeys: typeof _Hotkeys = undefined;

Hooks.once('init', function () {
	// If the Hotkeys library is present and activated
	// @ts-expect-error
	if (window.Hotkeys) {
		// Just grab a reference to the global Hotkeys library and return
		hotkeys =
			// @ts-expect-error
			window.Hotkeys as typeof Hotkeys;
		return;
	}
	// There is no global definition of the Hotkeys Library
	// Generate the Shim and initialize it
	SETTINGS.init('lib-df-hotkeys');
	Object.defineProperty(_Hotkeys, 'isShim', {
		value: true,
		writable: false,
		configurable: false
	});
	hotkeys = _Hotkeys;
	// @ts-expect-error
	hotkeys._init();
});