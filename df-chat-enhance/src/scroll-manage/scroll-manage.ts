import SETTINGS from "../../../common/SETTINGS";


export default class ScrollManage {
	private static readonly PREF_ENABLED = 'scroll-manage-enabled';
	private static readonly PREF_SCROLL_IF_YOU = 'scroll-manage-scroll-if-you';
	private static readonly ScrollThreshold = 50;
	private static _scrollToBottomButton: JQuery<HTMLElement>;


	static get enabled(): Boolean { return SETTINGS.get(this.PREF_ENABLED); }
	static get scrollToBottomIfYouSendMessage(): Boolean { return SETTINGS.get(this.PREF_SCROLL_IF_YOU); }

	static init() {
		Hooks.on('renderChatLog', this._renderChatLog.bind(this));

		SETTINGS.register(this.PREF_ENABLED, {
			name: 'DF_CHAT_SCROLL.EnableName',
			hint: 'DF_CHAT_SCROLL.EnableHint',
			scope: 'world',
			config: true,
			type: Boolean,
			default: true,
			onChange: (newValue) => {
				if (newValue) {
					libWrapper.register(SETTINGS.MOD_NAME, 'ChatLog.prototype.postOne', this._ChatLog_postOne, 'OVERRIDE');
				}
				else {
					libWrapper.unregister(SETTINGS.MOD_NAME, 'ChatLog.prototype.postOne', false);
				}
			}
		});
		SETTINGS.register(this.PREF_SCROLL_IF_YOU, {
			name: 'DF_CHAT_SCROLL.ScrollIfYouName',
			hint: 'DF_CHAT_SCROLL.ScrollIfYouHint',
			scope: 'world',
			config: true,
			type: Boolean,
			default: true
		});
	}

	static ready() {
		if (this.enabled)
			libWrapper.register(SETTINGS.MOD_NAME, 'ChatLog.prototype.postOne', this._ChatLog_postOne, 'OVERRIDE');
	}

	private static _renderChatLog(app: ChatLog, html: JQuery<HTMLElement>, data: object) {
		this._scrollToBottomButton = $(`<div id="scrollToBottom" style="display:none">
	<span>${game.i18n.localize('DF_CHAT_SCROLL.NewMessage')}</span> ${game.i18n.localize('DF_CHAT_SCROLL.ScrollButton')}
</div>`);
		this._scrollToBottomButton.on('click', () => {
			const el = app.element;
			const log = el.length ? el[0].querySelector("#chat-log") : null;
			if (log) {
				log.scrollTo({ behavior: "smooth", top: log.scrollHeight });
			}
		});
		html.find('div#chat-controls').before(this._scrollToBottomButton);

		html.find('ol#chat-log').on('scroll', (event) => {
			if (!this._scrollToBottomButton) return;
			const element = <HTMLOListElement>event.currentTarget;
			// Ignore events when the scroll height is too small to matter
			if (element.clientHeight > element.scrollHeight - this.ScrollThreshold) return;
			if (element.scrollTop < (element.scrollHeight - element.clientHeight) - this.ScrollThreshold)
				this._scrollToBottomButton.show();
			else {
				this._scrollToBottomButton.hide();
				this._scrollToBottomButton.removeClass('new');
			}
		});
	}

	private static async _ChatLog_postOne(this: ChatLog, message: ChatMessage, notify = false) {
		if (!message.visible) return;

		// Track internal flags
		if (!this._lastId) this._lastId = message.id; // Ensure that new messages don't result in batched scrolling
		if ((message.data.whisper || []).includes(game.user.id) && !message.isRoll) {
			this._lastWhisper = message;
		}

		// Render the message to the log
		const element = this.element.find("#chat-log");
		const atBottom = element[0].scrollTop >= ((element[0].scrollHeight - element[0].clientHeight) - ScrollManage.ScrollThreshold);
		const html = await (<any>message).getHTML();
		element.append(html);
		if (atBottom || (ScrollManage.scrollToBottomIfYouSendMessage && message.isAuthor))
			element[0].scrollTo({ top: element[0].scrollHeight, behavior: 'smooth' });
		// this.scrollBottom();
		else {
			ScrollManage._scrollToBottomButton.addClass('new');
		}

		// Post notification
		if (notify) this.notify(message);

		// Update popout tab
		if (this._popout) await (<any>this._popout).postOne(message, false);
		if (this.popOut) this.setPosition();
	}
}