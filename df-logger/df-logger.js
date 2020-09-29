import DFLogger from './DFLogger.js';

Hooks.once('init', function () {
	game.settings.register(DFLogger.MODULE, DFLogger.SETTING_GM_ONLY, {
		name: "DRAGON_FLAGON.Settings_GmOnly_Title",
		hint: "DRAGON_FLAGON.Settings_GmOnly_Hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
	});
	game.settings.register(DFLogger.MODULE, DFLogger.SETTING_SELF_DESTRUCT, {
		name: "DRAGON_FLAGON.Settings_SelfDestruct_Title",
		hint: "DRAGON_FLAGON.Settings_SelfDestruct_Hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	game.settings.register(DFLogger.MODULE, DFLogger.SETTING_DELAY, {
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
	game.settings.register(DFLogger.MODULE, DFLogger.SETTING_NOT_ME, {
		name: "DRAGON_FLAGON.Settings_NotMe_Title",
		hint: "DRAGON_FLAGON.Settings_NotMe_Hint",
		scope: "client",
		config: true,
		type: Boolean,
		default: false,
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