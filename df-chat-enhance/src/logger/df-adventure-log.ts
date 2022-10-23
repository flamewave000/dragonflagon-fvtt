import libWrapperShared from "../../../common/libWrapperShared";
import SETTINGS from "../../../common/Settings";
import DFAdventureLogConfig from "./DFAdventureLogConfig";
import DFAdventureLogProcessor from "./DFAdventureLogProcessor";

interface AdventurLogApi {
	event(message: string, postToChat?: boolean): Promise<void>
	pevent(message: string, postToChat?: boolean): Promise<void>
	gmevent(message: string, postToChat?: boolean): Promise<void>
	quote(speaker: string, message: string, postToChat?: boolean): Promise<void>
	pquote(speaker: string, message: string, postToChat?: boolean): Promise<void>
	gmquote(speaker: string, message: string, postToChat?: boolean): Promise<void>
}
declare global {
	const AdventureLog: AdventurLogApi;
}

export function init() {
	const api: AdventurLogApi = {
		event: (async function (message: string, postToChat = false) {
			DFAdventureLogProcessor.commandProcessor('event ' + message, false, false, !postToChat);
		}).bind(DFAdventureLogProcessor),

		pevent: (async function (message: string, postToChat = false) {
			DFAdventureLogProcessor.commandProcessor('event ' + message, false, true, !postToChat);
		}).bind(DFAdventureLogProcessor),

		gmevent: (async function (message: string, postToChat = false) {
			if (game.user.isGM)
				DFAdventureLogProcessor.commandProcessor('event ' + message, true, false, !postToChat);
			else ui.notifications.warn("DF_CHAT_LOG.Error.ApiLog_NotGm".localize());
		}).bind(DFAdventureLogProcessor),

		quote: (async function (speaker: string, message: string, postToChat = false) {
			DFAdventureLogProcessor.commandProcessor(`quote "${speaker}" ${message}`, false, false, !postToChat);
		}).bind(DFAdventureLogProcessor),

		pquote: (async function (speaker: string, message: string, postToChat = false) {
			DFAdventureLogProcessor.commandProcessor(`quote "${speaker}" ${message}`, false, true, !postToChat);
		}).bind(DFAdventureLogProcessor),

		gmquote: (async function (speaker: string, message: string, postToChat = false) {
			if (game.user.isGM)
				DFAdventureLogProcessor.commandProcessor(`quote "${speaker}" ${message}`, true, false, !postToChat);
			else ui.notifications.warn("DF_CHAT_LOG.Error.ApiLog_NotGm".localize());
		}).bind(DFAdventureLogProcessor)
	};
	// @ts-expect-error
	window.AdventureLog = api;
}
export function ready() {
	if (!game.modules.get('lib-wrapper')?.active) return;
	DFAdventureLogConfig.setupSettings();
	DFAdventureLogProcessor.setupSettings();

	Hooks.on('renderUserConfig', (_app: UserConfig, html: JQuery<HTMLElement>, data: UserConfig.Data<any>) => {
		const journal = data.user.getFlag(SETTINGS.MOD_NAME, DFAdventureLogProcessor.PREF_PLAYER_LOG_JOURNAL);
		const template = Handlebars.compile(`
<div class="form-group">
	<label for="dfce-player-log">Player Log Journal</label>
	<select id="dfce-player-log" name="player-log">
		{{#each journals}}
		<option value="{{id}}" {{#if (eq ../selected id)}}selected{{/if}}>{{name}}</option>
		{{/each}}
	</select>
</div>
`);
		const journals = ui.journal.documents.filter(x => x.testUserPermission(data.user, CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER));
		const journalSelection = $(template({
			selected: journal ?? '',
			journals: [{ id: '', name: '---' }].concat(journals as { id: string, name: string }[])
		}, {
			allowProtoMethodsByDefault: true,
			allowProtoPropertiesByDefault: true
		}));
		html.find('input[name="color"]').parent().parent().after(journalSelection);
	});

	libWrapperShared.register('UserConfig.prototype._updateObject',
		async function (this: UserConfig, wrapped: (...args: any) => any, event: any, formData: { "player-log": string }) {
			await this.object.setFlag(SETTINGS.MOD_NAME, DFAdventureLogProcessor.PREF_PLAYER_LOG_JOURNAL, formData["player-log"]);
			return await wrapped(event, formData);
		});
}