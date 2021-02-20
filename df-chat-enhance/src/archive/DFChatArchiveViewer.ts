import { DFChatArchive, DFChatArchiveEntry } from './DFChatArchive.js';

export default class DFChatArchiveViewer extends Application {
	archive: DFChatArchiveEntry;
	onCloseCallBack: (view: DFChatArchiveViewer) => void;
	constructor(archive: DFChatArchiveEntry, onCloseCallBack: (view: DFChatArchiveViewer) => void) {
		super();
		this.archive = archive;
		this.onCloseCallBack = onCloseCallBack;
	}

	static get defaultOptions() {
		const options = Application.defaultOptions;
		mergeObject(options, {
			template: "modules/df-chat-enhance/templates/archive-viewer.hbs",
			width: 300,
			height: 500,
			resizable: true,
			title: 'DF_CHAT_ARCHIVE.ArchiveViewer_Title',
			classes: ['df-chat-log-window']
		});
		return options;
	}

	getData(options = {}) {
		super.getData(options);
		return {
			name: this.archive.name,
			isGM: game.user.isGM,
			visible: this.archive.visible ?? false,
			logId: 'df-chat-log-' + this.archive.id
		};
	}

	_renderInner(data: {}, options?: any): Promise<JQuery> {
		return super._renderInner(data, options)
			.then(async (html) => {
				html.find("#visible").on('change', async (element) => {
					this.archive.visible = (element.target as HTMLInputElement).checked;
					await DFChatArchive.updateChatArchive(this.archive);
				});
				html.find("#edit").on('click', async () => {
					setTimeout(async () => {
						const dialog = new Dialog({
							title: game.i18n.localize("DF_CHAT_ARCHIVE.ArchiveViewer_NameEdit_Title"),
							content: `<input id="name" type="text" value="${this.archive.name}"/>`,
							buttons: {
								save: {
									icon: '<i class="fas fa-save"></i>',
									label: game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveViewer_NameEdit_Save'),
									callback: async (html) => {
										this.archive.name = $(html).find('#name').val() as string;
										await dialog.close();
										await DFChatArchive.updateChatArchive(this.archive);
										await this.render(false);
									}
								},
								close: {
									icon: '<i class="fas fa-times"></i>',
									label: game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveViewer_NameEdit_Cancel'),
									callback: async () => {
										await dialog.close();
									}
								}
							},
							default: 'save'
						});
						dialog.render(true);
					}, 1);
				});

				const log = html.find('#df-chat-log');
				var m: ChatMessage;
				const messageHtml = [];
				for (let value of this.archive.chats as ChatMessage.Data[]) {
					const cm = value instanceof ChatMessage ? value : new ChatMessage(value);
					try {
						const html = $(await cm.render());
						html.find('a.message-delete').hide();
						messageHtml.push(html);
					} catch (err) {
						console.error(`Chat message ${cm.id} failed to render.\n${err})`);
					}
				}
				// Prepend the HTML
				log.prepend(messageHtml);
				return html;
			});
	}
	close(options = {}): Promise<void> {
		this.onCloseCallBack(this);
		return super.close(options);
	}
}