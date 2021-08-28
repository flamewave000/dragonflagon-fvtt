import { Message, MessageProcessor } from "./MessageProcessor.js";


export default class DFLoggerMenu extends FormApplication {
	static get defaultOptions() {
		return <any>mergeObject(super.defaultOptions as Partial<FormApplication.Options>, {
			editable: true,
			resizable: true,
			submitOnChange: false,
			submitOnClose: false,
			closeOnSubmit: true,
			width: 600,
			height: 500,
			title: 'DF-LOGGER.ManageMenu.Title',
			tabs: [{ navSelector: ".tabs", contentSelector: "main", initial: "login" }],
			template: 'modules/df-logger/templates/message-manage.hbs'
		});
	}

	async _updateObject(event: Event, formData?: object) {
		const loginEntryElements = this.element.find('div[data-tab="login"]>div.message-entry');
		const loginEntries: Message[] = [];
		loginEntryElements.each((_, elem) => {
			loginEntries.push({
				tog: elem.querySelector<HTMLInputElement>('input[type="checkbox"]').checked,
				msg: elem.querySelector<HTMLInputElement>('input[type="text"]').value
			});
		});
		const logoutEntryElements = this.element.find('div[data-tab="logout"]>div.message-entry');
		const logoutEntries: Message[] = [];
		logoutEntryElements.each((_, elem) => {
			logoutEntries.push({
				tog: elem.querySelector<HTMLInputElement>('input[type="checkbox"]').checked,
				msg: elem.querySelector<HTMLInputElement>('input[type="text"]').value
			});
		});
		MessageProcessor.loginMessages = loginEntries;
		MessageProcessor.logoutMessages = logoutEntries;
		await MessageProcessor.saveMessages();
	}

	getData(options?: Application.RenderOptions): any {
		return {
			login: MessageProcessor.loginMessages,
			logout: MessageProcessor.logoutMessages
		}
	}

	/** @override */
	activateListeners(html: JQuery<HTMLElement>) {
		html.find('div.message-entry').each((_, elem) => this._processEntry($(elem)));
		html.find('button[name="add"]').on('click', async () => {
			const entry = $(await renderTemplate('modules/df-logger/templates/message-template.hbs', { tog: true, msg: '' }));
			this._processEntry(entry);
			html.find('div.tab.active').append(entry);
		});
		html.find('button[name="reset"]').on('click', async () => {
			Dialog.confirm({
				title: 'DF-LOGGER.ManageMenu.Confirm.Title',
				content: 'DF-LOGGER.ManageMenu.Confirm.Content',
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

	private _processEntry(element: JQuery<HTMLElement>) {
		const textBlock = element.find('input[type="text"]');
		element.find('input[type="checkbox"]').on('change', (event) => {
			const input = event.currentTarget as HTMLInputElement;
			if (input.checked) textBlock.removeAttr('disabled');
			else textBlock.attr('disabled', '');
		});
		element.find('button').on('click', (event: JQuery.ClickEvent) => {
			$(event.currentTarget).parent('.message-entry').remove();
		});
	}
}