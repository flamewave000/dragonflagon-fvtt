export default class UTIL {
	static async requestReload() {
		if (await Dialog.confirm({
			title: "DF_CHAT_ENHANCE.ReloadGameTitle".localize(),
			content: "DF_CHAT_ENHANCE.ReloadGameContent".localize(),
			defaultYes: true
		})) {
			window.location.reload();
		}
	}

	static reloadChatLog() {
		ui.chat._lastId = null;
		ui.chat._state = Application.RENDER_STATES.NONE;
		ui.chat.render(true);
	}
}