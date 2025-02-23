import SETTINGS from "../common/Settings.mjs";

export default class TableQuickRoll {
	static init() {
		SETTINGS.register('quick-roll', {
			name: 'DF_QOL.QuickRoll.Title',
			hint: 'DF_QOL.QuickRoll.Hint',
			scope: 'world',
			type: Boolean,
			default: true,
			config: true,
			onChange: async (enabled) => {
				if (enabled) Hooks.on('renderRollTableDirectory', TableQuickRoll.DF_QUICK_ROLL);
				else Hooks.off('renderRollTableDirectory', TableQuickRoll.DF_QUICK_ROLL);
				ui.tables.render(true);
			}
		});
		if (SETTINGS.get('quick-roll')) Hooks.on('renderRollTableDirectory', TableQuickRoll.DF_QUICK_ROLL);
	}

	static DF_QUICK_ROLL(/**@type {RollTableDirectory}*/ _app, /**@type {JQuery<HTMLElement>}*/ html, _data) {
		html.find(".rolltable").each((_idx, element) => {
			const button = $(`<a title="${'DF_QOL.QuickRoll.MenuItem'.localize()}" class="button df-qol-quickroll"><i class="fas fa-dice-d20"/></a>`);
			button.on('click', async function () {
				const table = game.tables.get(this.parentElement.getAttribute('data-document-id'));
				if (!table) return;
				if (table.description === undefined)
					table.description = '';
				await table.draw();
			});
			$(element).append(button);
		});
	}
}