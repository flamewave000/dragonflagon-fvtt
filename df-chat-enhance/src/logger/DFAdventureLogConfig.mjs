/// <reference path="../../../fvtt-scripts/foundry.js" />
/// <reference path="../../../common/foundry.d.ts" />
/// <reference path="../../../common/libWrapper.d.ts" />
import SETTINGS from "../../common/Settings.mjs";
import DFAdventureLogProcessor from "./DFAdventureLogProcessor.mjs";


export default class DFAdventureLogConfig extends FormApplication {
	/**@readonly*/ static PREF_JOURNAL = 'log-journal';
	/**@readonly*/ static PREF_JOURNAL_GM = 'gmlog-journal';
	/**@readonly*/ static PREF_CONFIG = 'log-config-menu';

	static get defaultOptions() {
		return foundry.utils.mergeObject(FormApplication.defaultOptions, {
			template: "modules/df-chat-enhance/templates/log-config.hbs",
			resizable: false,
			minimizable: false,
			title: "DF_CHAT_LOG.Config_Title".localize()
		});
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
			type: DFAdventureLogConfig,
			name: "DF_CHAT_LOG.Config_Title",
			label: "DF_CHAT_LOG.Config_Title",
			icon: 'fas fa-edit'
		});
	}

	/**
	 * @param {*} [options]
	 */
	getData(options) {
		const data = super.getData(options);
		const keys = game.journal.contents.filter(x => x.pages.contents.some(y => y.type === 'text')).map(x => x.id);
		/**@type {string|undefined}*/
		const selectedLog = SETTINGS.get(DFAdventureLogConfig.PREF_JOURNAL)?.split('.');
		/**@type {string|undefined}*/
		const selectedGMLog = SETTINGS.get(DFAdventureLogConfig.PREF_JOURNAL_GM)?.split('.');
		let logJournals = [];
		let logJournalPages = [];
		let gmlogJournals = [];
		let gmlogJournalPages = [];
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

		foundry.utils.mergeObject(data, {
			logJournals,
			logJournalPages,
			gmlogJournals,
			gmlogJournalPages
		});
		return data;
	}

	/**
	 * @param {string} journalId
	 * @param {JQuery<HTMLSelectElement>} element
	 */
	#fillPageList(journalId, element) {
		element.children().remove();
		const journal = game.journal.get(journalId);
		if (!journal) return;
		for (const page of journal.pages.contents.filter(x => x.type == 'text')) {
			element.append(`<option value="${journalId}.${page.id}">${page.name}</option>`);
		}
	}

	/**@param {JQuery<HTMLElement>} html*/
	activateListeners(html) {
		html.find('#dfal-journal').on('change', event => {
			const journalId = event.currentTarget.value;
			const pageElement = html.find('#dfal-journal-page');
			this.#fillPageList(journalId, pageElement);
		});
		html.find('#dfal-journal-gm').on('change', event => {
			const journalId = event.currentTarget.value;
			const pageElement = html.find('#dfal-journal-gm-page');
			this.#fillPageList(journalId, pageElement);
		});
	}

	/**
	 * @param {*} [_event]
	 * @param {*} [formData]
	 */
	async _updateObject(_event, formData) {
		const logJournal = formData['dfal-journal-page'];
		const gmlogJournal = formData['dfal-journal-gm-page'];
		const clear = formData['dfal-clear'];
		const gmClear = formData['dfal-clear-gm'];
		SETTINGS.set(DFAdventureLogConfig.PREF_JOURNAL, logJournal);
		SETTINGS.set(DFAdventureLogConfig.PREF_JOURNAL_GM, gmlogJournal);
		await DFAdventureLogConfig.initializeJournal(logJournal, clear, false, false);
		await DFAdventureLogConfig.initializeJournal(gmlogJournal, gmClear, true, false);
	}

	/**
	 * @param {string} id
	 * @param {boolean} clear
	 * @param {boolean} isGMOnly
	 * @param {boolean} isPlayerLog
	 * @returns {Promise<void>}
	 */
	static async initializeJournal(id, clear, isGMOnly, isPlayerLog) {
		const journalId = id?.split('.');
		if (!journalId || journalId.length < 2 || !game.journal.has(journalId[0])) return;
		const journal = game.journal.get(journalId[0]).pages.get(journalId[1]);
		if (clear || journal.text.content === null)
			journal.text.content = '';
		const html = $(journal.text.content);
		const article = html.find('article[class="df-adventure-log"]');
		if (article.length != 0) {
			await DFAdventureLogProcessor.reSortLog();
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