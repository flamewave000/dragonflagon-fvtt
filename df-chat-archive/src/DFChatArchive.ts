export interface DFChatArchiveEntry {
	id: number;
	name: string;
	chats: ChatMessage[] | ChatMessage.Data[];
}

export class DFChatArchive {
	private static _updateListener: () => void = null;
	private static _logs: DFChatArchiveEntry[]

	static setUpdateListener(listener: () => void) {
		this._updateListener = listener;
	}

	static registerSettings() {
		game.settings.register('df-chat-archive', 'logs', {
			scope: 'world',
			config: false,
			type: String,
			default: '[]'
		});
		game.settings.register('df-chat-archive', 'currentId', {
			scope: 'world',
			config: false,
			type: Number,
			default: 0
		});
		this._logs = JSON.parse(game.settings.get('df-chat-archive', 'logs'));
	}

	static getLogs() { return this._logs; }
	static getArchive(id: number) { return this._logs.find(x => x.id == id); }
	static exists(id: number) { return !!this._logs.find(x => x.id == id); }

	static async createChatArchive(name: string, chats: ChatMessage[]): Promise<DFChatArchiveEntry> {
		var newId = (game.settings.get('df-chat-archive', 'currentId') as number) + 1;
		game.settings.set('df-chat-archive', 'currentId', newId);
		const entry = {
			id: newId,
			name: name,
			chats: chats
		};
		this._logs.push(entry);
		await game.settings.set('df-chat-archive', 'logs', JSON.stringify(this._logs, null, ''));
		if (DFChatArchive._updateListener != null)
			DFChatArchive._updateListener();
		return entry;
	}

	static async deleteAll() {
		this._logs = [];
		await game.settings.set('df-chat-archive', 'logs', '[]');
		await game.settings.set('df-chat-archive', 'currentId', 0);
		if (DFChatArchive._updateListener != null)
			DFChatArchive._updateListener();
	}

	static async deleteChatArchive(id: Number) {
		this._logs.splice(this._logs.findIndex(x => x.id == id), 1);
		await game.settings.set('df-chat-archive', 'logs', JSON.stringify(this._logs, null, ''));
		if (DFChatArchive._updateListener != null)
			DFChatArchive._updateListener();
	}
}