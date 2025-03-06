/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../common/foundry.d.ts" />
/// <reference path="../../common/libWrapper.d.ts" />
/// <reference path="./types.d.ts" />
import ManualRolls from "./ManualRolls.mjs";
import SETTINGS from "../common/Settings.mjs";

const BRACES = [];

export default class RollPrompt extends FormApplication {
	/**@readonly*/static PREF_FOCUS_INPUT = 'focus-input';

	/**@type {RollPromptData[]}*/
	#_terms = [];
	#_nextId = 0;
	#_rolled = false;

	/**@type {boolean}*/
	static get focusInput() { return SETTINGS.get(RollPrompt.PREF_FOCUS_INPUT); }

	/**@type {FormApplicationOptions}*/
	static get defaultOptions() {
		return foundry.utils.mergeObject(
			FormApplication.defaultOptions,
			{
				title: game.i18n.localize("DF_MANUAL_ROLLS.Prompt.DefaultTitle"),
				template: `modules/${SETTINGS.MOD_NAME}/templates/roll-prompt.hbs`,
				width: 400,
			});
	}

	constructor(...args) {
		super(...args);
		if (BRACES.length > 0) return;
		if (!game.dnd5e) {
			BRACES.push('[');
			BRACES.push(']');
		} else {
			BRACES.push('(');
			BRACES.push(')');
		}
	}

	/**
	 * @param {Application.RenderOptions} [_options]
	 * @returns { { terms: RenderData[] } }
	 */
	getData(_options) {
		/**@type {RenderData[]}*/
		const data = [];
		for (const term of this.#_terms) {
			const die = term.term;
			for (let c = 0; c < die.number; c++) {
				data.push({
					id: term.id.toString(),
					idx: c,
					faces: c == 0 ? `${die.number}d${die.faces}${die.modifiers.length > 0 ? ' ' + BRACES[0] + die.modifiers.join(',') + BRACES[1] : ''}` : '',
					hasTotal: c == 0 && die.modifiers.length == 0 && die.number > 1,
					term: die
				});
			}
		}
		return { terms: data };
	}
	/**
	 * @param {FormApplication.CloseOptions} [options]
	 * @returns {Promise<void>}
	 */
	close(options) {
		// If we have not actually rolled anything yet, we need to resolve these with RNG values
		if (!this.#_rolled) {
			this.#_rolled = true;
			for (const x of this.#_terms) {
				/**@type {number[]}*/
				const results = [];
				for (let c = 0; c < x.term.number; c++) {
					results.push(Math.ceil(CONFIG.Dice.randomUniform() * x.term.faces));
				}
				x.res(results);
			}
		}
		return super.close(options);
	}
	/**
	 * @param {boolean} [force]
	 * @param {Application.RenderOptions} [options]
	 * @returns {Promise}
	 */
	render(force, options) {
		if (this.#_terms.length == 0) return;
		return super.render(force, options);
	}
	/**
	 * @param {boolean} [force]
	 * @param {ApplicationOptions} [options]
	 */
	async _render(force, options) {
		await super._render(force, options);
		if (RollPrompt.focusInput)
			this.element.find('input')[0].focus();
	}

	/**
	 * @protected
	 * @param {Event} _
	 * @param { { [key: string]: string | null } } [formData]
	 * @returns {Promise<unknown>}
	 */
	_updateObject(_, formData) {
		for (const x of this.#_terms) {
			/**@type {number[]}*/
			const results = [];
			const total = formData[`${x.id}-total`];
			// If a total input was defined and given, it overrides everything else.
			if (total !== undefined && total !== null) {
				const value = parseInt(total);
				results.push(...RollPrompt.distributeRoll(value, x.term.number));
				if (ManualRolls.flagged) {
					x.term.options.flavor = (x.term.options.flavor || '') + BRACES[0] + 'MRT' + BRACES[1];
					x.term.options.isManualRoll = true;
				}
			} else {
				const flags = [];
				for (let c = 0; c < x.term.number; c++) {
					const roll = formData[`${x.id}-${c}`];
					let value = parseInt(roll);
					if (isNaN(value)) {
						value = Math.ceil(CONFIG.Dice.randomUniform() * x.term.faces);
						flags.push('RN');
					} else {
						flags.push('MR');
						x.term.options.isManualRoll = true;
					}
					results.push(value);
				}
				if (ManualRolls.flagged && flags.some(x => x === 'MR')) {
					x.term.options.flavor = (x.term.options.flavor || '') + BRACES[0] + flags.join(',') + BRACES[1];
					x.term.options.isManualRoll = true;
				}
			}
			x.res(results);
		}
		this.#_rolled = true;
		return undefined;
	}

	/**
	 * @param {foundry.dice.terms.DiceTerm} term
	 * @returns {Promise<number[]>}
	 */
	requestResult(term) {
		return new Promise((res, _) => this.#_terms.push({ id: this.#_nextId++, res, term }));
	}

	/**
	 * @param {number} total
	 * @param {number} count
	 * @returns {number[]}
	 */
	static distributeRoll(total, count) {
		/**@type {number[]}*/
		const results = [];
		// If a total input was defined and given, it overrides everything else.
		let base = 0;
		// Append dice with the base average of the total.
		for (let c = 0; c < count - 1; c++) {
			base = Math.ceil(total / (count - results.length));
			total -= base;
			results.push(base);
		}
		results.push(total);
		return results;
	}
}