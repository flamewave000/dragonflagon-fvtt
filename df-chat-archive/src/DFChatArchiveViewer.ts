import { DFChatArchiveEntry } from './DFChatArchive';

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
			template: "modules/df-chat-archive/templates/archive-viewer.hbs",
			width: 300,
			height: 500,
			resizable: true,
			title: 'DF Chat Archive',
			classes: ['df-chat-log-window']
		});
		return options;
	}

	getData(options = {}) {
		super.getData(options);
		return {
			name: this.archive.name,
			logId: 'df-chat-log-1'
		};
	}

	_renderInner(data: {}, options?: any): Promise<JQuery> {
		return super._renderInner(data, options)
			.then(async (html) => {
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