export default class DFLogger {
	static MODULE = 'df-logger';
	static EV_LOGIN = 'login';
	static EV_LOGOUT = 'logout';
	static SETTING_GM_ONLY = 'gm-only';
	static SETTING_NOT_ME = 'not-me';
	static SETTING_DELAY = 'delay';
	static get LoginContent() { return game.i18n.localize('DRAGON_FLAGON.Content_Login'); }
	static get LogoutContent() { return game.i18n.localize('DRAGON_FLAGON.Content_Logout'); }

	static getMessageText(msgKey, msgCount) {
		return game.i18n.localize(msgKey + (Math.round(Math.random() * (msgCount * 100)) % msgCount));
	}

	static async displayMessage(user, alias, msg) {
		let chatMsg = await ChatMessage.create({
			sound: 'modules/df-logger/sounds/chime.mp3',
			content: msg.replace(/\{\{username\}\}/g, user.name),
			speaker: {
				scene: null,
				actor: null,
				token: null,
				alias: alias
			},
			whisper: [game.user.id],
			type: CHAT_MESSAGE_TYPES.OOC
		});
		setTimeout(async () => {
			await ChatMessage.delete(chatMsg.id);
		}, Math.round(game.settings.get(DFLogger.MODULE, 'delay') * 1000));
	}

	static onEvent(data) {
		// ignore message if GM-Only and we are not a GM
		if (game.settings.get(DFLogger.MODULE, DFLogger.SETTING_GM_ONLY) && !game.user.isGM) return;
		if (data.type === DFLogger.EV_LOGIN) DFLogger.onLogin(data);
		else if (data.type === DFLogger.EV_LOGOUT) DFLogger.onLogout(data);
	}

	static performLogin() {
		let payload = {
			type: DFLogger.EV_LOGIN,
			id: game.user.id,
			msg: DFLogger.getMessageText("DRAGON_FLAGON.LoginMsg", 38)
		}
		game.socket.emit(`module.${DFLogger.MODULE}`, payload);
		if (!game.settings.get(DFLogger.MODULE, DFLogger.SETTING_NOT_ME))
			DFLogger.onEvent(payload);
	}

	static async performLogout() {
		let payload = {
			type: DFLogger.EV_LOGOUT,
			id: game.user.id,
			msg: DFLogger.getMessageText("DRAGON_FLAGON.LogoutMsg", 1)
		}
		await game.socket.emit(`module.${DFLogger.MODULE}`, payload);
	}

	static async onLogin(data) {
		await DFLogger.displayMessage(game.users.get(data.id), DFLogger.LoginContent, data.msg);
	}

	static async onLogout(data) {
		// do not display a logout message for ourselves
		if (game.user.id === data.id) return;
		await DFLogger.displayMessage(game.users.get(data.id), DFLogger.LogoutContent, data.msg);
	}

	static cleanup() {
		game.messages.forEach(async it => {
			if (!it.isAuthor) return;
			let alias = it.data.speaker.alias;
			if (alias !== DFLogger.LoginContent && alias !== DFLogger.LogoutContent) return
			await ChatMessage.delete(it.id);
		});
	}
}
