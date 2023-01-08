import { ChatMessageData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
import SETTINGS from "../../../common/Settings";

export interface DFChatArchiveEntry {
	id: number;
	name: string;
	visible: boolean;
	filename: string;
	filepath: string;
}


class ArchiveFolderMenu extends FormApplication {
	static get defaultOptions() {
		return mergeObject(FormApplication.defaultOptions as Partial<FormApplicationOptions>, {
			width: 400,
			height: 125,
			resizable: false,
			minimizable: false,
			title: 'DF_CHAT_ARCHIVE.Settings.ArchiveFolder_Name',
			template: "modules/df-chat-enhance/templates/archive-folder.hbs",
			submitOnClose: false,
			submitOnChange: false,
			closeOnSubmit: true
		}) as FormApplicationOptions;
	}

	private folder = SETTINGS.get<string>(DFChatArchive.PREF_FOLDER);
	private source = SETTINGS.get<string>(DFChatArchive.PREF_FOLDER_SOURCE);

	getData(_options: any): any {
		return { path: this.folder };
	}

	async _renderInner(data: any): Promise<JQuery<HTMLElement>> {
		const html = await super._renderInner(data);
		const input = html.find('input#dfce-ca-folder-path')[0] as HTMLInputElement;
		html.find('label>button').on('click', async event => {
			event.preventDefault();
			const fp = new FilePicker(<any>{
				title: 'DF_CHAT_ARCHIVE.Settings.ArchiveFolder_Name',
				type: 'folder',
				field: input,
				callback: async (path: string) => {
					this.source = fp.activeSource;
					this.folder = path;
				},
				button: event.currentTarget
			});
			await fp.browse(SETTINGS.get(DFChatArchive.PREF_FOLDER));
		});
		return html;
	}
	protected async _updateObject() {
		await SETTINGS.set<string>(DFChatArchive.PREF_FOLDER, this.folder);
		await SETTINGS.set<string>(DFChatArchive.PREF_FOLDER_SOURCE, this.source);
	}
}

export class DFChatArchive {
	private static readonly PREF_LOGS = 'logs';
	private static readonly PREF_CID = 'currentId';
	static readonly PREF_FOLDER = 'archiveFolder';
	static readonly PREF_FOLDER_SOURCE = 'archiveFolderSource';
	private static readonly PREF_FOLDER_MENU = 'archiveFolderMenu';
	private static _updateListener: () => void = null;

	private static get DATA_FOLDER(): FilePicker.SourceType { return SETTINGS.get(DFChatArchive.PREF_FOLDER_SOURCE); }

	static setUpdateListener(listener: () => void) {
		this._updateListener = listener;
	}

	static registerSettings() {
		SETTINGS.register(this.PREF_LOGS, {
			scope: 'world',
			config: false,
			type: Object,
			default: [],
			onChange: () => {
				if (this._updateListener != null)
					this._updateListener();
			}
		});
		SETTINGS.register(this.PREF_CID, {
			scope: 'world',
			config: false,
			type: Number,
			default: 0
		});

		SETTINGS.registerMenu(this.PREF_FOLDER_MENU, {
			label: 'DF_CHAT_ARCHIVE.Settings.ArchiveFolder_Name',
			hint: 'DF_CHAT_ARCHIVE.Settings.ArchiveFolder_Hint',
			restricted: true,
			type: <any>ArchiveFolderMenu
		});

		SETTINGS.register(this.PREF_FOLDER, {
			scope: 'world',
			config: false,
			type: String,
			default: `worlds/${game.world.id}/chat-archive`,
			onChange: async () => {
				await this.createArchiveFolderIfMissing();
				if (this._updateListener != null)
					this._updateListener();
			}
		});
		SETTINGS.register(this.PREF_FOLDER_SOURCE, {
			scope: 'world',
			config: false,
			type: String,
			default: 'data',
		});
		this.createArchiveFolderIfMissing();
	}

	private static async createArchiveFolderIfMissing() {
		const folder: string = SETTINGS.get(this.PREF_FOLDER);
		await FilePicker.browse(this.DATA_FOLDER, folder)
			.catch(async _ => {
				if (!await FilePicker.createDirectory(this.DATA_FOLDER, folder, {}))
					throw new Error('Could not access the archive folder: ' + folder);
			});
	}

	static getLogs(): DFChatArchiveEntry[] { return SETTINGS.get<DFChatArchiveEntry[]>(this.PREF_LOGS); }
	static getArchive(id: number): DFChatArchiveEntry { return this.getLogs().find(x => x.id == id); }
	static exists(id: number): boolean { return !!this.getLogs().find(x => x.id == id); }

	private static async _generateChatArchiveFile(id: number, name: string, chats: ChatMessage[] | ChatMessageData[], visible: boolean): Promise<DFChatArchiveEntry> {
		// Get the folder path
		const folderPath = SETTINGS.get<string>(this.PREF_FOLDER);
		// Replace special characters in name to underscores
		const safeName = name.replace(/[^ a-z0-9-_()[\]<>]/gi, '_');
		// Generate the system safe filename
		const fileName = (`${id}_${safeName}.json`);
		// Create the File and contents
		const file = new File([JSON.stringify(chats, null, '')], fileName, { type: 'application/json' });
		const response: { path?: string; message?: string } = <any>await FilePicker.upload(this.DATA_FOLDER, folderPath, file);
		if (!response.path) {
			console.error(`Could not create archive ${fileName}\nReason: ${response}`);
			throw new Error('Could not upload the archive to server: ' + fileName);
		}
		const entry: DFChatArchiveEntry = {
			id: id,
			name: name,
			visible: visible,
			filepath: response.path,
			filename: fileName
		};
		return entry;
	}

	static async createChatArchive(name: string, chats: ChatMessage[], visible: boolean): Promise<DFChatArchiveEntry> {
		const newId = SETTINGS.get<number>(this.PREF_CID) + 1;
		SETTINGS.set(this.PREF_CID, newId);
		const entry = await this._generateChatArchiveFile(newId, name, chats, visible);
		const logs = SETTINGS.get<DFChatArchiveEntry[]>(this.PREF_LOGS);
		logs.push(entry);
		await SETTINGS.set(this.PREF_LOGS, logs);
		if (this._updateListener != null)
			this._updateListener();
		return entry;
	}

	static async getArchiveContents(archive: DFChatArchiveEntry): Promise<(ChatMessage | ChatMessageData)[]> {
		const response = await fetch(archive.filepath);
		const data = await response.json().catch(error => console.error(`Failed to read JSON for archive ${archive.filepath}\n${error}`));
		if (response.ok)
			return data as (ChatMessage | ChatMessageData)[];
		else
			throw new Error('Could not access the archive from server side: ' + archive.filepath);
	}

	static async updateChatArchive(archive: DFChatArchiveEntry, newChatData?: (ChatMessage | ChatMessageData)[]): Promise<DFChatArchiveEntry> {
		if (!this.getLogs().find(x => x.id == archive.id))
			throw new Error('Could not locate an archive for the given ID: ' + archive.id.toString());
		// If we are updating the contents of an archive
		if (newChatData) {
			const folderPath = SETTINGS.get<string>(this.PREF_FOLDER);
			const file = new File([JSON.stringify(newChatData)], archive.filename, { type: 'application/json' });
			const response: {
				path?: string;
				message?: string;
			} = <any>await FilePicker.upload(this.DATA_FOLDER, folderPath, file, {});
			if (!response.path)
				throw new Error('Could not upload the archive to server side: ' + archive.id.toString());
		}
		const logs = this.getLogs();
		const idx = logs.findIndex(x => x.id === archive.id);
		if (idx < 0) return archive;
		logs[idx] = archive;
		await SETTINGS.set(DFChatArchive.PREF_LOGS, logs);
		return archive;
	}

	static async deleteAll() {
		const folderPath = SETTINGS.get<string>(this.PREF_FOLDER);
		const logs = SETTINGS.get<DFChatArchiveEntry[]>(this.PREF_LOGS);
		// Can not delete files currently, truncate instead to make filtering easier.
		await Promise.all(logs.map(archive => {
			const file = new File([''], archive.filename, { type: 'application/json' });
			return FilePicker.upload(this.DATA_FOLDER, folderPath, file, {});
		}));
		await SETTINGS.set(this.PREF_LOGS, []);
		if (this._updateListener != null)
			this._updateListener();
	}

	static async deleteChatArchive(id: number) {
		const folderPath = SETTINGS.get<string>(this.PREF_FOLDER);
		const logs = SETTINGS.get<DFChatArchiveEntry[]>(this.PREF_LOGS);
		const entryIdx = logs.findIndex(x => x.id === id);
		if (entryIdx < 0) {
			console.error(`Could not find entry for ID#${id}`);
			return;
		}
		const entry = logs[entryIdx];
		// Cannot delete file currently, instead truncate the file and move along.
		const file = new File([''], entry.filename, { type: 'application/json' });
		await FilePicker.upload(this.DATA_FOLDER, folderPath, file, {});
		logs.splice(entryIdx, 1);
		await SETTINGS.set(this.PREF_LOGS, logs);
		if (this._updateListener != null)
			this._updateListener();
	}
}
