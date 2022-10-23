import { ChatMessageData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
import SETTINGS from "../../../common/Settings";
import DFChatEdit from "./df-chat-edit";


declare namespace marked {
	function parse(md: string, options: any): string;
}

export default class DFChatEditor extends FormApplication {
	private chatMessage: ChatMessageData & ChatMessage;
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

	constructor(chatMessage: ChatMessageData & ChatMessage) {
		super({});
		this.chatMessage = chatMessage;
	}

	/** @override */
	getData(options?: any): any {

		// Collect the different Actor types and the labels for those types
		const types = Object.keys(CONFIG.Actor.typeLabels).map(type => {
			return { type, label: CONFIG.Actor.typeLabels[type], actors: [] };
		});
		// Organize the actors in the current scene into those type categories
		for (const type of types) {
			type.actors = game.scenes.viewed.tokens.contents.filter(x => x.actor.type === type.type).map(x => ({
				id: 'token-' + x.id,
				name: x.name
			}));
		}

		let selected = '';
		if (this.chatMessage.user)
			selected = 'user-' + this.chatMessage.user;
		if (this.chatMessage.speaker.token)
			selected = 'token-' + this.chatMessage.speaker.token;

		return mergeObject(options, {
			selected,
			players: game.users.map(x => ({ id: 'user-' + x.id, name: x.name })),
			actorGroups: types.filter(x => x.actors.length > 0),
			messageText: this.chatMessage.content
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
	async _updateObject(_event?: any, formData?: { content: string, speaker: string }) {
		let data = formData.content as string;
		if (SETTINGS.get(DFChatEditor.PREF_MARKDOWN)) {
			data = DFChatEditor.processMarkdown(data)[1];
		} else {
			data = data.replace(/\r?\n/gm, '<br/>');
		}
		if (SETTINGS.get<boolean>(DFChatEdit.PREF_SHOW_EDITED) && data.search(/<p +class="df-edited">/) < 0) {
			data += `<p class="df-edited">${'DF_CHAT_EDIT.EditedFlag'.localize()}</p>`;
		}

		let speaker = undefined;
		let user = undefined;
		if (formData.speaker.startsWith('user-')) {
			user = game.users.get(formData.speaker.substring('user-'.length)).id;
			// @ts-expect-error
			speaker = ChatMessage._getSpeakerFromUser({ user });
		} else
			speaker = ChatMessage.getSpeaker({ token: game.scenes.viewed.tokens.get(formData.speaker.substring('token-'.length)) });
		if (speaker.alias === undefined)
			speaker.alias = null;
		this.chatMessage.update({ content: data, speaker, user });
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