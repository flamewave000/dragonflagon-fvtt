import SETTINGS from './libs/Settings.js';

export default class TokenLock {
	private static readonly TokenLockFlag = 'locked';
	private static readonly PREF_ENABLED = 'TokenLock.Enabled';
	private static readonly PREF_ALLOW_GM = 'TokenLock.AllowGM';

	static getLocked(token: any): boolean {
		return token.getFlag(SETTINGS.MOD_NAME, TokenLock.TokenLockFlag);
	}
	static setLocked(token: any, value: boolean): Promise<unknown> {
		return token.setFlag(SETTINGS.MOD_NAME, TokenLock.TokenLockFlag, value);
	}

	private static get enabled(): Boolean {
		return SETTINGS.get(this.PREF_ENABLED);
	}
	private static get allowGM(): Boolean {
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
			onChange: x => {
				this._registerPatch(x);
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
		this._registerPatch(this.enabled);
	}

	static ready() {
		this._registerHook(this.enabled);
	}

	private static _registerPatch(enabled: Boolean) {
		if (enabled) {
			libWrapper.register(SETTINGS.MOD_NAME, 'Token.prototype._canDrag', function (this: any, wrapped: Function, ...args: any) {
				return wrapped(...args) && ((TokenLock.allowGM && game.user.isGM) || !TokenLock.getLocked(this.document));
			}, 'WRAPPER');
			libWrapper.register(SETTINGS.MOD_NAME, 'TokenLayer.prototype.moveMany', async function (this: any, wrapped: Function, data: any) {
				const ids = data.ids instanceof Array ? data.ids : this.controlled.filter((o: any) => !o.data.locked).map((o: any) => o.id);
				data.ids = ids.filter((x: string) => {
					return !TokenLock.getLocked((<any>canvas).tokens.documentCollection.get(x)) ||
						(TokenLock.allowGM && game.user.isGM);
				});
				return wrapped(data)
			}, 'WRAPPER');
		}
		else {
			libWrapper.unregister(SETTINGS.MOD_NAME, 'Token.prototype._canDrag', false);
			libWrapper.unregister(SETTINGS.MOD_NAME, 'TokenLayer.prototype.moveMany', false);
		}
	}
	private static _registerHook(enabled: Boolean) {
		if (!game.user.isGM) return;
		if (enabled) Hooks.on('renderTokenHUD', this._renderTokenHUD);
		else Hooks.off('renderTokenHUD', this._renderTokenHUD);
	}

	private static _renderTokenHUD(app: TokenHUD, html: JQuery<HTMLElement>, data: any) {
		const toggle = $(`<div class="control-icon${TokenLock.getLocked((<any>app.object).document) ? ' active' : ''}" data-action="lock">
<img src="icons/svg/padlock.svg" width="36" height="36" title="${game.i18n.localize('DF_WOL.TokenLock.LockTitle')}">
</div>`);
		toggle.on('click', async (e) => {
			const element = $(e.currentTarget);
			const locked = !element.hasClass('active');
			// If we have only one token selected, just do a regular setFlag call
			if (canvas.tokens.controlled.length == 1)
				await TokenLock.setLocked((<any>app).object.document, locked);
			else {
				// Aggregate token update data
				const data = canvas.tokens.controlled
					// Only update tokens that are different than what we are trying to set the rest to
					.filter((x: any) => TokenLock.getLocked(x.document) != locked)
					// Create the update data for each token
					.map(x => {
						return {
							_id: x.data._id,
							flags: { 'df-qol': { locked } }
						}
					});
				// Perform Batch Update
				await (<any>canvas).scene.updateEmbeddedDocuments("Token", data);
			}
			element.toggleClass('active');
		});
		html.find('div.col.right').prepend(toggle);
	}
}