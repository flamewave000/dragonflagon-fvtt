import TableQuickRoll from './TableQuickRoll.js';
import FolderColours from './FolderColours.js';
import TextboxAutoFocus from './TextboxAutoFocus.js';
import BetterToggle from './BetterToggle.js';
import DayNightTransition from './DayNightTransition.js';
import DnD5eVehicleCapacity from './DnD5eVehicleCapacity.js';
import TemplateTargeting from './TemplateTargeting.js';

import SETTINGS from './libs/Settings.js';
SETTINGS.init('df-qol');


Hooks.once('init', function () {
	TableQuickRoll.init();
	FolderColours.init();
	TextboxAutoFocus.init();
	BetterToggle.init();
	DayNightTransition.init();
	DnD5eVehicleCapacity.init();
	TemplateTargeting.init();
});

Hooks.once('ready', function () {
	if (!game.modules.get('lib-wrapper')?.active) {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error(game.i18n.localize('DF-QOL.errorLibWrapperMissing'));
		return;
	}
	DnD5eVehicleCapacity.ready();
});
