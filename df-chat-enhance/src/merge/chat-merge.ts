import SETTINGS from "../SETTINGS.js";


export default class ChatMerge {

	private static readonly PREF_ENABLED = 'chat-merge-enabled';
	private static readonly PREF_EPOCH = 'chat-merge-epoch';
	private static readonly PREF_ALLOW_ROLLS = 'chat-merge-allowRolls';
	private static readonly PREF_SEPARATE = 'chat-merge-separateWithBorder';
	private static readonly PREF_HOVER = 'chat-merge-showhover';
	private static readonly PREF_SHOW_HEADER = 'chat-merge-showheader';

	private static get _enabled(): boolean { return SETTINGS.get(this.PREF_ENABLED); }
	private static get _epoch(): number { return SETTINGS.get(this.PREF_EPOCH) }
	private static get _allowRolls(): string { return SETTINGS.get(this.PREF_ALLOW_ROLLS) }
	private static get _separateWithBorder(): boolean { return SETTINGS.get(this.PREF_SEPARATE) }
	private static get _showHover(): boolean { return SETTINGS.get(this.PREF_HOVER) }
	private static get _showHeader(): boolean { return SETTINGS.get(this.PREF_SHOW_HEADER) }

	static init() {
		SETTINGS.register(this.PREF_ENABLED, {
			name: 'DF_CHAT_MERGE.EnableName',
			hint: 'DF_CHAT_MERGE.EnableHint',
			config: true,
			scope: 'client',
			default: true,
			type: Boolean,
			onChange: () => this._processAllMessage()
		});
		SETTINGS.register(this.PREF_SHOW_HEADER, {
			name: 'DF_CHAT_MERGE.ShowHeaderName',
			hint: 'DF_CHAT_MERGE.ShowHeaderHint',
			config: true,
			scope: 'client',
			default: false,
			type: Boolean,
			onChange: (newValue: Boolean) => {
				const style = (<HTMLElement>document.querySelector(':root')).style;
				style.setProperty('--dfce-cm-header', newValue ? '' : 'none');
				if (game.user.isGM) {
					style.setProperty('--dfce-cm-header-delete', newValue ? '' : '0');
					style.setProperty('--dfce-cm-header-delete-pad', newValue ? '' : '16px');
				}
			}
		});
		SETTINGS.register(this.PREF_ALLOW_ROLLS, {
			name: 'DF_CHAT_MERGE.AllowRollsName',
			hint: 'DF_CHAT_MERGE.AllowRollsHint',
			config: true,
			scope: 'client',
			default: 'rolls',
			type: String,
			choices: {
				none: game.i18n.localize('DF_CHAT_MERGE.AllowRollsOptions.none'),
				rolls: game.i18n.localize('DF_CHAT_MERGE.AllowRollsOptions.rolls'),
				all: game.i18n.localize('DF_CHAT_MERGE.AllowRollsOptions.all')
			},
			onChange: () => this._processAllMessage()
		});
		SETTINGS.register(this.PREF_SEPARATE, {
			name: 'DF_CHAT_MERGE.SeparateName',
			hint: 'DF_CHAT_MERGE.SeparateHint',
			config: true,
			scope: 'client',
			default: false,
			type: Boolean,
			onChange: (newValue: Boolean) => {
				const style = (<HTMLElement>document.querySelector(':root')).style;
				style.setProperty('--dfce-cm-separation', newValue ? '' : '0');
			}
		});
		SETTINGS.register(this.PREF_HOVER, {
			name: 'DF_CHAT_MERGE.HoverName',
			hint: 'DF_CHAT_MERGE.HoverHint',
			config: true,
			scope: 'client',
			default: true,
			type: Boolean,
			onChange: (newValue: Boolean) => {
				const style = (<HTMLElement>document.querySelector(':root')).style;
				style.setProperty('--dfce-cm-hover-shadow', newValue ? '' : '0');
			}
		});
		SETTINGS.register(this.PREF_EPOCH, {
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
			onChange: () => this._processAllMessage()
		});

		libWrapper.register(SETTINGS.MOD_NAME, 'ChatLog.prototype.deleteMessage', this._deleteMessage.bind(this), 'WRAPPER');
		Hooks.on("renderChatMessage", this._renderChatMessage);
	}
	static ready() {
		const style = (<HTMLElement>document.querySelector(':root')).style;
		style.setProperty('--dfce-cm-separation', this._separateWithBorder ? '' : '0');
		style.setProperty('--dfce-cm-hover-shadow', this._showHover ? '' : '0');
		style.setProperty('--dfce-cm-header', this._showHeader ? '' : 'none');
		if (game.user.isGM) {
			style.setProperty('--dfce-cm-header-delete', this._showHeader ? '' : '0');
			style.setProperty('--dfce-cm-header-delete-pad', this._showHeader ? '' : '16px');
		}
		this._processAllMessage();
	}

	private static _deleteMessage(wrapper: Function, messageId: string, { deleteAll = false } = {}) {
		// Ignore the Delete All process. Everything is being obliterated, who cares about the styling
		if (!deleteAll && this._enabled) {
			const element = document.querySelector(`li[data-message-id="${messageId}"`);
			// If we were a TOP
			if (element.classList.contains('dfce-cm-top')) {
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
			else if (element.classList.contains('dfce-cm-bottom')) {
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
			else if (element.classList.contains('dfce-cm-middle'))
				element.classList.remove('dfce-cm-middle');
		}
		return wrapper(messageId, { deleteAll });
	}

	private static _processAllMessage() {
		// Remove the old CSS class designations
		$('.dfce-cm-top').removeClass('dfce-cm-top');
		$('.dfce-cm-middle').removeClass('dfce-cm-middle');
		$('.dfce-cm-bottom').removeClass('dfce-cm-bottom');
		// If we are disabled, return
		if (!ChatMerge._enabled) return;
		// Collect all rendered chat messages
		const messages = $('li.chat-message');
		// Return if there are no messages rendered
		if (messages.length === 0) return;
		// Make sure to set the hover colour for the first message since we skip it in the processor bellow.
		if (messages[0].hasAttribute('style')) {
			messages[0].style.setProperty('--dfce-mc-border-color', messages[0].style.borderColor);
		}
		// Process each message after the first
		for (let c = 1; c < messages.length; c++) {
			// Update styling of the chat messages
			this._styleChatMessages(
				game.messages.get(messages[c].getAttribute('data-message-id')),
				messages[c],
				game.messages.get(messages[c - 1].getAttribute('data-message-id')),
				messages[c - 1]);
		}
	}

	private static _renderChatMessage(message: ChatMessage, html: JQuery<HTMLElement>, messageData: ChatMessage.Data) {
		if (!ChatMerge._enabled) return;
		// Find the most recent message in the chat log
		const partnerElem = $(`li.chat-message`).last()[0];
		// If there is no message, return
		if (partnerElem === null || partnerElem === undefined) return;
		// get the ChatMessage document associated with the html
		const partner = game.messages.get(partnerElem.getAttribute('data-message-id'));
		// Update styling of the chat messages
		ChatMerge._styleChatMessages(message, html[0], partner, partnerElem);
	}

	private static _inTimeFrame(current: number, previous: number): boolean {
		return current > previous && (current - previous) < (this._epoch * 1000);
	}

	private static _isValidMessage(current: ChatMessage, previous: ChatMessage) {
		const rolls = this._allowRolls;
		return current.data.user === previous.data.user
			&& this._inTimeFrame(current.data.timestamp, previous.data.timestamp)
			&& (rolls === 'all'
				|| (rolls === 'rolls' && current.isRoll === previous.isRoll)
				|| (rolls === 'none' && !current.isRoll && !previous.isRoll))
	}

	private static _styleChatMessages(curr: ChatMessage, currElem: HTMLElement, prev: ChatMessage, prevElem: HTMLElement) {
		if (currElem.hasAttribute('style')) {
			currElem.style.setProperty('--dfce-mc-border-color', currElem.style.borderColor);
		}
		if (!ChatMerge._isValidMessage(curr, prev)) return;
		if (prevElem.classList.contains('dfce-cm-bottom')) {
			prevElem.classList.remove('dfce-cm-bottom');
			prevElem.classList.add('dfce-cm-middle');
		} else prevElem.classList.add('dfce-cm-top');
		currElem.classList.add('dfce-cm-bottom');
	}
}