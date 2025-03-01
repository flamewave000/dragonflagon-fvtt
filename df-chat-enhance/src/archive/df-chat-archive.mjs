/// <reference path="../../../fvtt-scripts/foundry.js" />
import DFChatArchiveNew from "./DFChatArchiveNew.mjs";
import DFChatArchiveManager from "./DFChatArchiveManager.mjs";
import { DFChatArchive } from "./DFChatArchive.mjs";
import SETTINGS from "../../common/Settings.mjs";


export function init() {

	/**@type {DFChatArchiveNew|null}*/
	let archiveNew = null;
	/**@type {DFChatArchiveManager|null}*/
	let archiveManager = null;

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
		scope: 'client',
		type: Boolean,
		default: false,
		config: false
	});

	Hooks.on('renderChatLog',
		/**
		 * @param {ChatLog} chatLog
		 * @param {JQuery<HTMLElement>} html
		 */
		function (chatLog, html) {
			const archiveButton = $(`<a class="button chat-archive" title="${'DF_CHAT_ARCHIVE.ExportButtonTitle'.localize()}">
		<i class="fas fa-archive"></i></a>`);
			archiveButton.on('click', () => {
				if (archiveNew == null) {
					archiveNew = new DFChatArchiveNew({});
					archiveNew.render(true);
				} else {
					archiveNew.bringToTop();
				}
			});
			html.find('.control-buttons')
				.prepend(archiveButton)
				.attr('style', 'flex:0 0 auto;');
			if (SETTINGS.get(DFChatArchiveNew.PREF_HIDE_EXPORT)) {
				html.find('.control-buttons .export-log').hide();
			}
		});

	Hooks.on('renderSettings',
		/**
		 * @param {Settings} _settings
		 * @param {JQuery<HTMLElement>} html
		 */
		function (_settings, html) {
			const archiveManagerHtml = $(`<div id="df-chat-enhance-settings" style="margin:0">
	<h4>${'DF_CHAT_ARCHIVE.ChatEnhanceSettingGroup'.localize()}</h4>
	<button data-action="archive"><i class="fas fa-archive"></i>${'DF_CHAT_ARCHIVE.OpenChatArchive'.localize()}</button>
</div>`);
			archiveManagerHtml.on('click', () => {
				if (archiveManager == null || ![Application.RENDER_STATES.RENDERED, Application.RENDER_STATES.RENDERING].includes(archiveManager._state)) {
					archiveManager = new DFChatArchiveManager();
					archiveManager.render(true);
				} else {
					archiveManager.bringToTop();
				}
			});
			html.find('#settings-game').append(archiveManagerHtml);
		});
	Hooks.on('closeDFChatArchiveNew', () => { archiveNew = null; });
	Hooks.on('closeDFChatArchiveManager', () => { archiveNew = null; });
	Hooks.on(`renderDFChatArchiveNew`, function (app, /**@type {JQuery}*/ html) {
		html.find('input[type="text"]')[0].focus();
	});
}
