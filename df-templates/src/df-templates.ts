import SETTINGS from "../../common/Settings";
import AngleSnaps from "./AngleSnaps";
import DnD5eAbilityTemplateHandlers from "./DnD5eAbilityTemplateHandlers";
import SnapIntersect from "./SnapIntersect";
import SquareTemplate from "./SquareTemplate";
import TemplateTargeting from "./TemplateTargeting";

SETTINGS.init('df-templates');

Hooks.once('init', function () {
	TemplateTargeting.init();
	SnapIntersect.init();
	AngleSnaps.init();
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
	AngleSnaps.ready();

	if ((game as any).dnd5e) {
		libWrapper.register(SETTINGS.MOD_NAME, 'game.dnd5e.canvas.AbilityTemplate.prototype.activatePreviewListeners',
			function (this: any, initialLayer: CanvasLayer) {
				const handlers: DnD5eAbilityTemplateHandlers = {};

				/***************** THIS IS COPIED FROM THE DnD 5e CODE BASE `AbilityTemplate.prototype.activatePreviewListeners` ***************/
				// Cancel the workflow (right-click)
				handlers.rc = event => {
					this.layer._onDragLeftCancel(event);
					canvas.stage.off("mousemove", handlers.mm);
					canvas.stage.off("mousedown", handlers.lc);
					canvas.app.view.oncontextmenu = null;
					canvas.app.view.onwheel = null;
					initialLayer.activate();
					this.actorSheet?.maximize();
				};
				// Confirm the workflow (left-click)
				handlers.lc = event => {
					handlers.rc(event);
					const destination = canvas.grid.getSnappedPosition(this.data.x, this.data.y, 2);
					this.data.update(destination);
					canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [this.data]);
				};
				/***************** END OF COPY ***************/

				SnapIntersect.handleDnD5eAbilityTemplate(this, handlers);
				AngleSnaps.handleDnD5eAbilityTemplate(this, handlers);

				/***************** THIS IS COPIED FROM THE DnD 5e CODE BASE `AbilityTemplate.prototype.activatePreviewListeners` ***************/
				canvas.stage.on("mousemove", handlers.mm);
				canvas.stage.on("mousedown", handlers.lc);
				canvas.app.view.oncontextmenu = handlers.rc;
				canvas.app.view.onwheel = handlers.mw;
				/***************** END OF COPY ***************/
			}, 'OVERRIDE');
	}
});
