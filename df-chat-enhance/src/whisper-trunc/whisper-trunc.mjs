/// <reference path="../../../common/foundry.d.ts" />
/// <reference path="../../../fvtt-scripts/foundry.js" />
import SETTINGS from "../../common/Settings.mjs";

const TEMPLATE = "$0: $1 (+$2&nbsp;more)";
const LENGTH_ADJUST = '&nbsp;'.length - 1;

export default class WhisperTruncation {

	/**@readonly*/static #PREF_ENABLED = 'whisper-trunc_enabled';
	/**@readonly*/static #PREF_CHAR_LIMIT = 'whisper-trunc_char-limit';

	static init() {
		if (!game.dnd5e)
			Hooks.on('renderChatMessage', this.#_messageRender.bind(this));
		else
			Hooks.on('dnd5e.renderChatMessage', this.#_messageRender.bind(this));



		SETTINGS.register(this.#PREF_ENABLED, {
			name: 'DF_CHAT_WHISPER_TRUNC.SettingEnabledName',
			hint: 'DF_CHAT_WHISPER_TRUNC.SettingEnabledHint',
			config: true,
			type: Boolean,
			default: true,
			scope: 'world',
			onChange: async () => {
				ui.chat._state = 0;
				ui.chat._lastId = null;
				await ui.chat.render(true);
			}
		});
		SETTINGS.register(this.#PREF_CHAR_LIMIT, {
			name: 'DF_CHAT_WHISPER_TRUNC.SettingCharLimitName',
			hint: 'DF_CHAT_WHISPER_TRUNC.SettingCharLimitHint',
			config: true,
			type: Number,
			default: 50,
			scope: 'world',
			onChange: async () => {
				ui.chat._state = 0;
				ui.chat._lastId = null;
				await ui.chat.render(true);
			}
		});
	}

	/**
	 * @param {ChatMessage} message
	 * @param {JQuery<HTMLElement> | HTMLElement} html
	 */
	static #_messageRender(message, html) {
		// ignore regular messages, or whispers with only 1 recipient
		if (!SETTINGS.get(this.#PREF_ENABLED) || !(message.whisper) || message.whisper.length <= 1) return;
		const users = message.whisper.map(x => game.users.get(x));
		let accum = users[0].name;
		let title = this.#_formatTitle(accum, users.length - 1);
		let c = 1;
		const CHAR_LIMIT = SETTINGS.get(this.#PREF_CHAR_LIMIT);
		for (; c < users.length; c++) {
			// Append name to names string
			const tmpNames = accum + ', ' + users[c].name;
			// Generate a temp title
			const tmpTitle = this.#_formatTitle(tmpNames, users.length - c - 1);
			// If the potential title is too large, break so we can use the previous iteration's results
			if (tmpTitle.length - LENGTH_ADJUST > CHAR_LIMIT) break;
			// Set the accum and title to the newly generated values
			accum = tmpNames;
			title = tmpTitle;
		}
		// If we never ran out of room, exit
		if (c === users.length) return;
		// Update the HTML
		if (!game.dnd5e)
			html.find('span.whisper-to')
				.replaceWith(`<span class="whisper-to" data-tooltip="${users.slice(c).map(x => x.name).join(', ')}">${title}</span>`);
		else {
			/**@type {HTMLElement}*/
			const element = html.querySelector('h4.message-sender span.subtitle');
			element.innerHTML = title;
			element.dataset.tooltip = users.slice(c).map(x => x.name).join(', ');
		}
	}

	/**
	 * @param {string} names
	 * @param {number} count
	 * @returns {string}
	 */
	static #_formatTitle(names, count) {
		return count > 0
			? TEMPLATE
				.replace('$0', 'CHAT.To'.localize())
				.replace('$1', names)
				.replace('$2', count.toString())
			: names;
	}
}