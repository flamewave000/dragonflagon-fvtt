import RollPrompt from "./RollPrompt";
import SETTINGS from "../../common/Settings";

declare global {
	interface String {
		dfmr_replaceAll(token: string, replacement: string): string;
	}
}
String.prototype.dfmr_replaceAll = function (token: string, replacement: string) { return this.split(token).join(replacement); };

export default class ManualRolls {
	static PREF_GM_STATE = 'gm';
	static PREF_PC_STATE = 'pc';
	static PREF_FLAGGED = 'flagged';
	static PREF_TOGGLED = 'toggled';
	static FLAG_ROLL_TYPE = 'roll-type';

	static get flagged(): boolean { return SETTINGS.get(ManualRolls.PREF_FLAGGED); }
	static get toggled(): boolean { return SETTINGS.get(ManualRolls.PREF_TOGGLED); }
	static setToggled(value: boolean): Promise<boolean> { return SETTINGS.set(ManualRolls.PREF_TOGGLED, value); }
	static get toggleable() {
		return (game.user.getFlag(SETTINGS.MOD_NAME, ManualRolls.FLAG_ROLL_TYPE) || SETTINGS.get(game.user.isGM ? ManualRolls.PREF_GM_STATE : ManualRolls.PREF_PC_STATE)) === 'toggle';
	}
	static tempDisable = false;
	static get shouldRollManually() {
		const state = game.user.getFlag(SETTINGS.MOD_NAME, ManualRolls.FLAG_ROLL_TYPE) || SETTINGS.get(game.user.isGM ? ManualRolls.PREF_GM_STATE : ManualRolls.PREF_PC_STATE);
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

	static async setRollPromptRecursively(obj: any, rollPrompt: RollPrompt, termsToRoll: RollTerm[]) {
		if (obj instanceof RollTerm) {
			termsToRoll.push(obj);
		}
		if (obj instanceof PoolTerm){
			return;
		}
		// If the object is a DiceTerm, set the rollPrompt
		if (obj instanceof DiceTerm) {
			(<any>obj).rollPrompt = rollPrompt;

		} else if (typeof obj === 'object') {
			// If the object is an object, recursively check its properties
			for (const key in obj) {
				if (obj.hasOwnProperty(key)) {
					await ManualRolls.setRollPromptRecursively(obj[key], rollPrompt, termsToRoll);
				}
			}
		}
	}

	private static async _Roll_evaluate(this: Roll, wrapper: (arg: any) => any, { minimize = false, maximize = false } = {}): Promise<Roll> {
		// Ignore Min/Max requests and if we are disabled
		if (!ManualRolls.shouldRollManually || minimize || maximize) {
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
		const rollPrompt = new RollPrompt({}, this.options.flavor ? { title: this.options.flavor } : {});
		const termsToRoll: (RollTerm)[] = [];
		for (const term of this.terms) {
			await ManualRolls.setRollPromptRecursively(term, rollPrompt, termsToRoll);
		}

		// Step 3 - Evaluate remaining terms
		const promises: Promise<RollTerm>[] = [];
		for (const term of termsToRoll) {
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
		const rollPrompt: RollPrompt = (<any>this).rollPrompt;
		// Ignore Min/Max requests, if we are disabled, or if this dice term does not have a bound DFRollPrompt
		if (!ManualRolls.shouldRollManually || !rollPrompt || minimize || maximize)
			return wrapper(minimize, maximize);
		const results = await rollPrompt.requestResult(this);
		for (const x of results) this.results.push({ result: x, active: true });
		this._evaluateModifiers();
		return this;
	}
}
