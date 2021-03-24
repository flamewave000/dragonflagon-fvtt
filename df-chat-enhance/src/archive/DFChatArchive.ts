import CONFIG from '../CONFIG.js';
import SETTINGS from '../SETTINGS.js';

export interface DFChatArchiveEntry {
	id: number;
	name: string;
	world: string;
	visible: boolean;
	filename: string;
	filepath: string;
}

/** @deprecated */
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

	static setUpdateListener(listener: () => void) {
		this._updateListener = listener;
	}

	static registerSettings() {
		SETTINGS.register(DFChatArchive.PREF_LOGS, {
			scope: 'world',
			config: false,
			type: String,
			default: '[]',
			onChange: () => {
				if (DFChatArchive._updateListener != null)
					DFChatArchive._updateListener();
			}
		});
		SETTINGS.register(DFChatArchive.PREF_CID, {
			scope: 'world',
			config: false,
			type: Number,
			default: 0
		});
		SETTINGS.register(DFChatArchive.PREF_FOLDER, {
			scope: 'world',
			config: false,
			type: String,
			default: `worlds/${game.world.name}/chat-archive`,
			onChange: () => {
				this.createArchiveFolderIfMissing(DFChatArchive.DATA_FOLDER, game.settings.get(CONFIG.MOD_NAME, DFChatArchive.PREF_FOLDER));
				if (DFChatArchive._updateListener != null)
					DFChatArchive._updateListener();
			}
		});
		this.createArchiveFolderIfMissing(DFChatArchive.DATA_FOLDER, game.settings.get(CONFIG.MOD_NAME, DFChatArchive.PREF_FOLDER));
	}

	private static createArchiveFolderIfMissing(origin: string, folder: string) {
		FilePicker.browse(origin, folder)
			.then(loc => {
				if (loc.target == '.')
					FilePicker.createDirectory(origin, folder, {});
			})
			.catch(_ => { throw new Error('Could not access the archive folder: ' + folder) });
	}

	static getLogs(): DFChatArchiveEntry[] { return SETTINGS.get<DFChatArchiveEntry[]>(this.PREF_LOGS).filter(x => x.world === game.world.name); }
	static getArchive(id: number): DFChatArchiveEntry { return this.getLogs().find(x => x.id == id); }
	static exists(id: number): boolean { return !!this.getLogs().find(x => x.id == id); }

	private static async _generateChatArchiveFile(id: number, name: string, chats: ChatMessage[] | ChatMessage.ChatData[], visible: boolean): Promise<DFChatArchiveEntry> {
		// Get the folder path
		const folderPath = SETTINGS.get<string>(DFChatArchive.PREF_FOLDER);
		// Generate the system safe filename
		const fileName = encodeURI(`${id}_${name}.json`);
		// Create the File and contents
		const file = new File([JSON.stringify(chats, null, '')], fileName, { type: 'application/json' });
		const response: { path?: string; message?: string } = <any>await FilePicker.upload(this.DATA_FOLDER, folderPath, file);
		if (!response.path)
			throw new Error('Could not upload the archive to server: ' + fileName);
		const entry: DFChatArchiveEntry = {
			id: id,
			name: name,
			visible: visible,
			world: game.world.name,
			filepath: response.path,
			filename: fileName
		};
		return entry;
	}

	static async createChatArchive(name: string, chats: ChatMessage[], visible: boolean): Promise<DFChatArchiveEntry> {
		var newId = (game.settings.get(CONFIG.MOD_NAME, DFChatArchive.PREF_CID) as number) + 1;
		game.settings.set(CONFIG.MOD_NAME, DFChatArchive.PREF_CID, newId);
		const entry = await this._generateChatArchiveFile(newId, name, chats, visible);
		const logs = SETTINGS.get<DFChatArchiveEntry[]>(this.PREF_LOGS);
		logs.push(entry);
		await SETTINGS.set(DFChatArchive.PREF_LOGS, JSON.stringify(logs, null, ''));
		if (DFChatArchive._updateListener != null)
			DFChatArchive._updateListener();
		return entry;
	}

	static async readChatArchive(filePath: string): Promise<ChatMessage[] | ChatMessage.Data[]> {
		const response = await fetch(filePath);
		const data = await response.json().catch(error => console.error(`Failed to read JSON for archive ${filePath}\n${error}`));
		if (response.ok)
			return data as ChatMessage[] | ChatMessage.Data[];
		else
			throw new Error('Could not access the archive from server side: ' + filePath);
	}

	static async updateChatArchive(archive: DFChatArchiveEntry, newChatData?: ChatMessage[] | ChatMessage.Data[]): Promise<DFChatArchiveEntry> {
		if (!this.getLogs().find(x => x.id == archive.id))
			throw new Error('Could not locate an archive for the given ID: ' + archive.id.toString());
		// If we are updating the contents of an archive
		if (!!newChatData) {
			const folderPath = SETTINGS.get<string>(DFChatArchive.PREF_FOLDER);
			const file = new File([JSON.stringify(newChatData)], archive.filename, { type: 'application/json' });
			const response: {
				path?: string;
				message?: string;
			} = <any>await FilePicker.upload(this.DATA_FOLDER, folderPath, file, {});
			if (!response.path)
				throw new Error('Could not upload the archive to server side: ' + archive.id.toString());
		}
		if (DFChatArchive._updateListener != null)
			DFChatArchive._updateListener();
		return archive;
	}

	static async deleteAll() {
		const folderPath = SETTINGS.get<string>(this.PREF_FOLDER);
		var logs = SETTINGS.get<DFChatArchiveEntry[]>(this.PREF_LOGS);

		// Can not delete files currently, truncate instead to make filtering easier.
		await Promise.all(logs.filter(x => x.world === game.world.name).map(archive => {
			const file = new File([''], archive.filename, { type: 'application/json' });
			return FilePicker.upload(this.DATA_FOLDER, folderPath, file, {});
		}));
		logs = logs.filter(x => x.world !== game.world.name);
		await SETTINGS.set(DFChatArchive.PREF_LOGS, JSON.stringify(logs));
		if (DFChatArchive._updateListener != null)
			DFChatArchive._updateListener();
	}

	static async deleteChatArchive(id: Number) {
		const folderPath = SETTINGS.get<string>(this.PREF_FOLDER);
		const logs = SETTINGS.get<DFChatArchiveEntry[]>(this.PREF_LOGS);
		const entryIdx = logs.findIndex(x => x.id === id)
		if (entryIdx < 0) {
			console.error(`Could not find entry for ID#${id}`);
			return;
		}
		const entry = logs[entryIdx];
		// Cannot delete file currently, instead truncate the file and move along.
		const file = new File([''], entry.filename, { type: 'application/json' });
		await FilePicker.upload(this.DATA_FOLDER, folderPath, file, {});
		logs.splice(entryIdx, 1);
		await SETTINGS.set(DFChatArchive.PREF_LOGS, JSON.stringify(logs, null, ''));
		if (DFChatArchive._updateListener != null)
			DFChatArchive._updateListener();
	}

	static async upgradeFromDatabaseEntries() {
		if (!game.user.isGM)
			return;

		const logData: ObsoleteDFChatArchiveEntry[] | DFChatArchiveEntry[] = SETTINGS.get(this.PREF_LOGS);
		const needUpgrades = (<ObsoleteDFChatArchiveEntry[]>logData).filter(x => x.chats !== undefined);
		const logs = (<DFChatArchiveEntry[]>logData).filter(x => x.filename !== undefined);

		console.log('DF Chat Enhancements: Upgrading obsolete entries: ', needUpgrades);
		if (needUpgrades.length > 0)
			ui.notifications.info('DF Chat Enhancements: Migrating Chat Archive data...');

		const newEntries: DFChatArchiveEntry[] = [];
		for (let entry of needUpgrades) {
			newEntries.push(await this._generateChatArchiveFile(entry.id, entry.name, entry.chats, entry.visible));
		}

		console.log('DF Chat Enhancements: upgraded entries: ', JSON.stringify(newEntries, null, '\t'));
		logs.push(...newEntries);

		if (newEntries.length > 0) {
			await SETTINGS.set(DFChatArchive.PREF_LOGS, JSON.stringify(logs, null, ''));
			if (DFChatArchive._updateListener != null)
				DFChatArchive._updateListener();
		}
		ui.notifications.info('DF Chat Enhancements: Migration complete.');
	}
}