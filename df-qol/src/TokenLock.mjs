import SETTINGS from "../common/Settings.mjs";

export default class TokenLock {
	private static readonly TokenLockFlag = 'locked';
	private static readonly PREF_ENABLED = 'TokenLock.Enabled';
	private static readonly PREF_ALLOW_GM = 'TokenLock.AllowGM';

	static getLocked(token: TokenDocument): boolean {
		return <boolean>token.getFlag(SETTINGS.MOD_NAME, TokenLock.TokenLockFlag);
	}
	static setLocked(token: any, value: boolean): Promise<void> {
		return token.setFlag(SETTINGS.MOD_NAME, TokenLock.TokenLockFlag, value);
	}

	private static get enabled(): boolean {
		return SETTINGS.get(this.PREF_ENABLED);
	}
	private static get allowGM(): boolean {
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
			onChange: (x: boolean) => {
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

	private static _registerPatch(enabled: boolean) {
		if (enabled) {
			libWrapper.register(SETTINGS.MOD_NAME, 'Token.prototype._canDrag', function (this: any, wrapped: AnyFunction, ...args: any) {
				return wrapped(...args) && ((TokenLock.allowGM && game.user.isGM) || !TokenLock.getLocked(this.document));
			}, 'WRAPPER');

			libWrapper.register(SETTINGS.MOD_NAME, 'Token.prototype._onDragLeftStart', async function (this: Token, wrapped: (event: any) => any, event: PIXI.InteractionEvent) {
				// This is a little hack that tricks the wrapped function into thinking locked tokens are already being "dragged" and therefore should not be modified
				this.layer.controlled.forEach(x => {
					if (x.dfQolLocked !== undefined) return;
					x.dfQolLocked = x.document.locked;
					x.document.locked = TokenLock.getLocked(x.document) && !(TokenLock.allowGM && game.user.isGM);
				});
				const result = wrapped(event);
				this.layer.controlled.forEach(x => {
					if (x.dfQolLocked === undefined) return;
					x.document.locked = x.dfQolLocked;
					delete x.dfQolLocked;
				});
				return result;
			}, 'WRAPPER');
		}
		else {
			libWrapper.unregister(SETTINGS.MOD_NAME, 'Token.prototype._canDrag', false);
			libWrapper.unregister(SETTINGS.MOD_NAME, 'TokenLayer.prototype.moveMany', false);
		}
	}
	private static _registerHook(enabled: boolean) {
		if (!game.user.isGM) return;
		if (enabled) Hooks.on('renderTokenHUD', this._renderTokenHUD);
		else Hooks.off('renderTokenHUD', this._renderTokenHUD);
	}

	private static _renderTokenHUD(app: TokenHUD, html: JQuery<HTMLElement>, _data: any) {
		const toggle = $(`<div class="control-icon${TokenLock.getLocked((<any>app.object).document) ? ' active' : ''}" data-action="lock">
<img src="icons/svg/padlock.svg" width="36" height="36" title="${game.i18n.localize('DF_QOL.TokenLock.LockTitle')}">
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
					.map(x => ({
						_id: x.data._id,
						flags: { 'df-qol': { locked } }
					}));
				// Perform Batch Update
				await (<any>canvas).scene.updateEmbeddedDocuments("Token", data);
			}
			element.toggleClass('active');
		});
		html.find('div.col.right').prepend(toggle);
	}
}