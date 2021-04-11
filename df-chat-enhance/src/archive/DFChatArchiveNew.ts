import { DFChatArchive } from "./DFChatArchive.js";
import CONFIG from '../CONFIG.js';

export default class DFChatArchiveNew extends FormApplication<{ shouldDelete: boolean }> {
	static readonly PREF_DELETE = 'new-should-delete';
	static readonly PREF_HIDE_EXPORT = 'hide-export';
	static get defaultOptions() {
		return mergeObject(FormApplication.defaultOptions as Partial<FormApplication.Options>, {
			template: "modules/df-chat-enhance/templates/archive-new.hbs",
			resizable: false,
			minimizable: false,
			title: game.i18n.localize("DF_CHAT_ARCHIVE.ArchiveNew_Title")
		}) as FormApplication.Options;
	}

	static registerSettings() {
		game.settings.register(CONFIG.MOD_NAME, DFChatArchiveNew.PREF_DELETE, {
			config: false,
			scope: 'world',
			type: Boolean,
			default: true
		});
	}

	getData(options?: any) {
		return mergeObject(super.getData(options), {
			shouldDelete: game.settings.get(CONFIG.MOD_NAME, DFChatArchiveNew.PREF_DELETE) as boolean
		});
	}

	async _updateObject(_event?: any, formData?: any) {
		game.settings.set(CONFIG.MOD_NAME, DFChatArchiveNew.PREF_DELETE, formData.delete);

		const name = formData.name;
		if (!name) {
			ui.notifications.warn(game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveNew_ErrorNameMissing'));
			throw Error(game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveNew_ErrorNameMissing'));
		}

		var chats = [...(ui.chat.collection as Map<String, ChatMessage>).values()];

		// If we are selecting a date range
		if (formData['date-or-all'] === 'date') {
			const fromDate = new Date(formData.from).getTime();
			const toDate = new Date(formData.to).getTime();
			if (isNaN(fromDate) || isNaN(toDate)) {
				ui.notifications.warn(game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveNew_ErrorDatesMissing'));
				throw Error('Missing "from" and/or "to" dates');
			}
			chats = chats.filter((value) => value.data.timestamp >= fromDate && value.data.timestamp <= toDate);
		}

		ui.notifications.info(game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveNew_NoticeSuccess').replace('{0}', name));
		DFChatArchive.createChatArchive(name, chats, formData['visible']);
		// If we don't want to delete the messages, return
		if (!formData.delete) return;

		for (let chat of chats) {
			chat.delete();
		}
	}

	_renderInner(data: any, options?: any): Promise<JQuery<HTMLElement>> {
		return super._renderInner(data, options)
			.then((html) => {
				const from = html.find('#dfca-from');
				const to = html.find('#dfca-to');
				html.find('#dfca-all').on('change', () => {
					from.prop('disabled', true);
					to.prop('disabled', true);
					this._recalculateDimensions();
				});
				html.find('#dfca-date').on('change', () => {
					from.prop('disabled', false);
					to.prop('disabled', false);
					this._recalculateDimensions();
				});
				return html;
			});
	}
}