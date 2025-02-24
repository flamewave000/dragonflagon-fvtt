import DFSceneJournal from './df-scene-journal.mjs';
import DFSceneNav from './df-scene-nav.mjs';
import DFSceneThumb from './df-scene-thumb.mjs';
import SETTINGS from "../common/Settings.mjs";
SETTINGS.init('df-scene-enhance');

Hooks.once('init', function() {
	DFSceneJournal.init();
	DFSceneNav.init();
	DFSceneThumb.init();
});
Hooks.once('ready', function() {
	if (!game.modules.get('lib-wrapper')?.active) {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error(game.i18n.localize('DF-SCENE-ENHANCE.errorLibWrapperMissing'));
		return;
	}
	DFSceneJournal.ready();
	DFSceneNav.ready();
	DFSceneThumb.ready();
});