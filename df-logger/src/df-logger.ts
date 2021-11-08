import DFLogger from './DFLogger';
import DFLoggerMenu from './DFLoggerMenu';
import { MessageProcessor } from './MessageProcessor';
import SETTINGS from "../../common/SETTINGS";

SETTINGS.init('df-logger');

Hooks.once('init', function () {
	game.settings.registerMenu(SETTINGS.MOD_NAME, 'message-manage', {
		restricted: true,
		type: DFLoggerMenu,
		label: 'DF-LOGGER.Settings.ManageMessages',
		icon: 'fas fa-comment-alt'
	});
	SETTINGS.register(DFLogger.SETTING_SOUND, {
		name: 'DF-LOGGER.Settings.Sound_Name',
		hint: 'DF-LOGGER.Settings.Sound_Hint',
		scope: 'world',
		config: true,
		type: String,
		default: 'modules/df-logger/sounds/chime.mp3',
		filePicker: true
	});

	SETTINGS.register(DFLogger.SETTING_GM_ONLY, {
		name: "DF-LOGGER.Settings.GmOnly_Name",
		hint: "DF-LOGGER.Settings.GmOnly_Hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
	});
	SETTINGS.register(DFLogger.SETTING_SELF_DESTRUCT, {
		name: "DF-LOGGER.Settings.SelfDestruct_Name",
		hint: "DF-LOGGER.Settings.SelfDestruct_Hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	SETTINGS.register(DFLogger.SETTING_DELAY, {
		name: "DF-LOGGER.Settings.Delay_Name",
		hint: "DF-LOGGER.Settings.Delay_Hint",
		scope: "client",
		config: true,
		type: Number,
		default: 15,
		range: {
			min: 1,
			max: 30,
			step: 1
		}
	});
	SETTINGS.register(DFLogger.SETTING_NOT_ME, {
		name: "DF-LOGGER.Settings.NotMe_Name",
		hint: "DF-LOGGER.Settings.NotMe_Hint",
		scope: "client",
		config: true,
		type: Boolean,
		default: false,
	});

	// register our socket events receiver
	game.socket.on(`module.${SETTINGS.MOD_NAME}`, DFLogger.onEvent);
	game.socket.on('userActivity', DFLogger.onUserActivity);
});

Hooks.once('ready', async function () {
	await MessageProcessor.loadMessages();

	// remove any log messages that didn't get cleaned before we left (if any)
	DFLogger.cleanup();

	// Emit our login event to the socket
	DFLogger.performLogin();
});