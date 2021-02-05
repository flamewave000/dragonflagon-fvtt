String.prototype.replaceAll = function(token, replacement) { return this.split(token).join(replacement); };
class DFManualRolls {
	static MODULE = 'df-manual-rolls';
	static ENABLED = 'manual-rolls-enabled';
	static FORCED = 'manual-rolls-forced';
	static FLAGGED = 'manual-rolls-flagged';
	static ROLLBACK = 'manual-rolls-rollback';

	static get enabled() { return game.settings.get(DFManualRolls.MODULE, DFManualRolls.ENABLED); }
	static get forced() { return game.settings.get(DFManualRolls.MODULE, DFManualRolls.FORCED); }
	static get flagged() { return game.settings.get(DFManualRolls.MODULE, DFManualRolls.FLAGGED); }
	static get rollback() { return game.settings.get(DFManualRolls.MODULE, DFManualRolls.ROLLBACK); }

	static patch() {
		if (!!DiceTerm.prototype.dfManualRolls_roll) return;
		DiceTerm.prototype.dfManualRolls_roll = DiceTerm.prototype.roll;
		DiceTerm.prototype.roll = function ({ minimize = false, maximize = false } = {}) {
			if(maximize) {
				const roll = { result: this.faces, active: true };
				this.results.push(roll);
				return roll;
			}
			var value;
			var message = null;
			var result;
			while (true) {
				value = prompt(message || game.i18n.localize("DF_MANUAL_ROLLS.Prompt").replaceAll('{d}', this.faces));
				// If the user hits Cancel and wants to rollback to Foundry's Roller
				if (value == null && DFManualRolls.rollback)
					return this.dfManualRolls_roll({ minimize: minimize, maximize: maximize });
				result = parseInt(value);
				// Validate we were given an Integer in the set N∩[1,n]
				if (!isNaN(value) && !isNaN(result) && result >= 1 && result <= this.faces)
					break;
				if (!message)
					message = game.i18n.localize("DF_MANUAL_ROLLS.PromptInvalid").replaceAll('{d}', this.faces);
			}
			result = parseInt(value);
			// if (minimize) result = Math.min(1, this.faces);
			if (maximize) result = this.faces;
			this.DFManualRolls_result = result;
			const roll = { result, active: true };
			this.results.push(roll);
			return roll;
		}
	}
	static unpatch() {
		if (!DiceTerm.prototype.dfManualRolls_roll) return;
		DiceTerm.prototype.roll = DiceTerm.prototype.dfManualRolls_roll;
		delete DiceTerm.prototype.dfManualRolls_roll;
	}
}

Hooks.on('init', function () {
	game.settings.register(DFManualRolls.MODULE, DFManualRolls.FORCED, {
		name: "DF_MANUAL_ROLLS.Settings_Force_Title",
		hint: "DF_MANUAL_ROLLS.Settings_Force_Hint",
		scope: 'world',
		config: true,
		type: Boolean,
		default: false,
		onChange: async _ => await Dialog.confirm({
			title: game.i18n.localize("DF_MANUAL_ROLLS.Reload_Title"),
			content: `<p>${game.i18n.localize("DF_MANUAL_ROLLS.Reload_Content")}</p>`,
			yes: () => window.location.reload(),
			no: () => { },
			defaultYes: true
		})
	});
	game.settings.register(DFManualRolls.MODULE, DFManualRolls.FLAGGED, {
		name: "DF_MANUAL_ROLLS.Settings_Flagged_Title",
		hint: "DF_MANUAL_ROLLS.Settings_Flagged_Hint",
		scope: 'world',
		config: true,
		type: Boolean,
		default: false
	});
	if (!DFManualRolls.forced) {
		game.settings.register(DFManualRolls.MODULE, DFManualRolls.ENABLED, {
			name: "DF_MANUAL_ROLLS.Settings_Enabled_Title",
			hint: "DF_MANUAL_ROLLS.Settings_Enabled_Hint",
			scope: 'client',
			config: true,
			type: Boolean,
			default: true,
			onChange: value => {
				if (value || DFManualRolls.forced) DFManualRolls.patch();
				else DFManualRolls.unpatch();
			}
		});
		game.settings.register(DFManualRolls.MODULE, DFManualRolls.ROLLBACK, {
			name: "DF_MANUAL_ROLLS.Settings_Rollback_Title",
			hint: "DF_MANUAL_ROLLS.Settings_Rollback_Hint",
			scope: 'client',
			config: true,
			type: Boolean,
			default: true
		});
	}
});
Hooks.on('ready', function () {
	if (DFManualRolls.enabled || DFManualRolls.forced)
		DFManualRolls.patch();
});

Hooks.on('createChatMessage', async (chatMessage) => {
	if (!chatMessage.isRoll || !DFManualRolls.flagged || !(DFManualRolls.enabled || DFManualRolls.forced)) return;
	var flavor = game.i18n.localize("DF_MANUAL_ROLLS.Flag");
	if(!!chatMessage.data.flavor)
		flavor += " " + chatMessage.data.flavor;
	await chatMessage.update({ flavor: flavor });
});