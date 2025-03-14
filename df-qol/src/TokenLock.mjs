/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../fvtt-scripts/foundry-esm.js" />

import SETTINGS from "../common/Settings.mjs";

export default class TokenLock {
	static get TokenLockFlag() { return 'locked'; }
	static get PREF_ENABLED() { return 'TokenLock.Enabled'; }
	static get PREF_ALLOW_GM() { return 'TokenLock.AllowGM'; }

	/**
	 * @param {TokenDocument} token 
	 * @returns {boolean}
	 */
	static getLocked(token) {
		return token.document.locked ?? false;
	}
	/**
	 * @param {Token} token
	 * @param {boolean} value
	 * @returns {Promise<void>}
	 */
	static setLocked(token, value) {
		return token.document.update({ locked: value });
	}

	/**@type {boolean}*/
	static get enabled() {
		return SETTINGS.get(this.PREF_ENABLED);
	}
	/**@type {boolean}*/
	static get allowGM() {
		return SETTINGS.get(this.PREF_ALLOW_GM);
	}

	static init() {
		SETTINGS.register(this.PREF_ENABLED, {
			name: 'DF_QOL.TokenLock.Setting.EnableName',
			hint: "DF_QOL.TokenLock.Setting.EnableHint",
			config: true,
			scope: 'world',
			type: Boolean,
			default: true,
			onChange: (/**@type {boolean}*/x) => {
				this._registerHook(x);
			}
		});
		SETTINGS.register(this.PREF_ALLOW_GM, {
			name: 'DF_QOL.TokenLock.Setting.AllowGMName',
			hint: 'DF_QOL.TokenLock.Setting.AllowGMHint',
			config: true,
			scope: 'world',
			type: Boolean,
			default: true
		});
	}

	static ready() {
		this._registerHook(this.enabled);
	}

	static _registerHook(/**@type {boolean}*/ enabled) {
		if (!game.user.isGM) return;
		if (enabled) Hooks.on('renderTokenHUD', this._renderTokenHUD);
		else Hooks.off('renderTokenHUD', this._renderTokenHUD);
	}

	static _renderTokenHUD(/**@type {TokenHUD}*/ app, /**@type {JQuery<HTMLElement>}*/ html, _data) {
		const toggle = $(`<div class="control-icon${TokenLock.getLocked(app.object) ? ' active' : ''}" data-action="lock">
<img src="icons/svg/padlock.svg" width="36" height="36" title="${game.i18n.localize('DF_QOL.TokenLock.LockTitle')}">
</div>`);
		toggle.on('click', async (e) => {
			const element = $(e.currentTarget);
			const locked = !element.hasClass('active');
			// If we have only one token selected, just do a regular setFlag call
			if (canvas.tokens.controlled.length == 1)
				await TokenLock.setLocked(app.object, locked);
			else {
				// Aggregate token update data
				const data = canvas.tokens.controlled
					// Only update tokens that are different than what we are trying to set the rest to
					.filter((x) => TokenLock.getLocked(x) != locked)
					// Create the update data for each token
					.map(x => ({ _id: x.id, locked: locked }));
				// Perform Batch Update
				await canvas.scene.updateEmbeddedDocuments("Token", data);
			}
			element.toggleClass('active');
		});
		html.find('div.col.right').prepend(toggle);
	}
}