import SETTINGS from "../../common/Settings";
import DnD5eAbilityTemplateHandlers from "./DnD5eAbilityTemplateHandlers";

export default class SnapIntersect {
	static init() {
		SETTINGS.register('SnapIntersect', {
			config: true,
			scope: 'world',
			name: 'DF_TEMPLATES.SnapIntersectName',
			hint: 'DF_TEMPLATES.SnapIntersectHint',
			type: Boolean,
			default: false,
			onChange: (toggled) => {
				if (toggled)
					libWrapper.register(SETTINGS.MOD_NAME, 'canvas.templates.gridPrecision', () => 1, 'OVERRIDE');
				else
					libWrapper.unregister(SETTINGS.MOD_NAME, 'canvas.templates.gridPrecision', false);
			}
		});
	}

	static ready() {
		if (SETTINGS.get<boolean>('SnapIntersect'))
			libWrapper.register(SETTINGS.MOD_NAME, 'canvas.templates.gridPrecision', () => 1, 'OVERRIDE');
	}

	static handleDnD5eAbilityTemplate(abilityTemplate: any, handlers: DnD5eAbilityTemplateHandlers) {
		/***************** THIS IS COPIED FROM THE DnD 5e CODE BASE `AbilityTemplate.prototype.activatePreviewListeners` ***************/
		let moveTime = 0;
		// Update placement (mouse-move)
		handlers.mm = event => {
			event.stopPropagation();
			const now = Date.now(); // Apply a 20ms throttle
			if (now - moveTime <= 20) return;
			const center = event.data.getLocalPosition(abilityTemplate.layer);
			/**** MODIFIED THIS `getSnappedPosition` TO HAVE INTERVAL 1 INSTEAD OF 2 IF ENABLED ****/
			const snapped = canvas.grid.getSnappedPosition(center.x, center.y, SETTINGS.get('SnapIntersect') ? 1 : 2);
			abilityTemplate.data.update({ x: snapped.x, y: snapped.y });
			abilityTemplate.refresh();
			moveTime = now;
		};
		/***************** END OF COPY ***************/
	}
}