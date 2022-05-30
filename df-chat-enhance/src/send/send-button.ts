import SETTINGS from "../../../common/Settings";

export default class SendButton {
	private static readonly PREF_ENABLED = 'SendButton.Enabled';
	static init() {
		SETTINGS.register(this.PREF_ENABLED, {
			name: 'DF_CHAT_SEND_BUTTON.EnabledName'.localize(),
			hint: 'DF_CHAT_SEND_BUTTON.EnabledHint'.localize(),
			config: true,
			scope: 'client',
			type: Boolean,
			default: false,
			onChange: (isActive) => {
				if (isActive) {
					this._renderChatLog(ui.chat, $('#sidebar #chat'));
					const popout = $('#chat-popout');
					if (popout.length > 0)
						this._renderChatLog(ui.chat, popout);
				}
				else {
					$('.dfce-send-btn').remove();
					$<HTMLTextAreaElement>('#chat-message').each((_a, textarea) => {
						// @ts-expect-error
						$(textarea).off('input', textarea.dfce_handler);
					});
				}
			}
		});
		Hooks.on('renderChatLog', this._renderChatLog.bind(this));
	}

	private static _renderChatLog(app: ChatLog, html: JQuery<HTMLElement>) {
		if (!SETTINGS.get<boolean>(this.PREF_ENABLED)) return;
		const sendButton = $('<button class="dfce-send-btn"><i class="fas fa-paper-plane"></i></button>');
		sendButton.attr('title', 'DF_CHAT_SEND_BUTTON.ButtonTitle'.localize());
		html.find('#chat-form').append(sendButton);

		const textarea = html.find<HTMLTextAreaElement>('#chat-message');
		sendButton.prop('disabled', textarea[0].textLength <= 0 || textarea[0].value.trim().length <= 0);

		sendButton.on('click', async event => {
			event.preventDefault();
			// @ts-expect-error
			await ui.chat._onChatKeyDown(<any>{
				code: 'Enter',
				currentTarget: textarea[0],
				originalEvent: <any>{
					isComposing: false
				},
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				preventDefault: () => { }
			});
			setTimeout(() => textarea.trigger('input'), 100);
		});

		const handler = (event: JQuery.TriggeredEvent<HTMLTextAreaElement, undefined, HTMLTextAreaElement, HTMLTextAreaElement>) => {
			const element = (event.currentTarget as HTMLTextAreaElement);
			sendButton.prop('disabled', element.textLength <= 0 || element.value.trim().length <= 0);
		};
		// @ts-expect-error
		textarea[0].dfce_handler = handler;
		textarea.on('input', handler);
	}
}