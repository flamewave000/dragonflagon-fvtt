import SETTINGS from "../../common/Settings";
import SnapIntersect from "./SnapIntersect";
import TemplateTargeting from "./TemplateTargeting";

SETTINGS.init('df-templates');

Hooks.once('init', function () {
	TemplateTargeting.init();
	SnapIntersect.init();

	// DEBUG SETTINGS
	SETTINGS.register('template-debug', {
		config: true,
		scope: 'client',
		name: 'DF_TEMPLATES.DebugName',
		hint: 'DF_TEMPLATES.DebugHint',
		type: Boolean,
		default: false
	});
});

Hooks.once('ready', function () {
	if (!game.modules.get('lib-wrapper')?.active) {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error(game.i18n.localize('DF-QOL.errorLibWrapperMissing'));
		return;
	}
	TemplateTargeting.ready();
	SnapIntersect.ready();
});
