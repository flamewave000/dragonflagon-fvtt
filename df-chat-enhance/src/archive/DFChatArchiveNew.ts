import { DFChatArchive } from "./DFChatArchive";
import SETTINGS from "../../../common/Settings";

export default class DFChatArchiveNew extends FormApplication<FormApplicationOptions, { shouldDelete: boolean }> {
	static readonly PREF_DELETE = 'new-should-delete';
	static readonly PREF_HIDE_EXPORT = 'hide-export';
	static get defaultOptions() {
		return mergeObject(FormApplication.defaultOptions, {
			template: "modules/df-chat-enhance/templates/archive-new.hbs",
			resizable: false,
			minimizable: false,
			title: "DF_CHAT_ARCHIVE.ArchiveNew_Title".localize()
		});
	}

	static registerSettings() {
		SETTINGS.register(DFChatArchiveNew.PREF_DELETE, {
			config: false,
			scope: 'world',
			type: Boolean,
			default: true
		});
	}

	getData(options?: any) {
		return mergeObject(super.getData(options), {
			shouldDelete: SETTINGS.get(DFChatArchiveNew.PREF_DELETE) as boolean
		});
	}

	async _updateObject(_event?: any, formData?: any) {
		SETTINGS.set(DFChatArchiveNew.PREF_DELETE, formData.delete);

		const name = formData.name;
		if (!name) {
			ui.notifications.warn('DF_CHAT_ARCHIVE.ArchiveNew_ErrorNameMissing'.localize());
			throw Error('DF_CHAT_ARCHIVE.ArchiveNew_ErrorNameMissing'.localize());
		}

		let chats = <ChatMessage[]>[...(ui.chat.collection.values())];

		// If we are selecting a date range
		if (formData['date-or-all'] === 'date') {
			const fromDate = new Date(formData.from).getTime();
			const toDate = new Date(formData.to).getTime();
			if (isNaN(fromDate) || isNaN(toDate)) {
				ui.notifications.warn('DF_CHAT_ARCHIVE.ArchiveNew_ErrorDatesMissing'.localize());
				throw Error('Missing "from" and/or "to" dates');
			}
			chats = chats.filter((value) => value.data.timestamp >= fromDate && value.data.timestamp <= toDate);
		}

		ui.notifications.info('DF_CHAT_ARCHIVE.ArchiveNew_NoticeSuccess'.localize().replace('{0}', name));
		try {
			await DFChatArchive.createChatArchive(name, chats, formData['visible']);
		}
		catch (e) {
			// We have failed to create an archive so we should return immediately
			return;
		}
		// If we don't want to delete the messages, return
		if (!formData.delete) return;

		for (const chat of chats) {
			chat.delete();
		}
	}

	_renderInner(data: { shouldDelete: boolean }): Promise<JQuery<HTMLElement>> {
		return super._renderInner(data)
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