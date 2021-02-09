import DFChatArchiveNew from "./DFChatArchiveNew.js";
import DFChatArchiveManager from "./DFChatArchiveManager.js";
import { DFChatArchive } from "./DFChatArchive.js";


export default function initDFChatArchive() {

	var archiveNew: DFChatArchiveNew = null;
	var archiveManager: DFChatArchiveManager = null;

	DFChatArchive.registerSettings();
	DFChatArchiveNew.registerSettings();

	Hooks.on('renderChatLog', function (chatLog: ChatLog, html: JQuery<HTMLElement>, data: {}) {
		const archiveButton = $(`<a class="button chat-archive" title="${game.i18n.localize('DF_CHAT_ARCHIVE.ExportButtonTitle')}">
		<i class="fas fa-archive"></i></a>`)
		archiveButton.on('click', () => {
			if (archiveNew == null) {
				archiveNew = new DFChatArchiveNew();
				archiveNew.render(true);
			} else {
				archiveNew.bringToTop()
			}
		});
		html.find('.control-buttons')
			.prepend(archiveButton)
			.attr('style', 'flex:0 0 72px;');
	});

	Hooks.on('renderSettings', function (settings: Settings, html: JQuery<HTMLElement>, data: {}) {
		const archiveManagerHtml = $(`<button data-action="archive"><i class="fas fa-archive"></i>${game.i18n.localize('DF_CHAT_ARCHIVE.OpenChatArchive')}</button>`);
		archiveManagerHtml.on('click', () => {
			if (archiveManager == null) {
				archiveManager = new DFChatArchiveManager();
				archiveManager.render(true);
			} else {
				archiveManager.bringToTop()
			}
		});
		html.find('#settings-game').append(archiveManagerHtml)
	});

	Hooks.on('closeDFChatArchiveNew', () => archiveNew = null)
	Hooks.on('closeDFChatArchiveManager', () => archiveManager = null)
}