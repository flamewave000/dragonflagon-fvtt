import CONFIG from "../CONFIG.js";
import DFAdventureLogConfig from "./DFAdventureLogConfig.js";
import DFAdventureLogProcessor from "./DFAdventureLogProcessor.js";


export default function initDFAdventureLog() {
	game.settings.register(CONFIG.MOD_NAME, DFAdventureLogProcessor.PREF_ENABLE, {
		scope: 'world',
		name: 'DF_CHAT_LOG.Setting_EnableTitle',
		hint: 'DF_CHAT_LOG.Setting_EnableHint',
		config: true,
		type: Boolean,
		default: true,
		onChange: CONFIG.requestReload
	});
	if (!game.settings.get(CONFIG.MOD_NAME, DFAdventureLogProcessor.PREF_ENABLE))
		return;

	game.settings.register(CONFIG.MOD_NAME, 'df-log-gmonly', {
		name: 'DF_CHAT_LOG.Setting_GmOnlyTitle',
		hint: 'DF_CHAT_LOG.Setting_GmOnlyHint',
		scope: 'world',
		type: Boolean,
		default: false,
		config: true,
		onChange: CONFIG.requestReload
	});
	if (game.settings.get(CONFIG.MOD_NAME, 'df-log-gmonly') && !game.user.isGM)
		return;

	DFAdventureLogProcessor.setupSettings();
	DFAdventureLogConfig.setupSettings();
}