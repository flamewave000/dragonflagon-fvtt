
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
	requiredRole?: 'NONE'|'PLAYER'|'TRUSTED'|'ASSISTANT'|'GAMEMASTER',
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


declare global {
	interface Application {
		_recalculateDimensions(): void;
	}

	namespace marked {
		function parse(md: string, options: any): string;
	}

	interface Game {
		chatCommands: ChatCommands;
	}

	interface String {
		trimStart(): string
	}
	const AdventureLog: AdventurLogApi;
	
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
