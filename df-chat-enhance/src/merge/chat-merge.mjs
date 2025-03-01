/// <reference path="../../../fvtt-scripts/foundry.js" />
/// <reference path="../../../common/foundry.d.ts" />
import libWrapperShared from "../../common/libWrapperShared.mjs";
import SETTINGS from "../../common/Settings.mjs";
import DFChatArchiveManager from "../archive/DFChatArchiveManager.mjs";


export default class ChatMerge {

	/**@readonly*/ static #PREF_ENABLED = 'chat-merge-enabled';
	/**@readonly*/ static #PREF_SPLIT_SPEAKER = 'chat-merge-split-speaker';
	/**@readonly*/ static #PREF_EPOCH = 'chat-merge-epoch';
	/**@readonly*/ static #PREF_ALLOW_ROLLS = 'chat-merge-allowRolls';
	/**@readonly*/ static #PREF_SEPARATE = 'chat-merge-separateWithBorder';
	/**@readonly*/ static #PREF_HOVER = 'chat-merge-showhover';
	/**@readonly*/ static #PREF_SHOW_HEADER = 'chat-merge-showheader';

	/**@type {boolean}*/ static get #_enabled() { return SETTINGS.get(this.#PREF_ENABLED); }
	/**@type {number}*/ static get #_epoch() { return SETTINGS.get(this.#PREF_EPOCH); }
	/**@type {string}*/ static get #_allowRolls() { return SETTINGS.get(this.#PREF_ALLOW_ROLLS); }
	/**@type {boolean}*/ static get #_separateWithBorder() { return SETTINGS.get(this.#PREF_SEPARATE); }
	/**@type {boolean}*/ static get #_showHover() { return SETTINGS.get(this.#PREF_HOVER); }
	/**@type {boolean}*/ static get #_showHeader() { return SETTINGS.get(this.#PREF_SHOW_HEADER); }

	static init() {
		SETTINGS.register(this.#PREF_ENABLED, {
			name: 'DF_CHAT_MERGE.EnableName',
			hint: 'DF_CHAT_MERGE.EnableHint',
			config: true,
			scope: 'client',
			default: true,
			type: Boolean,
			onChange: () => this.#_processAllMessage()
		});
		SETTINGS.register(this.#PREF_SHOW_HEADER, {
			name: 'DF_CHAT_MERGE.ShowHeaderName',
			hint: 'DF_CHAT_MERGE.ShowHeaderHint',
			config: true,
			scope: 'client',
			default: false,
			type: Boolean,
			onChange: (/**@type {boolean}*/newValue) => {
				/**@type {CSSStyleDeclaration}*/
				const style = document.querySelector(':root').style;
				style.setProperty('--dfce-cm-header', newValue ? '' : 'none');
				if (game.user.isGM) {
					style.setProperty('--dfce-cm-header-delete', newValue ? '' : '0');
					style.setProperty('--dfce-cm-header-delete-pad', newValue ? '' : '16px');
				}
			}
		});
		SETTINGS.register(this.#PREF_SPLIT_SPEAKER, {
			name: 'DF_CHAT_MERGE.SplitSpeakerName',
			hint: 'DF_CHAT_MERGE.SplitSpeakerHint',
			config: true,
			scope: 'client',
			default: true,
			type: Boolean,
			onChange: () => this.#_processAllMessage()
		});
		SETTINGS.register(this.#PREF_ALLOW_ROLLS, {
			name: 'DF_CHAT_MERGE.AllowRollsName',
			hint: 'DF_CHAT_MERGE.AllowRollsHint',
			config: true,
			scope: 'client',
			default: 'rolls',
			type: String,
			choices: {
				none: 'DF_CHAT_MERGE.AllowRollsOptions.none'.localize(),
				rolls: 'DF_CHAT_MERGE.AllowRollsOptions.rolls'.localize(),
				all: 'DF_CHAT_MERGE.AllowRollsOptions.all'.localize()
			},
			onChange: () => this.#_processAllMessage()
		});
		SETTINGS.register(this.#PREF_SEPARATE, {
			name: 'DF_CHAT_MERGE.SeparateName',
			hint: 'DF_CHAT_MERGE.SeparateHint',
			config: true,
			scope: 'client',
			default: false,
			type: Boolean,
			onChange: (/**@type {boolean}*/newValue) => {
				/**@type {CSSStyleDeclaration}*/
				const style = document.querySelector(':root').style;
				style.setProperty('--dfce-cm-separation', newValue ? 'thin' : '0');
			}
		});
		SETTINGS.register(this.#PREF_HOVER, {
			name: 'DF_CHAT_MERGE.HoverName',
			hint: 'DF_CHAT_MERGE.HoverHint',
			config: true,
			scope: 'client',
			default: true,
			type: Boolean,
			onChange: (/**@type {boolean}*/newValue) => {
				/**@type {CSSStyleDeclaration}*/
				const style = document.querySelector(':root').style;
				newValue ? style.removeProperty('--dfce-cm-hover-shadow') : style.setProperty('--dfce-cm-hover-shadow', '0px');
			}
		});
		SETTINGS.register(this.#PREF_EPOCH, {
			name: 'DF_CHAT_MERGE.EpochName',
			hint: 'DF_CHAT_MERGE.EpochHint',
			config: true,
			scope: 'client',
			default: 10,
			type: Number,
			range: {
				min: 1,
				max: 60,
				step: 1
			},
			onChange: () => this.#_processAllMessage()
		});

		libWrapperShared.register('ChatLog.prototype.deleteMessage', this.#_deleteMessage.bind(this));
		Hooks.on("renderChatMessage", this.#_renderChatMessage);
	}
	static ready() {
		/**@type {CSSStyleDeclaration}*/
		const style = document.querySelector(':root').style;
		style.setProperty('--dfce-cm-separation', this.#_separateWithBorder ? 'thin' : '0');
		this.#_showHover ? style.removeProperty('--dfce-cm-hover-shadow') : style.setProperty('--dfce-cm-hover-shadow', '0px');
		style.setProperty('--dfce-cm-header', this.#_showHeader ? '' : 'none');
		if (game.user.isGM) {
			style.setProperty('--dfce-cm-header-delete', this.#_showHeader ? '' : '0');
			style.setProperty('--dfce-cm-header-delete-pad', this.#_showHeader ? '' : '16px');
		}
		this.#_processAllMessage(ui.chat.element);
		Hooks.on('renderChatLog', (_, html) => this.#_processAllMessage(html));
		Hooks.on('renderDFChatArchiveViewer', (_, html) => this.#_processAllMessage(html));
	}

	/**
	 * @param {Function} wrapper
	 * @param {string} messageId
	 * @returns 
	 */
	static #_deleteMessage(wrapper, messageId, { deleteAll = false } = {}) {
		// Ignore the Delete All process. Everything is being obliterated, who cares about the styling
		if (!deleteAll && this.#_enabled) {
			const element = document.querySelector(`li[data-message-id="${messageId}"`);
			// If we were a TOP
			if (element?.classList?.contains('dfce-cm-top')) {
				element.classList.remove('dfce-cm-top');
				// If the next element was a middle, make it a top
				if (element.nextElementSibling.classList.contains('dfce-cm-middle')) {
					element.nextElementSibling.classList.remove('dfce-cm-middle');
					element.nextElementSibling.classList.add('dfce-cm-top');
				}
				// Otherwise, it was a bottom and should now become a normal message again
				else element.nextElementSibling.classList.remove('dfce-cm-bottom');
			}
			// If we were a BOTTOM
			else if (element?.classList?.contains('dfce-cm-bottom')) {
				element.classList.remove('dfce-cm-bottom');
				// If the previous element was a middle, make it a bottom
				if (element.previousElementSibling.classList.contains('dfce-cm-middle')) {
					element.previousElementSibling.classList.remove('dfce-cm-middle');
					element.previousElementSibling.classList.add('dfce-cm-bottom');
				}
				// Otherwise, it was a top and should now become a normal message again
				else element.previousElementSibling.classList.remove('dfce-cm-top');
			}
			// If we were a MIDDLE, let the above and below snug and they'll be fine
			else if (element?.classList?.contains('dfce-cm-middle'))
				element.classList.remove('dfce-cm-middle');
		}
		return wrapper(messageId, { deleteAll });
	}

	/**@param {JQuery<HTMLElement>} [element]*/
	static #_processAllMessage(element) {
		element = element ?? $(document.body);
		// Remove the old CSS class designations
		element.find('.dfce-cm-top').removeClass('dfce-cm-top');
		element.find('.dfce-cm-middle').removeClass('dfce-cm-middle');
		element.find('.dfce-cm-bottom').removeClass('dfce-cm-bottom');
		// If we are disabled, return
		if (!ChatMerge.#_enabled) return;
		// Collect all rendered chat messages
		const messages = element.find('li.chat-message');
		// Return if there are no messages rendered
		if (messages.length === 0) return;
		// Make sure to set the hover colour for the first message since we skip it in the processor bellow.
		if (messages[0].hasAttribute('style')) {
			messages[0].style.setProperty('--dfce-mc-border-color', messages[0].style.borderColor);
		}
		// Process each message after the first
		for (let c = 1; c < messages.length; c++) {
			// Update styling of the chat messages
			this.#_styleChatMessages(
				game.messages.get(messages[c].getAttribute('data-message-id')),
				messages[c],
				game.messages.get(messages[c - 1].getAttribute('data-message-id')),
				messages[c - 1]);
		}
	}

	/**
	 * @param {ChatMessage} message
	 * @param {JQuery<HTMLElement>} html
	 */
	static #_renderChatMessage(message, html) {
		if (!ChatMerge.#_enabled) return;
		// Find the most recent message in the chat log
		const partnerElem = $(`#chat-log li.chat-message`).last()[0];
		// If there is no message, return
		if (partnerElem === null || partnerElem === undefined) return;
		// get the ChatMessage document associated with the html
		const partner = game.messages.get(partnerElem.getAttribute('data-message-id'));
		if (!message || !partner) return;
		// Update styling of the chat messages
		ChatMerge.#_styleChatMessages(message, html[0], partner, partnerElem);
	}

	/**
	 * @param {number} current
	 * @param {number} previous
	 * @returns {boolean}
	 */
	static #_inTimeFrame(current, previous) {
		return current > previous && (current - previous) < (this.#_epoch * 1000);
	}

	/**
	 * @param {ChatMessage} currData
	 * @param {ChatMessage} prevData
	 * @returns {boolean}
	 */
	static #_isValidMessage(currData, prevData) {
		const rolls = this.#_allowRolls;
		const splitSpeaker = SETTINGS.get(this.#PREF_SPLIT_SPEAKER);
		let userCompare = false;

		// If either message is a Midi-QoL message, ignore it
		if ((currData?.flags && currData.flags['midi-qol']) || (prevData?.flags && prevData.flags['midi-qol']))
			return false;

		if (splitSpeaker) {
			// this is a bit complex, basically we want to group by actors, but if you're not using an actor, group by user instead
			userCompare = ( // If actors are equal and NOT null
				currData.speaker.actor === prevData.speaker.actor
				&& !!currData.speaker.actor
			) ||
				( // If BOTH actors are null and users are equal
					!currData.speaker.actor
					&& !prevData.speaker.actor
					&& currData.author === prevData.author
				);
		} else {
			// If we are not splitting by speaker, just do the simple option of comparing the users
			userCompare = currData.author === prevData.author;
		}

		const currIsRoll = (currData.rolls ?? []).length > 0;
		const prevIsRoll = (prevData.rolls ?? []).length > 0;

		return userCompare
			&& this.#_inTimeFrame(currData.timestamp, prevData.timestamp)
			// Check for merging with roll types
			&& (rolls === 'all'
				|| (rolls === 'rolls' && currIsRoll === prevIsRoll)
				|| (rolls === 'none' && !currIsRoll && !prevIsRoll));
	}

	/**
	 * @param {ChatMessage} curr
	 * @param {HTMLElement} currElem
	 * @param {ChatMessage} prev
	 * @param {HTMLElement} prevElem
	 */
	static #_styleChatMessages(curr, currElem, prev, prevElem) {
		if (currElem.hasAttribute('style')) {
			currElem.style.setProperty('--dfce-mc-border-color', currElem.style.borderColor);
		}
		let isArchive = false;
		// If we are running in a Chat Archive
		if (curr === undefined && prev === undefined) {
			isArchive = true;
			const logId = parseInt(/df-chat-log-(\d+)/.exec(currElem.parentElement.parentElement.id)[1]);
			if (isNaN(logId)) return;
			const chatLog = DFChatArchiveManager.chatViewers.get(logId);
			curr = chatLog.messages.find(x => (x.id ?? x._id) == currElem.dataset.messageId);
			prev = chatLog.messages.find(x => (x.id ?? x._id) == prevElem.dataset.messageId);
		}
		if (!ChatMerge.#_isValidMessage(curr, prev)) return;
		if (prevElem.classList.contains('dfce-cm-bottom')) {
			prevElem.classList.remove('dfce-cm-bottom');
			prevElem.classList.add('dfce-cm-middle');
		} else prevElem.classList.add('dfce-cm-top');
		currElem.classList.add('dfce-cm-bottom');
		if (!!game.dnd5e && !isArchive)
			currElem.classList.add('dnd5e');
	}
}