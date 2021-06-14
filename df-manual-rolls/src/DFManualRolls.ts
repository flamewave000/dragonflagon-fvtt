import DFRollPrompt from "./DFRollPrompt.js";
import SETTINGS from "./lib/Settings.js";

declare global {
	interface String {
		replaceAll(token: string, replacement: string): string;
	}
}
String.prototype.replaceAll = function (token: string, replacement: string) { return this.split(token).join(replacement); };

export default class DFManualRolls {
	static ENABLED = 'manual-rolls-enabled';
	static FORCED = 'manual-rolls-forced';
	static FLAGGED = 'manual-rolls-flagged';
	static FLAVOUR_5E = 'manual-rolls-flavour5e';

	static get enabled() { return SETTINGS.get(DFManualRolls.ENABLED); }
	static get forced() { return SETTINGS.get(DFManualRolls.FORCED); }
	static get flagged() { return SETTINGS.get(DFManualRolls.FLAGGED); }

	static patch() {
		libWrapper.register(SETTINGS.MOD_NAME, 'Roll.prototype._evaluate',
			async function (this: Roll, wrapper: Function, { minimize = false, maximize = false } = {}): Promise<Roll> {
				// Ignore Min/Max requests
				if (minimize || maximize) {
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

				this.terms.forEach(term => {
					if (!(term instanceof DiceTerm)) return;
					(<any>term).dfmr_prompt = rollPrompt;
				});

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
				// Ignore Min/Max requests
				if (minimize || maximize)
					return wrapper(minimize, maximize);
				const prompt: DFRollPrompt = (<any>this).dfmr_prompt;
				// If this dice term does not have a bound DFRollPrompt, ignore it
				if (!prompt)
					return wrapper(minimize, maximize);
				const results = await prompt.requestResult(this);
				results.forEach(x => this.results.push({ result: x, active: true }));
				this._evaluateModifiers();
				return this;
			}, 'MIXED');
	}
	static unpatch() {
		libWrapper.unregister(SETTINGS.MOD_NAME, 'Roll.prototype._identifyTerms', false);
		libWrapper.unregister(SETTINGS.MOD_NAME, 'DiceTerm.prototype.roll', false);
	}
}