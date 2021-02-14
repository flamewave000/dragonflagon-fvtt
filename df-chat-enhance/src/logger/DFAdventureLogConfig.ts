import CONFIG from "../CONFIG.js";


export default class DFAdventureLogConfig extends FormApplication {
	static readonly PREF_JOURNAL = 'log-journal';
	static readonly PREF_CLEAR = 'log-journal-clear';
	static readonly PREF_CONFIG = 'log-config-menu';

	static get defaultOptions() {
		const options = FormApplication.defaultOptions;
		mergeObject(options, {
			template: "modules/df-chat-enhance/templates/log-config.hbs",
			resizable: false,
			minimizable: false,
			title: game.i18n.localize("DF_CHAT_LOG.Config_Title")
		});
		return options;
	}

	static setupSettings() {
		game.settings.register(CONFIG.MOD_NAME, DFAdventureLogConfig.PREF_JOURNAL, {
			scope: 'world',
			type: String,
			default: '',
			config: false
		})
		game.settings.register(CONFIG.MOD_NAME, DFAdventureLogConfig.PREF_CLEAR, {
			scope: 'world',
			type: Boolean,
			default: true,
			config: false
		})
		game.settings.registerMenu(CONFIG.MOD_NAME, DFAdventureLogConfig.PREF_CONFIG, {
			restricted: true,
			type: DFAdventureLogConfig,
			label: "DF_CHAT_LOG.Config_Title",
			icon: 'fas fa-edit'
		});
	}

	getData(options?: any) {
		const data = super.getData(options) as any;
		const keys = game.journal.keys();
		const selected = game.settings.get(CONFIG.MOD_NAME, DFAdventureLogConfig.PREF_JOURNAL) as string;
		var journals = [];
		for (let key of keys) {
			journals.push({
				id: key,
				name: game.journal.get(key).data.name,
				selected: key === selected
			})
		}
		journals = journals.sort((a, b) => a.name.localeCompare(b.name));

		mergeObject(data, {
			checked: game.settings.get(CONFIG.MOD_NAME, DFAdventureLogConfig.PREF_CLEAR) as Boolean,
			journals: journals,
		});
		return data;
	}

	async _updateObject(_event?: any, formData?: any) {
		const id = formData['dfal-journal'];
		const clear = formData['dfal-clear'];
		game.settings.set(CONFIG.MOD_NAME, DFAdventureLogConfig.PREF_JOURNAL, id);
		game.settings.set(CONFIG.MOD_NAME, DFAdventureLogConfig.PREF_CLEAR, clear);
		await DFAdventureLogConfig.initializeJournal(id);
	}

	static async initializeJournal(clear: Boolean) {
		const id = game.settings.get(CONFIG.MOD_NAME, DFAdventureLogConfig.PREF_JOURNAL);
		if (!game.journal.has(id)) return;
		const journal = game.journal.get(id);
		if (clear || journal.data.content === null)
			journal.data.content = '';
		const html = $(journal.data.content);
		const article = html.find('article[class="df-adventure-log"]');
		if (article.length != 0) return;
		await journal.update({
			content: journal.data.content + `
			<section>
				<h2>${game.i18n.localize('DF_CHAT_LOG.Log_Header')}</h2>
				<article class="df-adventure-log"></article>
				<hr />
			</section>
			`
		});
	}
}