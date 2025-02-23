import MessageProcessor from "./MessageProcessor.mjs";


export default class DFLoggerMenu extends FormApplication {
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			editable: true,
			resizable: true,
			submitOnChange: false,
			submitOnClose: false,
			closeOnSubmit: true,
			width: 600,
			height: 500,
			title: 'DF-LOGGER.ManageMenu.Title'.localize(),
			tabs: [{ navSelector: ".tabs", contentSelector: "main", initial: "login" }],
			template: 'modules/df-logger/templates/message-manage.hbs'
		});
	}

	/**
	 * @param {Event} _event
	 * @param {object} [_formData]
	 */
	async _updateObject(_event, _formData) {
		const loginEntryElements = this.element.find('div[data-tab="login"]>div.message-entry');
		/**@type {Message[]}*/const loginEntries = [];
		loginEntryElements.each((_, elem) => {
			loginEntries.push({
				tog: elem.querySelector('input[type="checkbox"]').checked,
				msg: elem.querySelector('input[type="text"]').value
			});
		});
		const logoutEntryElements = this.element.find('div[data-tab="logout"]>div.message-entry');
		/**@type {Message[]}*/const logoutEntries = [];
		logoutEntryElements.each((_, elem) => {
			logoutEntries.push({
				tog: elem.querySelector('input[type="checkbox"]').checked,
				msg: elem.querySelector('input[type="text"]').value
			});
		});
		MessageProcessor.loginMessages = loginEntries;
		MessageProcessor.logoutMessages = logoutEntries;
		await MessageProcessor.saveMessages();
	}

	/**
	 * @param {Application.RenderOptions} _options 
	 * @returns {object}
	 */
	getData(_options) {
		return {
			login: MessageProcessor.loginMessages,
			logout: MessageProcessor.logoutMessages
		};
	}

	/**
	 * @param {JQuery} html 
	 */
	activateListeners(html) {
		html.find('div.message-entry').each((_, elem) => this._processEntry($(elem)));
		html.find('button[name="add"]').on('click', async () => {
			const entry = $(await renderTemplate('modules/df-logger/templates/message-template.hbs', { tog: true, msg: '' }));
			this._processEntry(entry);
			html.find('div.tab.active').append(entry);
		});
		html.find('button[name="reset"]').on('click', async () => {
			Dialog.confirm({
				title: 'DF-LOGGER.ManageMenu.Confirm.Title'.localize(),
				content: 'DF-LOGGER.ManageMenu.Confirm.Content'.localize(),
				defaultYes: false,
				yes: async () => {
					MessageProcessor.loginMessages = [];
					MessageProcessor.logoutMessages = [];
					await MessageProcessor.initializeMessages();
					await this.render(true);
				}
			});
		});
	}

	/**
	 * @param {JQuery} element 
	 */
	_processEntry(element) {
		const textBlock = element.find('input[type="text"]');
		element.find('input[type="checkbox"]').on('change', (event) => {
			/**@type {HTMLInputElement}*/const input = event.currentTarget;
			if (input.checked) textBlock.removeAttr('disabled');
			else textBlock.attr('disabled', '');
		});
		element.find('button').on('click', (/**@type {JQuery.ClickEvent}*/event) => {
			$(event.currentTarget).parent('.message-entry').remove();
		});
	}
}