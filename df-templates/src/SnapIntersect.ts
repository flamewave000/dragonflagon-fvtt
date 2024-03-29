import SETTINGS from "../../common/Settings";

export default class SnapIntersect {
	static init() {
		SETTINGS.register('SnapIntersect', {
			config: true,
			scope: 'world',
			name: 'DF_TEMPLATES.SnapIntersectName',
			hint: 'DF_TEMPLATES.SnapIntersectHint',
			type: Boolean,
			default: false,
			onChange: (toggled) => toggled ? this.patch() : this.unpatch()
		});
	}

	static ready() {
		if (SETTINGS.get<boolean>('SnapIntersect'))
			this.patch();
	}

	private static patch() {
		libWrapper.register(SETTINGS.MOD_NAME, 'canvas.templates.gridPrecision', SnapIntersect.TemplateLayer_gridPrecision, 'OVERRIDE');
	}
	private static unpatch() {
		libWrapper.unregister(SETTINGS.MOD_NAME, 'canvas.templates.gridPrecision', false);
	}

	private static TemplateLayer_gridPrecision() {
		return canvas.grid.type === CONST.GRID_TYPES.GRIDLESS ? 0 : 1;
	}

	static handleDnD5eAbilityTemplate(this: any, event: any) {
		/***************** THIS IS COPIED FROM THE DnD 5e CODE BASE `AbilityTemplate.prototype._onMovePlacement` `module/canvas/ability-template.mjs` ***************/
		const now = Date.now(); // Apply a 20ms throttle
		if ( now - this._moveTime <= 20 ) return;
		const center = event.data.getLocalPosition(this.layer);
		/**** MODIFIED THIS `getSnappedPosition` TO HAVE INTERVAL 1 INSTEAD OF 2 IF ENABLED ****/
		const snapped = canvas.grid.getSnappedPosition(center.x, center.y, SETTINGS.get('SnapIntersect') ? 1 : 2);
		this.document.updateSource({x: snapped.x, y: snapped.y});
		this.refresh();
		this._moveTime = now;
		/***************** END OF COPY ***************/
	}
}