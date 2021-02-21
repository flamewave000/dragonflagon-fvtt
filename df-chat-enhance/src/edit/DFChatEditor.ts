export default class DFChatEditor extends FormApplication {
	private chatMessage: ChatMessage;

	/**
	 * Assign the default options which are supported by the entity edit sheet.
	 * @returns The default options for this FormApplication class
	 * @override
	 * @see {@link Application.defaultOptions}
	 */
	static get defaultOptions(): FormApplication.Options {
		var data = FormApplication.defaultOptions;
		return mergeObject(data, {
			closeOnSubmit: true,
			editable: true,
			resizable: true,
			width: 400,
			popOut: true,
			title: 'DF_CHAT_EDIT.Editor_Title',
			template: 'modules/df-chat-enhance/templates/chat-edit.hbs'
		});
	}

	constructor(chatMessage: ChatMessage) {
		super();
		this.chatMessage = chatMessage;
	}

	getData(options?: any): any {
		return mergeObject(options, {
			messageText: this.chatMessage.data.content
				.replace(/< *br *\/?>/gm, '\n')
				.replace(/\<p +class="df-edited"\>.+/, '')
		});
	}

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
	close(options?: FormApplication.CloseOptions) {
		delete (this.chatMessage as any).chatEditor;
		return super.close(options);
	}
}