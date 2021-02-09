import { DFChatArchive } from "./DFChatArchive.js";
import DFChatArchiveViewer from "./DFChatArchiveViewer.js";

export default class DFChatArchiveManager extends Application {
	static chatViewers: Map<Number, DFChatArchiveViewer> = new Map();

	static get defaultOptions() {
		const options = Application.defaultOptions;
		mergeObject(options, {
			template: "modules/df-chat-archive/templates/archive-manager.hbs",
			resizable: true,
			minimizable: true,
			width: 300,
			height: 500,
			title: game.i18n.localize("DF_CHAT_ARCHIVE.ArchiveManager_Title")
		});
		return options;
	}

	getData(options?: any) {
		let data = super.getData(options) as any;
		mergeObject(data, {
			messages: DFChatArchive.getLogs()
		});
		return data;
	}

	private _subscribeView(element: JQuery) {
		element.on('click', function () {
			const id = parseInt($(this).attr('data-id'));
			if (isNaN(id) || !DFChatArchive.exists(id)) {
				ui.notifications.error(game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveManager_ErrorBadId'));
				throw Error(`Invalid id for Chat Archive: '${$(this).attr('data-id')}'`);
			}
			if (DFChatArchiveManager.chatViewers.has(id)) {
				DFChatArchiveManager.chatViewers.get(id).bringToTop();
			} else {
				DFChatArchiveManager.chatViewers.set(id, new DFChatArchiveViewer(DFChatArchive.getArchive(id), view => {
					DFChatArchiveManager.chatViewers.delete(view.archive.id);
				}));
				DFChatArchiveManager.chatViewers.get(id).render(true);
			}
		});
	}
	private _subscribeDelete(element: JQuery) {
		element.on('click', async function () {
			const id = parseInt($(this).attr('data-id'));
			if (isNaN(id) || !DFChatArchive.exists(id)) {
				ui.notifications.error(game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveManager_ErrorBadId'));
				throw Error(`Invalid id for Chat Archive: '${$(this).attr('data-id')}'`);
			}
			const archive = DFChatArchive.getArchive(id);
			await Dialog.confirm({
				title: game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveManager_ConfirmDeleteArchiveTitle'),
				content: game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveManager_ConfirmDeleteArchiveContent').replace('{name}', archive.name),
				defaultYes: false,
				no: () => { },
				yes: async () => await DFChatArchive.deleteChatArchive(id)
			});
		});
	}

	activateListeners(html: JQuery) {
		DFChatArchive.setUpdateListener(this._archiveChanged.bind(this));
		if (DFChatArchive.getLogs().length > 0)
			html.find('p.dfca-no-items').hide();
		html.find('a[data-type="view"]').each((i, element) => { this._subscribeView($(element)) });
		html.find('a[data-type="delete"]').each((i, element) => { this._subscribeDelete($(element)) });
		html.find('#dfca-delete-all').on('click', async function () {
			await Dialog.confirm({
				title: game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveManager_ConfirmDeleteAllTitle'),
				content: game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveManager_ConfirmDeleteAllMessage1'),
				no: () => { },
				defaultYes: false,
				yes: async () => {
					await Dialog.confirm({
						title: game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveManager_ConfirmDeleteAllTitle'),
						content: game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveManager_ConfirmDeleteAllMessage2'),
						no: () => { },
						defaultYes: false,
						yes: async () => {
							await DFChatArchive.deleteAll();
							ui.notifications.info(game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveManager_ConfirmDeleteAllComplete'));
						}
					})
				}
			})
		});
	}

	close(options: {} = {}): Promise<void> {
		DFChatArchive.setUpdateListener(null);
		return super.close(options);
	}

	private async _archiveChanged() {
		const logs = new Map(DFChatArchive.getLogs().map(x => [x.id, x]));
		const elements = new Map<number, JQuery<HTMLElement>>();
		this.element.find('li.dfca-archive-item')
			.each(function () {
				const x = $(this);
				const attr = x.attr('data-id');
				const id = parseInt(attr);
				elements.set(id, x);
			});

		const removed: number[] = [];
		const added: number[] = [];
		if (elements.size == 0) {
			added.push(...logs.keys());
		} else {
			for (let rowId of elements.keys()) {
				if (logs.has(rowId)) continue;
				removed.push(rowId);
			}
			for (let rowId of logs.keys()) {
				if (elements.has(rowId)) continue;
				added.push(rowId);
			}
		}

		// Remove deleted items
		for (let id of removed) {
			elements.get(id).remove();
			elements.delete(id);
		}
		const archiveContainer = this.element.find('#dfca-archives');
		// Add new items
		for (let id of added) {
			const html = $(`
		<li class="dfca-archive-item" data-id="${id}">
			<div>
				<a class="button dfca-view" data-type="view" data-id="${id}"><i class="fas fa-eye"></i><span>${logs.get(id).name}</span></a>
				<a class="button dfca-delete" data-type="delete" data-id="${id}"><i class="fas fa-trash"></i></a>
			</div>
		</li>`);
			this._subscribeView(html.find('a[data-type="view"]'));
			this._subscribeDelete(html.find('a[data-type="delete"]'));
			archiveContainer.append(html);
		}
		if (elements.size == 0 && added.length == 0)
			this.element.find('p.dfca-no-items').show();
		else
			this.element.find('p.dfca-no-items').hide();
	}
}