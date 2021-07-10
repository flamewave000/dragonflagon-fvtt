
// https://foundryvtt.com/api/abstract.Document.html
class DocumentX<T, D> {
	static collectionName: string
	static database: DatabaseBackend
	static documentName: string
	static implementation: function
	static metadata: object
	collectionName: string
	data: D
	documentName: string
	id: string | null
	isEmbedded: boolean
	name: string | null
	pack: string | null
	parent: Document | null

	static canUserCreate(user): boolean
	static create(data?= {}, context?= {}): Promise<T>
	static createDocuments(data, context?): Promise<Array<T>>
	delete(context?): Promise<Document>
	deleteEmbeddedDocuments(embeddedName, ids, context?): Promise<Array<T>>
	static deleteDocuments(ids, context?): Promise<Array<T>>
	static updateDocuments(updates, context?): Promise<Array<T>>
	getFlag(scope: string, key: string): any
	setFlag(scope: string, key: string, value: any): Promise<T>
	update(data?: any, context?: any): Promise<Document>
}

declare class WallDocument extends Document<Wall> {
	constructor(data: Wall.Data, options = {})
}

declare class Sidebar extends Application {
	constructor(options?: Partial<Application.Options>);

	/**
	 * Sidebar application instances
	 * @defaultValue `[]`
	 */
	apps: Application[];

	tabs: { [name: string]: Application };

	/**
	 * Track whether the sidebar container is currently collapsed
	 * @defaultValue `false`
	 */
	protected _collapsed: boolean;

	/**
	 * @override
	 */
	static get defaultOptions(): Sidebar.Options;

	/**
	 * Return the name of the active Sidebar tab
	 */
	get activeTab(): string;

	/**
	 * Return an Array of pop-out sidebar tab Application instances
	 */
	get popouts(): Application[];

	/**
	 * @param options - (unused)
	 * @override
	 */
	getData(options?: Application.RenderOptions): Sidebar.Data;

	/**
	 * @override
	 */
	protected _render(force?: boolean, options?: Application.RenderOptions): Promise<void>;

	/**
	 * Activate a Sidebar tab by it's name
	 * @param tabName - The tab name corresponding to it's "data-tab" attribute
	 */
	activateTab(tabName: string): void;

	/**
	 * Expand the Sidebar container from a collapsed state.
	 * Take no action if the sidebar is already expanded.
	 */
	expand(): void;

	/**
	 * Collapse the sidebar to a minimized state.
	 * Take no action if the sidebar is already collapsed.
	 */
	collapse(): void;

	/**
	 * @override
	 */
	activateListeners(html: JQuery): void;

	/**
	 * @param event - (unused)
	 * @param tabs - (unused)
	 * @override
	 */
	protected _onChangeTab(event: MouseEvent | null, tabs: Tabs, active: string): void;

	/**
	 * Handle right-click events on tab controls to trigger pop-out containers for each tab
	 * @param event - The originating contextmenu event
	 */
	protected _onRightClickTab(event: MouseEvent): void;

	/**
	 * Handle toggling of the Sidebar container's collapsed or expanded state
	 */
	protected _onToggleCollapse(event: MouseEvent): void;
}

declare namespace Roll {
	interface Data {
		flavor?: string;
		formula: string;
		results: Array<number | string>;
		terms: Array<(DicePool.Data & { class: 'DicePool' }) | DiceTerm.Data | DiceTerm.OldData>;
		total: number | null;
	}
}

/**
 * An abstract class which represents a single token that can be used as part of a Roll formula.
 * Every portion of a Roll formula is parsed into a subclass of RollTerm in order for the Roll to be fully evaluated.
 */
class RollTerm {
	constructor({ options = {} } = {});

	/**
	 * An object of additional options which describes and modifies the term.
	 * @type {object}
	 */
	options;
	/**
	 * An internal flag for whether the term has been evaluated
	 * @type {boolean}
	 */
	_evaluated;
	/**
	 * Is this term intermediate, and should be evaluated first as part of the simplification process?
	 * @type {boolean}
	 */
	isIntermediate: boolean;
	/**
	 * A regular expression pattern which identifies optional term-level flavor text
	 * @type {string}
	 */
	static FLAVOR_REGEXP_STRING: string;
	/**
	 * A regular expression which identifies term-level flavor text
	 * @type {RegExp}
	 */
	static FLAVOR_REGEXP: RegExp;
	/**
	 * A regular expression used to match a term of this type
	 * @type {RegExp}
	 */
	static REGEXP: RegExp | undefined;
	/**
	 * An array of additional attributes which should be retained when the term is serialized
	 * @type {string[]}
	 */
	static SERIALIZE_ATTRIBUTES: string[];

	/* -------------------------------------------- */
	/*  RollTerm Attributes                         */
	/* -------------------------------------------- */

	/**
	 * A string representation of the formula expression for this RollTerm, prior to evaluation.
	 * @type {string}
	 */
	get expression(): string;
	/**
	 * A string representation of the formula, including optional flavor text.
	 * @type {string}
	 */
	get formula(): string;
	/**
	 * A string or numeric representation of the final output for this term, after evaluation.
	 * @type {number|string}
	 */
	get total(): number | string;
	/**
	 * Optional flavor text which modifies and describes this term.
	 * @type {string}
	 */
	get flavor(): string;

	/* -------------------------------------------- */
	/*  RollTerm Methods                            */
	/* -------------------------------------------- */

	/**
	 * Evaluate the term, processing its inputs and finalizing its total.
	 * @param {object} [options={}]           Options which modify how the RollTerm is evaluated
	 * @param {boolean} [options.minimize=false]    Minimize the result, obtaining the smallest possible value.
	 * @param {boolean} [options.maximize=false]    Maximize the result, obtaining the largest possible value.
	 * @param {boolean} [options.async=false]       Evaluate the term asynchronously, receiving a Promise as the returned value.
	 *                                              This will become the default behavior in version 10.x
	 * @returns {RollTerm}                     The evaluated RollTerm
	 */
	evaluate({ minimize, maximize, async }: { minimize?: boolean, maximize?: boolean, async?: boolean }): Promise<RollTerm>;
	/**
	 * Evaluate the term.
	 * @param {object} [options={}]           Options which modify how the RollTerm is evaluated, see RollTerm#evaluate
	 * @returns {Promise<RollTerm>}
	 * @private
	 */
	_evaluate({ minimize, maximize }: { minimize?: boolean, maximize?: boolean }): Promise<RollTerm>;
	/**
	 * This method is temporarily factored out in order to provide different behaviors synchronous evaluation.
	 * This will be removed in 0.10.x
	 * @private
	 */
	_evaluateSync({ minimize, maximize }: { minimize?: boolean, maximize?: boolean }): RollTerm;

	/* -------------------------------------------- */
	/*  Serialization and Loading                   */
	/* -------------------------------------------- */

	/**
	 * Construct a RollTerm from a provided data object
	 * @param {object} data         Provided data from an un-serialized term
	 * @return {RollTerm}           The constructed RollTerm
	 */
	static fromData(data: object): RollTerm
	/**
	 * Define term-specific logic for how a de-serialized data object is restored as a functional RollTerm
	 * @param {object} data         The de-serialized term data
	 * @returns {RollTerm}          The re-constructed RollTerm object
	 * @protected
	 */
	static _fromData(data: object): RollTerm;
	/**
	 * Reconstruct a RollTerm instance from a provided JSON string
	 * @param {string} json   A serialized JSON representation of a DiceTerm
	 * @return {RollTerm}     A reconstructed RollTerm from the provided JSON
	 */
	static fromJSON(json: string): RollTerm
	/**
	 * Serialize the RollTerm to a JSON string which allows it to be saved in the database or embedded in text.
	 * This method should return an object suitable for passing to the JSON.stringify function.
	 * @return {object}
	 */
	toJSON(): string;
}

class NumericTerm extends RollTerm {
	constructor({ number, options }: { number: string | number, options: any });
	/** @inheritdoc */
	static REGEXP: RegExp;
	/** @inheritdoc */
	static SERIALIZE_ATTRIBUTES: string[];
	/** @inheritdoc */
	get expression(): String;
	/** @inheritdoc */
	get total(): number;
	/**
	 * Determine whether a string expression matches a NumericTerm
	 * @param {string} expression               The expression to parse
	 * @return {RegExpMatchArray|null}
	 */
	static matchTerm(expression: string): RegExpMatchArray | null;
	/**
	 * Construct a term of this type given a matched regular expression array.
	 * @param {RegExpMatchArray} match          The matched regular expression array
	 * @return {NumericTerm}                    The constructed term
	 */
	static fromMatch(match: RegExpMatchArray): NumericTerm;
}

class Roll {
	constructor(formula, data = {}, options = {});
	/**
	 * The original provided data object which substitutes into attributes of the roll formula
	 * @type {Object}
	 */
	data;
	/**
	 * Options which modify or describe the Roll
	 * @type {object}
	 */
	options;
	/**
	 * The identified terms of the Roll
	 * @type {RollTerm[]}
	 */
	terms: RollTerm[];
	/**
	 * An array of inner DiceTerms which were evaluated as part of the Roll evaluation
	 * @type {DiceTerm[]}
	 */
	_dice;
	/**
	 * Store the original cleaned formula for the Roll, prior to any internal evaluation or simplification
	 * @type {string}
	 */
	_formula;
	/**
	 * Track whether this Roll instance has been evaluated or not. Once evaluated the Roll is immutable.
	 * @type {boolean}
	 */
	_evaluated;
	/**
	 * Cache the numeric total generated through evaluation of the Roll.
	 * @type {number}
	 * @private
	 */
	_total;
	/**
	 * Prepare the data structure used for the Roll.
	 * This is factored out to allow for custom Roll classes to do special data preparation using provided input.
	 * @param {object} data   Provided roll data
	 * @returns {object}      The prepared data object
	 * @protected
	 */
	_prepareData(data);
	/**
	 * Return an Array of the individual DiceTerm instances contained within this Roll.
	 * @return {DiceTerm[]}
	 */
	get dice();
	/**
	 * Return a standardized representation for the displayed formula associated with this Roll.
	 * @return {string}
	 */
	get formula();
	/**
	 * The resulting arithmetic expression after rolls have been evaluated
	 * @return {string}
	 */
	get result();
	/**
	 * Return the total result of the Roll expression if it has been evaluated.
	 * @type {number}
	 */
	get total();
	/**
	 * Alter the Roll expression by adding or multiplying the number of dice which are rolled
	 * @param {number} multiply   A factor to multiply. Dice are multiplied before any additions.
	 * @param {number} add        A number of dice to add. Dice are added after multiplication.
	 * @param {boolean} [multiplyNumeric]  Apply multiplication factor to numeric scalar terms
	 * @return {Roll}             The altered Roll expression
	 */
	alter(multiply, add, { multiplyNumeric = false } = {});
	/**
	 * Clone the Roll instance, returning a new Roll instance that has not yet been evaluated.
	 * @return {Roll}
	 */
	clone();
	/**
	 * Execute the Roll, replacing dice and evaluating the total result
	 * @param {object} [options={}]     Options which inform how the Roll is evaluated
	 * @param {boolean} [options.minimize=false]    Minimize the result, obtaining the smallest possible value.
	 * @param {boolean} [options.maximize=false]    Maximize the result, obtaining the largest possible value.
	 * @param {boolean} [options.async=false]       Evaluate the roll asynchronously, receiving a Promise as the returned value.
	 *                                              This will become the default behavior in version 10.x
	 * @returns {Roll|Promise<Roll>}    The evaluated Roll instance
	 *
	 * @example
	 * let r = new Roll("2d6 + 4 + 1d4");
	 * r.evaluate();
	 * console.log(r.result); // 5 + 4 + 2
	 * console.log(r.total);  // 11
	 */
	evaluate({ minimize = false, maximize = false, async } = {});
	/**
	 * Evaluate the roll asynchronously.
	 * A temporary helper method used to migrate behavior from 0.7.x (sync by default) to 0.9.x (async by default).
	 * @returns {Promise<Roll>}
	 * @private
	 */
	async _evaluate({ minimize = false, maximize = false } = {});
	/**
	 * Evaluate the roll synchronously.
	 * A temporary helper method used to migrate behavior from 0.7.x (sync by default) to 0.9.x (async by default).
	 * @returns {Roll}
	 * @private
	 */
	_evaluateSync({ minimize = false, maximize = false } = {});
	/**
	 * Safely evaluate the final total result for the Roll using its component terms.
	 * @returns {number}    The evaluated total
	 * @private
	 */
	_evaluateTotal();
	/**
	 * Alias for evaluate.
	 * @see {Roll#evaluate}
	 */
	roll(options = {});
	/**
	 * Create a new Roll object using the original provided formula and data.
	 * Each roll is immutable, so this method returns a new Roll instance using the same data.
	 * @param {object} [options={}]     Evaluation options passed to Roll#evaluate
	 * @return {Roll}                   A new Roll object, rolled using the same formula and data
	 */
	reroll(options = {});
	/**
	 * A factory method which constructs a Roll instance using the default configured Roll class.
	 * @param {string} formula        The formula used to create the Roll instance
	 * @param {object} [data={}]      The data object which provides component data for the formula
	 * @param {object} [options={}]   Additional options which modify or describe this Roll
	 * @return {Roll}                 The constructed Roll instance
	 */
	static create(formula, data = {}, options = {});
	/**
	 * Transform an array of RollTerm objects into a cleaned string formula representation.
	 * @param {RollTerm[]} terms      An array of terms to represent as a formula
	 * @returns {string}              The string representation of the formula
	 */
	static getFormula(terms);
	/**
	 * A sandbox-safe evaluation function to execute user-input code with access to scoped Math methods.
	 * @param {string} expression   The input string expression
	 * @returns {number}            The numeric evaluated result
	 */
	static safeEval(expression);
	/**
	 * After parenthetical and arithmetic terms have been resolved, we need to simplify the remaining expression.
	 * Any remaining string terms need to be combined with adjacent non-operators in order to construct parsable terms.
	 * @param {RollTerm[]} terms      An array of terms which is eligible for simplification
	 * @returns {RollTerm[]}          An array of simplified terms
	 */
	static simplifyTerms(terms);
	/**
	 * Simulate a roll and evaluate the distribution of returned results
	 * @param {string} formula    The Roll expression to simulate
	 * @param {number} n          The number of simulations
	 * @return {number[]}         The rolled totals
	 */
	static simulate(formula, n = 10000);
	/**
	 * Parse a formula by following an order of operations:
	 *
	 * Step 1: Replace formula data
	 * Step 2: Split outer-most parenthetical groups
	 * Step 3: Further split outer-most dice pool groups
	 * Step 4: Further split string terms on arithmetic operators
	 * Step 5: Classify all remaining strings
	 *
	 * @param {string} formula      The original string expression to parse
	 * @param {object} data         A data object used to substitute for attributes in the formula
	 * @returns {RollTerm[]}        A parsed array of RollTerm instances
	 */
	static parse(formula, data);
	/**
	 * Replace referenced data attributes in the roll formula with values from the provided data.
	 * Data references in the formula use the @attr syntax and would reference the corresponding attr key.
	 *
	 * @param {string} formula          The original formula within which to replace
	 * @param {object} data             The data object which provides replacements
	 * @param {string} [missing]        The value that should be assigned to any unmatched keys.
	 *                                  If null, the unmatched key is left as-is.
	 * @param {boolean} [warn]          Display a warning notification when encountering an un-matched key.
	 * @static
	 */
	static replaceFormulaData(formula, data, { missing, warn = false } = {});
	/**
	 * Validate that a provided roll formula can represent a valid
	 * @param {string} formula    A candidate formula to validate
	 * @return {boolean}          Is the provided input a valid dice formula?
	 */
	static validate(formula);
	/**
	 * Split a formula by identifying its outer-most parenthetical and math terms
	 * @param {string} _formula      The raw formula to split
	 * @returns {string[]}          An array of terms, split on parenthetical terms
	 * @private
	 */
	static _splitParentheses(_formula);
	/**
	 * Handle closing of a parenthetical term to create a MathTerm expression with a function and arguments
	 * @returns {MathTerm[]}
	 * @private
	 */
	static _splitMathArgs(expression);
	/**
	 * Split a formula by identifying its outer-most dice pool terms
	 * @param {string} _formula      The raw formula to split
	 * @returns {string[]}          An array of terms, split on parenthetical terms
	 * @private
	 */
	static _splitPools(_formula);
	/**
	 * Split a formula by identifying its outer-most groups using a certain group symbol like parentheses or brackets.
	 * @param {string} _formula     The raw formula to split
	 * @param {object} options      Options that configure how groups are split
	 * @returns {string[]}          An array of terms, split on dice pool terms
	 * @private
	 */
	static _splitGroup(_formula, { openRegexp, closeRegexp, openSymbol, closeSymbol, onClose } = {});
	/**
	 * Split a formula by identifying arithmetic terms
	 * @param {string} _formula                 The raw formula to split
	 * @returns {Array<(string|OperatorTerm)>}  An array of terms, split on arithmetic operators
	 * @private
	 */
	static _splitOperators(_formula);
	/**
	 * Temporarily remove flavor text from a string formula allowing it to be accurately parsed.
	 * @param {string} formula                        The formula to extract
	 * @returns {{formula: string, flavors: object}}  The cleaned formula and extracted flavor mapping
	 * @private
	 */
	static _extractFlavors(formula);
	/**
	 * Restore flavor text to a string term
	 * @param {string} term         The string term possibly containing flavor symbols
	 * @param {object} flavors      The extracted flavors object
	 * @returns {string}            The restored term containing flavor text
	 * @private
	 */
	static _restoreFlavor(term, flavors);
	/**
	 * Classify a remaining string term into a recognized RollTerm class
	 * @param {string} term         A remaining un-classified string
	 * @param {object} [options={}] Options which customize classification
	 * @param {boolean} [options.intermediate=false]  Allow intermediate terms
	 * @param {RollTerm|string} [options.prior]       The prior classified term
	 * @param {RollTerm|string} [options.next]        The next term to classify
	 * @returns {RollTerm}          A classified RollTerm instance
	 * @private
	 */
	static _classifyStringTerm(term, { intermediate = true, prior, next } = {});
	/**
	 * Render the tooltip HTML for a Roll instance
	 * @return {Promise<string>}      The rendered HTML tooltip as a string
	 */
	async getTooltip();
	/**
	 * Render a Roll instance to HTML
	 * @param {object} [chatOptions]      An object configuring the behavior of the resulting chat message.
	 * @return {Promise<string>}          The rendered HTML template as a string
	 */
	async render(chatOptions = {});
	/**
	 * Transform a Roll instance into a ChatMessage, displaying the roll result.
	 * This function can either create the ChatMessage directly, or return the data object that will be used to create.
	 *
	 * @param {object} messageData          The data object to use when creating the message
	 * @param {options} [options]           Additional options which modify the created message.
	 * @param {string} [options.rollMode]   The template roll mode to use for the message from CONFIG.Dice.rollModes
	 * @param {boolean} [options.create=true]   Whether to automatically create the chat message, or only return the
	 *                                          prepared chatData object.
	 * @return {Promise<ChatMessage>}       A promise which resolves to the created ChatMessage entity, if create is true
	 *                                      or the Object of prepared chatData otherwise.
	 */
	async toMessage(messageData = {}, { rollMode, create = true } = {});
	/**
	 * Expand an inline roll element to display it's contained dice result as a tooltip
	 * @param {HTMLAnchorElement} a     The inline-roll button
	 * @return {Promise<void>}
	 */
	static async expandInlineResult(a);
	/**
	 * Collapse an expanded inline roll to conceal it's tooltip
	 * @param {HTMLAnchorElement} a     The inline-roll button
	 */
	static collapseInlineResult(a);
}
declare namespace Combat {
	interface Combatant {
		_id: string;
		id: string;
		defeated?: boolean;
		flags: Record<string, unknown>;
		hidden?: boolean;
		img: string;
		initiative: number | null;
		name: string;
		owner: boolean;
		permission: number;
		players: User[];
		resource?: number;
		visible: boolean;
	}
}

const foundry: any;

class ChatMessage extends DocumentX<ChatMessage, ChatMessage.Data> {
	constructor(data?: ChatMessage.Data, context?: any);
	/**
	 * Return the recommended String alias for this message.
	 * The alias could be a Token name in the case of in-character messages or dice rolls.
	 * Alternatively it could be a User name in the case of OOC chat or whispers.
	 * @type {string}
	 */
	get alias();
	/**
	 * Is the current User the author of this message?
	 * @type {boolean}
	 */
	get isAuthor();
	/**
	 * Return whether the content of the message is visible to the current user.
	 * For certain dice rolls, for example, the message itself may be visible while the content of that message is not.
	 * @type {boolean}
	 */
	get isContentVisible();
	/**
	 * Test whether the chat message contains a dice roll
	 * @type {boolean}
	 */
	get isRoll();
	/**
	 * Return the Roll instance contained in this chat message, if one is present
	 * @type {Roll|null}
	 */
	get roll();
	/**
	 * Return whether the ChatMessage is visible to the current User.
	 * Messages may not be visible if they are private whispers.
	 * @type {boolean}
	 */
	get visible();
	/**
	 * The User who created the chat message.
	 * @type {User}
	 */
	get user(): User;
	/** @inheritdoc */
	prepareData();
	/**
	 * Transform a provided object of ChatMessage data by applying a certain rollMode to the data object.
	 * @param {object} chatData     The object of ChatMessage data prior to applying a rollMode preference
	 * @param {string} rollMode     The rollMode preference to apply to this message data
	 * @returns {object}            The modified ChatMessage data with rollMode preferences applied
	 */
	static applyRollMode(chatData, rollMode);
	/**
	 * Update the data of a ChatMessage instance to apply a requested rollMode
	 * @param {string} rollMode     The rollMode preference to apply to this message data
	 */
	applyRollMode(rollMode);
	/**
	 * Attempt to determine who is the speaking character (and token) for a certain Chat Message
	 * First assume that the currently controlled Token is the speaker
	 *
	 * @param {Scene} [scene]     The Scene in which the speaker resides
	 * @param {Actor} [actor]     The Actor whom is speaking
	 * @param {Token} [token]     The Token whom is speaking
	 * @param {string} [alias]     The name of the speaker to display
	 *
	 * @returns {Object}  The identified speaker data
	 */
	static getSpeaker({ scene, actor, token, alias } = {});
	/**
	 * A helper to prepare the speaker object based on a target Token
	 * @private
	 */
	static _getSpeakerFromToken({ token, alias });
	/**
	 * A helper to prepare the speaker object based on a target Actor
	 * @private
	 */
	static _getSpeakerFromActor({ scene, actor, alias });
	/**
	 * A helper to prepare the speaker object based on a target User
	 * @private
	 */
	static _getSpeakerFromUser({ scene, user, alias });
	/**
	 * Obtain an Actor instance which represents the speaker of this message (if any)
	 * @param {Object} speaker    The speaker data object
	 * @return {Actor|null}
	 */
	static getSpeakerActor(speaker);
	/**
	 * Obtain a data object used to evaluate any dice rolls associated with this particular chat message
	 * @return {object}
	 */
	getRollData();
	/**
	 * Given a string whisper target, return an Array of the user IDs which should be targeted for the whisper
	 *
	 * @param {string} name   The target name of the whisper target
	 * @return {User[]}       An array of User instances
	 */
	static getWhisperRecipients(name);
	/**
	 * Render the HTML for the ChatMessage which should be added to the log
	 * @return {Promise<jQuery>}
	 */
	getHTML(): Promise<JQuery>;
	/** @override */
	async _preCreate(data, options, user);
	/** @override */
	_onCreate(data, options, userId);
	/** @override */
	_onUpdate(data, options, userId);
	/** @override */
	_onDelete(options, userId);
	/**
	 * Export the content of the chat message into a standardized log format
	 * @return {string}
	 */
	export();
}
declare namespace ChatMessage {
	declare interface Data extends Entity.Data {
		content: string;
		roll?: string;
		speaker: SpeakerData;
		timestamp: number;
		type: number;
		user: string;
		whisper: string[];
		flavor?: string;
	}
}