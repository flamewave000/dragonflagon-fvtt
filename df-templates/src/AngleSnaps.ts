import SETTINGS from "../../common/Settings";

export default class AngleSnaps {
	static init() {
		SETTINGS.register<number>('angle-snap-macro', {
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
		SETTINGS.register<number>('angle-snap-micro', {
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
		libWrapper.register(SETTINGS.MOD_NAME, 'canvas.templates._onMouseWheel', function (this: TemplateLayer, event: MouseEvent): any {
			// Determine whether we have a hovered template?
			const template = this.hover;
			if (!template) return;
			// Determine the incremental angle of rotation from event data
			const snapCount = SETTINGS.get<number>('angle-snap-macro');
			let snap = 360 / snapCount;
			if (!event.shiftKey)
				snap /= SETTINGS.get<number>('angle-snap-micro');

			const sign = Math.sign((event as any).deltaY);
			const delta = snap * sign;
			let direction = template.document.direction - (template.document.direction % snap);
			if (template.document.direction % snap !== 0 && sign < 0)
				direction += snap;
			return template.rotate(direction + delta, snap);
		}, 'OVERRIDE');
	}

	static handleDnD5eAbilityTemplate(this: any, event: any) {
		/***************** THIS IS COPIED FROM THE DnD 5e CODE BASE `AbilityTemplate.prototype._onRotatePlacement `module/canvas/ability-template.mjs`` ***************/
		if (event.ctrlKey) event.preventDefault(); // Avoid zooming the browser window
		event.stopPropagation();

		/**** MODIFIED THIS REGION ****/
		const snapCount = SETTINGS.get<number>('angle-snap-macro');
		let snap = 360 / snapCount;
		if (event.shiftKey)
			snap /= SETTINGS.get<number>('angle-snap-micro');

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