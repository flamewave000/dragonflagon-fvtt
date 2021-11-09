import SETTINGS from "../../common/Settings";

function apply(shouldApply: boolean, hookName: string, func: AnyFunction) {
	if (shouldApply) Hooks.on(hookName, func);
	else Hooks.off(hookName, func);
}

export default class TextboxAutoFocus {
	static init() {
		SETTINGS.register('auto-focus', {
			name: 'DF_QOL.AutoFocus.Title',
			hint: 'DF_QOL.AutoFocus.Hint',
			scope: 'world',
			type: Boolean,
			default: true,
			config: true,
			onChange: (newValue: boolean) => {
				apply(newValue, 'renderDialog', TextboxAutoFocus.DF_AUTO_FOCUS);
				apply(newValue, 'renderFolderConfig', TextboxAutoFocus.DF_AUTO_FOCUS);
			}
		});
		apply(SETTINGS.get('auto-focus'), 'renderDialog', TextboxAutoFocus.DF_AUTO_FOCUS);
		apply(SETTINGS.get('auto-focus'), 'renderFolderConfig', TextboxAutoFocus.DF_AUTO_FOCUS);
	}

	static DF_AUTO_FOCUS(_app: any, html: JQuery, _data: any) {
		const inputs = html.find('input[type="text"]');
		if (inputs.length == 0) return;
		inputs[0].focus();
	}
}