/// <reference path="../../../fvtt-scripts/foundry.mjs" />
/// <reference path="../../../common/foundry.d.ts" />
/// <reference path="../types.d.ts" />
import { parseHTML } from "../../common/fvtt.mjs";
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
					this.#_renderChatLog(ui.chat, {
						"#chat-controls": document.querySelector("#chat-controls"),
						"#chat-message": document.querySelector("#chat-message"),
						"#roll-privacy": document.querySelector("#roll-privacy"),
					});
				}
				else {
					document.querySelector('#dfce-send-btn').remove();
					const cm = document.querySelector('#chat-message');
					cm.oninput = undefined;
					cm.onchange = undefined;
				}
			}
		});
		Hooks.on('renderChatInput', this.#_renderChatLog.bind(this));
	}

	/**
	 * @param {ChatLog} _
	 * @param {ChatElements} html
	 */
	static #_renderChatLog(_, html) {
		if (!SETTINGS.get(this.#PREF_ENABLED)) return;
		document.querySelectorAll('#dfce-send-btn').forEach(x => x.remove());
		const container = parseHTML('<div id="dfce-send-btn"><button class="ui-control icon fa-solid fa-paper-plane"></button></div>');
		html["#chat-controls"].appendChild(container);
		const sendButton = container.querySelector("button");
		sendButton.setAttribute('title', 'DF_CHAT_SEND_BUTTON.ButtonTitle'.localize());
		sendButton.onclick = async event => {
			event.preventDefault();
			event.stopPropagation();
			ui.chat._onKeyDown({
				key: "Enter",
				shiftKey: false,
				isComposing: false,
				target: html["#chat-message"],
				preventDefault: () => { },
				stopPropagation: () => { }
			});
			sendButton.toggleAttribute('disabled', true);
		};

		const handler = () => sendButton.toggleAttribute('disabled', html["#chat-message"].value.trim().length <= 0);
		html["#chat-message"].oninput = handler;
		html["#chat-message"].onchange = handler;
		handler();
	}
}