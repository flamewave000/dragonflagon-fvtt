import CONFIG from "../CONFIG.js";
import DFChatEditor from './DFChatEditor.js';


declare global {
	interface ChatMessage {
		chatEditor: DFChatEditor
		getHTML(): Promise<JQuery<HTMLElement>>
	}
}

const PREF_EDIT_ALLOWED = 'edit-allowed';
const PREF_GM_ALL = 'gm-edit-all';

export default function initDFChatEdit() {
	game.settings.register(CONFIG.MOD_NAME, PREF_EDIT_ALLOWED, {
		name: 'DF_CHAT_EDIT.Settings_AllowEditName',
		hint: 'DF_CHAT_EDIT.Settings_AllowEditHint',
		type: Boolean,
		default: true,
		scope: 'world',
		config: true
	});
	game.settings.register(CONFIG.MOD_NAME, PREF_GM_ALL, {
		name: 'DF_CHAT_EDIT.Settings_GMEditAllName',
		hint: 'DF_CHAT_EDIT.Settings_GMEditAllHint',
		type: Boolean,
		default: false,
		config: true,
		scope: 'world',
		onChange: () => {
			processAllMessages();
		}
	});

	if (game.user.isGM || game.settings.get(CONFIG.MOD_NAME, PREF_EDIT_ALLOWED)) {
		Hooks.on('renderChatMessage', processChatMessage);
		processAllMessages();
	}

	libWrapper.register(CONFIG.MOD_NAME, 'ChatLog.prototype._onChatKeyDown', (wrapper: Function, ...args: any) => {
		const event = args[0] as KeyboardEvent;
		const code = game.keyboard.getKey(event);
		// We have used the Shift+Up combo to edit previously sent message
		if (code === "ArrowUp" && event.shiftKey) {
			event.preventDefault();
			var messages = [...(ui.chat.collection as Map<string, ChatMessage>).values()];
			// Perform an inverted sort ( n<0 before, n=0 same, n>0 after )
			messages = messages.sort((a, b) => b.data.timestamp - a.data.timestamp);
			const message = messages.find(x => x.data.user === game.user.id);
			if (!message) return;
			editChatMessage.bind(message)();
		}
		else
			wrapper(...args);
	}, 'MIXED');
}

// Will be bound to the instance of ChatMessage we are observing
function editChatMessage(this: ChatMessage) {
	// Double check permissions
	if (!game.settings.get(CONFIG.MOD_NAME, PREF_EDIT_ALLOWED)) {
		ui.notifications.warn(game.i18n.localize('DF_CHAT_EDIT.Error_NoPermission'));
		// Try removing the edit buttons from everything
		processAllMessages();
		return;
	}
	if (!!this.chatEditor) {
		this.chatEditor.bringToTop();
	} else {
		this.chatEditor = new DFChatEditor(this);
		this.chatEditor.render(true);
	}
}

function processAllMessages() {
	var element: JQuery<HTMLLIElement>;
	ui.chat.element.find('li.chat-message').each(function () {
		element = $(this) as JQuery<HTMLLIElement>;
		const message = game.messages.get(element.attr('data-message-id'));
		processChatMessage(message, element, message.data);
	});
}

function processChatMessage(chatMessage: ChatMessage, html: JQuery<HTMLElement>, data: any) {
	// If we are catching the render of an archived message
	if(!(ui.chat.collection as Map<string, ChatMessage>).has(chatMessage.id))
		return;
	// If an edit button has already been placed
	if (html.find('a.button.message-edit').length != 0) {
		html.find('a.button.message-edit').remove();// remove the old edit button
	}
	// Ignore rolls and other people's messages, unless we are the GM and PREF_GM_ALL is true
	if (!game.settings.get(CONFIG.MOD_NAME, PREF_EDIT_ALLOWED) || chatMessage.isRoll
		|| (chatMessage.data.user !== game.userId && !(game.user.isGM && game.settings.get(CONFIG.MOD_NAME, PREF_GM_ALL))))
		return;
	const header = html.find('header.message-header');
	const editButton = $(`<a class="button message-edit"><i class="fas fa-pencil-alt"></i></a>`);
	header.prepend(editButton);
	editButton.on('click', editChatMessage.bind(chatMessage));
}