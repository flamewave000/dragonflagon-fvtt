import { Hotkeys } from './Hotkeys.js';

export let hotkeys: typeof Hotkeys = undefined;

Hooks.once('init', function() {
	if ((<any>window).Hotkeys) {
		hotkeys = (<any>window).Hotkeys;
		(<any>hotkeys)._init();
		return;
	}

	hotkeys = Hotkeys
});