export default class DFChatEditor extends FormApplication {
	private chatMessage: ChatMessage;

	/**
	 * Assign the default options which are supported by the entity edit sheet.
	 * @returns The default options for this FormApplication class
	 * @override
	 * @see {@link Application.defaultOptions}
	 */
	static get defaultOptions(): FormApplication.Options {
		return mergeObject(FormApplication.defaultOptions as Partial<FormApplication.Options>, {
			closeOnSubmit: true,
			editable: true,
			resizable: true,
			width: 400,
			popOut: true,
			title: 'DF_CHAT_EDIT.Editor_Title',
			template: 'modules/df-chat-enhance/templates/chat-edit.hbs'
		}) as FormApplication.Options;
	}

	constructor(chatMessage: ChatMessage) {
		super({});
		this.chatMessage = chatMessage;
	}

	/** @override */
	getData(options?: any): any {
		return mergeObject(options, {
			messageText: this.chatMessage.data.content
				.replace(/< *br *\/?>/gm, '\n')
				.replace(/\<p +class="df-edited"\>.+/, '')
		});
	}

	/** @override */
	activateListeners(html: JQuery): void {
		super.activateListeners(html);
		html.find('#cancel').on('click', async () => await this.close());
	}

	/** @override */
	async _updateObject(_event?: any, formData?: any) {
		var data = formData.content as string;
		data = data.replace(/\r?\n/gm, '<br/>');
		if (data.search(/\<p +class="df-edited"\>/) < 0) {
			data += `<p class="df-edited">${game.i18n.localize('DF_CHAT_EDIT.EditedFlag')}</p>`;
		}
		this.chatMessage.update({
			content: data
		});
	}
	/** @override */
	close(options?: FormApplication.CloseOptions) {
		delete (<any>this.chatMessage).chatEditor;
		return super.close(options);
	}
}