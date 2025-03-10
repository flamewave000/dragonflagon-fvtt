/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../common/foundry.d.ts" />
/// <reference path="../../common/libWrapper.d.ts" />
/// <reference path="./types.d.ts" />
import SETTINGS from "../common/Settings.mjs";

export default class SnapIntersect {
	static init() {
		SETTINGS.register('SnapIntersect', {
			config: true,
			scope: 'world',
			name: 'DF_TEMPLATES.SnapIntersectName',
			hint: 'DF_TEMPLATES.SnapIntersectHint',
			type: Boolean,
			default: false,
			onChange: (toggled) => toggled ? this.#patch() : this.#unpatch()
		});
	}

	static ready() {
		if (SETTINGS.get('SnapIntersect'))
			this.#patch();
	}

	static #patch() {
		libWrapper.register(SETTINGS.MOD_NAME, 'TemplateLayer.prototype.getSnappedPoint', SnapIntersect.#TemplateLayer_gridPrecision, 'OVERRIDE');
	}
	static #unpatch() {
		libWrapper.unregister(SETTINGS.MOD_NAME, 'TemplateLayer.prototype.getSnappedPoint', false);
	}

	static #TemplateLayer_gridPrecision(point) {
		const M = CONST.GRID_SNAPPING_MODES;
		const grid = canvas.grid;
		return grid.getSnappedPoint(point, {
		  mode: grid.isHexagonal && !this.options.controllableObjects
			? M.CENTER | M.VERTEX
			: M.CENTER | M.VERTEX | M.CORNER | M.SIDE_MIDPOINT,
		  resolution: 0.5
		});
	}
}