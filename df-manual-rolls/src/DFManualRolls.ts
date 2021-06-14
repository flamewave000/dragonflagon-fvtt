import DFRollPrompt from "./DFRollPrompt.js";
import SETTINGS from "./lib/Settings.js";

declare global {
	interface String {
		replaceAll(token: string, replacement: string): string;
	}
}
String.prototype.replaceAll = function (token: string, replacement: string) { return this.split(token).join(replacement); };

export default class DFManualRolls {
	static GM_STATE = 'gm';
	static PC_STATE = 'pc';
	static FLAGGED = 'flagged';
	static TOGGLED = 'toggled';

	// static get gmState() { return SETTINGS.get(DFManualRolls.GM_STATE); }
	// static get pcState() { return SETTINGS.get(DFManualRolls.PC_STATE); }
	static get flagged() { return SETTINGS.get(DFManualRolls.FLAGGED); }
	static get toggled() { return SETTINGS.get(DFManualRolls.TOGGLED); }
	static setToggled(value: boolean): Promise<boolean> { return SETTINGS.set(DFManualRolls.TOGGLED, value); }
	static get shouldRollManually() {
		const state = SETTINGS.get(game.user.isGM ? DFManualRolls.GM_STATE : DFManualRolls.PC_STATE);
		return state === 'always' || (state === 'toggle' && this.toggled);
	}

	static patch() {
		libWrapper.register(SETTINGS.MOD_NAME, 'Roll.prototype._evaluate',
			async function (this: Roll, wrapper: Function, { minimize = false, maximize = false } = {}): Promise<Roll> {
				// Ignore Min/Max requests and if we are disabled
				if (!DFManualRolls.shouldRollManually || minimize || maximize) {
					return wrapper({ minimize, maximize });
				}

				/****** THIS IS CAPTURED DIRECTLY FROM Roll.prototype._evaluate ******/
				// Step 1 - Replace intermediate terms with evaluated numbers
				const intermediate = [];
				for (let element of this.terms) {
					var term: any = element;
					if (!(term instanceof RollTerm)) {
						throw new Error("Roll evaluation encountered an invalid term which was not a RollTerm instance");
					}
					if (term.isIntermediate) {
						await term.evaluate({ minimize, maximize, async: true });
						this._dice = this._dice.concat((<any>term).dice);
						term = new NumericTerm({ number: term.total, options: (<any>term).options });
					}
					intermediate.push(term);
				}
				this.terms = intermediate;

				// Step 2 - Simplify remaining terms
				this.terms = Roll.simplifyTerms(this.terms);

				/****** DF MANUAL ROLLS MODIFICATION ******/
				const rollPrompt = new DFRollPrompt({}, !!this.options.flavor ? { title: this.options.flavor } : {});

				for (let term of this.terms) {
					if (!(term instanceof DiceTerm)) continue;
					(<any>term).rollPrompt = rollPrompt;
				}

				// Step 3 - Evaluate remaining terms
				const promises: Promise<RollTerm>[] = [];
				for (let term of this.terms) {
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
			}, 'MIXED');

		libWrapper.register(SETTINGS.MOD_NAME, 'DiceTerm.prototype._evaluate',
			async function (this: DiceTerm, wrapper: Function, { minimize = false, maximize = false } = {}): Promise<DiceTerm> {
				const rollPrompt: DFRollPrompt = (<any>this).rollPrompt;
				// Ignore Min/Max requests, if we are disabled, or if this dice term does not have a bound DFRollPrompt
				if (!DFManualRolls.shouldRollManually || !rollPrompt || minimize || maximize)
					return wrapper(minimize, maximize);
				const results = await rollPrompt.requestResult(this);
				for (let x of results) this.results.push({ result: x, active: true })
				this._evaluateModifiers();
				return this;
			}, 'MIXED');
	}
	static unpatch() {
		libWrapper.unregister(SETTINGS.MOD_NAME, 'Roll.prototype._identifyTerms', false);
		libWrapper.unregister(SETTINGS.MOD_NAME, 'DiceTerm.prototype.roll', false);
	}
}