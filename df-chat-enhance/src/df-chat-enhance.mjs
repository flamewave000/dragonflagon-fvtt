/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="./types.d.ts" />

// import * as DFChatArchive from "./archive/df-chat-archive.mjs";
// import DFChatEdit from "./edit/df-chat-edit.mjs";
// import * as DFAdventureLog from "./logger/df-adventure-log.mjs";
// import DFAdventureLogProcessor from "./logger/DFAdventureLogProcessor.mjs";
// import ChatMerge from "./merge/chat-merge.mjs";
import ChatRollPrivacy from "./privacy/df-chat-privacy.mjs";
// import ScrollManage from "./scroll-manage/scroll-manage.mjs";
import SETTINGS from "../common/Settings.mjs";
import WhisperTruncation from "./whisper-trunc/whisper-trunc.mjs";
// import PlayerColor from './player-color/PlayerColor.mjs';
import SendButton from "./send/send-button.mjs";
import FontSizePatch from "./font-size/font-size.mjs";
import ChatTime from "./chat-time/chat-time.mjs";
SETTINGS.init('df-chat-enhance');

Application.prototype._recalculateDimensions = function () {
	this.element[0].style.height = '';
	this.element[0].style.width = '';
	this.setPosition({});
};

Hooks.once('setup', function () {
	ChatRollPrivacy.setup();
});

Hooks.once('init', function () {
	/**
	 * Order here matters! The archive adds a button to the
	 * chat window, while the privacy changes those buttons
	 * from <a> tags to <button> tags if enabled.
	 */
	// DFChatArchive.init();
	ChatRollPrivacy.init();
	// DFAdventureLog.init();
	// ChatMerge.init();
	// ScrollManage.init();
	WhisperTruncation.init();
	// PlayerColor.init();
	SendButton.init();
	FontSizePatch.init();
	ChatTime.init();

	libWrapper.register(SETTINGS.MOD_NAME, 'ChatLog.prototype._getEntryContextOptions',
		/**
		 * @param {(...args: any) => ContextMenuEntry[]} wrapped
		 * @param  {...any} args
		 * @returns {ContextMenuEntry[]}
		 */
		function (wrapped, ...args) {
			const options = wrapped(...args);
			// DFChatEdit.appendChatContextMenuOptions(options);
			// DFAdventureLogProcessor.appendChatContextMenuOptions(options);
			return options;
		}, 'WRAPPER');
});

Hooks.once('ready', function () {
	if (!game.modules.get('lib-wrapper')?.active) {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error('DF_CHAT_LOG.Error.LibWrapperMissing'.localize());
	}
	// DFAdventureLog.ready();
	// DFChatEdit.ready();
	// ChatMerge.ready();
	// ScrollManage.ready();
	ChatTime.ready();
});
