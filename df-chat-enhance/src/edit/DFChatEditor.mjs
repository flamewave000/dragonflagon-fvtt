/// <reference path="../../../fvtt-scripts/foundry.js" />
/// <reference path="../../../common/foundry.d.ts" />
/// <reference path="../../../common/libWrapper.d.ts" />
/// <reference path="../types.d.ts" />
import SETTINGS from "../../common/Settings.mjs";
import DFChatEdit from "./df-chat-edit.mjs";

export default class DFChatEditor extends FormApplication {
	/**@type {ChatMessage}*/ #chatMessage = null;
	/**@readonly*/ static PREF_MARKDOWN = 'edit-markdown';

	/**
	 * Assign the default options which are supported by the entity edit sheet.
	 * @returns {FormApplicationOptions} The default options for this FormApplication class
	 * @override
	 * @see {@link Application.defaultOptions}
	 */
	static get defaultOptions() {
		return foundry.utils.mergeObject(FormApplication.defaultOptions, {
			closeOnSubmit: true,
			editable: true,
			resizable: true,
			width: 400,
			popOut: true,
			title: 'DF_CHAT_EDIT.Editor_Title',
			template: 'modules/df-chat-enhance/templates/chat-edit.hbs'
		});
	}

	/**@param {ChatMessage} chatMessage*/
	constructor(chatMessage) {
		super({});
		this.#chatMessage = chatMessage;
	}

	/**
	 * @override
	 * @param {any} [options]
	 * @returns {any}
	 */
	getData(options) {
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
		if (this.#chatMessage.author)
			selected = 'user-' + this.#chatMessage.author;
		if (this.#chatMessage.speaker.token)
			selected = 'token-' + this.#chatMessage.speaker.token;

		return foundry.utils.mergeObject(options, {
			selected,
			players: game.users.map(x => ({ id: 'user-' + x.id, name: x.name })),
			actorGroups: types.filter(x => x.actors.length > 0),
			messageText: this.#chatMessage.content
				.replace(/< *br *\/?>/gm, '\n')
				.replace(/<p +class="df-edited">.+/, '')
		});
	}

	/**
	 * @override
	 * @param {JQuery} html
	 * @returns {void}
	 */
	activateListeners(html) {
		super.activateListeners(html);
		html.find('#cancel').on('click', async () => await this.close());
	}

	/**
	 * @override
	 * @param {any} [_event]
	 * @param { { content: string, speaker: string } } [formData]
	 */
	async _updateObject(_event, formData) {
		let data = formData.content;
		if (SETTINGS.get(DFChatEditor.PREF_MARKDOWN)) {
			data = DFChatEditor.processMarkdown(data)[1];
		} else {
			data = data.replace(/\r?\n/gm, '<br/>');
		}
		if (SETTINGS.get(DFChatEdit.PREF_SHOW_EDITED) && data.search(/<p +class="df-edited">/) < 0) {
			data += `<p class="df-edited">${'DF_CHAT_EDIT.EditedFlag'.localize()}</p>`;
		}

		let speaker = undefined;
		let user = undefined;
		if (formData.speaker.startsWith('user-')) {
			user = game.users.get(formData.speaker.substring('user-'.length)).id;
			speaker = ChatMessage._getSpeakerFromUser({ user });
		} else
			speaker = ChatMessage.getSpeaker({ token: game.scenes.viewed.tokens.get(formData.speaker.substring('token-'.length)) });
		if (speaker.alias === undefined)
			speaker.alias = null;
		this.#chatMessage.update({ content: data, speaker, user });
	}
	/**
	 * @override
	 * @param {FormApplication.CloseOptions} [options]
	 * @returns {Promise<void>}
	 */
	close(options) {
		delete this.#chatMessage.chatEditor;
		return super.close(options);
	}

	/**
	 * @param {string} message
	 * @returns {[string, string]}
	 */
	static processMarkdown(message) {
		const originalMessage = message;
		message = marked.parse(message, {
			headerIds: false,
			breaks: true
		}).trimEnd();
		if (message.startsWith('<p>'))
			message = message.substring(3);
		if (message.endsWith('</p>'))
			message = message.substring(0, message.length - 4);
		const newLine = /(<\/?[ a-z]+>)\n(<\/?[ a-z]+>?)/;
		while (newLine.test(message))
			message = message.replace(newLine, '$1$2');
		return [originalMessage, message];
	}
}

/**@type {MarkedExtension}*/
const inlineDiceRoll = {
	name: "dice-roll",
	level: 'inline',
	start(src) { return src.match(/\[\[/)?.index; },
	renderer(token) { return token.raw; },
	tokenizer(src, _tokens) {
		const rule = /^\[\[[^\n\r]+\]\]$/;
		const match = rule.exec(src);
		if (match)
			return { type: 'dice-roll', raw: match[0] };
	}
};
marked.use({ extensions: [inlineDiceRoll] });