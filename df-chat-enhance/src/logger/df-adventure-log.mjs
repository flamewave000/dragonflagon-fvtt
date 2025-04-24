/// <reference path="../../../fvtt-scripts/foundry.js" />
/// <reference path="../../../common/foundry.d.ts" />
import libWrapperShared from "../../common/libWrapperShared.mjs";
import SETTINGS from "../../common/Settings.mjs";
import DFAdventureLogConfig from "./DFAdventureLogConfig.mjs";
import DFAdventureLogProcessor from "./DFAdventureLogProcessor.mjs";

export function init() {
	/**@type {AdventurLogApi}*/
	const api = {
		event: (async function (message, postToChat = false) {
			DFAdventureLogProcessor.commandProcessor('event ' + message, false, false, !postToChat);
		}).bind(DFAdventureLogProcessor),

		pevent: (async function (message, postToChat = false) {
			DFAdventureLogProcessor.commandProcessor('event ' + message, false, true, !postToChat);
		}).bind(DFAdventureLogProcessor),

		gmevent: (async function (message, postToChat = false) {
			if (game.user.isGM)
				DFAdventureLogProcessor.commandProcessor('event ' + message, true, false, !postToChat);
			else ui.notifications.warn("DF_CHAT_LOG.Error.ApiLog_NotGm".localize());
		}).bind(DFAdventureLogProcessor),

		quote: (async function (speaker, message, postToChat = false) {
			DFAdventureLogProcessor.commandProcessor(`quote "${speaker}" ${message}`, false, false, !postToChat);
		}).bind(DFAdventureLogProcessor),

		pquote: (async function (speaker, message, postToChat = false) {
			DFAdventureLogProcessor.commandProcessor(`quote "${speaker}" ${message}`, false, true, !postToChat);
		}).bind(DFAdventureLogProcessor),

		gmquote: (async function (speaker, message, postToChat = false) {
			if (game.user.isGM)
				DFAdventureLogProcessor.commandProcessor(`quote "${speaker}" ${message}`, true, false, !postToChat);
			else ui.notifications.warn("DF_CHAT_LOG.Error.ApiLog_NotGm".localize());
		}).bind(DFAdventureLogProcessor)
	};
	window.AdventureLog = api;

	if (!game.modules.get('lib-wrapper')?.active) return;
	DFAdventureLogConfig.setupSettings();
	DFAdventureLogProcessor.setupSettings();
}
export function ready() {
	if (!game.modules.get('lib-wrapper')?.active) return;
	if (!game.user.isGM) return;

	Hooks.on('renderUserConfig',
		/**
		 * @param {foundry.applications.sheets.UserConfig} app
		 * @param {HTMLFormElement} html
		 */
		(app, html) => {
			const journal = app.document.getFlag(SETTINGS.MOD_NAME, DFAdventureLogProcessor.PREF_PLAYER_LOG_JOURNAL)?.split('.');
			const template = Handlebars.compile(`
<fieldset>
	<legend>${'DF_CHAT_LOG.PLog_Header'.localize()}</legend>
	<div class="form-group stacked">
		<label for="dfce-player-log">${'DF_CHAT_LOG.UserConfig_Journal'.localize()}</label>
		<select id="dfce-player-log" name="player-log">
			{{#each journals}}
			<option value="{{id}}" {{#if selected}} selected{{/if}}>{{name}}</option>
			{{/each}}
		</select>
	</div>
	<div class="form-group stacked">
		<label for="dfce-player-log-page">${'DF_CHAT_LOG.UserConfig_JournalPage'.localize()}</label>
		<div class="form-fields">
			<select id="dfce-player-log-page" name="player-log-page">
				{{#each pages}}
				<option value="{{id}}"{{#if selected}} selected{{/if}}>{{name}}</option>
				{{/each}}
			</select>
		</div>
	</div>
</fieldset>`);
			const journals = ui.journal.documents
				.filter(x => x.testUserPermission(app.document, foundry.CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER))
				.map(x => [
					x, x.pages
						.filter(y => y.testUserPermission(app.document, foundry.CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER))
						.filter(y => y.type === 'text')
				])
				.filter(x => x[1].length > 0);


			const journalSelection = $(template({
				selected: journal ?? '',
				journals: [{ id: '', name: '---', selected: !journal }].concat(
					journals.map(x => {
						return ({
							id: x[0].id,
							name: x[0].name,
							selected: !!journal && x[0].id === journal[0]
						});
					})),
				pages: journal ? journals.find(x => x[0].id == journal[0])[1].map(x => ({
					id: x.id,
					name: x.name,
					selected: !!journal && x.id === journal[1]
				})) : []
			}, {
				allowProtoMethodsByDefault: true,
				allowProtoPropertiesByDefault: true
			}));
			$(html).find('.form-group.stacked.character').parent().before(journalSelection);
			journalSelection.find('#dfce-player-log').on('change', event => {
				/**@type {HTMLSelectElement}*/
				const journalId = event.currentTarget.value;
				const pageElement = journalSelection.find('#dfce-player-log-page');
				pageElement.children().remove();
				if (!journalId || journalId.length === 0) return;
				const pages = journals.find(x => x[0].id === journalId)[1];
				for (const page of pages) {
					pageElement.append(`<option value="${page.id}">${page.name}</option>`);
				}
			});
		});

	libWrapperShared.register('foundry.applications.sheets.UserConfig.prototype._processFormData',
		/**
		 * @this {foundry.applications.sheets.UserConfig}
		 * @param {(...any) => any} wrapped
		 * @param {SubmitEvent} event
		 * @param {HTMLFormElement} _form
		 * @param { { "chat-color": string } } formData
		 * @returns {Promise<any>}
		 */
		function (wrapped, event, form, formData) {
			if (!formData.object["player-log"] || !formData.object["player-log-page"]) {
				this.document.setFlag(SETTINGS.MOD_NAME, DFAdventureLogProcessor.PREF_PLAYER_LOG_JOURNAL, null);
				return wrapped(event, form, formData);
			}
			const selection = formData.object["player-log"] + '.' + formData.object["player-log-page"];
			this.document.setFlag(SETTINGS.MOD_NAME, DFAdventureLogProcessor.PREF_PLAYER_LOG_JOURNAL, selection);
			delete formData.object["player-log"];
			delete formData.object["player-log-page"];
			return wrapped(event, form, formData);
		});
}
