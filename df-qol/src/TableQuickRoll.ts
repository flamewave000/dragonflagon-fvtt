import SETTINGS from "../../common/Settings";


async function requestReload() {
	if (await Dialog.confirm({
		title: game.i18n.localize("DF_QOL.ReloadGame.Title"),
		content: game.i18n.localize("DF_QOL.ReloadGame.Content"),
		defaultYes: true
	} as any) as any as Boolean) {
		window.location.reload();
	}
}

export default class TableQuickRoll {
	static init() {
		SETTINGS.register('quick-roll', {
			name: 'DF_QOL.QuickRoll.Title',
			hint: 'DF_QOL.QuickRoll.Hint',
			scope: 'world',
			type: Boolean,
			default: true,
			config: true,
			onChange: async () => await requestReload()
		});
		if (SETTINGS.get('quick-roll')) Hooks.on('getRollTableDirectoryEntryContext', TableQuickRoll.DF_QUICK_ROLL);
		else Hooks.off('getRollTableDirectoryEntryContext', TableQuickRoll.DF_QUICK_ROLL);
	}

	static DF_QUICK_ROLL(_html: any, entryOptions: any) {
		entryOptions.unshift({
			name: "DF_QOL.QuickRoll.MenuItem",
			icon: '<i class="fas fa-dice-d20"></i>',
			condition: () => true,
			callback: async (header: any) => {
				const table = game.tables.get(header.data('entityId'));
				if (table.data.description === undefined)
					table.data.description = '';
				await table.draw();
			}
		});
	}
}