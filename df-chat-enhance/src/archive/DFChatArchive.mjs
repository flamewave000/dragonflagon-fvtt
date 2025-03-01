/// <reference path="../../../fvtt-scripts/foundry.js" />
/// <reference path="../../../common/foundry.d.ts" />
/// <reference path="./types.d.ts" />
import SETTINGS from "../../common/Settings.mjs";

class ArchiveFolderMenu extends FormApplication {
	/**@type {FormApplicationOptions}*/
	static get defaultOptions() {
		return foundry.utils.mergeObject(FormApplication.defaultOptions, {
			width: 400,
			height: 125,
			resizable: false,
			minimizable: false,
			title: 'DF_CHAT_ARCHIVE.Settings.ArchiveFolder_Name',
			template: "modules/df-chat-enhance/templates/archive-folder.hbs",
			submitOnClose: false,
			submitOnChange: false,
			closeOnSubmit: true
		});
	}

	/**@type {string}*/
	#folder = SETTINGS.get(DFChatArchive.PREF_FOLDER);
	/**@type {string}*/
	#source = SETTINGS.get(DFChatArchive.PREF_FOLDER_SOURCE);

	/**
	 * @param {*} _options 
	 * @returns {*}
	 */
	getData(_options) {
		return { path: this.#folder };
	}

	/**
	 * @param {*} data
	 * @returns {Promise<JQuery<HTMLElement>}
	 */
	async _renderInner(data) {
		const html = await super._renderInner(data);
		/**@type {HTMLInputElement}*/
		const input = html.find('input#dfce-ca-folder-path')[0];
		html.find('label>button').on('click', async event => {
			event.preventDefault();
			const fp = new FilePicker({
				title: 'DF_CHAT_ARCHIVE.Settings.ArchiveFolder_Name',
				type: 'folder',
				field: input,
				callback: async (path) => {
					this.#source = fp.activeSource;
					this.#folder = path;
				},
				button: event.currentTarget
			});
			await fp.browse(SETTINGS.get(DFChatArchive.PREF_FOLDER));
		});
		return html;
	}
	/** @protected */
	async _updateObject() {
		await SETTINGS.set(DFChatArchive.PREF_FOLDER, this.#folder);
		await SETTINGS.set(DFChatArchive.PREF_FOLDER_SOURCE, this.#source);
	}
}

export class DFChatArchive {
	/**@readonly*/ static #PREF_LOGS = 'logs';
	/**@readonly*/ static #PREF_CID = 'currentId';
	/**@readonly*/ static PREF_FOLDER = 'archiveFolder';
	/**@readonly*/ static PREF_FOLDER_SOURCE = 'archiveFolderSource';
	/**@readonly*/ static #PREF_FOLDER_MENU = 'archiveFolderMenu';
	/**@type {(() => void) | null}*/
	static #_updateListener = null;

	/**@type {string}*/
	static get #DATA_FOLDER() { return SETTINGS.get(DFChatArchive.PREF_FOLDER_SOURCE); }

	/**
	 * @param {()=>void} listener
	 */
	static setUpdateListener(listener) {
		this.#_updateListener = listener;
	}

	static registerSettings() {
		SETTINGS.register(this.#PREF_LOGS, {
			scope: 'world',
			config: false,
			type: Object,
			default: [],
			onChange: () => {
				if (this.#_updateListener != null)
					this.#_updateListener();
			}
		});
		SETTINGS.register(this.#PREF_CID, {
			scope: 'world',
			config: false,
			type: Number,
			default: 0
		});

		SETTINGS.registerMenu(this.#PREF_FOLDER_MENU, {
			label: 'DF_CHAT_ARCHIVE.Settings.ArchiveFolder_Name',
			hint: 'DF_CHAT_ARCHIVE.Settings.ArchiveFolder_Hint',
			name: 'DF_CHAT_ARCHIVE.Settings.ArchiveFolder_Name',
			icon: 'fas fa-folder-tree',
			restricted: true,
			type: ArchiveFolderMenu
		});

		SETTINGS.register(this.PREF_FOLDER, {
			scope: 'world',
			config: false,
			type: String,
			default: `worlds/${game.world.id}/chat-archive`,
			onChange: async () => {
				await this.#createArchiveFolderIfMissing();
				if (this.#_updateListener != null)
					this.#_updateListener();
			}
		});
		SETTINGS.register(this.PREF_FOLDER_SOURCE, {
			scope: 'world',
			config: false,
			type: String,
			default: 'data',
		});
		this.#createArchiveFolderIfMissing();
	}

	static async #createArchiveFolderIfMissing() {
		/**@type {string}*/
		const folder = SETTINGS.get(this.PREF_FOLDER);
		await FilePicker.browse(this.#DATA_FOLDER, folder).catch(async _ => {
			if (!await FilePicker.createDirectory(this.#DATA_FOLDER, folder, {}))
				throw new Error('Could not access the archive folder: ' + folder);
		});
	}

	/** @returns {DFChatArchiveEntry[]} */
	static getLogs() { return SETTINGS.get(this.#PREF_LOGS); }
	/**
	 * @param {number} id
	 * @returns {DFChatArchiveEntry}
	 */
	static getArchive(id) { return this.getLogs().find(x => x.id == id); }
	/**
	 * @param {number} id
	 * @returns {boolean}
	 */
	static exists(id) { return !!this.getLogs().find(x => x.id == id); }

	/**
	 * @param {number} id
	 * @param {string} name
	 * @param {ChatMessage[]} chats
	 * @param {boolean} visible
	 * @returns {Promise<DFChatArchiveEntry>}
	 */
	static async #_generateChatArchiveFile(id, name, chats, visible) {
		// Get the folder path
		/**@type {string}*/
		const folderPath = SETTINGS.get(this.PREF_FOLDER);
		// Replace any non-written character with an underscore. This should preserve both English and other languages' written characters.
		const safeName = name.replace(/[^\p{L}\d]/gu, '_');
		// Generate the system safe filename
		const fileName = `${id}_${safeName}.json`;
		// Create the File and contents
		const file = new File([JSON.stringify(chats, null, '')], fileName, { type: 'application/json' });
		/**@type { { path?: string; message?: string } }*/
		const response = await FilePicker.upload(this.#DATA_FOLDER, folderPath, file);
		if (!response.path) {
			console.error(`Could not create archive ${fileName}\nReason: ${response}`);
			throw new Error('Could not upload the archive to server: ' + fileName);
		}
		/**@type {DFChatArchiveEntry}*/
		const entry = {
			id: id,
			name: name,
			visible: visible,
			filepath: response.path,
			filename: fileName
		};
		return entry;
	}

	/**
	 * @param {string} name
	 * @param {ChatMessage[]} chats
	 * @param {boolean} visible
	 * @returns {Promise<DFChatArchiveEntry}
	 */
	static async createChatArchive(name, chats, visible) {
		const newId = SETTINGS.get(this.#PREF_CID) + 1;
		SETTINGS.set(this.#PREF_CID, newId);
		const entry = await this.#_generateChatArchiveFile(newId, name, chats, visible);
		/**@type {DFChatArchiveEntry[]}*/
		const logs = SETTINGS.get(this.#PREF_LOGS);
		logs.push(entry);
		await SETTINGS.set(this.#PREF_LOGS, logs);
		if (this.#_updateListener != null)
			this.#_updateListener();
		return entry;
	}

	/**
	 * @param {DFChatArchiveEntry} archive
	 * @returns {Promise<ChatMessage[]>}
	 */
	static async getArchiveContents(archive) {
		const response = await fetch(archive.filepath);
		/**@type {ChatMessage[]}*/
		const data = await response.json().catch(error => console.error(`Failed to read JSON for archive ${archive.filepath}\n${error}`));
		if (response.ok)
			return data;
		else
			throw new Error('Could not access the archive from server side: ' + archive.filepath);
	}

	/**
	 * @param {DFChatArchiveEntry} archive
	 * @param {ChatMessage[]} [newChatData]
	 * @returns {Promise<DFChatArchiveEntry>}
	 */
	static async updateChatArchive(archive, newChatData) {
		if (!this.getLogs().find(x => x.id == archive.id))
			throw new Error('Could not locate an archive for the given ID: ' + archive.id.toString());
		// If we are updating the contents of an archive
		if (newChatData) {
			const folderPath = SETTINGS.get(this.PREF_FOLDER);
			const file = new File([JSON.stringify(newChatData)], archive.filename, { type: 'application/json' });
			/**@type { {path?: string, message?: string} }*/
			const response = await FilePicker.upload(this.#DATA_FOLDER, folderPath, file, {});
			if (!response.path)
				throw new Error('Could not upload the archive to server side: ' + archive.id.toString());
		}
		const logs = this.getLogs();
		const idx = logs.findIndex(x => x.id === archive.id);
		if (idx < 0) return archive;
		logs[idx] = archive;
		await SETTINGS.set(DFChatArchive.#PREF_LOGS, logs);
		return archive;
	}

	static async deleteAll() {
		/**@type {string}*/
		const folderPath = SETTINGS.get(this.PREF_FOLDER);
		/**@type {DFChatArchiveEntry[]}*/
		const logs = SETTINGS.get(this.#PREF_LOGS);
		// Can not delete files currently, truncate instead to make filtering easier.
		await Promise.all(logs.map(archive => {
			const file = new File([''], archive.filename, { type: 'application/json' });
			return FilePicker.upload(this.#DATA_FOLDER, folderPath, file, {});
		}));
		await SETTINGS.set(this.#PREF_LOGS, []);
		if (this.#_updateListener != null)
			this.#_updateListener();
	}

	/**
	 * @param {number} id
	 * @returns {Promise<void>}
	 */
	static async deleteChatArchive(id) {
		/**@type {string}*/
		const folderPath = SETTINGS.get(this.PREF_FOLDER);
		/**@type {DFChatArchiveEntry[]}*/
		const logs = SETTINGS.get(this.#PREF_LOGS);
		const entryIdx = logs.findIndex(x => x.id === id);
		if (entryIdx < 0) {
			console.error(`Could not find entry for ID#${id}`);
			return;
		}
		const entry = logs[entryIdx];
		// Cannot delete file currently, instead truncate the file and move along.
		const file = new File([''], entry.filename, { type: 'application/json' });
		await FilePicker.upload(this.#DATA_FOLDER, folderPath, file, {});
		logs.splice(entryIdx, 1);
		await SETTINGS.set(this.#PREF_LOGS, logs);
		if (this.#_updateListener != null)
			this.#_updateListener();
	}
}
