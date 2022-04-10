import DFRollPrompt from "./DFRollPrompt";
import SETTINGS from "../../common/Settings";

declare global {
	interface String {
		dfmr_replaceAll(token: string, replacement: string): string;
	}
}
String.prototype.dfmr_replaceAll = function (token: string, replacement: string) { return this.split(token).join(replacement); };

export default class DFManualRolls {
	static PREF_GM_STATE = 'gm';
	static PREF_PC_STATE = 'pc';
	static PREF_FLAGGED = 'flagged';
	static PREF_TOGGLED = 'toggled';

	static get flagged(): boolean { return SETTINGS.get(DFManualRolls.PREF_FLAGGED); }
	static get toggled(): boolean { return SETTINGS.get(DFManualRolls.PREF_TOGGLED); }
	static setToggled(value: boolean): Promise<boolean> { return SETTINGS.set(DFManualRolls.PREF_TOGGLED, value); }
	static get toggleable() {
		return SETTINGS.get(game.user.isGM ? DFManualRolls.PREF_GM_STATE : DFManualRolls.PREF_PC_STATE) === 'toggle';
	}
	static tempDisable = false;
	static get shouldRollManually() {
		const state = SETTINGS.get(game.user.isGM ? DFManualRolls.PREF_GM_STATE : DFManualRolls.PREF_PC_STATE);
		return !this.tempDisable && (state === 'always' || (state === 'toggle' && this.toggled));
	}

	static patch() {
		libWrapper.register(SETTINGS.MOD_NAME, 'Roll.prototype._evaluate', this._Roll_evaluate, 'MIXED');
		libWrapper.register(SETTINGS.MOD_NAME, 'DiceTerm.prototype._evaluate', this._DiceTerm_evaluate, 'MIXED');
	}
	static unpatch() {
		libWrapper.unregister(SETTINGS.MOD_NAME, 'Roll.prototype._identifyTerms', false);
		libWrapper.unregister(SETTINGS.MOD_NAME, 'DiceTerm.prototype.roll', false);
	}

	private static async _Roll_evaluate(this: Roll, wrapper: (arg: any) => any, { minimize = false, maximize = false } = {}): Promise<Roll> {
		// Ignore Min/Max requests and if we are disabled
		if (!DFManualRolls.shouldRollManually || minimize || maximize) {
			return wrapper({ minimize, maximize });
		}

		/****** THIS IS CAPTURED DIRECTLY FROM Roll.prototype._evaluate ******/
		// Step 1 - Replace intermediate terms with evaluated numbers
		const intermediate = [];
		for (const element of this.terms) {
			let term: any = element;
			if (!(term instanceof RollTerm)) {
				throw new Error("Roll evaluation encountered an invalid term which was not a RollTerm instance");
			}
			if (term.isIntermediate) {
				await term.evaluate({ minimize, maximize, async: true });
				this._dice = this._dice.concat((<any>term).dice);
				term = new NumericTerm({ number: <number>term.total, options: (<any>term).options });
			}
			intermediate.push(term);
		}
		this.terms = intermediate;

		// Step 2 - Simplify remaining terms
		this.terms = (this.constructor as any).simplifyTerms(this.terms);

		/****** DF MANUAL ROLLS MODIFICATION ******/
		// @ts-ignore
		const rollPrompt = new DFRollPrompt({}, this.options.flavor ? { title: this.options.flavor } : {});

		for (const term of this.terms) {
			if (!(term instanceof DiceTerm)) continue;
			(<any>term).rollPrompt = rollPrompt;
		}

		// Step 3 - Evaluate remaining terms
		const promises: Promise<RollTerm>[] = [];
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

	private static async _DiceTerm_evaluate(this: DiceTerm, wrapper: AnyFunction, { minimize = false, maximize = false } = {}): Promise<DiceTerm> {
		const rollPrompt: DFRollPrompt = (<any>this).rollPrompt;
		// Ignore Min/Max requests, if we are disabled, or if this dice term does not have a bound DFRollPrompt
		if (!DFManualRolls.shouldRollManually || !rollPrompt || minimize || maximize)
			return wrapper(minimize, maximize);
		const results = await rollPrompt.requestResult(this);
		for (const x of results) this.results.push({ result: x, active: true });
		this._evaluateModifiers();
		return this;
	}
}
