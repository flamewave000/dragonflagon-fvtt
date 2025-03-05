/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../common/foundry.d.ts" />
/// <reference path="./types.d.ts" />
import SETTINGS from "../common/Settings.mjs";
// import AngleSnaps from "./AngleSnaps.mjs";
import SnapIntersect from "./SnapIntersect.mjs";
import SquareTemplate from "./SquareTemplate.mjs";
import TemplateTargeting from "./TemplateTargeting.mjs";

SETTINGS.init('df-templates');

Hooks.once('init', function () {
	TemplateTargeting.init();
	SnapIntersect.init();
	// AngleSnaps.init();
	SquareTemplate.init();

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
	// AngleSnaps.ready();

	if (game.dnd5e) {
		libWrapper.register(SETTINGS.MOD_NAME, 'game.dnd5e.canvas.AbilityTemplate.prototype.activatePreviewListeners',
			function (/**@type {(il: any) => any}*/ wrapper, /**@type {CanvasLayer}*/ initialLayer) {
				this._onMovePlacement_ORIG = this._onMovePlacement;
				this._onMovePlacement = SnapIntersect.handleDnD5eAbilityTemplate.bind(this);
				// this._onRotatePlacement_ORIG = this._onRotatePlacement;
				// this._onRotatePlacement = AngleSnaps.handleDnD5eAbilityTemplate.bind(this);
				return wrapper(initialLayer);
			}, 'WRAPPER');
	}
});
