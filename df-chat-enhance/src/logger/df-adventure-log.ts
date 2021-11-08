import DFAdventureLogConfig from "./DFAdventureLogConfig";
import DFAdventureLogProcessor from "./DFAdventureLogProcessor";


interface AdventurLogApi {
	event(message: string, postToChat?: boolean): Promise<void>
	gmevent(message: string, postToChat?: boolean): Promise<void>
	quote(speaker: string, message: string, postToChat?: boolean): Promise<void>
	gmquote(speaker: string, message: string, postToChat?: boolean): Promise<void>
}
declare global {
	const AdventureLog: AdventurLogApi
}

export function init() {
	const api: AdventurLogApi = {
		event: (async function (message: string, postToChat: boolean = false) {
			DFAdventureLogProcessor.commandProcessor('event ' + message, false, !postToChat);
		}).bind(DFAdventureLogProcessor),

		gmevent: (async function (message: string, postToChat: boolean = false) {
			if (game.user.isGM)
				DFAdventureLogProcessor.commandProcessor('event ' + message, true, !postToChat);
			else ui.notifications.warn(game.i18n.localize("DF_CHAT_LOG.Error.ApiLog_NotGm"));
		}).bind(DFAdventureLogProcessor),

		quote: (async function (speaker: string, message: string, postToChat: boolean = false) {
			DFAdventureLogProcessor.commandProcessor(`quote "${speaker}" ${message}`, false, !postToChat);
		}).bind(DFAdventureLogProcessor),

		gmquote: (async function (speaker: string, message: string, postToChat: boolean = false) {
			if (game.user.isGM)
				DFAdventureLogProcessor.commandProcessor(`quote "${speaker}" ${message}`, true, !postToChat);
			else ui.notifications.warn(game.i18n.localize("DF_CHAT_LOG.Error.ApiLog_NotGm"));
		}).bind(DFAdventureLogProcessor)
	}
	// @ts-expect-error
	window.AdventureLog = api;
}
export function ready() {
	if (!game.modules.get('lib-wrapper')?.active) return;
	DFAdventureLogConfig.setupSettings();
	DFAdventureLogProcessor.setupSettings();
}