/// <reference path="../../../fvtt-scripts/foundry.js" />
/// <reference path="../../../common/foundry.d.ts" />
import libWrapperShared from "../../common/libWrapperShared.mjs";
import SETTINGS from "../../common/Settings.mjs";
import UTIL from '../Util.mjs';

export default class PlayerColor {
	/**@readonly*/ static #PREF_TINT_BG = 'PlayerColor_TintBackground';
	/**@readonly*/ static #PREF_BORDER_STYLE = 'PlayerColor.BorderStyle';
	/**@readonly*/ static #FLAG_CHAT_COLOR = 'chat-color';

	static init() {
		SETTINGS.register(PlayerColor.#PREF_TINT_BG, {
			config: true,
			name: 'DF_CHAT_PLAYER_COLOR.SettingTintBackgroundName',
			hint: 'DF_CHAT_PLAYER_COLOR.SettingTintBackgroundHint',
			scope: 'world',
			type: Boolean,
			default: false,
			onChange: UTIL.reloadChatLog
		});
		SETTINGS.register(PlayerColor.#PREF_BORDER_STYLE, {
			name: 'DF_CHAT_PLAYER_COLOR.SettingBorderStyleName',
			hint: 'DF_CHAT_PLAYER_COLOR.SettingBorderStyleHint',
			config: true,
			type: String,
			choices: {
				all: 'DF_CHAT_PLAYER_COLOR.BorderStyle.all',
				mine: 'DF_CHAT_PLAYER_COLOR.BorderStyle.mine',
				none: 'DF_CHAT_PLAYER_COLOR.BorderStyle.none'
			},
			default: 'all',
			scope: 'client',
			onChange: UTIL.reloadChatLog
		});

		Hooks.on('renderUserConfig',
			/**
			 * @param {User} app
			 * @param {JQuery<HTMLElement>} html
			 */
			(app, html) => {
				const color = app.document.getFlag(SETTINGS.MOD_NAME, PlayerColor.#FLAG_CHAT_COLOR) ?? '';
				$(html).find('color-picker[name="color"]').parent().parent().after(`
<div class="form-group">
	<label for="UserCongih-${app.uuid}-form-chat-color">${'DF_CHAT_PLAYER_COLOR.Label'.localize()}</label>
	<div class="form-fields">
		<color-picker name="chat-color" value="${color}" id="UserCongih-${app.uuid}-form-chat-color">
			<input class="text" placeholder>
			<input type="color">
		</color-picker>
	</div>
	<p class="hint">${'DF_CHAT_PLAYER_COLOR.Hint'.localize()}</p>
</div>`);
			});

		libWrapperShared.register('foundry.applications.sheets.UserConfig.prototype._processFormData',
			/**
			 * @this {foundry.applications.sheets.UserConfig}
			 * @param {(...any) => any} wrapped
			 * @param {SubmitEvent} event
			 * @param {HTMLFormElement} form
			 * @param { { "chat-color": string } } formData
			 * @returns {Promise<any>}
			 */
			function (wrapped, event, form, formData) {
				this.document.setFlag(SETTINGS.MOD_NAME, PlayerColor.#FLAG_CHAT_COLOR, formData.object["chat-color"]);
				delete formData.object["chat-color"];
				return wrapped(event, form, formData);
			});

		libWrapper.register(SETTINGS.MOD_NAME, 'ChatMessage.prototype.getHTML', this.#ChatMessage_getHTML, 'WRAPPER');
	}

	/**
	* @this {ChatMessage}
	* @param {(...arg: any) => Promise<JQuery<HTMLElement>>} wrapper
	* @param  {...any} args
	* @returns {Promise<JQuery<HTMLElement>>}
	*/
	static async #ChatMessage_getHTML(wrapper, ...args) {
		const html = await wrapper(...args);
		const STYLE = SETTINGS.get(PlayerColor.#PREF_BORDER_STYLE);
		// If the message has no user bound to it, then it is likely some kind of other message being created by a module. Just return immediately.
		// Also ignore whispers and rolls
		if (!this.author) return html;
		let chatColor = this.author.getFlag(SETTINGS.MOD_NAME, PlayerColor.#FLAG_CHAT_COLOR)?.trim();
		// If it is a valid color
		if (!chatColor || !/#[a-fA-F0-9]{6,8}/.test(chatColor))
			chatColor = this.author.color;

		// Set the border colour to its default
		let borderColour = '#6f6c66';
		switch (STYLE) {
			case 'none': break;
			case 'mine': if (game.userId !== this.author.id) break;
			/** @fallthrough */
			case 'all': borderColour = chatColor; break;
		}
		html[0].style.borderColor = borderColour;

		// Set the hover border colour to what ever the border colour is
		html[0].style.setProperty('--dfce-mc-border-color', borderColour);
		if (!this.isRoll && this.whisper.length == 0 && SETTINGS.get(PlayerColor.#PREF_TINT_BG)) {
			html[0].style.backgroundColor = chatColor;
			html[0].style.backgroundBlendMode = 'screen';
			if (!!game.dnd5e) {
				html[0].style.backgroundImage = 'url(../ui/parchment.jpg)';
				html[0].style.backgroundRepeat = 'repeat';
			}
		}
		return html;
	}
}
