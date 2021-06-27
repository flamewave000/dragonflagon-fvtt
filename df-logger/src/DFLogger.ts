import { Message, MessageProcessor } from "./MessageProcessor.js";
import SETTINGS from "./Settings.js";

interface Payload {
	type: string,
	id: string,
	msg: string
}

export default class DFLogger {
	static EV_LOGIN = 'login';
	static EV_LOGOUT = 'logout';
	static SETTING_GM_ONLY = 'gm-only';
	static SETTING_NOT_ME = 'not-me';
	static SETTING_SELF_DESTRUCT = 'self-destruct';
	static SETTING_DELAY = 'delay';
	static SETTING_SOUND = 'sound';
	static get Persist() { return !SETTINGS.get(DFLogger.SETTING_SELF_DESTRUCT); }
	static get LoginContent() { return game.i18n.localize('DF-LOGGER.Content.Login' + (DFLogger.Persist ? '_Persist' : '')); }
	static get LogoutContent() { return game.i18n.localize('DF-LOGGER.Content.Logout' + (DFLogger.Persist ? '_Persist' : '')); }

	static getMessageText(messages: Message[]): string {
		messages = messages.filter(x => x.tog);
		return messages[Math.round(Math.random() * (messages.length * 100)) % messages.length].msg;
	}

	static async displayMessage(user: User, alias: any, msg: string) {
		let chatMsg = await ChatMessage.create({
			sound: SETTINGS.get(DFLogger.SETTING_SOUND),
			content: msg.replace(/\{\{username\}\}/g, user.name),
			speaker: {
				scene: null,
				actor: null,
				token: null,
				alias: alias
			},
			whisper: [game.user.id],
			type: CONST.CHAT_MESSAGE_TYPES.OOC
		});

		if (!DFLogger.Persist) {
			setTimeout(async () => {
				await chatMsg.delete();
			}, Math.round(game.settings.get(SETTINGS.MOD_NAME, 'delay') * 1000));
		}
	}

	static onEvent(data: Payload) {
		// ignore message if GM-Only and we are not a GM
		if (game.settings.get(SETTINGS.MOD_NAME, DFLogger.SETTING_GM_ONLY) && !game.user.isGM) return;
		if (data.type === DFLogger.EV_LOGIN) DFLogger.onLogin(data);
		else if (data.type === DFLogger.EV_LOGOUT) DFLogger.onLogout(data);
	}
	static onUserActivity(userId: string, activityData: { active?: boolean } = {}) {
		if (!("active" in activityData) || activityData.active === true) return;
		DFLogger.onLogout({
			type: DFLogger.EV_LOGOUT,
			id: userId,
			msg: DFLogger.getMessageText(MessageProcessor.logoutMessages)
		});
	}

	static performLogin() {
		let payload: Payload = {
			type: DFLogger.EV_LOGIN,
			id: game.user.id,
			msg: DFLogger.getMessageText(MessageProcessor.loginMessages)
		}
		game.socket.emit(`module.${SETTINGS.MOD_NAME}`, payload);
		if (!game.settings.get(SETTINGS.MOD_NAME, DFLogger.SETTING_NOT_ME))
			DFLogger.onEvent(payload);
	}

	static async onLogin(data: Payload) {
		await DFLogger.displayMessage(game.users.get(data.id), DFLogger.LoginContent, data.msg);
	}

	static async onLogout(data: Payload) {
		// do not display a logout message for ourselves
		if (game.user.id === data.id) return;
		await DFLogger.displayMessage(game.users.get(data.id), DFLogger.LogoutContent, data.msg);
	}

	static cleanup() {
		if (DFLogger.Persist) return;
		game.messages.forEach(async it => {
			if (!it.isAuthor) return;
			let alias = it.data.speaker.alias;
			if (alias !== DFLogger.LoginContent && alias !== DFLogger.LogoutContent) return
			await it.delete();
		});
	}
}
