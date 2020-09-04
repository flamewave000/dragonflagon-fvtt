import DFLogger from './DFLogger.js';

Hooks.once('init', function () {
	game.settings.register(DFLogger.MODULE, DFLogger.SETTING_GM_ONLY, {
		name: game.i18n.localize("DRAGON_FLAGON.Settings_GmOnly_Title"),
		hint: game.i18n.localize("DRAGON_FLAGON.Settings_GmOnly_Hint"),
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
	});
	game.settings.register(DFLogger.MODULE, DFLogger.SETTING_NOT_ME, {
		name: game.i18n.localize("DRAGON_FLAGON.Settings_NotMe_Title"),
		hint: game.i18n.localize("DRAGON_FLAGON.Settings_NotMe_Hint"),
		scope: "client",
		config: true,
		type: Boolean,
		default: false,
	});
	game.settings.register(DFLogger.MODULE, DFLogger.SETTING_DELAY, {
		name: game.i18n.localize("DRAGON_FLAGON.Settings_Delay_Title"),
		hint: game.i18n.localize("DRAGON_FLAGON.Settings_Delay_Hint"),
		scope: "client",
		config: true,
		type: Number,
		default: 15,
        min: 5,
		onChange: value => {
			if (value < 5)
				game.settings.put(DFLogger.MODULE, DFLogger.SETTING_DELAY, 5);
		}
	});

	// register our socket events receiver
	game.socket.on(`module.${DFLogger.MODULE}`, DFLogger.onEvent);
});

Hooks.once('ready', function () {
	// remove any log messages that didn't get cleaned before we left (if any)
	DFLogger.cleanup();
	// Emit our login event to the socket
	DFLogger.performLogin();
	// swap the logout function for my own intermediate
	game.dflogger_logOut = game.logOut;
	game.logOut = async function () {
		// Emit our logout event to the socket
		await DFLogger.performLogout();
		// execute the regular logout function
		game.dflogger_logOut();
	};
});