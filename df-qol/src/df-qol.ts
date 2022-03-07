import TableQuickRoll from './TableQuickRoll';
import FolderColours from './FolderColours';
import TextboxAutoFocus from './TextboxAutoFocus';
import BetterToggle from './BetterToggle';
import DayNightTransition from './DayNightTransition';
import DnD5eVehicleCapacity from './DnD5eVehicleCapacity';

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

	SETTINGS.register('temp-migration-df-templates-flag', {
		config: false,
		scope: 'client',
		default: false,
		type: Boolean
	});

	if (!SETTINGS.get('temp-migration-df-templates-flag')) {
		Dialog.prompt({
			title: 'Template Features have Moved!',
			content: `<p>
	The template features that were once a part of <b>DF Quality of Life</b>
	have been removed and released as a new dedicated module. You can find
	<b><a href="https://foundryvtt.com/packages/df-templates">DF Template Enhancements</a></b>
	in the FoundryVTT Module list.
</p><p>
	Clicking the button below will make this message no longer display when FoundryVTT loads. If you
	want to keep seeing this message, please click the close button above.
</p>`,
			rejectClose: false,
			callback: () => SETTINGS.set('temp-migration-df-templates-flag', true)
		});
	}
});
