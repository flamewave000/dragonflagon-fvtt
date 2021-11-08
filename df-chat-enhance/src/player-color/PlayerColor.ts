import { ChatMessageData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
import SETTINGS from "../../../common/Settings";

export default class PlayerColor {
	static readonly FLAG_CHAT_COLOR = 'chat-color';

	static init() {
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

		libWrapper.register(SETTINGS.MOD_NAME, 'UserConfig.prototype._updateObject',
			async function (this: UserConfig, wrapped: Function, event: any, formData: { "chat-color": string }) {
				await this.object.setFlag(SETTINGS.MOD_NAME, PlayerColor.FLAG_CHAT_COLOR, formData["chat-color"]);
				await wrapped(event, formData);
			}, 'WRAPPER');

		Hooks.on("renderChatMessage", (msg: ChatMessage, html: JQuery<HTMLElement>, messageData: { borderColor: string }) => {
			const chatColor = (<string>msg.user.getFlag(SETTINGS.MOD_NAME, PlayerColor.FLAG_CHAT_COLOR))?.trim();
			// If it is a valid color
			if (chatColor.length > 0 && /#[a-fA-F0-9]{6,8}/.test(chatColor)) {
				html[0].style.borderColor = chatColor;
				html[0].style.setProperty('--dfce-mc-border-color', chatColor);
			}
		});
	}
}