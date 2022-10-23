import { JournalEntryData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
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
		const keys = game.journal.keys();
		const selectedLog = SETTINGS.get(DFAdventureLogConfig.PREF_JOURNAL) as string;
		const selectedGMLog = SETTINGS.get(DFAdventureLogConfig.PREF_JOURNAL_GM) as string;
		let logJournals = [];
		let gmlogJournals = [];
		for (const key of keys) {
			logJournals.push({
				id: key,
				name: game.journal.get(key).name,
				selected: key === selectedLog
			});
			gmlogJournals.push({
				id: key,
				name: game.journal.get(key).name,
				selected: key === selectedGMLog
			});
		}
		logJournals = logJournals.sort((a, b) => a.name.localeCompare(b.name));
		gmlogJournals = gmlogJournals.sort((a, b) => a.name.localeCompare(b.name));

		mergeObject(data as any, {
			logJournals: logJournals,
			gmlogJournals: gmlogJournals,
		});
		return data;
	}

	async _updateObject(_event?: any, formData?: any) {
		const logJournal = formData['dfal-journal'];
		const gmlogJournal = formData['dfal-journal-gm'];
		const clear = formData['dfal-clear'];
		const gmClear = formData['dfal-clear-gm'];
		SETTINGS.set(DFAdventureLogConfig.PREF_JOURNAL, logJournal);
		SETTINGS.set(DFAdventureLogConfig.PREF_JOURNAL_GM, gmlogJournal);
		await DFAdventureLogConfig.initializeJournal(logJournal, clear, false, false);
		await DFAdventureLogConfig.initializeJournal(gmlogJournal, gmClear, true, false);
	}

	static async initializeJournal(id: string, clear: boolean, isGMOnly: boolean, isPlayerLog: boolean) {
		if (!game.journal.has(id)) return;
		const journal = <Journal & JournalEntryData><any>game.journal.get(id);
		if (clear || journal.content === null)
			journal.content = '';
		const html = $(journal.content);
		const article = html.find('article[class="df-adventure-log"]');
		if (article.length != 0) {
			await DFAdventureLogProcessor.resortLog();
			return;
		}
		await journal.update({
			content: journal.content + `
			<section>
				<h2>${game.i18n.localize(isGMOnly ? 'DF_CHAT_LOG.GMLog_Header' : isPlayerLog ? 'DF_CHAT_LOG.PLog_Header' : 'DF_CHAT_LOG.Log_Header')}</h2>
				<section class="df-adventure-log"></section>
				<hr />
			</section>
			`
		});
	}
}