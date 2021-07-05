import DFManualRolls from "./DFManualRolls.js";
import DFRollPrompt from "./DFRollPrompt.js";
import SETTINGS from "./lib/Settings.js";


export default class DFManualRollsLegacy {
	static PREF_USE_LEGACY = 'use-legacy';

	static get useLegacy(): boolean { return SETTINGS.get(DFManualRollsLegacy.PREF_USE_LEGACY); }

	static patch() {
		libWrapper.register(SETTINGS.MOD_NAME, 'DiceTerm.prototype._evaluateSync', this._DiceTerm_evaluateSync, 'MIXED');
	}
	static unpatch() {
		libWrapper.unregister(SETTINGS.MOD_NAME, 'DiceTerm.prototype.roll', false);
	}

	static _DiceTerm_evaluateSync(this: DiceTerm, wrapper: Function, { minimize = false, maximize = false } = {}) {
		if ((this.number > 999)) {
			throw new Error(`You may not evaluate a DiceTerm with more than 999 requested results`);
		}

		// ignore min/max rolls
		if (!DFManualRolls.shouldRollManually || minimize || maximize)
			return wrapper({ minimize, maximize });

		// if there are no modifiers, display a "total" roll request
		if (this.modifiers.length == 0) {
			const total = DFManualRollsLegacy.prompt(this.number, this.faces, this.flavor);
			const results = DFRollPrompt.distributeRoll(total[0], this.number);
			this.results = results.map(x => { return { result: x, active: true } });
			if (DFManualRolls.flagged && total[1]) {
				this.options.flavor = (this.options.flavor || '') + '[MRT]';
				(<any>this.options).isManualRoll = true;
			}
		}
		else {
			const flags = [];
			for (let n = 1; n <= this.number; n++) {
				const roll: { result: number, active: boolean } = { result: undefined, active: true };
				if (minimize) {
					roll.result = Math.min(1, this.faces);
					flags.push('RN');
				}
				else if (maximize) {
					roll.result = this.faces;
					flags.push('RN');
				}
				else {
					const result = DFManualRollsLegacy.prompt(1, this.faces, this.flavor)
					roll.result = result[0];
					flags.push(result[1] ? 'MR' : 'RN');
				}
				this.results.push(roll);
			}
			if (DFManualRolls.flagged && flags.some(x => x === 'MR')) {
				this.options.flavor = (this.options.flavor || '') + '[' + flags.join(',') + ']';
				(<any>this.options).isManualRoll = true;
			}
		}
		this._evaluateModifiers();
		return this;
	}

	static prompt(number: number, faces: number, flavour: string): [number, boolean] {
		var failed = false;
		var result: [number, boolean] = [0, false];
		const promptText = game.i18n.localize('DF_MANUAL_ROLLS.Prompt_Legacy')
			.replaceAll('{0}', number.toString())
			.replaceAll('{1}', faces.toString())
			.replaceAll('{2}', (number * faces).toString());
		const invalidText = game.i18n.localize('DF_MANUAL_ROLLS.Prompt_Legacy_Invalid');
		while (true) {
			var value: string | number =
				prompt(promptText + (!!flavour ? `\n${flavour}` : '') + (failed ? '\n' + invalidText : ''), '');
			if (value === '' || value === null)
				result = [Math.ceil(CONFIG.Dice.randomUniform() * faces), false];
			else {
				value = parseInt(value);
				result = [value, true];
				if (isNaN(<number>value) || value < number || value > number * faces) {
					failed = true;
					continue;
				}
			}
			return result;
		}
	}
}