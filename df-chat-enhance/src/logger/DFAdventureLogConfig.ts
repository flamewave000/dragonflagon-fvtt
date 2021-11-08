import CONFIG from "../CONFIG";
import DFAdventureLogProcessor from "./DFAdventureLogProcessor";


export default class DFAdventureLogConfig extends FormApplication {
	static readonly PREF_JOURNAL = 'log-journal';
	static readonly PREF_JOURNAL_GM = 'gmlog-journal';
	static readonly PREF_CONFIG = 'log-config-menu';

	static get defaultOptions() {
		return mergeObject(FormApplication.defaultOptions as Partial<FormApplication.Options>, {
			template: "modules/df-chat-enhance/templates/log-config.hbs",
			resizable: false,
			minimizable: false,
			title: game.i18n.localize("DF_CHAT_LOG.Config_Title")
		}) as FormApplication.Options;
	}

	static setupSettings() {
		game.settings.register(CONFIG.MOD_NAME, DFAdventureLogConfig.PREF_JOURNAL, {
			scope: 'world',
			type: String,
			default: '',
			config: false
		});
		game.settings.register(CONFIG.MOD_NAME, DFAdventureLogConfig.PREF_JOURNAL_GM, {
			scope: 'world',
			type: String,
			default: '',
			config: false
		});
		game.settings.registerMenu(CONFIG.MOD_NAME, DFAdventureLogConfig.PREF_CONFIG, {
			restricted: true,
			type: DFAdventureLogConfig,
			label: "DF_CHAT_LOG.Config_Title",
			icon: 'fas fa-edit'
		});
	}

	getData(options?: any) {
		const data = super.getData(options);
		const keys = game.journal.keys();
		const selectedLog = game.settings.get(CONFIG.MOD_NAME, DFAdventureLogConfig.PREF_JOURNAL) as string;
		const selectedGMLog = game.settings.get(CONFIG.MOD_NAME, DFAdventureLogConfig.PREF_JOURNAL_GM) as string;
		var logJournals = [];
		var gmlogJournals = [];
		for (let key of keys) {
			logJournals.push({
				id: key,
				name: game.journal.get(key).data.name,
				selected: key === selectedLog
			})
			gmlogJournals.push({
				id: key,
				name: game.journal.get(key).data.name,
				selected: key === selectedGMLog
			})
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
		game.settings.set(CONFIG.MOD_NAME, DFAdventureLogConfig.PREF_JOURNAL, logJournal);
		game.settings.set(CONFIG.MOD_NAME, DFAdventureLogConfig.PREF_JOURNAL_GM, gmlogJournal);
		await DFAdventureLogConfig.initializeJournal(logJournal, clear, false);
		await DFAdventureLogConfig.initializeJournal(gmlogJournal, gmClear, true);
	}

	static async initializeJournal(id: string, clear: Boolean, isGMOnly: boolean) {
		if (!game.journal.has(id)) return;
		const journal = game.journal.get(id);
		if (clear || journal.data.content === null)
			journal.data.content = '';
		const html = $(journal.data.content);
		const article = html.find('article[class="df-adventure-log"]');
		if (article.length != 0) {
			await DFAdventureLogProcessor.resortLog();
			return;
		}
		await journal.update({
			content: journal.data.content + `
			<section>
				<h2>${game.i18n.localize(isGMOnly ? 'DF_CHAT_LOG.GMLog_Header' : 'DF_CHAT_LOG.Log_Header')}</h2>
				<section class="df-adventure-log"></section>
				<hr />
			</section>
			`
		});
	}
}