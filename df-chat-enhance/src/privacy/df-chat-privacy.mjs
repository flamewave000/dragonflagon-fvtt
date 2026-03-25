/// <reference path="../../../fvtt-scripts/foundry.mjs" />
import SETTINGS from "../../common/Settings.mjs";

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
	/**@readonly*/static #PREF_COLOURIZE_BUTTONS = 'ChatRollPrivacy.ColourizeButtons';
	/**@readonly*/static #PREF_TOGGLE_A = 'ChatRollPrivacy.ToggleA';
	/**@readonly*/static #PREF_TOGGLE_B = 'ChatRollPrivacy.ToggleB';
	/**
	 * @param {string} mode
	 * @returns {HTMLButtonElement} */
	static getBtn(mode) { return document.querySelector(`#roll-privacy>button[data-roll-mode="${mode}"]`); }

	static setup() {
		game.keybindings.register(SETTINGS.MOD_NAME, "roll-mode_publicroll", {
			name: 'DF_CHAT_PRIVACY.Bindings.publicroll_name',
			hint: 'DF_CHAT_PRIVACY.Bindings.publicroll_hint',
			// editable: [{ key: 'KeyQ', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			onDown: () => this.getBtn('publicroll').click()
		});
		game.keybindings.register(SETTINGS.MOD_NAME, "roll-mode_gmroll", {
			name: 'DF_CHAT_PRIVACY.Bindings.privateroll_name',
			hint: 'DF_CHAT_PRIVACY.Bindings.privateroll_hint',
			// editable: [{ key: 'KeyW', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			onDown: () => this.getBtn('gmroll').click()
		});
		game.keybindings.register(SETTINGS.MOD_NAME, "roll-mode_blindroll", {
			name: 'DF_CHAT_PRIVACY.Bindings.blindroll_name',
			hint: 'DF_CHAT_PRIVACY.Bindings.blindroll_hint',
			// editable: [{ key: 'KeyE', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			onDown: () => this.getBtn('blindroll').click()
		});
		game.keybindings.register(SETTINGS.MOD_NAME, "roll-mode_selfroll", {
			name: 'DF_CHAT_PRIVACY.Bindings.selfroll_name',
			hint: 'DF_CHAT_PRIVACY.Bindings.selfroll_hint',
			// editable: [{ key: 'KeyR', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			onDown: () => this.getBtn('selfroll').click()
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
					this.getBtn(toggleA).click();
				else
					this.getBtn(toggleB).click();
			}
		});
	}

	static init() {
		SETTINGS.register(ChatRollPrivacy.#PREF_COLOURIZE_BUTTONS, {
			name: 'DF_CHAT_PRIVACY.Settings_EnableTitle',
			hint: 'DF_CHAT_PRIVACY.Settings_EnableHint',
			scope: 'client',
			type: Boolean,
			default: true,
			config: true,
			onChange: value => {
				document.querySelectorAll("#roll-privacy>button").forEach(btn => btn.classList.toggle('dfce-roll-btn', value));
				if (value)
					Hooks.on('renderChatInput', this.#_handleChatLogRendering);
				else
					Hooks.off('renderChatInput', this.#_handleChatLogRendering);
			}
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

		if (SETTINGS.get(ChatRollPrivacy.#PREF_COLOURIZE_BUTTONS))
			Hooks.on('renderChatInput', this.#_handleChatLogRendering);
	}

	/**
	 * @param {ChatLog} chat
	 * @param {ChatElements} html
	 * @returns {Promise<void>}
	 */
	static async #_handleChatLogRendering(chat, html) {
		const enabled = SETTINGS.get(ChatRollPrivacy.#PREF_COLOURIZE_BUTTONS);
		html["#roll-privacy"].querySelectorAll("button").forEach(btn => btn.classList.toggle('dfce-roll-btn', enabled));
	}
}
