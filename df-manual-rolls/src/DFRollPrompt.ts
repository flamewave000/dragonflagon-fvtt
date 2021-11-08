import DFManualRolls from "./DFManualRolls";
import SETTINGS from "../../common/SETTINGS";

interface RollPromptData {
	id: number;
	res: Function;
	term: DiceTerm;
}
interface RenderData {
	id: string;
	idx: number;
	faces: string;
	hasTotal: boolean;
	term: DiceTerm
}

export default class DFRollPrompt extends FormApplication<{ terms: RenderData[] }> {

	static readonly PREF_FOCUS_INPUT = 'focus-input';

	private _nextId = 0;
	private _terms: RollPromptData[] = [];
	private _rolled = false;

	static get focusInput(): boolean { return SETTINGS.get(DFRollPrompt.PREF_FOCUS_INPUT); }

	static get defaultOptions(): FormApplication.Options {
		return <FormApplication.Options>mergeObject(
			<DeepPartial<FormApplication.Options>>FormApplication.defaultOptions,
			{
				title: game.i18n.localize("DF_MANUAL_ROLLS.Prompt.DefaultTitle"),
				template: `modules/${SETTINGS.MOD_NAME}/templates/roll-prompt.hbs`,
				width: 400,

			});
	}

	getData(options?: Application.RenderOptions): { terms: RenderData[] } {
		const data: RenderData[] = [];
		for (let term of this._terms) {
			const die = term.term;
			for (let c = 0; c < die.number; c++) {
				data.push({
					id: term.id.toString(),
					idx: c,
					faces: c == 0 ? `${die.number}d${die.faces}${die.modifiers.length > 0 ? ' [' + die.modifiers.join(',') + ']' : ''}` : '',
					hasTotal: c == 0 && die.modifiers.length == 0 && die.number > 1,
					term: die
				});
			}
		}
		return { terms: data };
	}
	close(options?: FormApplication.CloseOptions): Promise<void> {
		// If we have not actually rolled anything yet, we need to resolve these with RNG values
		if (!this._rolled) {
			this._rolled = true;
			for (let x of this._terms) {
				const results: number[] = [];
				for (let c = 0; c < x.term.number; c++) {
					results.push(Math.ceil(CONFIG.Dice.randomUniform() * x.term.faces));
				}
				x.res(results);
			}
		}
		return super.close(options);
	}
	render(force?: boolean, options?: Application.RenderOptions) {
		if (this._terms.length == 0) return;
		return super.render(force, options);
	}
	async _render(force?: boolean, options?: Application.RenderOptions) {
		await super._render(force, options);
		if (DFRollPrompt.focusInput)
			this.element.find('input')[0].focus();
	}
	protected _updateObject(_: Event, formData?: { [key: string]: string | null }): Promise<unknown> {
		for (let x of this._terms) {
			const results: number[] = [];
			const total = formData[`${x.id}-total`];
			// If a total input was defined and given, it overrides everything else.
			if (total !== undefined && total !== null) {
				var value = parseInt(total);
				results.push(...DFRollPrompt.distributeRoll(value, x.term.number));
				if (DFManualRolls.flagged)
					x.term.options.flavor = (x.term.options.flavor || '') + '[MRT]';
			} else {
				const flags = [];
				for (let c = 0; c < x.term.number; c++) {
					const roll = formData[`${x.id}-${c}`];
					var value = parseInt(roll);
					if (isNaN(value)) {
						value = Math.ceil(CONFIG.Dice.randomUniform() * x.term.faces);
						flags.push('RN');
					} else {
						flags.push('MR');
						(<any>x.term.options).isManualRoll = true;
					}
					results.push(value);
				}
				if (DFManualRolls.flagged && flags.some(x => x === 'MR')) {
					x.term.options.flavor = (x.term.options.flavor || '') + '[' + flags.join(',') + ']';
					(<any>x.term.options).isManualRoll = true;
				}
			}
			x.res(results);
		}
		this._rolled = true;
		return undefined;
	}

	requestResult(term: DiceTerm): Promise<number[]> {
		return new Promise((res, _) => this._terms.push({ id: this._nextId++, res, term }));
	}

	static distributeRoll(total: number, count: number): number[] {
		const results: number[] = [];
		// If a total input was defined and given, it overrides everything else.
		var base = 0;
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