/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../common/foundry.d.ts" />
/// <reference path="./types.d.ts" />
import SETTINGS from "../common/Settings.mjs";

export default class AngleSnaps {
	static init() {
		SETTINGS.register('angle-snap-macro', {
			config: true,
			scope: 'world',
			name: 'DF_TEMPLATES.AngleSnap.MacroName',
			hint: 'DF_TEMPLATES.AngleSnap.MacroHint',
			type: Number,
			range: {
				min: 4,
				max: 24,
				step: 4
			},
			default: 24
		});
		SETTINGS.register('angle-snap-micro', {
			config: true,
			scope: 'world',
			name: 'DF_TEMPLATES.AngleSnap.MicroName',
			hint: 'DF_TEMPLATES.AngleSnap.MicroHint',
			type: Number,
			range: {
				min: 1,
				max: 4,
				step: 1
			},
			default: 3
		});
	}

	static ready() {
		libWrapper.register(SETTINGS.MOD_NAME, 'canvas.templates._onMouseWheel',
			/**
			 * @this {TemplateLayer}
			 * @param {MouseEvent} event
			 * @returns {*}
			 */
			function (event) {
			// Determine whether we have a hovered template?
			const template = this.hover;
			if (!template) return;
			// Determine the incremental angle of rotation from event data
			const snapCount = SETTINGS.get('angle-snap-macro');
			let snap = 360 / snapCount;
			if (!event.shiftKey)
				snap /= SETTINGS.get('angle-snap-micro');

			const sign = Math.sign(event.deltaY);
			const delta = snap * sign;
			let direction = template.document.direction - (template.document.direction % snap);
			if (template.document.direction % snap !== 0 && sign < 0)
				direction += snap;
			return template.rotate(direction + delta, snap);
		}, 'OVERRIDE');
	}

	/**
	 * @param {*} event
	 */
	static handleDnD5eAbilityTemplate(event) {
		/***************** THIS IS COPIED FROM THE DnD 5e CODE BASE `AbilityTemplate.prototype._onRotatePlacement `module/canvas/ability-template.mjs`` ***************/
		if (event.ctrlKey) event.preventDefault(); // Avoid zooming the browser window
		event.stopPropagation();

		/**** MODIFIED THIS REGION ****/
		const snapCount = SETTINGS.get('angle-snap-macro');
		let snap = 360 / snapCount;
		if (event.shiftKey)
			snap /= SETTINGS.get('angle-snap-micro');

		const sign = Math.sign(event.deltaY);
		let direction = this.document.direction;
		if (direction < 0) direction += 360;
		direction = direction - (direction % snap);
		if (this.document.direction % snap !== 0 && sign < 0)
			direction += snap;
		this.document.updateSource({ direction: direction + (snap * sign) });
		/**** END OF MODIFICATION ****/

		this.refresh();
		/***************** END OF COPY ***************/
	}
}