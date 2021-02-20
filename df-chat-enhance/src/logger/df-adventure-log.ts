import CONFIG from "../CONFIG.js";
import DFAdventureLogConfig from "./DFAdventureLogConfig.js";
import DFAdventureLogProcessor from "./DFAdventureLogProcessor.js";

export function init() {
	if (game.modules.get('lib-wrapper')?.active) {
		DFAdventureLogProcessor.initialise();
	}
}
export function ready() {
	if (game.modules.get('lib-wrapper')?.active) {
		DFAdventureLogConfig.setupSettings();
		DFAdventureLogProcessor.setupSettings();
	}
	else {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error(game.i18n.localize('DF_CHAT_LOG.Error_LibWrapperMissing'));
	}
}