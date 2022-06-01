import * as DFChatArchive from "./archive/df-chat-archive";
import DFChatEdit from "./edit/df-chat-edit";
import * as DFAdventureLog from "./logger/df-adventure-log";
import DFAdventureLogProcessor from "./logger/DFAdventureLogProcessor";
import ChatMerge from "./merge/chat-merge";
import ChatRollPrivacy from "./privacy/df-chat-privacy";
import ScrollManage from "./scroll-manage/scroll-manage";
import SETTINGS from "../../common/Settings";
import WhisperTruncation from "./whisper-trunc/whisper-trunc";
import PlayerColor from './player-color/PlayerColor';
import SendButton from "./send/send-button";
import FontSizePatch from "./font-size/font-size";
import ChatTime from "./chat-time/chat-time";
SETTINGS.init('df-chat-enhance');

declare global {
	interface Application {
		_recalculateDimensions(): void;
	}
}

(<any>Application.prototype)._recalculateDimensions = function () {
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
	DFChatArchive.init();
	ChatRollPrivacy.init();
	DFAdventureLog.init();
	ChatMerge.init();
	ScrollManage.init();
	WhisperTruncation.init();
	PlayerColor.init();
	SendButton.init();
	FontSizePatch.init();
	ChatTime.init();

	libWrapper.register(SETTINGS.MOD_NAME, 'ChatLog.prototype._getEntryContextOptions', function (wrapped: (...args: any) => ContextMenu.Item[], ...args: any) {
		const options = wrapped(...args);
		DFChatEdit.appendChatContextMenuOptions(options);
		DFAdventureLogProcessor.appendChatContextMenuOptions(options);
		return options;
	}, 'WRAPPER');
});

Hooks.once('ready', function () {
	if (!game.modules.get('lib-wrapper')?.active) {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error('DF_CHAT_LOG.Error.LibWrapperMissing'.localize());
	}
	DFAdventureLog.ready();
	DFChatEdit.ready();
	ChatMerge.ready();
	ScrollManage.ready();
	ChatTime.ready();
});
