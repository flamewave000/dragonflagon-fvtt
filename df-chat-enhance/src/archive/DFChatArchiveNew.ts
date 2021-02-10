import { DFChatArchive } from "./DFChatArchive.js";
import CONFIG from '../CONFIG.js';

export default class DFChatArchiveNew extends FormApplication {
	static readonly PREF_DELETE = 'new-should-delete';
	static readonly PREF_HIDE_EXPORT = 'hide-export';
	static get defaultOptions() {
		const options = FormApplication.defaultOptions;
		mergeObject(options, {
			template: "modules/df-chat-enhance/templates/archive-new.hbs",
			resizable: false,
			minimizable: false,
			title: game.i18n.localize("DF_CHAT_ARCHIVE.ArchiveNew_Title")
		});
		return options;
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
		const data = super.getData(options) as any;
		mergeObject(data, {
			shouldDelete: game.settings.get(CONFIG.MOD_NAME, DFChatArchiveNew.PREF_DELETE) as Boolean
		});
		return data;
	}

	_updateObject(_event?: any, formData?: any): void {
		game.settings.set(CONFIG.MOD_NAME, DFChatArchiveNew.PREF_DELETE, formData.delete);

		const name = formData.name;
		if (!name) {
			ui.notifications.warn(game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveNew_ErrorNameMissing'));
			throw Error(game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveNew_ErrorNameMissing'));
		}

		var chats = [...((ui.chat as any).collection as Map<String, ChatMessage>).values()];

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

		ui.notifications.info(game.i18n.localize(''));
		DFChatArchive.createChatArchive(name, chats);
		// If we don't want to delete the messages, return
		if (!formData.delete) return;

		for(let chat of chats) {
			chat.delete();
		}
	}

	_renderInner(data: object, options?: any): Promise<JQuery<HTMLElement>> {
		return super._renderInner(data, options)
			.then((html) => {
				const from = html.find('#dfca-from');
				const to = html.find('#dfca-to');
				html.find('#dfca-all').on('change', () => {
					from.prop('disabled', true);
					to.prop('disabled', true);
					(this as any)._recalculateDimensions();
				});
				html.find('#dfca-date').on('change', () => {
					from.prop('disabled', false);
					to.prop('disabled', false);
					(this as any)._recalculateDimensions();
				});
				return html;
			});
	}
}