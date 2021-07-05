import DFRollPrompt from "./DFRollPrompt.js";
import SETTINGS from "./lib/Settings.js";

declare global {
	interface String {
		replaceAll(token: string, replacement: string): string;
	}
}
String.prototype.replaceAll = function (token: string, replacement: string) { return this.split(token).join(replacement); };

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
	static get shouldRollManually() {
		const state = SETTINGS.get(game.user.isGM ? DFManualRolls.PREF_GM_STATE : DFManualRolls.PREF_PC_STATE);
		return state === 'always' || (state === 'toggle' && this.toggled);
	}

	static patch() {
		libWrapper.register(SETTINGS.MOD_NAME, 'Roll.prototype._evaluate', this._Roll_evaluate, 'MIXED');
		libWrapper.register(SETTINGS.MOD_NAME, 'DiceTerm.prototype._evaluate', this._DiceTerm_evaluate, 'MIXED');
		libWrapper.register(SETTINGS.MOD_NAME, 'Combat.prototype.rollInitiative', this._Combat_rollInitiative, 'MIXED');
		libWrapper.register(SETTINGS.MOD_NAME, 'Combatant.prototype.getInitiativeRoll', this._Combat_getInitiativeRoll, 'OVERRIDE');
	}
	static unpatch() {
		libWrapper.unregister(SETTINGS.MOD_NAME, 'Roll.prototype._identifyTerms', false);
		libWrapper.unregister(SETTINGS.MOD_NAME, 'DiceTerm.prototype.roll', false);
	}

	private static async _Roll_evaluate(this: Roll, wrapper: Function, { minimize = false, maximize = false } = {}): Promise<Roll> {
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
	}

	private static async _DiceTerm_evaluate(this: DiceTerm, wrapper: Function, { minimize = false, maximize = false } = {}): Promise<DiceTerm> {
		const rollPrompt: DFRollPrompt = (<any>this).rollPrompt;
		// Ignore Min/Max requests, if we are disabled, or if this dice term does not have a bound DFRollPrompt
		if (!DFManualRolls.shouldRollManually || !rollPrompt || minimize || maximize)
			return wrapper(minimize, maximize);
		const results = await rollPrompt.requestResult(this);
		for (let x of results) this.results.push({ result: x, active: true })
		this._evaluateModifiers();
		return this;
	}

	private static async _Combat_rollInitiative(this: Combat, wrapper: Function, ids: string | string[],
		{ formula = null, updateTurn = true, messageOptions = {} }: { formula?: string | null, updateTurn?: boolean, messageOptions?: any } = {}): Promise<Combat> {
		// Ignore if we are disabled
		if (!DFManualRolls.shouldRollManually) {
			return wrapper(ids, { formula, updateTurn, messageOptions });
		}

		/****** THIS IS CAPTURED DIRECTLY FROM Combat.prototype.rollInitiative ******/

		// Structure input data
		ids = typeof ids === "string" ? [ids] : ids;
		const currentId = this.combatant.id;
		const rollMode = messageOptions.rollMode || game.settings.get("core", "rollMode");

		// Iterate over Combatants, performing an initiative roll for each
		const updates = [];
		const messages = [];
		for (let [i, id] of ids.entries()) {

			// Get Combatant data (non-strictly)
			const combatant = (<any>this.combatants).get(id);

			// THIS DOES NOT APPEAR TO BE A VALID STATEMENT
			// if (!combatant?.isOwner) return results;
			// REPLACING WITH THE EQUIVALENT HERE
			if (!combatant?.isOwner) return undefined;

			// Produce an initiative roll for the Combatant
			/****** DF MANUAL ROLLS MODIFICATION ******/
			const roll = await combatant.getInitiativeRoll(formula); // Added 'await' keyword here
			/************ END MODIFICATION ************/
			updates.push({ _id: id, initiative: roll.total });

			// Construct chat message data
			let messageData = foundry.utils.mergeObject({
				speaker: {
					scene: this.scene.id,
					actor: combatant.actor?.id,
					token: combatant.token?.id,
					alias: combatant.name
				},
				flavor: game.i18n.format("COMBAT.RollsInitiative", { name: combatant.name }),
				flags: { "core.initiativeRoll": true }
			}, messageOptions);
			const chatData = await roll.toMessage(messageData, {
				create: false,
				rollMode: combatant.hidden && (rollMode === "roll") ? "gmroll" : rollMode
			});

			// Play 1 sound for the whole rolled set
			if (i > 0) chatData.sound = null;
			messages.push(chatData);
		}
		if (!updates.length) return this;

		// Update multiple combatants
		await (<any>this).updateEmbeddedDocuments("Combatant", updates);

		// Ensure the turn order remains with the same combatant
		if (updateTurn) {
			await this.update({ turn: this.turns.findIndex(t => t.id === currentId) });
		}

		// Create multiple chat messages
		await (<any>ChatMessage).implementation.create(messages);
		return this;
		/****************************** END OF CAPTURE ******************************/
	}

	private static _Combat_getInitiativeRoll(this: Combat, formula: string): Promise<Roll> | Roll {
		/** THIS IS CAPTURED DIRECTLY FROM Combat.prototype.getInitiativeRoll **/
		formula = formula || (<any>this)._getInitiativeFormula();
		const rollData = (<any>this).actor?.getRollData() || {};
		const roll: Roll = Roll.create(formula, rollData);
		/****** DF MANUAL ROLLS MODIFICATION ******/
		// Added flavour that can be displayed in the title
		roll.options.flavor = game.i18n.localize('DF_MANUAL_ROLLS.InitiativeRollFlavour').replace('{{name}}', this.name);
		return roll.evaluate({ async: DFManualRolls.shouldRollManually }); // used to be: return roll.evaluate({ async: false });
		/************ END MODIFICATION ************/
		/**************************** END OF CAPTURE ***************************/
	}
}