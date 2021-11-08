import DFSceneJournal from './df-scene-journal';
import DFSceneNav from './df-scene-nav';
import DFSceneThumb from './df-scene-thumb';
import SETTINGS from "../../common/SETTINGS";
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