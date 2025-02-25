/// <reference path="../../../fvtt-scripts/foundry.js" />
/// <reference path="../../../common/foundry.d.ts" />
import SETTINGS from "../../common/Settings.mjs";

export default class SendButton {
	/**@readonly*/static #PREF_ENABLED = 'SendButton.Enabled';
	static init() {
		SETTINGS.register(this.#PREF_ENABLED, {
			name: 'DF_CHAT_SEND_BUTTON.EnabledName'.localize(),
			hint: 'DF_CHAT_SEND_BUTTON.EnabledHint'.localize(),
			config: true,
			scope: 'client',
			type: Boolean,
			default: false,
			onChange: (isActive) => {
				if (isActive) {
					this.#_renderChatLog(ui.chat, $('#sidebar #chat'));
					const popout = $('#chat-popout');
					if (popout.length > 0)
						this.#_renderChatLog(ui.chat, popout);
				}
				else {
					$('.dfce-send-btn').remove();
					$('#chat-message').each((_a, /**@type {HTMLTextAreaElement}*/textarea) => {
						$(textarea).off('input', textarea.dfce_handler);
					});
				}
			}
		});
		Hooks.on('renderChatLog', this.#_renderChatLog.bind(this));
	}

	/**
	 * @param {ChatLog} app
	 * @param {JQuery<HTMLElement>} html
	 */
	static #_renderChatLog(app, html) {
		if (!SETTINGS.get(this.#PREF_ENABLED)) return;
		const sendButton = $('<button class="dfce-send-btn"><i class="fas fa-paper-plane"></i></button>');
		sendButton.attr('title', 'DF_CHAT_SEND_BUTTON.ButtonTitle'.localize());
		html.find('#chat-form').append(sendButton);

		const textarea = html.find('#chat-message');
		sendButton.prop('disabled', textarea[0].textLength <= 0 || textarea[0].value.trim().length <= 0);

		sendButton.on('click', async event => {
			event.preventDefault();
			await ui.chat._onChatKeyDown({
				code: 'Enter',
				currentTarget: textarea[0],
				originalEvent: {
					isComposing: false
				},
				preventDefault: () => { },
				stopPropagation: () => { }
			});
			setTimeout(() => textarea.trigger('input'), 100);
		});

		/**@type {(event: JQuery.TriggeredEvent<HTMLTextAreaElement, undefined, HTMLTextAreaElement, HTMLTextAreaElement>) => void}*/
		const handler = (event) => {
			/**@type {HTMLTextAreaElement}*/
			const element = event.currentTarget;
			sendButton.prop('disabled', element.textLength <= 0 || element.value.trim().length <= 0);
		};
		textarea[0].dfce_handler = handler;
		textarea.on('input', handler);
		textarea.on('change', handler);
	}
}