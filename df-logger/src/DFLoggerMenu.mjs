/// <reference path="../../fvtt-scripts/foundry.mjs" />

import MessageProcessor from "./MessageProcessor.mjs";
import { renderTemplateElement } from '../common/fvtt.mjs';

const { ApplicationV2, DialogV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class DFLoggerMenu extends HandlebarsApplicationMixin(ApplicationV2) {
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		position: {
			width: 600,
			height: 500,
		},
		window: {
			resizable: true,
			contentClasses: ["standard-form"],
			title: 'DF-LOGGER.ManageMenu.Title'//.localize() // Just the localization key
		},
		tag: 'form', // REQUIRED for dialogs and forms
		form: {
			submitOnChange: false,
			submitOnClose: false,
			closeOnSubmit: true,
			handler: DFLoggerMenu.#onSubmitForm
		}
	};
	static TABS = {
		sheet: {
			tabs: [
				// { navSelector: ".tabs", contentSelector: "main", initial: "login" }
				{ id: "login", group: "menu" },
				{ id: "logout", group: "menu" }
			],
			initial: "login",
		}
	};
	/** @inheritDoc */
	static PARTS = {
		tabs: { template: 'modules/df-logger/templates/message-manage-tabs.hbs' },
		login: { template: 'modules/df-logger/templates/message-manage-login.hbs' },
		logout: { template: 'modules/df-logger/templates/message-manage-logout.hbs' },
		footer: { template: 'modules/df-logger/templates/message-manage-footer.hbs' }
	};
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.login = MessageProcessor.loginMessages;
		context.logout = MessageProcessor.logoutMessages;
		return context;
	}

	/**
	 * Attach event listeners to rendered template parts.
	 * @param {string} partId                       The id of the part being rendered
	 * @param {HTMLElement} htmlElement             The rendered HTML element for the part
	 * @param {ApplicationRenderOptions} _options    Rendering options passed to the render method
	 * @protected
	 */
	_attachPartListeners(partId, htmlElement, _options) {
		switch (partId) {
			case 'login':
			case 'logout':
				htmlElement.querySelectorAll('main>li').forEach(/**@type {HTMLDivElement}*/elem => this._processEntry(elem));
				break;
			case 'footer':
				htmlElement.querySelector('button[name="add"]').onclick = this.#addEntry.bind(this);
				htmlElement.querySelector('button[name="reset"]').onclick = this.#reset.bind(this);
				break;
		}
	}

	/** @param {HTMLElement} element */
	_processEntry(element) {
		/** @type {HTMLInputElement}*/
		const textBlock = element.querySelector('input[type="text"]');
		/** @type {HTMLInputElement}*/
		const checkbox = element.querySelector('input[type="checkbox"]');
		checkbox.onchange = () => textBlock.toggleAttribute('disabled', !checkbox.checked);
		/** @type {HTMLButtonElement}*/
		const button = element.querySelector('button');
		button.onclick = () => button.closest('li').remove();
	}

	async #addEntry() {
		const element = await renderTemplateElement('modules/df-logger/templates/message-template.hbs', { tog: true, msg: '' });
		this._processEntry(element);
		this.element.querySelector('fieldset.active>main').appendChild(element);
		element.scrollIntoView();
		element.querySelector('input[type="text"]').focus();
	}

	async #reset() {
		DialogV2.confirm({
			window: { title: 'DF-LOGGER.ManageMenu.Confirm.Title'.localize() },
			content: 'DF-LOGGER.ManageMenu.Confirm.Content'.localize(),
			no: { default: true },
			yes: {
				callback: async () => {
					MessageProcessor.loginMessages = [];
					MessageProcessor.logoutMessages = [];
					await MessageProcessor.initializeMessages();
					await this.render(true);
				}
			}
		});
	}

	/**
	 * Handle form submission
	 * @this {DFLoggerMenu}
	 * @param {SubmitEvent} event
	 * @param {HTMLFormElement} form
	 * @param {FormDataExtended} formData
	 * @param {object} _submitOptions
	 */
	static async #onSubmitForm(event, form, _formData, _submitOptions) {
		event.preventDefault();
		const login = form.querySelectorAll('section>fieldset[data-tab="login"]>main>li');
		/**@type {Message[]}*/const loginEntries = [];
		login.forEach(elem => {
			loginEntries.push({
				tog: elem.querySelector('input[type="checkbox"]').checked,
				msg: elem.querySelector('input[type="text"]').value
			});
		});
		const logout = form.querySelectorAll('section>fieldset[data-tab="logout"]>main>li');
		/**@type {Message[]}*/const logoutEntries = [];
		logout.forEach(elem => {
			logoutEntries.push({
				tog: elem.querySelector('input[type="checkbox"]').checked,
				msg: elem.querySelector('input[type="text"]').value
			});
		});
		MessageProcessor.loginMessages = loginEntries;
		MessageProcessor.logoutMessages = logoutEntries;
		await MessageProcessor.saveMessages();
	}
}
