export default class CONFIG {
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
		// @ts-expect-error
		ui.chat._lastId = null;
		// @ts-expect-error
		ui.chat._state = Application.RENDER_STATES.NONE;
		ui.chat.render(true);
	}
}