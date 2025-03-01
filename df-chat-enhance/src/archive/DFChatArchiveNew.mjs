/// <reference path="../../../fvtt-scripts/foundry.js" />
/// <reference path="../../../common/foundry.d.ts" />
import { DFChatArchive } from "./DFChatArchive.mjs";
import SETTINGS from "../../common/Settings.mjs";
import ChatHistoryOptimizer from '../scroll-manage/ChatHistoryOptimizer.mjs'

export default class DFChatArchiveNew extends FormApplication {
	/**@readonly*/ static PREF_DELETE = 'new-should-delete';
	/**@readonly*/ static PREF_HIDE_EXPORT = 'hide-export';
	static get defaultOptions() {
		return foundry.utils.mergeObject(FormApplication.defaultOptions, {
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

	/**
	 * @param {*} [options]
	 * @returns {FormApplicationOptions}
	 */
	getData(options) {
		return foundry.utils.mergeObject(super.getData(options), {
			shouldDelete: SETTINGS.get(DFChatArchiveNew.PREF_DELETE)
		});
	}

	/**
	 * @param {*} [_event]
	 * @param { {[k:string]:any} } [formData]
	 * @returns {Promise<void>}
	 */
	async _updateObject(_event, formData) {
		SETTINGS.set(DFChatArchiveNew.PREF_DELETE, formData.delete);

		const name = formData.name;
		if (!name) {
			ui.notifications.warn('DF_CHAT_ARCHIVE.ArchiveNew_ErrorNameMissing'.localize());
			throw Error('DF_CHAT_ARCHIVE.ArchiveNew_ErrorNameMissing'.localize());
		}

		//* Create a clone of the data and adjust chat IDs so they don't match with
		//* existing chats, in case they weren't deleted.
		const isDateRange = formData['date-or-all'] === 'date';
		const fromDate = isDateRange ? new Date(formData.from).getTime() : Number.MIN_VALUE;
		const toDate = isDateRange ? new Date(formData.to).getTime() : Number.MAX_VALUE;
		/**
		 * @param {ChatMessage[]} items
		 */
		function* process(items) {
			for (let i = 0; i < items.length; i++) {
				if (items[i].timestamp < fromDate || items[i].timestamp > toDate) continue;
				/**@type {ChatMessage}*/
				const result = items[i].toObject();
				result.originalID = result._id;
				result._id = "DFCA" + result._id.substring(4);
				yield result;
			}
		}
		const chats = [...process(ui.chat.collection.contents)];

		ui.notifications.info('DF_CHAT_ARCHIVE.ArchiveNew_NoticeSuccess'.localize().replace('{0}', name));
		try {
			await DFChatArchive.createChatArchive(name, chats, formData['visible']);
		}
		catch (e) {
			// We have failed to create an archive so we should return immediately
			console.error(e);
			return;
		}
		// If we don't want to delete the messages, return
		if (!formData.delete) return;

		if (!isDateRange)
			game.messages.flush();
		else
			await game.messages.documentClass.deleteDocuments(chats.map(x => x.originalID));
	}

	/**
	 * @param { {shouldDelete: boolean} } data
	 * @returns {Promise<JQuery<HTMLElement>>}
	 */
	_renderInner(data) {
		return super._renderInner(data)
			.then((html) => {
				const from = html.find('#dfca-from');
				const to = html.find('#dfca-to');
				const warn = html.find("#dfca-warning");
				html.find('#dfca-all').on('change', () => {
					from.prop('disabled', true);
					to.prop('disabled', true);
					warn.hide();
					this._recalculateDimensions();
				});
				html.find('#dfca-date').on('change', () => {
					from.prop('disabled', false);
					to.prop('disabled', false);
					warn.show();
					this._recalculateDimensions();
				});
				return html;
			});
	}
}