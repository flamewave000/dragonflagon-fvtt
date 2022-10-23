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
		const journal = (<string>data.user.getFlag(SETTINGS.MOD_NAME, DFAdventureLogProcessor.PREF_PLAYER_LOG_JOURNAL))?.split('.');
		const template = Handlebars.compile(`
<div class="form-group">
	<label for="dfce-player-log">Player Log Journal</label>
	<div class="form-fields">
		<select id="dfce-player-log" name="player-log">
			{{#each journals}}
			<option value="{{id}}" {{#if selected}} selected{{/if}}>{{name}}</option>
			{{/each}}
		</select>
	</div>
</div>
<div class="form-group">
	<label for="dfce-player-log-page">Player Log Journal Page</label>
	<div class="form-fields">
		<select id="dfce-player-log-page" name="player-log-page">
			{{#each pages}}
			<option value="{{id}}"{{#if selected}} selected{{/if}}>{{name}}</option>
			{{/each}}
		</select>
	</div>
</div>
`);
		const journals = ui.journal.documents
			.filter(x => x.testUserPermission(data.user, CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER))
			.filter(x => x.pages.contents.some(y => y.type === 'text'));
		const journalSelection = $(template({
			selected: journal ?? '',
			journals: [{ id: '', name: '---', selected: !journal }].concat(journals.map(x => ({
				id: x.id,
				name: x.name,
				selected: x.id === journal[0]
			}))),
			pages: journal ? journals.find(x => x.id == journal[0]).pages.contents.filter(x => x.type === 'text').map(x => ({
				id: x.id,
				name: x.name,
				selected: x.id === journal[1]
			})) : []
		}, {
			allowProtoMethodsByDefault: true,
			allowProtoPropertiesByDefault: true
		}));
		html.find('#characters').parent().before(journalSelection);
		journalSelection.find('#dfce-player-log').on('change', event => {
			const journalId = (event.currentTarget as HTMLSelectElement).value;
			const pageElement = journalSelection.find('#dfce-player-log-page');
			pageElement.children().remove();
			if (!journalId || journalId.length === 0) return;
			for (const page of game.journal.get(journalId).pages.contents.filter(x => x.type === 'text')) {
				pageElement.append(`<option value="${journalId}.${page.id}">${page.name}</option>`);
			}
		});
	});

	libWrapperShared.register('UserConfig.prototype._updateObject',
		async function (this: UserConfig, wrapped: (...args: any) => any, event: any, formData: { "player-log-page": string }) {
			await this.object.setFlag(SETTINGS.MOD_NAME, DFAdventureLogProcessor.PREF_PLAYER_LOG_JOURNAL, formData["player-log-page"]);
			return await wrapped(event, formData);
		});

	migrateDataV9toV10();
}

async function migrateDataV9toV10() {
	if (!game.user.isGM) return;
	let journalId = SETTINGS.get<string>(DFAdventureLogConfig.PREF_JOURNAL);
	if (checkJournal(journalId))
		await SETTINGS.set<string>(DFAdventureLogConfig.PREF_JOURNAL, await migrateJournalV9toV10(journalId));
	journalId = SETTINGS.get<string>(DFAdventureLogConfig.PREF_JOURNAL_GM);
	if (checkJournal(journalId))
		await SETTINGS.set<string>(DFAdventureLogConfig.PREF_JOURNAL_GM, await migrateJournalV9toV10(journalId));

	for (const user of game.users) {
		journalId = <string>user.getFlag(SETTINGS.MOD_NAME, DFAdventureLogProcessor.PREF_PLAYER_LOG_JOURNAL);
		if (!checkJournal(journalId)) continue;
		journalId = await migrateJournalV9toV10(journalId);
		if (!journalId)
			await user.unsetFlag(SETTINGS.MOD_NAME, DFAdventureLogProcessor.PREF_PLAYER_LOG_JOURNAL);
		else
			await user.setFlag(SETTINGS.MOD_NAME, DFAdventureLogProcessor.PREF_PLAYER_LOG_JOURNAL, journalId);
	}
}

function checkJournal(id: string) { return id && id.split('.').length < 2; }

async function migrateJournalV9toV10(id: string): Promise<string | null> {
	const journal = game.journal.get(id);
	if (!journal) return null;
	const page = journal.pages.contents.find(x => x.type == 'text');
	if (!page) return null;
	return journal.id + '.' + page.id;
}
