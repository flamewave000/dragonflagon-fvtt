import CONFIG from '../CONFIG.js';

export interface DFChatArchiveEntry {
	id: number;
	name: string;
	file: string;
	visible: boolean;
	filename: string;
}

export interface ObsoleteDFChatArchiveEntry {
	id: number;
	name: string;
	chats: ChatMessage[] | ChatMessage.Data[];
	visible: boolean;
}

export class DFChatArchive {
	private static readonly PREF_LOGS = 'logs';
	private static readonly PREF_CID = 'currentId';
	private static readonly PREF_FOLDER = 'archiveFolder';
	private static readonly DATA_FOLDER = 'data';
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
			default: '[]',
			onChange: () => {
				this._logs = JSON.parse(game.settings.get(CONFIG.MOD_NAME, DFChatArchive.PREF_LOGS));
				if (DFChatArchive._updateListener != null)
					DFChatArchive._updateListener();
			}
		});
		game.settings.register(CONFIG.MOD_NAME, DFChatArchive.PREF_CID, {
			scope: 'world',
			config: false,
			type: Number,
			default: 0
		});
		game.settings.register(CONFIG.MOD_NAME, DFChatArchive.PREF_FOLDER, {
			scope: 'world',
			config: false,
			type: String,
			default: 'uploaded-chat-archive',
			onChange: () => {
				this.createArchiveFolderIfNotExists(DFChatArchive.DATA_FOLDER, game.settings.get(CONFIG.MOD_NAME, DFChatArchive.PREF_FOLDER));
				this._logs = JSON.parse(game.settings.get(CONFIG.MOD_NAME, DFChatArchive.PREF_LOGS));
				if (DFChatArchive._updateListener != null)
					DFChatArchive._updateListener();
			}
		});
		this.createArchiveFolderIfNotExists(DFChatArchive.DATA_FOLDER, game.settings.get(CONFIG.MOD_NAME, DFChatArchive.PREF_FOLDER));
		this._logs = JSON.parse(game.settings.get(CONFIG.MOD_NAME, DFChatArchive.PREF_LOGS));
	}

	private static createArchiveFolderIfNotExists(origin: string, folder: string) {
		FilePicker.browse(origin, folder)
		.then(loc => {
			if (loc.target == '.')
				FilePicker.createDirectory(origin, folder, {});
		})
		.catch(_ => { throw new Error('Could not access the archive folder: ' + folder) });
	} 

	static getLogs(): DFChatArchiveEntry[] { return this._logs; }
	static getArchive(id: number): DFChatArchiveEntry { return this._logs.find(x => x.id == id); }
	static exists(id: number): boolean { return !!this._logs.find(x => x.id == id); }

	static async createChatArchive(name: string, chats: ChatMessage[], visible: boolean): Promise<DFChatArchiveEntry> {
		var newId = (game.settings.get(CONFIG.MOD_NAME, DFChatArchive.PREF_CID) as number) + 1;
		game.settings.set(CONFIG.MOD_NAME, DFChatArchive.PREF_CID, newId);

		const folderPath = game.settings.get(CONFIG.MOD_NAME, DFChatArchive.PREF_FOLDER) as string;
		// Append some random generated string.
		const fileName = `${game.world.name}_${newId}_${name}.json`.replace(/[\/\?<>\\:\*\|"]|[\x00-\x1f\x80-\x9f]/g, '_');
		const file = new File([JSON.stringify(chats)], fileName, { type: 'application/json' });
		const response = <any> await FilePicker.upload(this.DATA_FOLDER, folderPath, file, {});
		if (!response.path)
			throw new Error('Could not upload the archive to server side: ' + newId.toString());

		const entry = {
			id: newId,
			name: name,
			file: response.path,
			visible: visible,
			filename: fileName
		};
		this._logs.push(entry);
		await game.settings.set(CONFIG.MOD_NAME, DFChatArchive.PREF_LOGS, JSON.stringify(this._logs, null, ''));
		if (DFChatArchive._updateListener != null)
			DFChatArchive._updateListener();
		return entry;
	}

	static async readChatArchive(filePath: string): Promise<ChatMessage[] | ChatMessage.Data[]> {
		const response = await fetch(filePath);
		const data = await response.json().catch(_ => {});
		if (response.ok)
			return data as ChatMessage[] | ChatMessage.Data[];
		else
			throw new Error('Could not access the archive from server side: ' + filePath);
	}

	static async updateChatArchive(archive: DFChatArchiveEntry, newChats?: ChatMessage[] | ChatMessage.Data[]): Promise<DFChatArchiveEntry> {
		const index = this._logs.findIndex(x => x.id == archive.id);
		if (index < 0) throw new Error('Could not locate an archive for the given ID: ' + archive.id.toString());

		if (newChats) {
			const folderPath = game.settings.get(CONFIG.MOD_NAME, DFChatArchive.PREF_FOLDER) as string;
			const file = new File([JSON.stringify(newChats)], archive.filename, { type: 'application/json' });
			const response = <any> await FilePicker.upload(this.DATA_FOLDER, folderPath, file, {});
			if (!response.path)
				throw new Error('Could not upload the archive to server side: ' + archive.id.toString());
		}

		this._logs[index] = archive;
		await game.settings.set(CONFIG.MOD_NAME, DFChatArchive.PREF_LOGS, JSON.stringify(this._logs, null, ''));
		if (DFChatArchive._updateListener != null)
			DFChatArchive._updateListener();
		return archive;
	}

	static async deleteAll() {
		const folderPath = game.settings.get(CONFIG.MOD_NAME, DFChatArchive.PREF_FOLDER) as string;
		// Can not delete file currently, truncate instead to make filtering easier.
		await Promise.all(this._logs.map(entry => {
			const file = new File([''], entry.filename, { type: 'application/json' });
			return FilePicker.upload(this.DATA_FOLDER, folderPath, file, {});
		}))
		this._logs = [];
		await game.settings.set(CONFIG.MOD_NAME, DFChatArchive.PREF_LOGS, '[]');
		await game.settings.set(CONFIG.MOD_NAME, DFChatArchive.PREF_CID, 0);
		if (DFChatArchive._updateListener != null)
			DFChatArchive._updateListener();
	}

	static async deleteChatArchive(id: Number) {
		const folderPath = game.settings.get(CONFIG.MOD_NAME, DFChatArchive.PREF_FOLDER) as string;
		const entry = this._logs.find(x => x.id == id);
		// Can not delete file currently, truncate instead to make filtering easier.
		const file = new File([''], entry.filename, { type: 'application/json' });
		await FilePicker.upload(this.DATA_FOLDER, folderPath, file, {});
		this._logs.splice(this._logs.findIndex(x => x.id == id), 1);
		await game.settings.set(CONFIG.MOD_NAME, DFChatArchive.PREF_LOGS, JSON.stringify(this._logs, null, ''));
		if (DFChatArchive._updateListener != null)
			DFChatArchive._updateListener();
	}

	static async upgradeFromDatabaseEntries() {
		const folderPath = game.settings.get(CONFIG.MOD_NAME, DFChatArchive.PREF_FOLDER) as string;
		const needUpgrades = this._logs
			.filter(x => (<any> x as ObsoleteDFChatArchiveEntry).chats)
			.map(x => (<any> x as ObsoleteDFChatArchiveEntry));

		console.log('DF Chat Enhancements is upgrading obsolete entries: ', needUpgrades);
		if (needUpgrades.length > 0)
			ui.notifications.info('Upgrading DF Chat Enhancements obsolete format records.');

		const newEntries: DFChatArchiveEntry[] = [];
		for (let entry of needUpgrades) {
			const fileName = `${game.world.name}_${entry.id}_${entry.name}.json`
				.replace(/[\/\?<>\\:\*\|"]|[\x00-\x1f\x80-\x9f]/g, '_');
			const file = new File([JSON.stringify(entry.chats)], fileName, { type: 'application/json' });
			const response = <any> await FilePicker.upload(this.DATA_FOLDER, folderPath, file, {});
			if (response.path) {
				newEntries.push({
					id: entry.id,
					name: entry.name,
					file: response.path,
					visible: entry.visible,
					filename: fileName
				} as DFChatArchiveEntry);
			}
		}

		console.log('DF Chat Enhancements upgraded with new entries: ', newEntries);
		for (let entry of newEntries) {
			if (needUpgrades.some(x => x.id == entry.id)) {
				this._logs.splice(this._logs.findIndex(x => x.id == entry.id), 1);
				this._logs.push(entry);

				console.log('DF Chat Enhancements upgraded the entry: ', entry);
			}
		}

		await game.settings.set(CONFIG.MOD_NAME, DFChatArchive.PREF_LOGS, JSON.stringify(this._logs, null, ''));
		if (DFChatArchive._updateListener != null)
			DFChatArchive._updateListener();
		
		if (newEntries.length > 0)
			ui.notifications.info('DF Chat Enhancements records upgraded.');
	}
}