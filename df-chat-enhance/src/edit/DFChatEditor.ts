import SETTINGS from "../../../common/Settings";
import DFChatEdit from "./df-chat-edit";


declare namespace marked {
	function parse(md: string, options: any): string;
}

export default class DFChatEditor extends FormApplication {
	private chatMessage: ChatMessage;
	public static readonly PREF_MARKDOWN = 'edit-markdown';

	/**
	 * Assign the default options which are supported by the entity edit sheet.
	 * @returns The default options for this FormApplication class
	 * @override
	 * @see {@link Application.defaultOptions}
	 */
	static get defaultOptions(): FormApplicationOptions {
		return mergeObject(FormApplication.defaultOptions as Partial<FormApplicationOptions>, {
			closeOnSubmit: true,
			editable: true,
			resizable: true,
			width: 400,
			popOut: true,
			title: 'DF_CHAT_EDIT.Editor_Title',
			template: 'modules/df-chat-enhance/templates/chat-edit.hbs'
		}) as FormApplicationOptions;
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
				.replace(/<p +class="df-edited">.+/, '')
		});
	}

	/** @override */
	activateListeners(html: JQuery): void {
		super.activateListeners(html);
		html.find('#cancel').on('click', async () => await this.close());
	}

	/** @override */
	async _updateObject(_event?: any, formData?: any) {
		let data = formData.content as string;
		if (SETTINGS.get(DFChatEditor.PREF_MARKDOWN)) {
			data = DFChatEditor.processMarkdown(data)[1];
		} else {
			data = data.replace(/\r?\n/gm, '<br/>');
		}
		if (SETTINGS.get<boolean>(DFChatEdit.PREF_SHOW_EDITED) && data.search(/<p +class="df-edited">/) < 0) {
			data += `<p class="df-edited">${'DF_CHAT_EDIT.EditedFlag'.localize()}</p>`;
		}
		this.chatMessage.update({ content: data });
	}
	/** @override */
	close(options?: FormApplication.CloseOptions) {
		delete (<any>this.chatMessage).chatEditor;
		return super.close(options);
	}

	public static processMarkdown(message: string) {
		const originalMessage = message;
		message = marked.parse(message, {
			headerIds: false,
			breaks: true
		}).trimEnd();
		if (message.startsWith('<p>'))
			message = message.substr(3);
		if (message.endsWith('</p>'))
			message = message.substr(0, message.length - 4);
		const newLine = /(<\/?[ a-z]+>)\n(<\/?[ a-z]+>?)/;
		while (newLine.test(message))
			message = message.replace(newLine, '$1$2');
		return [originalMessage, message];
	}
}