
const MODULE_NAME = 'df-qol';

function apply(shouldApply: Boolean, hookName: string, func: Hooks.General) {
	if (shouldApply) Hooks.on(hookName, func);
	else Hooks.off(hookName, func);
}

async function requestReload() {
	if (await Dialog.confirm({
		title: game.i18n.localize("DRAGON_FLAGON_QOL.ReloadGameTitle"),
		content: game.i18n.localize("DRAGON_FLAGON_QOL.ReloadGameContent"),
		defaultYes: true
	} as any) as any as Boolean) {
		window.location.reload();
	}
}

Hooks.once('init', function () {
	game.settings.register(MODULE_NAME, 'quick-roll', {
		name: 'DRAGON_FLAGON_QOL.QuickRollTitle',
		hint: 'DRAGON_FLAGON_QOL.QuickRollHint',
		scope: 'world',
		type: Boolean,
		default: true,
		config:true,
		onChange: async () => await requestReload()
	});
	apply(game.settings.get(MODULE_NAME, 'quick-roll'), 'getRollTableDirectoryEntryContext', DF_QUICK_ROLL);

	game.settings.register(MODULE_NAME, 'auto-focus', {
		name: 'DRAGON_FLAGON_QOL.AutoFocusTitle',
		hint: 'DRAGON_FLAGON_QOL.AutoFocusHint',
		scope: 'world',
		type: Boolean,
		default: true,
		config:true,
		onChange: newValue => {
			apply(newValue, 'renderDialog', DF_AUTO_FOCUS)
			apply(newValue, 'renderFolderConfig', DF_AUTO_FOCUS)
		}
	});
	apply(game.settings.get(MODULE_NAME, 'auto-focus'), 'renderDialog', DF_AUTO_FOCUS);
	apply(game.settings.get(MODULE_NAME, 'auto-focus'), 'renderFolderConfig', DF_AUTO_FOCUS);
});


function DF_QUICK_ROLL(_html: any, entryOptions: any) {
	entryOptions.unshift({
		name: "DRAGON_FLAGON_QOL.QuickRollMenuItem",
		icon: '<i class="fas fa-dice-d20"></i>',
		condition: () => true,
		callback: async (header: any) => {
			const table = game.tables.get(header.data('entityId'));
			const roll = table.roll();
			await table.draw({ roll: roll } as any);
		}
	});
}

function DF_AUTO_FOCUS(_app: any, html: JQuery, _data: any) {
	const inputs = html.find('input[type="text"]');
	if(inputs.length == 0) return
	inputs[0].focus();
}