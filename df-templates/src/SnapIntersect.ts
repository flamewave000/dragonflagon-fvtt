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
}