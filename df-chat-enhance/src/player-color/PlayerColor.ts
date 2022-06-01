import libWrapperShared from "../../../common/libWrapperShared";
import SETTINGS from "../../../common/Settings";
import UTIL from '../Util';

export default class PlayerColor {
	static readonly PREF_TINT_BG = 'PlayerColor_TintBackground';
	static readonly PREF_BORDER_STYLE = 'PlayerColor.BorderStyle';
	static readonly FLAG_CHAT_COLOR = 'chat-color';

	static init() {
		SETTINGS.register(PlayerColor.PREF_TINT_BG, {
			config: true,
			name: 'DF_CHAT_PLAYER_COLOR.SettingTintBackgroundName',
			hint: 'DF_CHAT_PLAYER_COLOR.SettingTintBackgroundHint',
			scope: 'world',
			type: Boolean,
			default: false,
			onChange: UTIL.reloadChatLog
		});
		SETTINGS.register<string>(PlayerColor.PREF_BORDER_STYLE, {
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

		Hooks.on('renderUserConfig', (app: UserConfig, html: JQuery<HTMLElement>, data: UserConfig.Data<any>) => {
			const color = data.user.getFlag(SETTINGS.MOD_NAME, PlayerColor.FLAG_CHAT_COLOR) ?? '';
			html.find('input[name="color"]').parent().after(`
<div class="form-group">
	<label for="chat-color">${'DF_CHAT_PLAYER_COLOR.Label'.localize()}</label>
	<input id="chat-color" type="text" name="chat-color" value="${color}" style="flex:1.35">
	<input type="color" value="${color}" data-edit="chat-color">
</div>`);
			const chatField = html.find('#chat-color');
			const chatPicker = html.find('[data-edit="chat-color"]');
			// Make sure to update the color selector if a manual entry occurs
			chatField.on('change', () => chatPicker.val(chatField.val()));
			// Resize the window to encompass the new fields
			app.element[0].style.height = '';
			app.setPosition({});
		});

		libWrapperShared.register('UserConfig.prototype._updateObject',
			async function (this: UserConfig, wrapped: (arg0: any, arg1: any) => any, event: any, formData: { "chat-color": string }): Promise<void> {
				await this.object.setFlag(SETTINGS.MOD_NAME, PlayerColor.FLAG_CHAT_COLOR, formData["chat-color"]);
				await wrapped(event, formData);
			});

		libWrapper.register(SETTINGS.MOD_NAME, 'ChatMessage.prototype.getHTML', async function (this: ChatMessage, wrapper: (...arg: any) => Promise<JQuery<HTMLElement>>, ...args: any) {
			const html = await wrapper(...args);
			// If the message has no user bound to it, then it is likely some kind of other message being created by a module. Just return immediately.
			if (!this.user) return html;
			let chatColor = (<string>this.user.getFlag(SETTINGS.MOD_NAME, PlayerColor.FLAG_CHAT_COLOR))?.trim();
			// If it is a valid color
			if (!chatColor || !/#[a-fA-F0-9]{6,8}/.test(chatColor))
				chatColor = this.user.color;

			// Set the border colour to its default
			let borderColour = '#6f6c66';
			switch (SETTINGS.get<string>(PlayerColor.PREF_BORDER_STYLE)) {
				case 'none': break;
				case 'mine':
					if (game.userId !== this.data.user) break;
				// fallthrough
				case 'all':
					borderColour = chatColor;
					break;
			}
			html[0].style.borderColor = borderColour;

			// Set the hover border colour to what ever the border colour is
			html[0].style.setProperty('--dfce-mc-border-color', borderColour);
			if (SETTINGS.get(PlayerColor.PREF_TINT_BG)) {
				html[0].style.backgroundColor = chatColor;
				html[0].style.backgroundImage = 'url(../ui/parchment.jpg)';
				html[0].style.backgroundRepeat = 'repeat';
				html[0].style.backgroundBlendMode = 'screen';
			}
			return html;
		}, 'WRAPPER');
	}
}
