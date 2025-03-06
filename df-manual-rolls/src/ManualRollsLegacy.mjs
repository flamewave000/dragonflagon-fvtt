/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../common/foundry.d.ts" />
/// <reference path="../../common/libWrapper.d.ts" />
/// <reference path="./types.d.ts" />
import ManualRolls from "./ManualRolls.mjs";
import RollPrompt from "./RollPrompt.mjs";
import SETTINGS from "../common/Settings.mjs";

export default class ManualRollsLegacy {
	static PREF_USE_LEGACY = 'use-legacy';

	/**@type {boolean}*/
	static get useLegacy() { return SETTINGS.get(ManualRollsLegacy.PREF_USE_LEGACY); }

	static #pf1HelpersPatched = false;

	static patch() {
		libWrapper.register(SETTINGS.MOD_NAME, 'foundry.dice.terms.DiceTerm.prototype._evaluateSync', this._DiceTerm_evaluateSync, 'MIXED');

		if (this.#pf1HelpersPatched) return;
		this.#pf1HelpersPatched = true;

		/*******************************************************/
		/************** This Code Copied From PF1 **************/
		/*******************************************************/
		Handlebars.registerHelper("itemDamage", (item, rollData) => {
			if (!item.hasDamage) return null; // It was a mistake to call this

			const actorData = item.document.parentActor.data.data,
				itemData = item.data;

			const rv = [];

			const reduceFormula = formula => {
				/******** MODIFIED PORTION START ********/
				let roll;
				try {
					ManualRolls.tempDisable = true;
					roll = RollPF.safeRoll(formula, rollData);
				} finally {
					ManualRolls.tempDisable = false;
				}
				/******** MODIFIED PORTION END ********/
				formula = roll.formula.replace(/\[[^\]]+\]/g, ""); // remove flairs
				return [roll, formula];
			};

			const handleParts = parts => {
				for (const [formula, _] of parts) {
					const [roll, newformula] = reduceFormula(formula);
					if (roll.total == 0) continue;
					rv.push(newformula);
				}
			};

			// Normal damage parts
			handleParts(itemData.damage.parts);

			// Include ability score only if the string isn't too long yet
			const dmgAbl = itemData.ability.damage;
			const dmgAblMod = Math.floor((actorData.abilities[dmgAbl]?.mod ?? 0) * (itemData.ability.damageMult || 1));
			if (dmgAblMod != 0) rv.push(dmgAblMod);

			// Include damage parts that don't happen on crits
			handleParts(itemData.damage.nonCritParts);

			// Include general sources. Item enhancement bonus is among these.
			const sources = item.document.allDamageSources;
			for (const s of sources) rv.push(s.formula);

			if (rv.length === 0) rv.push("NaN"); // Something probably went wrong

			return rv
				.join("+")
				.replace(/\s+/g, "") // remove whitespaces
				.replace(/\+-/, "-") // simplify math logic pt.1
				.replace(/--/g, "+") // simplify math logic pt.2
				.replace(/\+\++/, "+"); // simplify math logic pt.3
		});
		/********************************************************/
		/**************** END OF COPIED PF1 CODE ****************/
		/********************************************************/
	}
	static unpatch() {
		libWrapper.unregister(SETTINGS.MOD_NAME, 'DiceTerm.prototype.roll', false);
	}

	/**
	 * 
	 * @this {DiceTerm}
	 * @param {Function} wrapper
	 * @returns 
	 */
	static _DiceTerm_evaluateSync(wrapper, { minimize, maximize } = { minimize: false, maximize: false }) {
		if ((this.number > 999)) {
			throw new Error(`You may not evaluate a DiceTerm with more than 999 requested results`);
		}

		// ignore min/max rolls
		if (!ManualRolls.shouldRollManually || minimize || maximize)
			return wrapper({ minimize, maximize });

		// if there are no modifiers, display a "total" roll request
		if (this.modifiers.length == 0) {
			const total = ManualRollsLegacy.prompt(this.number, this.faces, this.flavor);
			const results = RollPrompt.distributeRoll(total[0], this.number);
			this.results = results.map(x => { return { result: x, active: true }; });
			if (ManualRolls.flagged && total[1]) {
				this.options.flavor = (this.options.flavor || '') + '[MRT]';
				this.options.isManualRoll = true;
			}
		}
		else {
			const flags = [];
			for (let n = 1; n <= this.number; n++) {
				/**@type { { result: number|undefined, active: boolean } }*/
				const roll = { result: undefined, active: true };
				if (minimize) {
					roll.result = Math.min(1, this.faces);
					flags.push('RN');
				}
				else if (maximize) {
					roll.result = this.faces;
					flags.push('RN');
				}
				else {
					const result = ManualRollsLegacy.prompt(1, this.faces, this.flavor);
					roll.result = result[0];
					flags.push(result[1] ? 'MR' : 'RN');
				}
				this.results.push(roll);
			}
			if (ManualRolls.flagged && flags.some(x => x === 'MR')) {
				this.options.flavor = (this.options.flavor || '') + '[' + flags.join(',') + ']';
				this.options.isManualRoll = true;
			}
		}
		this._evaluateModifiers();
		return this;
	}

	/**
	 * @param {number} number
	 * @param {number} faces
	 * @param {string} flavour
	 * @returns {[number, boolean]}
	 */
	static prompt(number, faces, flavour) {
		let failed = false;
		let result = [0, false];
		const promptText = game.i18n.localize('DF_MANUAL_ROLLS.Prompt.Legacy')
			.dfmr_replaceAll('{0}', number.toString())
			.dfmr_replaceAll('{1}', faces.toString())
			.dfmr_replaceAll('{2}', (number * faces).toString());
		const invalidText = game.i18n.localize('DF_MANUAL_ROLLS.Prompt.Legacy_Invalid');
		while (true) {
			/**@type {string | number}*/
			let value = prompt(promptText + (flavour ? `\n${flavour}` : '') + (failed ? '\n' + invalidText : ''), '');
			if (value === '' || value === null)
				result = [Math.ceil(CONFIG.Dice.randomUniform() * faces), false];
			else {
				value = parseInt(value);
				result = [value, true];
				if (isNaN(value) || value < number || value > number * faces) {
					failed = true;
					continue;
				}
			}
			return result;
		}
	}
}