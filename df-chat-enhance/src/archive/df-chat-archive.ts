import DFChatArchiveNew from "./DFChatArchiveNew";
import DFChatArchiveManager from "./DFChatArchiveManager";
import { DFChatArchive } from "./DFChatArchive";
import CONFIG from "../CONFIG";
import SETTINGS from "../../../common/SETTINGS";


export function init() {

	var archiveNew: DFChatArchiveNew = null;
	var archiveManager: DFChatArchiveManager = null;

	DFChatArchive.registerSettings();
	DFChatArchiveNew.registerSettings();

	SETTINGS.register(DFChatArchiveNew.PREF_HIDE_EXPORT, {
		name: 'DF_CHAT_ARCHIVE.Settings.HideExport',
		scope: 'world',
		type: Boolean,
		default: false,
		config: true,
		onChange: (newValue) => {
			if (!newValue)
				$('#chat-controls .export-log').show();
			else
				$('#chat-controls .export-log').hide();
		}
	});

	SETTINGS.register(DFChatArchiveManager.PREF_REVERSE_SORT, {
		scope: 'world',
		type: Boolean,
		default: false,
		config: false
	});

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
			.attr('style', 'flex:0 0 auto;');
		if (game.settings.get(CONFIG.MOD_NAME, DFChatArchiveNew.PREF_HIDE_EXPORT)) {
			html.find('.control-buttons .export-log').hide();
		}
	});

	Hooks.on('renderSettings', function (settings: Settings, html: JQuery<HTMLElement>, data: {}) {
		const archiveManagerHtml = $(`<div id="df-chat-enhance-settings" style="margin:0">
	<h4>${game.i18n.localize('DF_CHAT_ARCHIVE.ChatEnhanceSettingGroup')}</h4>
	<button data-action="archive"><i class="fas fa-archive"></i>${game.i18n.localize('DF_CHAT_ARCHIVE.OpenChatArchive')}</button>
</div>`);
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
	Hooks.on(`renderDFChatArchiveNew`, function (app: any, html: JQuery, data: any) {
		html.find('input[type="text"]')[0].focus();
	});
}
