import { Hotkeys } from './Hotkeys.js';
import SETTINGS from './Settings.js';

export let hotkeys: typeof Hotkeys = undefined;

Hooks.once('init', function() {
	if ((<any>window).Hotkeys) {
		hotkeys = (<any>window).Hotkeys;
		return;
	}
	SETTINGS.init('lib-df-hotkeys');
	hotkeys = Hotkeys;
	(<any>hotkeys)._init();
});