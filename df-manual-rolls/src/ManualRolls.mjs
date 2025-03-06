/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../common/foundry.d.ts" />
/// <reference path="../../common/libWrapper.d.ts" />
/// <reference path="./types.d.ts" />

import RollPrompt from "./RollPrompt.mjs";
import SETTINGS from "../common/Settings.mjs";

String.prototype.dfmr_replaceAll = function (token, replacement) { return this.split(token).join(replacement); };

export default class ManualRolls {
	static PREF_GM_STATE = 'gm';
	static PREF_PC_STATE = 'pc';
	static PREF_FLAGGED = 'flagged';
	static PREF_TOGGLED = 'toggled';
	static FLAG_ROLL_TYPE = 'roll-type';

	/**@type {boolean}*/
	static get flagged() { return SETTINGS.get(ManualRolls.PREF_FLAGGED); }
	/**@type {boolean}*/
	static get toggled() { return SETTINGS.get(ManualRolls.PREF_TOGGLED); }
	/**
	 * @param {boolean} value 
	 * @returns {Promise<boolean>}
	 */
	static setToggled(value) { return SETTINGS.set(ManualRolls.PREF_TOGGLED, value); }
	static get toggleable() {
		return (game.user.getFlag(SETTINGS.MOD_NAME, ManualRolls.FLAG_ROLL_TYPE) || SETTINGS.get(game.user.isGM ? ManualRolls.PREF_GM_STATE : ManualRolls.PREF_PC_STATE)) === 'toggle';
	}
	static tempDisable = false;
	static get shouldRollManually() {
		const state = game.user.getFlag(SETTINGS.MOD_NAME, ManualRolls.FLAG_ROLL_TYPE) || SETTINGS.get(game.user.isGM ? ManualRolls.PREF_GM_STATE : ManualRolls.PREF_PC_STATE);
		return !this.tempDisable && (state === 'always' || (state === 'toggle' && this.toggled));
	}

	static patch() {
		libWrapper.register(SETTINGS.MOD_NAME, 'Roll.prototype._evaluate', this.#_Roll_evaluate, 'MIXED');
		libWrapper.register(SETTINGS.MOD_NAME, 'foundry.dice.terms.DiceTerm.prototype._evaluate', this.#_DiceTerm_evaluate, 'MIXED');
	}
	static unpatch() {
		libWrapper.unregister(SETTINGS.MOD_NAME, 'Roll.prototype._identifyTerms', false);
		libWrapper.unregister(SETTINGS.MOD_NAME, 'foundry.dice.terms.DiceTerm.prototype._evaluate', false);
	}

	/**
	 * @this {Roll}
	 * @param {Function} wrapper
	 * @returns {Promise<Roll>}
	 */
	static async #_Roll_evaluate(wrapper, { minimize , maximize } = { minimize: false, maximize: false}) {
		// Ignore Min/Max requests and if we are disabled
		if (!ManualRolls.shouldRollManually || minimize || maximize) {
			return wrapper({ minimize, maximize });
		}

		/****** THIS IS CAPTURED DIRECTLY FROM Roll.prototype._evaluate ******/
		// Step 1 - Replace intermediate terms with evaluated numbers
		const intermediate = [];
		for (const element of this.terms) {
			let term = element;
			if (!(term instanceof foundry.dice.terms.RollTerm)) {
				throw new Error("Roll evaluation encountered an invalid term which was not a RollTerm instance");
			}
			if (term.isIntermediate) {
				await term.evaluate({ minimize, maximize, async: true });
				this._dice = this._dice.concat(term.dice);
				term = new NumericTerm({ number: term.total, options: term.options });
			}
			intermediate.push(term);
		}
		this.terms = intermediate;

		// Step 2 - Simplify remaining terms
		this.terms = this.constructor.simplifyTerms(this.terms);

		/****** DF MANUAL ROLLS MODIFICATION ******/
		// @ts-ignore
		const rollPrompt = new RollPrompt({}, this.options.flavor ? { title: this.options.flavor } : {});

		for (const term of this.terms) {
			if (!(term instanceof foundry.dice.terms.DiceTerm)) continue;
			term.rollPrompt = rollPrompt;
		}

		// Step 3 - Evaluate remaining terms
		/**@type {Promise<foundry.dice.terms.RollTerm>[]}*/
		const promises = [];
		for (const term of this.terms) {
			// @ts-ignore
			if (term._evaluated) continue;
			promises.push(term.evaluate({ minimize, maximize, async: true }));
		}
		await rollPrompt.render(true);
		await Promise.all(promises);
		/************ END MODIFICATION ************/

		// Step 4 - Evaluate the final expression
		this._total = this._evaluateTotal();
		return this;
		/****** END OF CAPTURE ******/
	}

	/**
	 * 
	 * @this {foundry.dice.terms.DiceTerm}
	 * @param {Function} wrapper
	 * @returns {Promise<foundry.dice.terms.DiceTerm>}
	 */
	static async #_DiceTerm_evaluate(wrapper, { minimize, maximize } = {minimize: false, maximize: false}) {
		/**@type {RollPrompt}*/
		const rollPrompt = this.rollPrompt;
		// Ignore Min/Max requests, if we are disabled, or if this dice term does not have a bound DFRollPrompt
		if (!ManualRolls.shouldRollManually || !rollPrompt || minimize || maximize)
			return wrapper(minimize, maximize);
		const results = await rollPrompt.requestResult(this);
		for (const x of results) this.results.push({ result: x, active: true });
		this._evaluateModifiers();
		return this;
	}
}
