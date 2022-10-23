import SETTINGS from "../../../common/Settings";
import DFAdventureLogProcessor from "./DFAdventureLogProcessor";


export default class DFAdventureLogConfig extends FormApplication {
	static readonly PREF_JOURNAL = 'log-journal';
	static readonly PREF_JOURNAL_GM = 'gmlog-journal';
	static readonly PREF_CONFIG = 'log-config-menu';

	static get defaultOptions() {
		return mergeObject(FormApplication.defaultOptions as Partial<FormApplicationOptions>, {
			template: "modules/df-chat-enhance/templates/log-config.hbs",
			resizable: false,
			minimizable: false,
			title: "DF_CHAT_LOG.Config_Title".localize()
		}) as FormApplicationOptions;
	}

	static setupSettings() {
		SETTINGS.register(DFAdventureLogConfig.PREF_JOURNAL, {
			scope: 'world',
			type: String,
			default: '',
			config: false
		});
		SETTINGS.register(DFAdventureLogConfig.PREF_JOURNAL_GM, {
			scope: 'world',
			type: String,
			default: '',
			config: false
		});
		SETTINGS.registerMenu(DFAdventureLogConfig.PREF_CONFIG, {
			restricted: true,
			type: <any>DFAdventureLogConfig,
			label: "DF_CHAT_LOG.Config_Title",
			icon: 'fas fa-edit'
		});
	}

	getData(options?: any) {
		const data = super.getData(options);
		const keys = game.journal.contents.filter(x => x.pages.contents.some(y => y.type === 'text')).map(x => x.id);
		const selectedLog = (SETTINGS.get(DFAdventureLogConfig.PREF_JOURNAL) as string | undefined)?.split('.');
		const selectedGMLog = (SETTINGS.get(DFAdventureLogConfig.PREF_JOURNAL_GM) as string | undefined)?.split('.');
		let logJournals: any[] = [];
		let logJournalPages: any[] = [];
		let gmlogJournals: any[] = [];
		let gmlogJournalPages: any[] = [];
		for (const key of keys) {
			logJournals.push({
				id: key,
				name: game.journal.get(key).name,
				selected: selectedLog && key === selectedLog[0]
			});
			if (selectedLog && key === selectedLog[0]) {
				logJournalPages = game.journal.get(key).pages.contents.map(x => ({
					id: key + '.' + x.id,
					name: x.name,
					selected: x.id === selectedLog[1]
				}));
			}
			gmlogJournals.push({
				id: key,
				name: game.journal.get(key).name,
				selected: selectedGMLog && key === selectedGMLog[0]
			});
			if (selectedGMLog && key === selectedGMLog[0]) {
				gmlogJournalPages = game.journal.get(key).pages.contents.map(x => ({
					id: key + '.' + x.id,
					name: x.name,
					selected: x.id === selectedGMLog[1]
				}));
			}
		}
		logJournals = logJournals.sort((a, b) => a.name.localeCompare(b.name));
		gmlogJournals = gmlogJournals.sort((a, b) => a.name.localeCompare(b.name));

		mergeObject(data as any, {
			logJournals,
			logJournalPages,
			gmlogJournals,
			gmlogJournalPages
		});
		return data;
	}

	private fillPageList(journalId: string, element: JQuery<HTMLSelectElement>) {
		element.children().remove();
		const journal = game.journal.get(journalId);
		if (!journal) return;
		for (const page of journal.pages.contents.filter(x => x.type == 'text')) {
			element.append(`<option value="${journalId}.${page.id}">${page.name}</option>`);
		}
	}

	activateListeners(html: JQuery<HTMLElement>): void {
		html.find('#dfal-journal').on('change', event => {
			const journalId = (event.currentTarget as HTMLSelectElement).value;
			const pageElement = html.find<HTMLSelectElement>('#dfal-journal-page');
			this.fillPageList(journalId, pageElement);
		});
		html.find('#dfal-journal-gm').on('change', event => {
			const journalId = (event.currentTarget as HTMLSelectElement).value;
			const pageElement = html.find<HTMLSelectElement>('#dfal-journal-gm-page');
			this.fillPageList(journalId, pageElement);
		});
	}

	async _updateObject(_event?: any, formData?: any) {
		const logJournal = formData['dfal-journal-page'];
		const gmlogJournal = formData['dfal-journal-gm-page'];
		const clear = formData['dfal-clear'];
		const gmClear = formData['dfal-clear-gm'];
		SETTINGS.set(DFAdventureLogConfig.PREF_JOURNAL, logJournal);
		SETTINGS.set(DFAdventureLogConfig.PREF_JOURNAL_GM, gmlogJournal);
		await DFAdventureLogConfig.initializeJournal(logJournal, clear, false, false);
		await DFAdventureLogConfig.initializeJournal(gmlogJournal, gmClear, true, false);
	}

	static async initializeJournal(id: string, clear: boolean, isGMOnly: boolean, isPlayerLog: boolean) {
		const journalId = id?.split('.');
		if (!journalId || journalId.length < 2 || !game.journal.has(journalId[0])) return;
		const journal = game.journal.get(journalId[0]).pages.get(journalId[1]);
		if (clear || journal.text.content === null)
			journal.text.content = '';
		const html = $(journal.text.content);
		const article = html.find('article[class="df-adventure-log"]');
		if (article.length != 0) {
			await DFAdventureLogProcessor.resortLog();
			return;
		}
		await journal.update({
			'text.content': journal.text.content + `
			<section>
				<h2>${game.i18n.localize(isGMOnly ? 'DF_CHAT_LOG.GMLog_Header' : isPlayerLog ? 'DF_CHAT_LOG.PLog_Header' : 'DF_CHAT_LOG.Log_Header')}</h2>
				<section class="df-adventure-log"></section>
				<hr />
			</section>
			`
		});
	}
}