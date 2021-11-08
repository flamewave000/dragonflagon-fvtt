import {} from '../../common/global';
import * as DFChatArchive from "./archive/df-chat-archive";
import DFChatEdit from "./edit/df-chat-edit";
import * as DFAdventureLog from "./logger/df-adventure-log";
import DFAdventureLogProcessor from "./logger/DFAdventureLogProcessor";
import ChatMerge from "./merge/chat-merge";
import initDFChatPrivacy from "./privacy/df-chat-privacy";
import ScrollManage from "./scroll-manage/scroll-manage";
import SETTINGS from "../../common/Settings";
import WhisperTruncation from "./whisper-trunc/whisper-trunc";
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
}

Hooks.once('init', function () {
	/**
	 * Order here matters! The archive adds a button to the
	 * chat window, while the privacy changes those buttons
	 * from <a> tags to <button> tags if enabled.
	 */
	DFChatArchive.init();
	initDFChatPrivacy();
	DFAdventureLog.init();
	ChatMerge.init();
	ScrollManage.init();
	WhisperTruncation.init();

	libWrapper.register(SETTINGS.MOD_NAME, 'ChatLog.prototype._getEntryContextOptions', function (wrapped: Function, ...args: any) {
		const options = wrapped(...args) as ContextMenu.Item[];
		DFChatEdit.appendChatContextMenuOptions(options);
		DFAdventureLogProcessor.appendChatContextMenuOptions(options);
		return options;
	}, 'WRAPPER');
});

Hooks.once('ready', function () {
	if (!game.modules.get('lib-wrapper')?.active) {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error(game.i18n.localize('DF_CHAT_LOG.Error.LibWrapperMissing'));
	}
	DFAdventureLog.ready();
	DFChatEdit.ready();
	ChatMerge.ready();
	ScrollManage.ready();
});
