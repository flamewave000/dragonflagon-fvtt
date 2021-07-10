import { DFChatArchive } from "./DFChatArchive.js";
import DFChatArchiveViewer from "./DFChatArchiveViewer.js";

export default class DFChatArchiveManager extends Application {
	static chatViewers: Map<Number, DFChatArchiveViewer> = new Map();

	static get defaultOptions() {
		return mergeObject(Application.defaultOptions as Partial<Application.Options>, {
			template: "modules/df-chat-enhance/templates/archive-manager.hbs",
			resizable: true,
			minimizable: true,
			width: 300,
			height: 500,
			title: game.i18n.localize("DF_CHAT_ARCHIVE.ArchiveManager_Title")
		}) as Application.Options;
	}

	getData(options?: any) {
		let data = super.getData(options);
		var messages = DFChatArchive.getLogs();
		if (!game.user.isGM)
			messages = messages.filter(x => x.visible);
		mergeObject(data, { messages: messages, isGM: game.user.isGM });
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
				defaultYes: false,
				yes: async () => {
					await Dialog.confirm({
						title: game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveManager_ConfirmDeleteAllTitle'),
						content: game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveManager_ConfirmDeleteAllMessage2'),
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

	close(options: {} = {}): Promise<unknown> {
		DFChatArchive.setUpdateListener(null);
		return super.close(options);
	}

	private async _archiveChanged() {
		var logs = DFChatArchive.getLogs();
		if (!game.user.isGM)
			logs = logs.filter(x => x.visible);
		const archiveContainer = this.element.find('#dfca-archives');
		archiveContainer.empty();
		// Add new items
		for (let archive of logs) {
			const visible = archive.visible === true
				? `<i class="dfca-visible fas fa-users" title="${game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveManager_VisibleToPlayers')}"></i>` : '';
			const html = $(`
		<li class="dfca-archive-item" data-id="${archive.id}">
			<div>
				<a class="button dfca-view" data-type="view" data-id="${archive.id}"><i class="fas fa-eye"></i>
					<span>${archive.name}</span>
				</a>
				${visible}
				<a class="button dfca-delete" data-type="delete" data-id="${archive.id}"><i class="fas fa-trash"></i></a>
			</div>
		</li>`);
			this._subscribeView(html.find('a[data-type="view"]'));
			this._subscribeDelete(html.find('a[data-type="delete"]'));
			archiveContainer.append(html);
		}
		if (archiveContainer[0].children.length == 0)
			this.element.find('p.dfca-no-items').show();
		else
			this.element.find('p.dfca-no-items').hide();
	}
}