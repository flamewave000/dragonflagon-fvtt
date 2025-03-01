/// <reference path="../../../fvtt-scripts/foundry.js" />
/// <reference path="./types.d.ts" />
import { DFChatArchive } from './DFChatArchive.mjs';
import ChatTime from '../chat-time/chat-time.mjs';

export default class DFChatArchiveViewer extends Application {
	/**@type {DFChatArchiveEntry}*/ archive;
	/**@type {ChatMessage[]}*/ messages;
	/**@type {(view: DFChatArchiveViewer) => void}*/ onCloseCallBack;
	/**
	 * @param {DFChatArchiveEntry} archive
	 * @param {(view: DFChatArchiveViewer) => void} onCloseCallBack
	 */
	constructor(archive, onCloseCallBack) {
		super();
		this.archive = archive;
		this.onCloseCallBack = onCloseCallBack;
	}

	/**@type {ApplicationOptions}*/
	static get defaultOptions() {
		return foundry.utils.mergeObject(Application.defaultOptions, {
			template: "modules/df-chat-enhance/templates/archive-viewer.hbs",
			width: 300,
			height: 500,
			resizable: true,
			title: 'DF_CHAT_ARCHIVE.ArchiveViewer_Title',
			classes: ['df-chat-log-window']
		});
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

	/**
	 * @param {*} data
	 * @returns {Promise<JQuery>}
	 */
	_renderInner(data) {
		return super._renderInner(data)
			.then(async (/**@type {JQuery<HTMLElement>}*/ html) => {
				html.find("#visible-df-chat-log-" + this.archive.id).on('change', async (element) => {
					this.archive.visible = element.target.checked;
					await DFChatArchive.updateChatArchive(this.archive);
				});
				html.find("#edit").on('click', async () => {
					setTimeout(async () => {
						const dialog = new Dialog({
							title: "DF_CHAT_ARCHIVE.ArchiveViewer_NameEdit_Title".localize(),
							content: `<input id="name" type="text" value="${this.archive.name}"/>`,
							buttons: {
								save: {
									icon: '<i class="fas fa-save"></i>',
									label: 'DF_CHAT_ARCHIVE.ArchiveViewer_NameEdit_Save'.localize(),
									callback: async (html) => {
										this.archive.name = $(html).find('#name').val();
										await dialog.close();
										await DFChatArchive.updateChatArchive(this.archive);
										await this.render(false);
									}
								},
								close: {
									icon: '<i class="fas fa-times"></i>',
									label: 'DF_CHAT_ARCHIVE.ArchiveViewer_NameEdit_Cancel'.localize(),
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
				html.find('#print').on('click', async () => {
					const clone = html.find('#df-chat-log').clone();
					clone.addClass('df-chat-print');
					$('body').hide();
					$('html').addClass('df-chat-print');
					$('html').append(clone);
					window.print();
					clone.remove();
					$('html').removeClass('df-chat-print');
					$('body').show();
				});
				html.find('#merge').on('click', async () => {
					if (DFChatArchive.getLogs().length == 1) {
						ui.notifications.info('DF_CHAT_ARCHIVE.ArchiveViewer_Merge_OnlyOneArchive'.localize());
						return;
					}
					const dialog = new Dialog({
						title: 'DF_CHAT_ARCHIVE.ArchiveViewer_Merge_Title'.localize(),
						default: 'merge',
						content: await renderTemplate('modules/df-chat-enhance/templates/archive-merge.hbs', {
							id: this.archive.id,
							name: this.archive.name,
							archives: DFChatArchive.getLogs().filter(x => x.id != this.archive.id)
						}),
						buttons: {
							cancel: {
								icon: '<i class="fas fa-times"></i>',
								label: 'DF_CHAT_ARCHIVE.ArchiveViewer_Merge_Cancel'.localize(),
								callback: async () => await dialog.close()
							},
							merge: {
								icon: '<i class="fas fa-sitemap"></i>',
								label: 'DF_CHAT_ARCHIVE.ArchiveViewer_Merge_Merge'.localize(),
								callback: async (html) => {
									/**@type {string}*/
									const val = $(html).find('#archive').val();
									if (isNaN(parseInt(val))) return;
									const id = parseInt(val);
									const source = DFChatArchive.getLogs().find(x => x.id == id);
									const currentChats = await DFChatArchive.getArchiveContents(this.archive);
									const sourceChats = await DFChatArchive.getArchiveContents(source);
									/**@type {ChatMessage[]}*/
									const mergedChats = currentChats
										.concat(sourceChats)
										.sort((a, b) => a.timestamp - b.timestamp);
									await DFChatArchive.updateChatArchive(this.archive, mergedChats);
									this.render(true);
									if (($(html).find('#delete-' + this.archive.id)[0]).checked) {
										await DFChatArchive.deleteChatArchive(id);
									}
								}
							}
						}
					});
					await dialog.render(true);
				});

				html.find('#html').on('click', () => {
					const data = $('<div></div>').append(html.find('#df-chat-log').clone()).html();
					const anchor = document.createElement('a');
					anchor.download = encodeURI(this.archive.name) + '.html';
					// anchor.href = "data:text/html;base64," + btoa(unescape(encodeURIComponent(data)));
					anchor.href = "data:text/html," + encodeURIComponent(data);
					anchor.click();
				});

				const log = html.find('#df-chat-log');
				const messageHtml = [];
				/**@type {ChatMessage[]}*/
				this.messages = await DFChatArchive.getArchiveContents(this.archive);
				this.messages = this.messages.filter(x => game.user.isGM || x.author.id === game.userId || x.whisper.length == 0 || x.whisper.some(x => x === game.userId));

				/**@type {string[]}*/
				const deletionList = [];
				const deleteButton = html.find('#dfal-save-changes');
				for (const value of this.messages) {
					const chatMessage = value instanceof ChatMessage ? value : new ChatMessage(value);
					try {
						/**@type {JQuery<HTMLElement>}*/
						const html = await chatMessage.getHTML();
						ChatTime.renderChatMessage(chatMessage, html);
						const deleteButton = html.find('a.message-delete');
						// if we only have 1 message, don't allow it to be deleted. They might as well just delete the archive
						if (this.messages.length == 1)
							deleteButton.hide();
						deleteButton.on('click', (/**@type {JQuery.ClickEvent}*/event) => {
								const messageHtml = $(event.target.parentElement?.parentElement?.parentElement?.parentElement);
								const buttonIcon = $(event.target);
								if (messageHtml.hasClass('dfal-deleted')) {
									messageHtml.removeClass('dfal-deleted');
									buttonIcon.removeClass('fa-redo-alt');
									buttonIcon.addClass('fa-trash');
									deletionList.splice(deletionList.findIndex(x => x === messageHtml.attr('data-message-id')), 1);
								} else {
									messageHtml.addClass('dfal-deleted');
									buttonIcon.removeClass('fa-trash');
									buttonIcon.addClass('fa-redo-alt');
									deletionList.push(messageHtml.attr('data-message-id'));
								}
								if (deletionList.length > 0) deleteButton.show();
								else deleteButton.hide();
							});
						messageHtml.push(html);
					} catch (err) {
						console.error(`Chat message ${chatMessage.id} failed to render.\n${err})`);
					}
				}

				// Prepend the HTML
				log.prepend(messageHtml);

				deleteButton.hide();
				deleteButton.on('click', async () => {
					if (deletionList.length === this.messages.length) {
						ui.notifications.warn('DF_CHAT_ARCHIVE.ArchiveViewer_Error_Delete_All'.localize());
						return;
					}
					Dialog.confirm({
						title: "DF_CHAT_ARCHIVE.ArchiveViewer_DeleteTitle".localize(),
						content: "DF_CHAT_ARCHIVE.ArchiveViewer_DeleteContent".localize(),
						defaultYes: false,
						yes: async () => {
							for (const id of deletionList) {
								const message = html.find(`li[data-message-id="${id}"]`);
								message.hide(500, () => message.remove());
							}
							this.messages = this.messages.filter(x => !deletionList.includes(x._id));
							await DFChatArchive.updateChatArchive(this.archive, this.messages);
						}
					});
				});

				return html;
			});
	}
	/**
	 * @param {object} [options]
	 * @returns {Promise<void>}
	 */
	close(options) {
		this.onCloseCallBack(this);
		return super.close(options);
	}
}