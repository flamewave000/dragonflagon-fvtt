/// <reference path="../../../fvtt-scripts/foundry.js" />
import SETTINGS from "../../common/Settings.mjs";
import UTIL from "../Util.mjs";

export default class ChatTime {

	/**@readonly*/static #PREF_ENABLED = 'ChatTime.UseSimpleCalender';
	/**@readonly*/static #PREF_FORMAT = 'ChatTime.SimpleCalendarFormat';
	/**@readonly*/static #FLAG_CHAT_TIME = 'ChatTime.WorldTime';

	/**@type {boolean}*/
	static get #enabled() { return SETTINGS.get(this.#PREF_ENABLED); }
	/**@type {boolean}*/
	static get #simpleCalendarActive() { return !!game.modules.get('foundryvtt-simple-calendar')?.active; }

	static ready() {
		if (!this.#simpleCalendarActive && game.user.isGM && this.#enabled)
			ui.notifications.warn('DF_CHAT_TIME.ErrorSimpleCalendarMissing', { permanent: true, localize: true });
	}

	static init() {
		SETTINGS.register(this.#PREF_ENABLED, {
			scope: 'world',
			type: Boolean,
			name: "DF_CHAT_TIME.EnabledName",
			hint: "DF_CHAT_TIME.EnabledHint",
			default: false,
			config: true,
			onChange: UTIL.reloadChatLog
		});

		SETTINGS.register(this.#PREF_FORMAT, {
			scope: 'world',
			type: String,
			name: 'DF_CHAT_TIME.FormatName',
			hint: 'DF_CHAT_TIME.FormatHint',
			default: 'YYYY, MMM DD, HH:mm',
			config: this.#simpleCalendarActive,
			onChange: UTIL.reloadChatLog
		});

		libWrapper.register(SETTINGS.MOD_NAME, 'ChatMessage.implementation.create',
			/**
			 * @param {(...args: any) => unknown} wrapped
			 * @param {Partial<ChatMessageData>} chatData
			 * @param {*} createOptions
			 * @returns {unknown}
			 */
			(wrapped, chatData, createOptions) => {
				chatData.flags = chatData.flags ?? {};
				chatData.flags[SETTINGS.MOD_NAME] = {};
				chatData.flags[SETTINGS.MOD_NAME][this.#FLAG_CHAT_TIME] = game.time.worldTime;
				return wrapped(chatData, createOptions);
			}, 'WRAPPER');

		if (!game.dnd5e)
			Hooks.on('renderChatMessage', this.#_renderChatMessage);
		else
			Hooks.on('dnd5e.renderChatMessage', this.#_renderChatMessage);
	}
	/**
	* @param {ChatMessage} message
	* @param {JQuery<HTMLElement> | HTMLElement} html
	* @param {any} _data
	* @returns {void}
	*/
	static #_renderChatMessage(message, html, _data) {
		const time = new Date(message.timestamp).toLocaleString(navigator.language.startsWith('en') ? 'en-CA' : navigator.language);
		/**@type {JQuery<HTMLElement>}*/
		const element = $(html);
		if (ChatTime.#simpleCalendarActive && ChatTime.#enabled) {
			/**@type {number}*/
			const simpleTimestamp = message.getFlag(SETTINGS.MOD_NAME, ChatTime.#FLAG_CHAT_TIME);
			if (simpleTimestamp !== undefined) {
				const timeElement = element.find('.message-timestamp');
				const simpleTimeElement = $(`<time class="dfce-simple-timestamp">${SimpleCalendar.api.formatDateTime(
					SimpleCalendar.api.timestampToDate(simpleTimestamp), SETTINGS.get(ChatTime.#PREF_FORMAT)
				)}</time>`);
				timeElement.after(simpleTimeElement);
				timeElement.hide();
				simpleTimeElement[0].dataset.tooltip = time;
				return;
			}
		}
		element.find(".message-timestamp")[0].dataset.tooltip = time;
	}
}