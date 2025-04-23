/// <reference path="../../../fvtt-scripts/foundry.js" />
import SETTINGS from "../../common/Settings.mjs";
import UTIL from "../Util.mjs";

/**@type { {[key: string]:string;publicroll:string;gmroll:string;blindroll:string;selfroll:string;} }*/
const ICONS_FOR_KNOWN_ROLL_TYPES = {
	publicroll: 'fas fa-users',
	gmroll: 'fas fa-user-secret',
	blindroll: 'fas fa-user-ninja',
	selfroll: 'fas fa-ghost'
};

/**
 * @typedef {object} RollMode
 * @property {'CHAT.RollDefault'} group
 * @property {'publicroll'|'gmroll'|'blindroll'|'selfroll'} value
 * @property {'CHAT.RollPublic'|'CHAT.RollPrivate'|'CHAT.RollBlind'|'CHAT.RollSelf'} label
 */

/**
 * @typedef {object} ChatLogData
 * @property {User} user
 * @property {string} rollMode
 * @property {RollMode[]} rollModes
 * @property {boolean} isStream
 */

export default class ChatRollPrivacy {
	/**@readonly*/static #PREF_TOGGLE_A = 'privacy-toggle-a';
	/**@readonly*/static #PREF_TOGGLE_B = 'privacy-toggle-b';

	static setup() {
		game.keybindings.register(SETTINGS.MOD_NAME, "roll-mode_publicroll", {
			name: 'DF_CHAT_PRIVACY.Bindings.publicroll_name',
			hint: 'DF_CHAT_PRIVACY.Bindings.publicroll_hint',
			// editable: [{ key: 'KeyQ', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			onDown: () => $('#dfcp-rt-buttons > button[data-id="publicroll"]').trigger('click')
		});
		game.keybindings.register(SETTINGS.MOD_NAME, "roll-mode_gmroll", {
			name: 'DF_CHAT_PRIVACY.Bindings.privateroll_name',
			hint: 'DF_CHAT_PRIVACY.Bindings.privateroll_hint',
			// editable: [{ key: 'KeyW', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			onDown: () => $('#dfcp-rt-buttons > button[data-id="gmroll"]').trigger('click')
		});
		game.keybindings.register(SETTINGS.MOD_NAME, "roll-mode_blindroll", {
			name: 'DF_CHAT_PRIVACY.Bindings.blindroll_name',
			hint: 'DF_CHAT_PRIVACY.Bindings.blindroll_hint',
			// editable: [{ key: 'KeyE', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			onDown: () => $('#dfcp-rt-buttons > button[data-id="blindroll"]').trigger('click')
		});
		game.keybindings.register(SETTINGS.MOD_NAME, "roll-mode_selfroll", {
			name: 'DF_CHAT_PRIVACY.Bindings.selfroll_name',
			hint: 'DF_CHAT_PRIVACY.Bindings.selfroll_hint',
			// editable: [{ key: 'KeyR', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			onDown: () => $('#dfcp-rt-buttons > button[data-id="selfroll"]').trigger('click')
		});
		game.keybindings.register(SETTINGS.MOD_NAME, "roll-mode_toggle", {
			name: 'DF_CHAT_PRIVACY.Bindings.toggleroll_name',
			hint: 'DF_CHAT_PRIVACY.Bindings.toggleroll_hint',
			// editable: [{ key: 'KeyTilde', modifiers: [] }],
			onDown: () => {
				/**@type {string}*/const current = game.settings.get("core", "rollMode");
				/**@type {string}*/const toggleA = SETTINGS.get(ChatRollPrivacy.#PREF_TOGGLE_A);
				/**@type {string}*/const toggleB = SETTINGS.get(ChatRollPrivacy.#PREF_TOGGLE_B);
				if (current !== toggleA)
					$(`#dfcp-rt-buttons > button[data-id="${toggleA}"]`).trigger('click');
				else
					$(`#dfcp-rt-buttons > button[data-id="${toggleB}"]`).trigger('click');
			}
		});
	}

	static init() {
		SETTINGS.register('enabled', {
			name: 'DF_CHAT_PRIVACY.Settings_EnableTitle',
			hint: 'DF_CHAT_PRIVACY.Settings_EnableHint',
			scope: 'client',
			type: Boolean,
			default: true,
			config: true,
			onChange: UTIL.requestReload
		});
		SETTINGS.register('replace-buttons', {
			name: 'DF_CHAT_PRIVACY.Settings_ReplaceButtonsTitle',
			hint: 'DF_CHAT_PRIVACY.Settings_ReplaceButtonsHint',
			scope: 'client',
			type: Boolean,
			default: true,
			config: true,
			onChange: UTIL.requestReload
		});
		SETTINGS.register(ChatRollPrivacy.#PREF_TOGGLE_A, {
			name: 'DF_CHAT_PRIVACY.Settings_ToggleATitle',
			hint: 'DF_CHAT_PRIVACY.Settings_ToggleAHint',
			type: String,
			choices: {
				publicroll: 'CHAT.RollPublic',
				gmroll: 'CHAT.RollPrivate',
				blindroll: 'CHAT.RollBlind',
				selfroll: 'CHAT.RollSelf'
			},
			default: 'publicroll',
			config: true,
			scope: 'client'
		});
		SETTINGS.register(ChatRollPrivacy.#PREF_TOGGLE_B, {
			name: 'DF_CHAT_PRIVACY.Settings_ToggleBTitle',
			hint: 'DF_CHAT_PRIVACY.Settings_ToggleBHint',
			type: String,
			choices: {
				publicroll: 'CHAT.RollPublic',
				gmroll: 'CHAT.RollPrivate',
				blindroll: 'CHAT.RollBlind',
				selfroll: 'CHAT.RollSelf'
			},
			default: 'selfroll',
			config: true,
			scope: 'client'
		});
	
		if (SETTINGS.get('enabled') === false)
			return;
	
		Hooks.on('renderChatLog', this.#_handleChatLogRendering);
	}


	/**
	 * @param {number} current
	 * @param {number} count
	 * @returns {string}
	 */
	static #calcColour(current, count) {
		return `rgb(${(current / count) * 255},${(1 - (current / count)) * 255},0)`;
	}

	/**
	 * @param {ChatLog} chat
	 * @param {JQuery<HTMLElement>} html
	 * @param {ChatLogData} data
	 * @returns {Promise<void>}
	 */
	static async #_handleChatLogRendering(chat, html, data) {
		const buttons = [];
		const iconKeys = Object.keys(ICONS_FOR_KNOWN_ROLL_TYPES);
		for (let c = 0; c < data.rollModes.length; c++) {
			const rt = data.rollModes[c].value;
			if (!(rt in ICONS_FOR_KNOWN_ROLL_TYPES)) {
				console.warn(Error(`Unknown roll type '${rt}'`));
				continue;
			}
			buttons.push({
				rt: rt,
				name: data.rollModes[rt],
				isGM: game.user.isGM,
				active: data.rollMode === rt,
				icon: ICONS_FOR_KNOWN_ROLL_TYPES[rt],
				colour: ChatRollPrivacy.#calcColour(iconKeys.findIndex(x => x == rt), iconKeys.length)
			});
		}
		const buttonHtml = $(await renderTemplate('modules/df-chat-enhance/templates/privacy-button.hbs', { buttons }));
		buttonHtml.find('button').on('click', function () {
			const rollType = $(this).attr('data-id');
			game.settings.set("core", "rollMode", rollType);
			buttonHtml.find('button.active').removeClass('active');
			$(this).addClass('active');
		});
		html.find('select[name=rollMode]').after(buttonHtml);
		html.find('select[name=rollMode]').remove();
	
		if (!SETTINGS.get('replace-buttons'))
			return;
	
		// Adjust the button container to remove the extra margin since those buttons are now moving in.
		buttonHtml.attr('style', 'margin:0 0 0 0.5em');
	
		// Convert the old <a> tag elements to <button> tags
		let first = true;
		html.find('#chat-controls div.control-buttons a').each(function () {
			const html = $(this).html();
			const classes = $(this).attr('class');
			const title = $(this).attr('title');
			const style = $(this).attr('style');
			const click = $._data(this, 'events')['click'][0].handler;
			const button = $(`<button class="${classes}" title="${title}" style="${style}">${html}</button>`);
			button.on('click', click);
			// Add a small margin between the first button and the RollTypes
			if (first) {
				button.attr('style', 'margin-left:0.5em');
				first = false;
			}
			buttonHtml.append(button);
		});
	
		html.find('#chat-controls div.control-buttons').remove();
	}
}
