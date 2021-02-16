
import CONFIG from '../CONFIG.js';
import DFAdventureLogConfig from './DFAdventureLogConfig.js';

export default class DFAdventureLogProcessor {
	static readonly PREF_ENABLE = 'enable-command';
	static setupSettings() {

		Hooks.on('closeDFAdventureLogConfig', () => { DFAdventureLogProcessor.logConfig = null; });

		if (game.settings.get(CONFIG.MOD_NAME, DFAdventureLogProcessor.PREF_ENABLE)) {
			Hooks.on('chatCommandsReady', function (chatCommands: any) {
				chatCommands.registerCommand(chatCommands.createCommandFromData({
					commandKey: "/log",
					invokeOnCommand: DFAdventureLogProcessor.chatCommandProcessor,
					shouldDisplayToChat: false,
					iconClass: "fa-edit",
					description: "Submit an event to the adventure log"
				}));
			});
		}
	}

	private static logConfig: DFAdventureLogConfig = null;
	private static async chatCommandProcessor(chatLog: ChatLog, messageText: string, chatData: ChatMessage.ChatData): Promise<void> {
		const speakerId = chatData.user;
		messageText = messageText.trim();
		const tokens = messageText.split(' ');

		// If the user did not enter anything, send them a help message
		if (messageText.length == 0 || tokens.every(x => x.length == 0)) {
			setTimeout(async () => {
				await Dialog.prompt({
					title: 'Adventure Journal Command Help',
					label: 'OK',
					callback: () => { },
					content: await renderTemplate(`modules/df-chat-enhance/templates/lang/log-help.${game.i18n.localize('DF_CHAT_ENHANCE.LANG')}.hbs`, {
						isGM: game.user.isGM
					}),
					options: { width: 800 }
				});
			}, 1);
			return;
		}

		const speaker = ChatMessage.getSpeaker({ user: game.user } as any);
		const messageData = {
			flavor: '',
			user: game.user._id,
			speaker: speaker,
			type: CONST.CHAT_MESSAGE_TYPES.OOC,
			content: ''
		};
		switch (tokens[0].toLowerCase()) {
			case 'config':
				setTimeout(async () => {
					if (!!DFAdventureLogProcessor.logConfig)
						DFAdventureLogProcessor.logConfig.bringToTop();
					else {
						DFAdventureLogProcessor.logConfig = new DFAdventureLogConfig();
						DFAdventureLogProcessor.logConfig.render(true);
					}
				}, 1);
				return;
			case 'q':
			case 'quote':
				messageText = messageText.replace(tokens[0], '').trimStart();
				var source: string;
				// If the token starts with a quote, but does not end with one
				if (tokens[1][0] === '"' && tokens[1][tokens[1].length - 1] !== '"') {
					// Extract the quoted Source
					var index = -1;
					for (let c = 1; c < messageText.length; c++) {
						if (messageText[c] === '"') {
							index = c;
							break;
						}
					}
					if (index < 0) {
						ui.notifications.error(game.i18n.localize('DF_CHAT_LOG.Error_MissingQuote').replace('{0}', tokens[1]));
						setTimeout(() => $('#chat-message').val('/log q ' + messageText), 1);
						return;
					}
					source = messageText.slice(0, index + 1);
				}
				else
					source = tokens[1];
				messageText = messageText.replace(source, '').trim();
				// Remove any double-quotes surrounding the source token
				source = source.replace(/"/gm, '');
				messageData.flavor = `${game.user.name} quoted ${source}`;
				messageData.content = `<span class="dfal-qu">${messageText}</span>`;
				if (messageText.length == 0) {
					ui.notifications.error(game.i18n.localize('DF_CHAT_LOG.Error_MissingMessage'));
					setTimeout(() => $('#chat-message').val(`/log q "${source}" ${messageText}`), 1);
					return;
				}
				var line = game.i18n.localize('DF_CHAT_LOG.Log_Quote');
				line = line.replace('{0}', new Date().toLocaleString('sv').replace(',', '').replace(/ ([AP])/, '$1'));
				line = line.replace('{1}', game.user.name);
				line = line.replace('{2}', source);
				messageText = line.replace('{3}', messageText);
				break;
			case 'e':
			case 'event':
				messageText = messageText.replace(tokens[0], '').trim();
			default:
				messageText = messageText.trim();
				messageData.flavor = 'Event Logged';
				messageData.content = `<span class="dfal-ev">${messageText}</span>`;
				var line = game.i18n.localize('DF_CHAT_LOG.Log_Event');
				line = line.replace('{0}', new Date().toLocaleString('sv').replace(',', '').replace(/ ([AP])/, '$1'));
				line = line.replace('{1}', game.user.name);
				messageText = line.replace('{2}', messageText);
				break;
		}

		const journalId = game.settings.get(CONFIG.MOD_NAME, DFAdventureLogConfig.PREF_JOURNAL) as string;
		if (!game.journal.has(journalId)) {
			if (game.user.isGM)
				ui.notifications.error(game.i18n.localize('DF_CHAT_LOG.Error_NoJournalSetGM'), { permanent: true });
			else
				ui.notifications.warn(game.i18n.localize('DF_CHAT_LOG.Error_NoJournalSet'));
			return;
		}
		const journal = game.journal.get(journalId);
		var html = $(journal.data.content);
		var messageHtml = $(messageText);
		var article = html.find('article.df-adventure-log');
		if (article.length == 0) {
			await DFAdventureLogConfig.initializeJournal(false);
			html = $(journal.data.content);
			messageHtml = $(messageText);
			article = html.find('article.df-adventure-log');
		}
		article.append(messageHtml);
		await journal.update({
			content: $('<div></div>').append(html).html()
		});
		await ChatMessage.create(messageData as any, {});
	}
}