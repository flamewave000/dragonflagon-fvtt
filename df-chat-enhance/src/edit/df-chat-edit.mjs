/// <reference path="../../../fvtt-scripts/foundry.js" />
/// <reference path="../../../common/foundry.d.ts" />
/// <reference path="../../../common/libWrapper.d.ts" />
import SETTINGS from "../../common/Settings.mjs";
import DFChatEditor from './DFChatEditor.mjs';

const PREF_EDIT_ALLOWED = 'edit-allowed';
const PREF_GM_ALL = 'gm-edit-all';
const PREF_IGNORE_HTML = 'edit-ignore-html';

export default class DFChatEdit {
	/**@readonly*/static PREF_SHOW_EDITED = 'DFChatEdit.ShowEditedLable';

	static ready() {
		SETTINGS.register(DFChatEditor.PREF_MARKDOWN, {
			name: 'DF_CHAT_EDIT.Settings_MarkdownName',
			hint: 'DF_CHAT_EDIT.Settings_MarkdownHint',
			type: Boolean,
			default: true,
			config: true,
			scope: 'world'
		});
		SETTINGS.register(PREF_EDIT_ALLOWED, {
			name: 'DF_CHAT_EDIT.Settings_AllowEditName',
			hint: 'DF_CHAT_EDIT.Settings_AllowEditHint',
			type: Boolean,
			default: true,
			scope: 'world',
			config: true
		});
		SETTINGS.register(PREF_GM_ALL, {
			name: 'DF_CHAT_EDIT.Settings_GMEditAllName',
			hint: 'DF_CHAT_EDIT.Settings_GMEditAllHint',
			type: Boolean,
			default: false,
			config: true,
			scope: 'world'
		});
		SETTINGS.register(PREF_IGNORE_HTML, {
			name: 'DF_CHAT_EDIT.Settings_IgnoreHtmlName',
			hint: 'DF_CHAT_EDIT.Settings_IgnoreHtmlHint',
			type: Boolean,
			default: false,
			config: true,
			scope: 'world'
		});
		SETTINGS.register(this.PREF_SHOW_EDITED, {
			name: 'DF_CHAT_EDIT.Settings_ShowEditedLabelName',
			hint: 'DF_CHAT_EDIT.Settings_ShowEditedLabelHint',
			type: Boolean,
			default: true,
			config: true,
			scope: 'world'
		});

		libWrapper.register(SETTINGS.MOD_NAME, 'ChatLog.prototype._onChatKeyDown', (/**@type {()=>void}*/wrapper, ...args) => {
			/**@type {KeyboardEvent}*/
			const event = args[0];
			// We have used the Shift+Up combo to edit previously sent message
			if (event.code === "ArrowUp" && event.ctrlKey) {
				event.preventDefault();
				/**@type {ChatMessage[]}*/
				let messages = [...(ui.chat.collection.values())];
				// Perform an inverted sort ( n<0 before, n=0 same, n>0 after )
				messages = messages.sort((a, b) => b.timestamp - a.timestamp);
				const message = messages.find(x => x.author === game.user.id);
				if (!message) return;
				DFChatEdit.editChatMessage.bind(message)();
			}
			else
				wrapper(...args);
		}, 'MIXED');

		libWrapper.register(SETTINGS.MOD_NAME, 'ChatLog.prototype.processMessage',
			/**
			 * @this {ChatLog}
			 * @param {Function} wrapper
			 * @param {string} message
			 * @returns {unknown}
			 */
			function (wrapper, message) {
				/**@type {string|null}*/
				let originalMessage = null;
				if (SETTINGS.get(DFChatEditor.PREF_MARKDOWN)) {
					if (message.trim().startsWith('/')) {
						const token = message.split(' ')[0].trim();
						switch (token) {
							case '/ooc': /* fall-through */
							case '/ic': /* fall-through */
							case '/emote': /* fall-through */
							case '/whisper': /* fall-through */
							case '/w':
								[originalMessage, message] = DFChatEditor.processMarkdown(message.substr(token.length));
								originalMessage = `${token} ${originalMessage.trimStart()}`;
								message = `${token} ${message.trimStart()}`;
								break;
							case 'log': /* fall-through */
							case 'gmlog': /* fall-through */
							case '/gmroll': /* fall-through */
							case '/blindroll': /* fall-through */
							case '/selfroll': /* fall-through */
							case '/r': /* fall-through */
							case '/roll': /* fall-through */
							default: break;
						}
					} else {
						[originalMessage, message] = DFChatEditor.processMarkdown(message);
					}
				}
				const result = wrapper(message);
				if (originalMessage) {
					this._sentMessages.splice(0, 1);
					this._sentMessages.unshift(originalMessage);
				}
				return result;
			}, 'WRAPPER');
	}

	/** @param {ContextMenuEntry[]} options */
	static appendChatContextMenuOptions(options) {
		options.push({
			name: 'DF_CHAT_EDIT.ContextOption',
			icon: '<i class="fas fa-pencil-alt"></i>',
			condition: (header) => {
				/**@type {ChatMessage}*/
				const chatData = ui.chat.collection.get($(header).attr('data-message-id'));
				return this.processChatMessage(chatData);
			},
			callback: (header) => {
				/**@type {ChatMessage}*/
				const chatData = ui.chat.collection.get($(header).attr('data-message-id'));
				DFChatEdit.editChatMessage.bind(chatData)();
				return {};
			}
		});
	}

	/**
	 * Will be bound to the instance of ChatMessage we are observing
	 * @this {ChatMessage}
	 * @returns {Promise<void>}
	 */
	static async editChatMessage() {
		// Double check permissions
		if (!SETTINGS.get(PREF_EDIT_ALLOWED)) {
			ui.notifications.warn('DF_CHAT_EDIT.Error_NoPermission'.localize());
			return;
		}
		if (this.chatEditor) {
			this.chatEditor.bringToTop();
		} else {
			this.chatEditor = new DFChatEditor(this);
			await this.chatEditor._render(true);
		}
		this.chatEditor.element.find('textarea').focus();
	}

	/**
	 * @param {string} str
	 * @returns {boolean}
	 */
	static isHTML(str) {
		const doc = new DOMParser().parseFromString(str, "text/html");
		return Array.from(doc.body.childNodes).some(node => {
			return (node instanceof HTMLElement && !node.classList.contains('df-edited'))
				&& !(node instanceof HTMLBRElement)
				&& node.nodeType === 1;
		});
	}

	/**
	 * @param {ChatMessage} chatMessage
	 * @returns {boolean}
	 */
	static processChatMessage(chatMessage,) {
		// If we are catching the render of an archived message
		if (!ui.chat.collection.has(chatMessage.id))
			return false;
		// Ignore rolls and other people's messages, unless we are the GM and PREF_GM_ALL is true
		if (!SETTINGS.get(PREF_EDIT_ALLOWED) || chatMessage.isRoll
			|| (chatMessage.author.id !== game.userId && !(game.user.isGM && SETTINGS.get(PREF_GM_ALL))))
			return false;
		// If we ignore html and message contains html, return
		if (SETTINGS.get(PREF_IGNORE_HTML) && DFChatEdit.isHTML(chatMessage.content)) return false;
		return true;
	}
}
