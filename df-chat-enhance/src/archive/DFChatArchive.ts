import CONFIG from '../CONFIG.js';

export interface DFChatArchiveEntry {
	id: number;
	name: string;
	chats: ChatMessage[] | ChatMessage.Data[];
}

export class DFChatArchive {
	private static readonly PREF_LOGS = 'logs';
	private static readonly PREF_CID = 'currentId';
	private static _updateListener: () => void = null;
	private static _logs: DFChatArchiveEntry[]

	static setUpdateListener(listener: () => void) {
		this._updateListener = listener;
	}

	static registerSettings() {
		game.settings.register(CONFIG.MOD_NAME, DFChatArchive.PREF_LOGS, {
			scope: 'world',
			config: false,
			type: String,
			default: '[]'
		});
		game.settings.register(CONFIG.MOD_NAME, DFChatArchive.PREF_CID, {
			scope: 'world',
			config: false,
			type: Number,
			default: 0
		});
		this._logs = JSON.parse(game.settings.get(CONFIG.MOD_NAME, DFChatArchive.PREF_LOGS));
	}

	static getLogs() { return this._logs; }
	static getArchive(id: number) { return this._logs.find(x => x.id == id); }
	static exists(id: number) { return !!this._logs.find(x => x.id == id); }

	static async createChatArchive(name: string, chats: ChatMessage[]): Promise<DFChatArchiveEntry> {
		var newId = (game.settings.get(CONFIG.MOD_NAME, DFChatArchive.PREF_CID) as number) + 1;
		game.settings.set(CONFIG.MOD_NAME, DFChatArchive.PREF_CID, newId);
		const entry = {
			id: newId,
			name: name,
			chats: chats
		};
		this._logs.push(entry);
		await game.settings.set(CONFIG.MOD_NAME, DFChatArchive.PREF_LOGS, JSON.stringify(this._logs, null, ''));
		if (DFChatArchive._updateListener != null)
			DFChatArchive._updateListener();
		return entry;
	}

	static async deleteAll() {
		this._logs = [];
		await game.settings.set(CONFIG.MOD_NAME, DFChatArchive.PREF_LOGS, '[]');
		await game.settings.set(CONFIG.MOD_NAME, DFChatArchive.PREF_CID, 0);
		if (DFChatArchive._updateListener != null)
			DFChatArchive._updateListener();
	}

	static async deleteChatArchive(id: Number) {
		this._logs.splice(this._logs.findIndex(x => x.id == id), 1);
		await game.settings.set(CONFIG.MOD_NAME, DFChatArchive.PREF_LOGS, JSON.stringify(this._logs, null, ''));
		if (DFChatArchive._updateListener != null)
			DFChatArchive._updateListener();
	}
}