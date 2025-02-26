/// <reference path="../../../fvtt-scripts/foundry.js" />
/// <reference path="../../../common/foundry.d.ts" />
/// <reference path="../../../common/libWrapper.d.ts" />
import SETTINGS from "../../common/Settings.mjs";
import ChatHistoryOptimizer from "./ChatHistoryOptimizer.mjs";

// div.jump-to-bottom

export default class ScrollManage {
	/**@readonly*/static #PREF_ENABLED = 'scroll-manage-enabled';
	/**@readonly*/static #PREF_SCROLL_IF_YOU = 'scroll-manage-scroll-if-you';

	static recentPostOneIgnoreCount = 0;

	/**@type {boolean}*/
	static get enabled() { return SETTINGS.get(this.#PREF_ENABLED); }
	/**@type {boolean}*/
	static get scrollToBottomIfYouSendMessage() { return SETTINGS.get(this.#PREF_SCROLL_IF_YOU); }

	static init() {
		Hooks.on('renderChatLog', this.#_renderChatLog.bind(this));

		SETTINGS.register(this.#PREF_ENABLED, {
			name: 'DF_CHAT_SCROLL.EnableName',
			hint: 'DF_CHAT_SCROLL.EnableHint',
			scope: 'world',
			config: true,
			type: Boolean,
			default: true,
			onChange: (newValue) => {
				if (newValue) this.#register();
				else this.#unregister();
			}
		});
		SETTINGS.register(this.#PREF_SCROLL_IF_YOU, {
			name: 'DF_CHAT_SCROLL.ScrollIfYouName',
			hint: 'DF_CHAT_SCROLL.ScrollIfYouHint',
			scope: 'world',
			config: true,
			type: Boolean,
			default: true
		});

		ChatHistoryOptimizer.init();
	}

	static ready() {
		if (this.enabled)
			this.#register();
	}

	static #register() {
		libWrapper.register(SETTINGS.MOD_NAME, 'ChatLog.prototype.postOne', this._ChatLog_postOne, 'WRAPPER');
		libWrapper.register(SETTINGS.MOD_NAME, 'ChatLog.prototype.scrollBottom', this._ChatLog_scrollBottom, 'MIXED');
	}
	static #unregister() {
		libWrapper.unregister(SETTINGS.MOD_NAME, 'ChatLog.prototype.postOne', false);
		libWrapper.unregister(SETTINGS.MOD_NAME, 'ChatLog.prototype.scrollBottom', false);
	}

	/**
	 * Post a single chat message to the log
	 * @this {ChatLog}
	 * @param {Function} wrapped
	 * @param {ChatMessage} message   A ChatMessage document instance to post to the log
	 * @param {object} [options={}]   Additional options for how the message is posted to the log
	 * @param {string} [options.before] An existing message ID to append the message before, by default the new message is
	 *                                  appended to the end of the log.
	 * @param {boolean} [options.notify] Trigger a notification which shows the log as having a new unread message.
	 * @returns {Promise<void>}       A Promise which resolves once the message is posted
	 */
	static _ChatLog_postOne(wrapped, message, { before, notify = false } = {}) {
		if (!this.isAtBottom)
			this._scrollToBottomButton.addClass('new');
		if (!this.isAtBottom && message.isAuthor && !ScrollManage.scrollToBottomIfYouSendMessage)
			ScrollManage.recentPostOneIgnoreCount++;
		return wrapped(message, { before, notify });
	}

	/**
	 * @private
	 * @this {ChatLog}
	 * @param {UIEvent} _event   The initial scroll event
	 */
	static _ChatLog_onScrollLog(_event) {
		if (this.isAtBottom)
			this._scrollToBottomButton.removeClass('new');
	}

	/**
	 * @param {ChatLog} app
	 * @param {JQuery<HTMLElement>} html
	 */
	static #_renderChatLog(app, html) {
		app._scrollToBottomButton = html.find(".jump-to-bottom");
		// Load new messages on scroll
		html.find("#chat-log").on("scroll", this._ChatLog_onScrollLog.bind(app));
		this._isAtBottom = true;
	}

	/**
	 * @private
	 * @this {ChatLog}
	 * @param {Function} wrapped
	 * @param {...any} args
	 * @returns
	 */
	static async _ChatLog_scrollBottom(wrapped, ...args) {
		if (ScrollManage.recentPostOneIgnoreCount > 0) {
			ScrollManage.recentPostOneIgnoreCount--;
			return;
		}
		this._scrollToBottomButton.removeClass('new');
		await wrapped(...args);
		(ChatHistoryOptimizer.ChatLog_onScrollLog.bind(this))({
			target: this.element[0].querySelector("#chat-log")
		});
	}
}