/// <reference path="../../../fvtt-scripts/foundry.js" />
/// <reference path="../../../common/foundry.d.ts" />
/// <reference path="../../../common/libWrapper.d.ts" />
import SETTINGS from "../../common/Settings.mjs";
import UTIL from "../Util.mjs";

export default class ChatHistoryOptimizer {

	/**@readonly*/static PREF_ENABLED = 'ChatHistoryOptimizer.Enabled';
	/**@readonly*/static PREF_HISTORY_SIZE = 'ChatHistoryOptimizer.HistorySize';

	static init() {
		SETTINGS.register(this.PREF_ENABLED, {
			name: 'DF_CHAT_SCROLL.HistoryFixEnabledName',
			hint: 'DF_CHAT_SCROLL.HistoryFixEnabledHint',
			config: true,
			type: Boolean,
			default: true,
			scope: 'world',
			onChange: UTIL.requestReload
		});
		SETTINGS.register(this.PREF_HISTORY_SIZE, {
			name: 'DF_CHAT_SCROLL.HistorySizeName',
			hint: 'DF_CHAT_SCROLL.HistorySizeHint',
			config: true,
			type: Number,
			default: CONFIG.ChatMessage.batchSize,
			range: {
				min: CONFIG.ChatMessage.batchSize,
				max: CONFIG.ChatMessage.batchSize * 5,
				step: CONFIG.ChatMessage.batchSize
			},
			scope: 'world',
			onChange: () => $('#chat-log').trigger('scroll')
		});

		if (!SETTINGS.get(this.PREF_ENABLED)) return;

		libWrapper.register(SETTINGS.MOD_NAME, "ChatLog.prototype.isAtBottom", function() { return this._isAtBottom; }, "OVERRIDE");

		Hooks.on('renderChatLog', (/**@type {ChatLog}*/app, /**@type {JQuery}*/ html) => {
			html.find("#chat-log").off().on("scroll", this.ChatLog_onScrollLog.bind(app));
/* DEBUG *
			// This is used for DEBUG purposes only
			// Displays the number of messages being rendered in the Chat Log
			html.find('.jump-to-bottom').after('<div class="dfce-chat-count" style="flex:0;text-align:center"></div>');
		});
		this._displayMessageCounts(0);
/* DEBUG */
		});
/* DEBUG */
	}
	
	/**
	 * @this {ChatLog}
	 * @param {(event: any)=>Promise<void>} wrapped
	 * @param {JQuery.ScrollEvent} event
	 * @returns {Promise<void>}
	 */
	static ChatLog_onScrollLog(event) {
		if (!this.rendered) return Promise.resolve();
		// If this variable is not set, we need to allow the original script to run
		if (!this._scrollToBottomButton) {
			this._scrollToBottomButton = this.element.find(".jump-to-bottom")[0];
			return this._onScrollLog(event);
		}
		
		/**@type {HTMLElement}*/const log = event.target;
		const pct = log.scrollTop / (log.scrollHeight - log.clientHeight);
		this._isAtBottom = (pct > 0.99) || Number.isNaN(pct);
		this._scrollToBottomButton[0].classList.toggle("hidden", this._isAtBottom);

		const maxMessageCount = SETTINGS.get(ChatHistoryOptimizer.PREF_HISTORY_SIZE);
		// Ignore all scroll events when there are not enough messages to even batch
		if (this.collection.size <= CONFIG.ChatMessage.batchSize) return;
		const messages = $(log).find('li.chat-message');
		// Grab the top most message based on current scroll position
		let topMessageIndex = -1;

		//! NOTICE! The message list is inverted, it is sorted OLDEST to NEWEST,
		//! so message[0] is at the very top of the chat log, and message[n] is
		//! at the very bottom of the chat log.
		
		// We try to start as close to the actual top message as we can, then traverse either up or down from there
		const chatViewTop = log.scrollTop + messages[0].offsetTop;
		let c = Math.clamp(Math.trunc(messages.length * pct), 0, messages.length - 1);
		// If the estimate is too high up the log, we traverse down
		if (messages[c].offsetTop < chatViewTop) {
			for (; c < messages.length; c++) {
				if (
					// If this message is at/on the scroll top
					(messages[c].offsetTop <= chatViewTop && messages[c].offsetTop + messages[c].offsetHeight >= chatViewTop) ||
					// If the previous message is above the view, and this one is in the view
					(c - 1 >= 0 && messages[c].offsetTop >= chatViewTop && messages[c - 1].offsetTop + messages[c - 1].offsetHeight)
				) {
					topMessageIndex = c;
					// We should break as soon as we find it
					break;
				}
			}
		}
		// Otherwise we traverse up the chat log
		else {
			for (; c >= 0; c--) {
				if (
					// If this message is at/on the scroll top
					(messages[c].offsetTop <= chatViewTop && messages[c].offsetTop + messages[c].offsetHeight >= chatViewTop) ||
					// If the previous message is above the view, and this one is in the view
					(c - 1 >= 0 && messages[c].offsetTop >= chatViewTop && messages[c - 1].offsetTop + messages[c - 1].offsetHeight)
				) {
					topMessageIndex = c;
					// We should break as soon as we find it
					break;
				}
			}
		}
		// If we found nothing
		if (topMessageIndex < 0) {
			return Promise.resolve();
		}

		// Check if we should load more messages
		if (topMessageIndex < (CONFIG.ChatMessage.batchSize / 4) && messages.length < this.collection.size) {
			// Add Messages
			return this._renderBatch(this.element, CONFIG.ChatMessage.batchSize);
		}
		// If we don't want to load more, check if we should delete some
		else if (topMessageIndex > maxMessageCount) {
			const count = topMessageIndex - (maxMessageCount - 1);
			// Set the Last ID for batch rendering
			this._lastId = messages[count].dataset.messageId;
			// Remove the messages
			messages.slice(0, count).remove();
		}
		return Promise.resolve();
	}

	static #_lastFrame = 0;
	/**
	 * @private
	 * @param {number} time
	 */
	static _displayMessageCounts(time) {
		if (ChatHistoryOptimizer.#_lastFrame + 1000 < time) {
			ChatHistoryOptimizer.#_lastFrame = time;
			$('.dfce-chat-count').each(function (_, element) {
				const msgCount = $(element).siblings('#chat-log').find('li.chat-message').length;
				element.innerText = `${msgCount} / ${ui.chat.collection.size}`;
			});
		}
		requestAnimationFrame(ChatHistoryOptimizer._displayMessageCounts);
	}
}