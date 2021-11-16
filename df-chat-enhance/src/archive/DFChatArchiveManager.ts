import SETTINGS from "../../../common/Settings";
import { DFChatArchive } from "./DFChatArchive";
import DFChatArchiveViewer from "./DFChatArchiveViewer";

export default class DFChatArchiveManager extends Application {
	static readonly PREF_REVERSE_SORT = 'dfca-manager-reverseSort';
	static chatViewers: Map<number, DFChatArchiveViewer> = new Map();

	static get defaultOptions() {
		return mergeObject(Application.defaultOptions as Partial<Application.Options>, {
			template: "modules/df-chat-enhance/templates/archive-manager.hbs",
			resizable: true,
			minimizable: true,
			width: 300,
			height: 500,
			title: "DF_CHAT_ARCHIVE.ArchiveManager_Title".localize()
		}) as Application.Options;
	}

	getData(options?: any) {
		const data = super.getData(options);
		let messages = DFChatArchive.getLogs();
		if (!game.user.isGM)
			messages = messages.filter(x => x.visible);
		messages = messages.sort((a, b) => a.name.localeCompare(b.name));
		const reverseSort = SETTINGS.get<boolean>(DFChatArchiveManager.PREF_REVERSE_SORT);
		mergeObject(data, {
			messages: reverseSort ? messages.reverse() : messages,
			isGM: game.user.isGM,
			reverseSort
		});
		return data;
	}

	private _subscribeView(element: JQuery) {
		element.on('click', function () {
			const id = parseInt($(this).attr('data-id'));
			if (isNaN(id) || !DFChatArchive.exists(id)) {
				ui.notifications.error('DF_CHAT_ARCHIVE.ArchiveManager_ErrorBadId'.localize());
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
				ui.notifications.error('DF_CHAT_ARCHIVE.ArchiveManager_ErrorBadId'.localize());
				throw Error(`Invalid id for Chat Archive: '${$(this).attr('data-id')}'`);
			}
			const archive = DFChatArchive.getArchive(id);
			await Dialog.confirm({
				title: 'DF_CHAT_ARCHIVE.ArchiveManager_ConfirmDeleteArchiveTitle'.localize(),
				content: 'DF_CHAT_ARCHIVE.ArchiveManager_ConfirmDeleteArchiveContent'.localize().replace('{name}', archive.name),
				defaultYes: false,
				yes: async () => await DFChatArchive.deleteChatArchive(id)
			});
		});
	}

	activateListeners(html: JQuery) {
		DFChatArchive.setUpdateListener(this._archiveChanged.bind(this));
		if (DFChatArchive.getLogs().length > 0)
			html.find('p.dfca-no-items').hide();
		html.find('a[data-type="view"]').each((i, element) => { this._subscribeView($(element)); });
		html.find('a[data-type="delete"]').each((i, element) => { this._subscribeDelete($(element)); });
		html.find('#dfca-delete-all').on('click', async function () {
			await Dialog.confirm({
				title: 'DF_CHAT_ARCHIVE.ArchiveManager_ConfirmDeleteAllTitle'.localize(),
				content: 'DF_CHAT_ARCHIVE.ArchiveManager_ConfirmDeleteAllMessage1'.localize(),
				defaultYes: false,
				yes: async () => {
					await Dialog.confirm({
						title: 'DF_CHAT_ARCHIVE.ArchiveManager_ConfirmDeleteAllTitle'.localize(),
						content: 'DF_CHAT_ARCHIVE.ArchiveManager_ConfirmDeleteAllMessage2'.localize(),
						defaultYes: false,
						yes: async () => {
							await DFChatArchive.deleteAll();
							ui.notifications.info('DF_CHAT_ARCHIVE.ArchiveManager_ConfirmDeleteAllComplete'.localize());
						}
					});
				}
			});
		});
		const asc = html.find('#dfca-sort-asc');
		const dsc = html.find('#dfca-sort-dsc');
		asc.on('click', async () => {
			await SETTINGS.set(DFChatArchiveManager.PREF_REVERSE_SORT, true);
			asc.hide();
			dsc.show();
			this.render();
		});
		dsc.on('click', async () => {
			await SETTINGS.set(DFChatArchiveManager.PREF_REVERSE_SORT, false);
			dsc.hide();
			asc.show();
			this.render();
		});
	}

	close(options?: any): Promise<void> {
		DFChatArchive.setUpdateListener(null);
		return super.close(options);
	}

	private async _archiveChanged() {
		let logs = DFChatArchive.getLogs();
		if (!game.user.isGM)
			logs = logs.filter(x => x.visible);
		const archiveContainer = this.element.find('#dfca-archives');
		archiveContainer.empty();
		// Add new items
		for (const archive of logs) {
			const visible = archive.visible === true
				? `<i class="dfca-visible fas fa-users" title="${'DF_CHAT_ARCHIVE.ArchiveManager_VisibleToPlayers'.localize()}"></i>` : '';
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