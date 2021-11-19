import TableQuickRoll from './TableQuickRoll';
import FolderColours from './FolderColours';
import TextboxAutoFocus from './TextboxAutoFocus';
import BetterToggle from './BetterToggle';
import DayNightTransition from './DayNightTransition';
import DnD5eVehicleCapacity from './DnD5eVehicleCapacity';
import TemplateTargeting from './TemplateTargeting';

import SETTINGS from "../../common/Settings";
import TokenLock from './TokenLock';
SETTINGS.init('df-qol');


Hooks.once('init', function () {
	TableQuickRoll.init();
	FolderColours.init();
	TextboxAutoFocus.init();
	BetterToggle.init();
	DayNightTransition.init();
	DnD5eVehicleCapacity.init();
	TemplateTargeting.init();
	TokenLock.init();
});

Hooks.once('ready', function () {
	if (!game.modules.get('lib-wrapper')?.active) {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error(game.i18n.localize('DF-QOL.errorLibWrapperMissing'));
		return;
	}
	DnD5eVehicleCapacity.ready();
	TokenLock.ready();
});
