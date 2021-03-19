import DFAdventureLogConfig from "./DFAdventureLogConfig.js";
import DFAdventureLogProcessor from "./DFAdventureLogProcessor.js";

export function init() {
	if (game.modules.get('lib-wrapper')?.active) {
		DFAdventureLogProcessor.initialise();
	}
}
export function ready() {
	if (!game.modules.get('lib-wrapper')?.active) return;
	DFAdventureLogConfig.setupSettings();
	DFAdventureLogProcessor.setupSettings();
}