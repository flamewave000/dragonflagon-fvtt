import SETTINGS from "../../common/Settings";
import TemplateTargeting from "./TemplateTargeting";

SETTINGS.init('df-templates');

Hooks.once('init', function () {
	TemplateTargeting.init();
});

Hooks.once('ready', function () {
	if (!game.modules.get('lib-wrapper')?.active) {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error(game.i18n.localize('DF-QOL.errorLibWrapperMissing'));
		return;
	}
	TemplateTargeting.ready();
});
