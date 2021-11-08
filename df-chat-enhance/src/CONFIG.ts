export default class CONFIG {
	static async requestReload() {
		if (await Dialog.confirm({
			title: game.i18n.localize("DF_CHAT_ENHANCE.ReloadGameTitle"),
			content: game.i18n.localize("DF_CHAT_ENHANCE.ReloadGameContent"),
			defaultYes: true
		})) {
			window.location.reload();
		}
	}
}