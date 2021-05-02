import * as DFChatArchive from "./archive/df-chat-archive.js";
import initDFChatEdit from "./edit/df-chat-edit.js";
import * as DFAdventureLog from "./logger/df-adventure-log.js";
import initDFChatPrivacy from "./privacy/df-chat-privacy.js";
import SETTINGS from "./SETTINGS.js";
SETTINGS.init('df-chat-enhance');

// declare global {
// 	interface Application {
// 		_recalculateDimensions(): void;
// 	}
// }

(<any>Application.prototype)._recalculateDimensions = function () {
	this.element[0].style.height = '';
	this.element[0].style.width = '';
	this.setPosition({});
}

Hooks.once('init', function() {
	/**
	 * Order here matters! The archive adds a button to the
	 * chat window, while the privacy changes those buttons
	 * from <a> tags to <button> tags if enabled.
	 */
	DFChatArchive.init();
	initDFChatPrivacy();
	DFAdventureLog.init();
});

Hooks.once('ready', function() {
	DFChatArchive.ready();
	if (!game.modules.get('lib-wrapper')?.active) {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error(game.i18n.localize('DF_CHAT_LOG.Error_LibWrapperMissing'));
	}
	DFAdventureLog.ready();
	initDFChatEdit();
});
