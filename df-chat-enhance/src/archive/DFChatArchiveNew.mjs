/// <reference path="../../../fvtt-scripts/foundry.js" />
/// <reference path="../../../common/foundry.d.ts" />
import { DFChatArchive } from "./DFChatArchive.mjs";
import SETTINGS from "../../common/Settings.mjs";

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
		/**
		 * @param {ChatMessage[]} items
		 */
		function* process(items) {
			const fromDate = formData['date-or-all'] === 'date' ? new Date(formData.from).getTime() : Number.MIN_VALUE;
			const toDate = formData['date-or-all'] === 'date' ? new Date(formData.to).getTime() : Number.MAX_VALUE;
			for (let i = 0; i < items.length; i++) {
				if (items[i].timestamp < fromDate || items[i].timestamp > toDate) continue;
				/**@type {ChatMessage}*/
				const result = items[i].toObject();
				result._id = "DFCA" + result._id.substring(4);
				yield result;
			}
		}

		ui.notifications.info('DF_CHAT_ARCHIVE.ArchiveNew_NoticeSuccess'.localize().replace('{0}', name));
		try {
			const chats = [...process(ui.chat.collection.contents)];
			await DFChatArchive.createChatArchive(name, chats, formData['visible']);
		}
		catch (e) {
			// We have failed to create an archive so we should return immediately
			console.error(e);
			return;
		}
		// If we don't want to delete the messages, return
		if (!formData.delete) return;

		game.messages.flush();
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