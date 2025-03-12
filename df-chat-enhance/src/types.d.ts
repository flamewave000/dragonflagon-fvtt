
declare interface AdventurLogApi {
	event(message: string, postToChat?: boolean): Promise<void>
	pevent(message: string, postToChat?: boolean): Promise<void>
	gmevent(message: string, postToChat?: boolean): Promise<void>
	quote(speaker: string, message: string, postToChat?: boolean): Promise<void>
	pquote(speaker: string, message: string, postToChat?: boolean): Promise<void>
	gmquote(speaker: string, message: string, postToChat?: boolean): Promise<void>
}

declare interface ChatCommand {
	name: string,
	module: string,
	aliases?: string[],
	description?: string,
	icon?: string,
	requiredRole?: 'NONE' | 'PLAYER' | 'TRUSTED' | 'ASSISTANT' | 'GAMEMASTER',
	/**
	 * To run your own logic when the command is invoked
	 * @param chat The ChatLog instance that triggered the command.
	 * @param parameters The parameter text of the invocation, which is everything after the first space (except for single character aliases, where the space is omitted).
	 * @param message The data of the chat message (user and speaker information).
	 * @returns The return value controls what happens after completing the callback. Returning an empty object (or message data without content) will prevent further interaction. You can also return nothing (undefined) or null to use FoundryVTT's command handling.
	 */
	callback?: (chat: ChatLog, parameters: string, message: ChatMessage) => ChatMessage | undefined | null | {},
	/**
	 * The autocompleteCallback function is optional and may be used to display suggestions or information for the current command.
	 * @param menu The menu controlling the autocompletion process. Its state information can be used to refine the results, e.g. the maximum amount of entries (menu.maxEntries) or the current visibility (menu.visible).
	 * @param alias The alias that was used.
	 * @param parameters The parameters (everything after the first space or single character alias).
	 * @returns The returned commands should usually start with the provided alias, but they don't need to. You can also complete with other aliases (e.g. to teach the user about abbreviations) or entirely different commands.
	 */
	autocompleteCallback?: (menu: ContextMenu, alias: string, parameters: string) => string[],
	/** @default true */
	closeOnComplete?: boolean
}

declare class ChatCommands {
	/**
	 * Deregister a Chat Command
	 */
	deregisterCommand(command: ChatCommand): void;
	register(data: ChatCommand): ChatCommand;
}

declare interface MarkedToken {
	[key: string]: string;
	/** A string that matches the name parameter of the extension. */
	type: string;
	/** A string containing all of the text that this token consumes from the source. */
	raw: string;
	/** An array of child tokens that will be traversed by the `walkTokens` function by default. */
	tokens?: MarkedToken[]
}

declare class MarkedLexer {
	/** This runs the block tokenizer functions (including any block-level extensions) on the provided text, and appends any resulting tokens onto the tokens array. The tokens array is also returned by the function. You might use this, for example, if your extension creates a "container"-type token (such as a blockquote) that can potentially include other block-level tokens inside. */
	blockTokens(text: string, tokens: MarkedToken): MarkedToken[];
	/** Parsing of inline-level tokens only occurs after all block-level tokens have been generated. This function adds text and tokens to a queue to be processed using inline-level tokenizers (including any inline-level extensions) at that later step. Tokens will be generated using the provided text, and any resulting tokens will be appended to the tokens array. Note that this function does **NOT** return anything since the inline processing cannot happen until the block-level processing is complete. */
	inline(text: string, tokens: MarkedToken[]): void;
	/** Sometimes an inline-level token contains further nested inline tokens (such as a `**strong**` token inside of a `### Heading`). This runs the inline tokenizer functions (including any inline-level extensions) on the provided text, and appends any resulting tokens onto the tokens array. The tokens array is also returned by the function. */
	inlineTokens(text: string, tokens: MarkedToken[]): MarkedToken[];
}
declare class MarkedParser {
	/** Runs the block renderer functions (including any extensions) on the provided array of tokens, and returns the resulting HTML string output. This is used to generate the HTML from any child block-level tokens, for example if your extension is a "container"-type token (such as a blockquote) that can potentially include other block-level tokens inside. */
	parse(tokens: MarkedToken[]): string;
	/** Runs the inline renderer functions (including any extensions) on the provided array of tokens, and returns the resulting HTML string output. This is used to generate the HTML from any child inline-level tokens. */
	parseInline(tokens: MarkedToken[]): string;
}

/** https://marked.js.org/using_pro#extensions */
declare interface MarkedExtension {
	/** A string used to identify the token that will be handled by this extension. */
	name: string;
	/** A string to determine when to run the extension tokenizer. Must be equal to 'block' or 'inline'. */
	level: 'block' | 'inline';
	/** A function that returns the index of the next potential start of the custom token. */
	start(src: string): number | undefined;
	/** A function that reads string of Markdown text and returns a generated token. */
	tokenizer(this: MarkedLexer, src: string, tokens: MarkedToken[]): MarkedToken;
	/** A function that reads a token and returns the generated HTML output string. */
	renderer(this: MarkedParser, token: MarkedToken): string;
	/** An array of strings that match the names of any token parameters that should be traversed by the `walkTokens` functions. */
	childTokens?: string[];
}
declare interface MarkedParseOptions {
	/** If true, walkTokens functions can be async and marked.parse will return a promise that resolves when all walk tokens functions resolve. */
	async?: boolean
	/** If true, add <br> on a single line break (copies GitHub behavior on comments, but not on rendered markdown files). Requires gfm be true. */
	breaks?: boolean
	/** If true, use approved GitHub Flavored Markdown (GFM) specification. */
	gfm?: boolean
	/** If true, conform to the original markdown.pl as much as possible. Don't fix original markdown bugs or behavior. Turns off and overrides gfm. */
	pedantic?: boolean
	/** An object containing functions to render tokens to HTML. See extensibility for more details. */
	renderer?: object
	/** If true, the parser does not throw any exception or log any warning. Any error will be returned as a string. */
	silent?: boolean
	/** An object containing functions to create tokens from markdown. See extensibility for more details. */
	tokenizer?: object
	/** A function which is called for every token. See extensibility for more details. */
	walkTokens?: function
}
declare interface MarkedUseOptions extends MarkedParseOptions {
	extensions?: MarkedExtension[];
}
declare class Marked {
	parse(md: string, options: MarkedParseOptions): string;
	use(options: MarkedUseOptions): void;
}
declare const marked: Marked;
declare const AdventureLog: AdventurLogApi;

declare global {
	interface Application {
		_recalculateDimensions(): void;
	}

	interface Game {
		chatCommands: ChatCommands;
	}

	interface String {
		trimStart(): string
	}

	namespace SimpleCalendar.api {
		function formatDateTime(time: {
			year: number,
			month: number,
			day: number,
			hour: number,
			minute: number,
			second: number
		}): { date: string, time: string }
		function formatDateTime(time: {
			year: number,
			month: number,
			day: number,
			hour: number,
			minute: number,
			second: number
		}, format: string): string
		function timestamp(): number
		function timestampToDate(timestamp: number): {
			year: number,
			month: number,
			day: number,
			hour: number,
			minute: number,
			second: number
		}
	}
}
