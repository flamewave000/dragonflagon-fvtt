import SETTINGS from "../../../common/Settings";
import UTIL from "../Util";

export default class ChatHistoryOptimizer {

	private static readonly PREF_ENABLED = 'ChatHistoryOptimizer.Enabled';
	private static readonly PREF_HISTORY_SIZE = 'ChatHistoryOptimizer.HistorySize';

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
		SETTINGS.register<number>(this.PREF_HISTORY_SIZE, {
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

		libWrapper.register(SETTINGS.MOD_NAME, 'ChatLog.prototype._onScrollLog', this._ChatLog_onScrollLog, 'MIXED');

		/**
		// This is used for DEBUG purposes only
		// Displays the number of messages being rendered in the Chat Log
		Hooks.on('renderChatLog', (_: any, html: JQuery) => {
			html.find('#scrollToBottom').after('<div class="dfce-chat-count" style="flex:0;text-align:center"></div>');
		});
		this._displayMessageCounts(0);
		/**/
	}

	private static _ChatLog_onScrollLog(this: ChatLog, wrapped: (event: any) => Promise<void>, event: any): Promise<void> {
		if (!this.rendered) return Promise.resolve();
		const maxMessageCount = SETTINGS.get<number>(ChatHistoryOptimizer.PREF_HISTORY_SIZE);
		// Ignore all scroll events when there are not enough messages to even batch
		if (this.collection.size <= CONFIG.ChatMessage.batchSize) return wrapped(event);
		const log = event.target as HTMLElement;
		const messages = $(log).find('li.chat-message');

		// Grab the top most message based on current scroll position
		let topMessageIndex = -1;

		//! NOTICE! The message list is inverted, it is sorted OLDEST to NEWEST,
		//! so message[0] is at the very top of the chat log, and message[n] is
		//! at the very bottom of the chat log.

		// We try to start as close to the actual top message as we can, then traverse either up or down from there
		const pct = log.scrollTop / log.scrollHeight;
		const chatViewTop = log.scrollTop + messages[0].offsetTop;
		let c = Math.trunc(messages.length * pct);
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

	private static _lastFrame = 0;
	private static _displayMessageCounts(time: number) {
		if (ChatHistoryOptimizer._lastFrame + 500 < time) {
			ChatHistoryOptimizer._lastFrame = time;
			$('.dfce-chat-count').each(function (_, element: HTMLElement) {
				const msgCount = $(element).siblings('#chat-log').find('li.chat-message').length;
				element.innerText = `${msgCount} / ${ui.chat.collection.size}`;
			});
		}
		requestAnimationFrame(ChatHistoryOptimizer._displayMessageCounts);
	}
}