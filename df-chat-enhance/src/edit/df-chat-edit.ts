import CONFIG from "../CONFIG.js";
import DFChatEditor from './DFChatEditor.js';

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

	Hooks.once('ready', function () {
		if (game.user.isGM || game.settings.get(CONFIG.MOD_NAME, PREF_EDIT_ALLOWED)) {
			Hooks.on('renderChatMessage', processChatMessage);
			processAllMessages();
		}
	});
}

// Will be bound to the instance of ChatMessage we are observing
async function editChatMessage(this: ChatMessage) {
	// Double check permissions
	if (!game.settings.get(CONFIG.MOD_NAME, PREF_EDIT_ALLOWED)) {
		ui.notifications.warn(game.i18n.localize('DF_CHAT_EDIT.Error_NoPermission'));
		// Try removing the edit buttons from everything
		processAllMessages();
		return;
	}
	if (!!(this as any).chatEditor) {
		(this as any).chatEditor.bringToTop();
	} else {
		(this as any).chatEditor = new DFChatEditor(this);
		(this as any).chatEditor.render(true);
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
	// If an edit button has already been placed
	if (html.find('a.button.message-edit').length != 0) {
		html.find('a.button.message-edit').remove();// remove the old edit button
	}
	// Ignore rolls and other people's messages, unless we are the GM and PREF_GM_ALL is true
	if (!game.settings.get(CONFIG.MOD_NAME, PREF_EDIT_ALLOWED) || chatMessage.isRoll
		|| (chatMessage.data.user !== game.userId && !(game.user.isGM && game.settings.get(CONFIG.MOD_NAME, PREF_GM_ALL))))
		return;
	const header = html.find('header.message-header');
	const editButton = $(`<a class="button message-edit" style="flex:0 0 auto;margin-right:0.125em"><i class="fas fa-pencil-alt"></i></a>`);
	header.prepend(editButton);
	editButton.on('click', editChatMessage.bind(chatMessage));
}