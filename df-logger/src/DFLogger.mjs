import MessageProcessor from "./MessageProcessor.mjs";
import SETTINGS from "./common/Settings.mjs";

export default class DFLogger {
	static EV_LOGIN = 'login';
	static EV_LOGOUT = 'logout';
	static SETTING_GM_ONLY = 'gm-only';
	static SETTING_NOT_ME = 'not-me';
	static SETTING_SELF_DESTRUCT = 'self-destruct';
	static SETTING_DELAY = 'delay';
	static SETTING_SOUND = 'sound';
	static get Persist() { return !SETTINGS.get(DFLogger.SETTING_SELF_DESTRUCT); }
	static get LoginContent() { return game.i18n.localize('DF-LOGGER.Content.Login'); }
	static get LogoutContent() { return game.i18n.localize('DF-LOGGER.Content.Logout'); }

	/**
	 * @param {Message[]} messages 
	 * @returns {string}
	 */
	static getMessageText(messages) {
		messages = messages.filter(x => x.tog);
		return messages[Math.round(Math.random() * (messages.length * 100)) % messages.length].msg;
	}

	/**
	 * @param {User} user 
	 * @param {any} alias 
	 * @param {string} msg 
	 */
	static async displayMessage(user, alias, msg) {
		const chatMsg = await ChatMessage.create({
			sound: SETTINGS.get(DFLogger.SETTING_SOUND),
			content: msg.replace(/\{\{username\}\}/g, user.name),
			speaker: {
				scene: null,
				actor: null,
				token: null,
				alias: alias
			},
			whisper: [game.user.id],
			type: CONST.CHAT_MESSAGE_STYLES.OOC,
			flags: { 'df-logger': { destroy: !this.Persist } }
		});

		if (!DFLogger.Persist) {
			setTimeout(async () => {
				try {
					await chatMsg.delete();
				} catch { /* ignore errors here, they only occur if the user deleted the message before our timer did */ }
			}, Math.round(SETTINGS.get('delay') * 1000));
		}
	}

	/**
	 * @param {Payload} data
	 * @returns 
	 */
	static onEvent(data) {
		// ignore message if GM-Only and we are not a GM
		if (SETTINGS.get(DFLogger.SETTING_GM_ONLY) && !game.user.isGM) return;
		if (data.type === DFLogger.EV_LOGIN) DFLogger.onLogin(data);
		else if (data.type === DFLogger.EV_LOGOUT) DFLogger.onLogout(data);
	}
	/**
	 * 
	 * @param {string} userId 
	 * @param { {active?: boolean} } activityData
	 */
	static onUserActivity(userId, activityData = {}) {
		if (!("active" in activityData) || activityData.active === true) return;
		DFLogger.onLogout({
			type: DFLogger.EV_LOGOUT,
			id: userId,
			msg: DFLogger.getMessageText(MessageProcessor.logoutMessages)
		});
	}

	static performLogin() {
		/** @type {Payload} */const payload = {
			type: DFLogger.EV_LOGIN,
			id: game.user.id,
			msg: DFLogger.getMessageText(MessageProcessor.loginMessages)
		};
		game.socket.emit(`module.${SETTINGS.MOD_NAME}`, payload);
		if (!SETTINGS.get(DFLogger.SETTING_NOT_ME))
			DFLogger.onEvent(payload);
	}

	/**
	 * @param {Payload} data 
	 */
	static async onLogin(data) {
		await DFLogger.displayMessage(game.users.get(data.id), DFLogger.LoginContent, data.msg);
	}

	/**
	 * @param {Payload} data 
	 */
	static async onLogout(data) {
		// do not display a logout message for ourselves
		if (game.user.id === data.id) return;
		await DFLogger.displayMessage(game.users.get(data.id), DFLogger.LogoutContent, data.msg);
	}

	static cleanup() {
		if (DFLogger.Persist) return;
		game.messages.forEach(async it => {
			if (!it.isAuthor) return;
			if (it.getFlag(SETTINGS.MOD_NAME, 'destroy'))
				await it.delete();
		});
	}
}
