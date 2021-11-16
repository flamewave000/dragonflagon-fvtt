import SETTINGS from "../../../common/Settings";
import DFChatEditor from './DFChatEditor';

const PREF_EDIT_ALLOWED = 'edit-allowed';
const PREF_GM_ALL = 'gm-edit-all';
const PREF_IGNORE_HTML = 'edit-ignore-html';

export default class DFChatEdit {
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

		libWrapper.register(SETTINGS.MOD_NAME, 'ChatLog.prototype._onChatKeyDown', (wrapper: (..._: any) => void, ...args: any) => {
			const event = args[0] as KeyboardEvent;
			const code = game.keyboard.getKey(event);
			// We have used the Shift+Up combo to edit previously sent message
			if (code === "ArrowUp" && event.ctrlKey) {
				event.preventDefault();
				let messages = <ChatMessage[]>[...(ui.chat.collection.values())];
				// Perform an inverted sort ( n<0 before, n=0 same, n>0 after )
				messages = messages.sort((a, b) => b.data.timestamp - a.data.timestamp);
				const message = messages.find(x => x.data.user === game.user.id);
				if (!message) return;
				DFChatEdit.editChatMessage.bind(message)();
			}
			else
				wrapper(...args);
		}, 'MIXED');

		libWrapper.register(SETTINGS.MOD_NAME, 'ChatLog.prototype.processMessage', function (this: ChatLog, wrapper: AnyFunction, message: string) {
			let originalMessage: string = null;
			if (SETTINGS.get(DFChatEditor.PREF_MARKDOWN) && !message.trim().startsWith('/')) {
				[originalMessage, message] = DFChatEditor.processMarkdown(message);
			}
			const result = wrapper(message);
			if (originalMessage) {
				this._sentMessages.splice(0, 1);
				this._sentMessages.unshift(originalMessage);
			}
			return result;
		}, 'WRAPPER');
	}

	static appendChatContextMenuOptions(options: ContextMenu.Item[]) {
		options.push({
			name: 'DF_CHAT_EDIT.ContextOption',
			icon: '<i class="fas fa-pencil-alt"></i>',
			condition: (header) => {
				const chatData: ChatMessage = ui.chat.collection.get($(header).attr('data-message-id'));
				return this.processChatMessage(chatData);
			},
			callback: (header) => {
				const chatData = ui.chat.collection.get($(header).attr('data-message-id'));
				DFChatEdit.editChatMessage.bind(chatData)();
				return {};
			}
		});
	}

	// Will be bound to the instance of ChatMessage we are observing
	static editChatMessage(this: ChatMessage) {
		// Double check permissions
		if (!SETTINGS.get(PREF_EDIT_ALLOWED)) {
			ui.notifications.warn('DF_CHAT_EDIT.Error_NoPermission'.localize());
			return;
		}
		if ((<any>this).chatEditor) {
			(<any>this).chatEditor.bringToTop();
		} else {
			(<any>this).chatEditor = new DFChatEditor(this);
			(<any>this).chatEditor.render(true);
		}
	}

	static isHTML(str: string): boolean {
		const doc = new DOMParser().parseFromString(str, "text/html");
		return Array.from(doc.body.childNodes).some(node => {
			return (node instanceof HTMLElement && !node.classList.contains('df-edited'))
				&& !(node instanceof HTMLBRElement)
				&& node.nodeType === 1;
		});
	}

	static processChatMessage(chatMessage: ChatMessage/*, html: JQuery<HTMLElement>*/): boolean {
		// If we are catching the render of an archived message
		if (!ui.chat.collection.has(chatMessage.id))
			return false;
		// // If an edit button has already been placed
		// if (html.find('a.button.message-edit').length != 0) {
		// 	html.find('a.button.message-edit').remove();// remove the old edit button
		// }
		// Ignore rolls and other people's messages, unless we are the GM and PREF_GM_ALL is true
		if (!SETTINGS.get(PREF_EDIT_ALLOWED) || chatMessage.isRoll
			|| (chatMessage.data.user !== game.userId && !(game.user.isGM && SETTINGS.get(PREF_GM_ALL))))
			return false;
		// If we ignore html and message contains html, return
		if (SETTINGS.get(PREF_IGNORE_HTML) && DFChatEdit.isHTML(chatMessage.data.content)) return false;

		return true;
		// const header = html.find('header.message-header');
		// const editButton = $(`<a class="button message-edit"><i class="fas fa-pencil-alt"></i></a>`);
		// header.prepend(editButton);
		// editButton.on('click', DFChatEdit.editChatMessage.bind(chatMessage));
	}
}