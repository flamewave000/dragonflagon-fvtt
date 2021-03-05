
declare global {
	interface String {
		replaceAll(token: string, replacement: string): string;
	}
	interface DiceTerm {
		dfManualRolls_flavor: string;
		dfManualRolls_result: number;
		dfManualRolls_roll({ minimize, maximize }?: { minimize: boolean; maximize: boolean }): DiceTerm.Result;
	}
	class DnD5eDice {
		get d20Roll(): (args: { parts: Array<string> }) => Promise<any>;
		set d20Roll(value: (args: { parts: Array<string> }) => Promise<any>);
		get damageRoll(): (args: { parts: Array<string> }) => Promise<any>;
		set damageRoll(value: (args: { parts: Array<string> }) => Promise<any>);
		dfManualRolls_dr: (args: { parts: Array<string> }) => Promise<any>;
		dfManualRolls_d20: (args: { parts: Array<string> }) => Promise<any>;
	}
	interface Game {
		dnd5e?: { dice: DnD5eDice };
	}
	interface Roll {
		dfManualRolls_identifyTerms(formula: string, { step }: { step: number }): Roll.Terms;
	}
}
String.prototype.replaceAll = function (token: string, replacement: string) { return this.split(token).join(replacement); };

export default class DFManualRolls {
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
		Roll.prototype.roll = function () {
			console.log(this);
			return this.evaluate();
		}
		Roll.prototype.dfManualRolls_identifyTerms = (Roll.prototype as any)._identifyTerms;
		(Roll.prototype as any)._identifyTerms = function (formula: string, { step }: { step: number } = { step: 0 }) {
			const terms: Roll.Terms = this.dfManualRolls_identifyTerms(formula, { step });
			for(let term of terms) {
				if(term instanceof DiceTerm)
					term.dfManualRolls_flavor = this.data.flavor || this.data.title;
			}
			return terms;
		}
		DiceTerm.prototype.dfManualRolls_roll = DiceTerm.prototype.roll;
		DiceTerm.prototype.roll = function ({ minimize, maximize } = { minimize: false, maximize: false }) {
			if (maximize) {
				const roll = { result: this.faces, active: true };
				this.results.push(roll);
				return roll;
			}
			console.log(this);
			var value;
			var message = null;
			var flavour = (this.dfManualRolls_flavor) ? this.dfManualRolls_flavor + '\n\n' : '';
			var result;
			while (true) {
				try {
					value = prompt(message || flavour + game.i18n.localize("DF_MANUAL_ROLLS.Prompt").replaceAll('{d}', this.faces.toString()));
				} catch (err) {
					ui.notifications.error(game.i18n.localize("DF_MANUAL_ROLLS.FVTTAppError"));
					return this.dfManualRolls_roll({ minimize, maximize });
				}
				// If the user hits Cancel and wants to rollback to Foundry's Roller
				if (value == null && DFManualRolls.rollback)
					return this.dfManualRolls_roll({ minimize: minimize, maximize: maximize });
				result = parseInt(value);
				// Validate we were given an Integer in the set N∩[1,n]
				if (!isNaN(value as any) && !isNaN(result) && result >= 1 && result <= this.faces)
					break;
				if (!message)
					message = game.i18n.localize("DF_MANUAL_ROLLS.PromptInvalid").replaceAll('{d}', this.faces.toString());
			}
			result = parseInt(value);
			// if (minimize) result = Math.min(1, this.faces);
			if (maximize) result = this.faces;
			this.dfManualRolls_result = result;
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