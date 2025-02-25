/// <reference path="../../../fvtt-scripts/foundry.js" />
import SETTINGS from "../../common/Settings.mjs";
import UTIL from "../Util.mjs";

/**@type { {[key: string]:string;publicroll:string;gmroll:string;blindroll:string;selfroll:string;} }*/
const ICONS_FOR_KNOWN_ROLL_TYPES = {
	publicroll: 'fas fa-dice-d20',
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
	static setup() {
		game.keybindings.register(SETTINGS.MOD_NAME, "roll-mode.publicroll", {
			name: 'Public Roll',
			editable: [{ key: 'KeyQ', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			namespace: 'Roll Type Shortcuts',
			onDown: () => {
				$('#dfcp-rt-buttons > button[data-id="publicroll"]').trigger('click');
			}
		});
		game.keybindings.register(SETTINGS.MOD_NAME, "roll-mode.gmroll", {
			name: 'Private GM Roll',
			editable: [{ key: 'KeyW', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			namespace: 'Roll Type Shortcuts',
			onDown: () => {
				$('#dfcp-rt-buttons > button[data-id="gmroll"]').trigger('click');
			}
		});
		game.keybindings.register(SETTINGS.MOD_NAME, "roll-mode.blindroll", {
			name: 'Blind GM Roll',
			editable: [{ key: 'KeyE', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			namespace: 'Roll Type Shortcuts',
			onDown: () => {
				$('#dfcp-rt-buttons > button[data-id="blindroll"]').trigger('click');
			}
		});
		game.keybindings.register(SETTINGS.MOD_NAME, "roll-mode.selfroll", {
			name: 'Self Roll',
			editable: [{ key: 'KeyR', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			namespace: 'Roll Type Shortcuts',
			onDown: () => {
				$('#dfcp-rt-buttons > button[data-id="selfroll"]').trigger('click');
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
