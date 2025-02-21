import TableQuickRoll from './TableQuickRoll.mjs';
import FolderColours from './FolderColours.mjs';
import BetterToggle from './BetterToggle.mjs';
import DayNightTransition from './DayNightTransition.mjs';
import DnD5eBetterAttackDialog from './DnD5eBetterAttackDialog.mjs';
// import DnD5eVehicleCapacity from './DnD5eVehicleCapacity.mjs';

import SETTINGS from "../common/Settings.mjs";
import TokenLock from './TokenLock.mjs';
SETTINGS.init('df-qol');


Hooks.once('init', function () {
	TableQuickRoll.init();
	FolderColours.init();
	BetterToggle.init();
	DayNightTransition.init();
	DnD5eBetterAttackDialog.init();
	// DnD5eVehicleCapacity.init();
	TokenLock.init();
});

Hooks.once('ready', function () {
	if (!game.modules.get('lib-wrapper')?.active) {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error(game.i18n.localize('DF-QOL.errorLibWrapperMissing'));
		return;
	}
	// DnD5eVehicleCapacity.ready();
	TokenLock.ready();
});
