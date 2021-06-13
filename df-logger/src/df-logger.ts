import DFLogger from './DFLogger.js';
import SETTINGS from './Settings.js';

SETTINGS.init('df-logger');

Hooks.once('init', function () {
	SETTINGS.register(DFLogger.SETTING_GM_ONLY, {
		name: "DRAGON_FLAGON.Settings_GmOnly_Title",
		hint: "DRAGON_FLAGON.Settings_GmOnly_Hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
	});
	SETTINGS.register(DFLogger.SETTING_SELF_DESTRUCT, {
		name: "DRAGON_FLAGON.Settings_SelfDestruct_Title",
		hint: "DRAGON_FLAGON.Settings_SelfDestruct_Hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	SETTINGS.register(DFLogger.SETTING_DELAY, {
		name: "DRAGON_FLAGON.Settings_Delay_Title",
		hint: "DRAGON_FLAGON.Settings_Delay_Hint",
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
		name: "DRAGON_FLAGON.Settings_NotMe_Title",
		hint: "DRAGON_FLAGON.Settings_NotMe_Hint",
		scope: "client",
		config: true,
		type: Boolean,
		default: false,
	});

	// register our socket events receiver
	game.socket.on(`module.${SETTINGS.MOD_NAME}`, DFLogger.onEvent);
	game.socket.on('userActivity', DFLogger.onUserActivity);
});

Hooks.once('ready', function () {
	// remove any log messages that didn't get cleaned before we left (if any)
	DFLogger.cleanup();
	// Emit our login event to the socket
	DFLogger.performLogin();
});