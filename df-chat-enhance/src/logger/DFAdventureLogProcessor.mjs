/// <reference path="../../../fvtt-scripts/foundry.js" />
/// <reference path="../../../common/foundry.d.ts" />
/// <reference path="../../../common/libWrapper.d.ts" />
import SETTINGS from "../../common/Settings.mjs";
import DFChatEditor from "../edit/DFChatEditor.mjs";
import DFAdventureLogConfig from './DFAdventureLogConfig.mjs';

if (!String.prototype.trimStart) {
	String.prototype.trimStart = function () {
		const whitespace = [' ', '\n', '\r'];
		let index = -1;
		for (let c = 0; c < this.length; c++) {
			if (whitespace.every(x => x !== this[c])) break;
			index = c;
		}
		return this.substr(index + 1);
	};
}

export default class DFAdventureLogProcessor {
	/**@readonly*/ static PREF_ENABLE = 'enable-command';
	/**@readonly*/ static PREF_GMONLY = 'df-log-gmonly';
	/**@readonly*/ static PREF_GMONLY_WHISPER = 'df-log-gmonly-whisper';
	/**@readonly*/ static PREF_MESSAGES = 'df-log-messages';
	/**@readonly*/ static PREF_SORTDESC = 'df-log-sortdesc';
	/**@readonly*/ static PREF_DISABLE_FORMATTING = 'df-log-disable-format';
	/**@readonly*/ static PREF_DISABLE_AUTHOR = 'df-log-disable-author';
	/**@readonly*/ static PREF_SIMPLE_CALENDAR = 'df-log-use-simple-calendar';
	/**@readonly*/ static PREF_USE_TIME = 'df-log-use-time';
	/**@readonly*/ static PREF_PLAYER_LOG_JOURNAL = 'player-adventure-log';
	/**@type {ChatCommand|null}*/ static logCommand = null;
	/**@type {ChatCommand|null}*/ static gmlogCommand = null;
	/**@type {ChatCommand|null}*/ static plogCommand = null;

	/**@param {ContextMenuEntry} options*/
	static appendChatContextMenuOptions(options) {
		options.push({
			name: 'DF_CHAT_LOG.ContextMenu_AsEvent',
			icon: '<i style="color:SeaGreen" class="fas fa-edit"></i>',
			condition: () => {
				const enabled = SETTINGS.get(DFAdventureLogProcessor.PREF_ENABLE);
				const isGM = game.user.isGM;
				const gmOnly = SETTINGS.get(DFAdventureLogProcessor.PREF_GMONLY);
				return enabled && (!gmOnly || isGM);
			},
			callback: (header) => {
				/**@type {ChatMessage}*/
				const chatData = ui.chat.collection.get($(header).attr('data-message-id'));
				DFAdventureLogProcessor.commandProcessor(chatData.content, false, false);
				return {};
			}
		});
		options.push({
			name: 'DF_CHAT_LOG.ContextMenu_AsQuote',
			icon: '<i style="color:SeaGreen" class="fas fa-quote-right"></i>',
			condition: () => {
				const enabled = SETTINGS.get(DFAdventureLogProcessor.PREF_ENABLE);
				const isGM = game.user.isGM;
				const gmOnly = SETTINGS.get(DFAdventureLogProcessor.PREF_GMONLY);
				return enabled && (!gmOnly || isGM);
			},
			callback: (header) => {
				/**@type {ChatMessage}*/
				const chatData = ui.chat.collection.get($(header).attr('data-message-id'));
				if (chatData.content.trimStart().startsWith('"'))
					DFAdventureLogProcessor.commandProcessor('q ' + chatData.content, false, false);
				else
					DFAdventureLogProcessor.commandProcessor(`q "${chatData.author.name}" ${chatData.content}`, false, false);
				return {};
			}
		});
		options.push({
			name: 'DF_CHAT_LOG.ContextMenu_AsGmEvent',
			icon: '<i style="color:FireBrick" class="fas fa-edit"></i>',
			condition: () => {
				const enabled = SETTINGS.get(DFAdventureLogProcessor.PREF_ENABLE);
				const isGM = game.user.isGM;
				return enabled && isGM;
			},
			callback: (header) => {
				/**@type {ChatMessage}*/
				const chatData = ui.chat.collection.get($(header).attr('data-message-id'));
				DFAdventureLogProcessor.commandProcessor(chatData.content, true, false);
				return {};
			}
		});
		options.push({
			name: 'DF_CHAT_LOG.ContextMenu_AsGmQuote',
			icon: '<i style="color:FireBrick" class="fas fa-quote-right"></i>',
			condition: () => {
				const enabled = SETTINGS.get(DFAdventureLogProcessor.PREF_ENABLE);
				const isGM = game.user.isGM;
				return enabled && isGM;
			},
			callback: (header) => {
				/**@type {ChatMessage}*/
				const chatData = ui.chat.collection.get($(header).attr('data-message-id'));
				if (chatData.content.trimStart().startsWith('"'))
					DFAdventureLogProcessor.commandProcessor('q ' + chatData.content, true, false);
				else
					DFAdventureLogProcessor.commandProcessor(`q "${chatData.author.name}" ${chatData.content}`, true, false);
				return {};
			}
		});
	}

	static setupSettings() {
		SETTINGS.register(DFAdventureLogProcessor.PREF_ENABLE, {
			scope: 'world',
			name: 'DF_CHAT_LOG.Setting.EnableTitle',
			hint: 'DF_CHAT_LOG.Setting.EnableHint',
			config: true,
			type: Boolean,
			default: true,
			onChange: enabled => {
				if (!enabled && !!DFAdventureLogProcessor.logCommand)
					DFAdventureLogProcessor.deregisterCommand();
				else
					DFAdventureLogProcessor.registerCommand();
			}
		});
		SETTINGS.register(DFAdventureLogProcessor.PREF_GMONLY, {
			name: 'DF_CHAT_LOG.Setting.GmOnlyTitle',
			hint: 'DF_CHAT_LOG.Setting.GmOnlyHint',
			scope: 'world',
			type: Boolean,
			default: false,
			config: true,
			onChange: gmOnly => {
				if (gmOnly && !game.user.isGM)
					DFAdventureLogProcessor.deregisterCommand();
				else
					DFAdventureLogProcessor.registerCommand();
			}
		});
		SETTINGS.register(DFAdventureLogProcessor.PREF_GMONLY_WHISPER, {
			name: 'DF_CHAT_LOG.Setting.GmOnlyWhisperName',
			hint: 'DF_CHAT_LOG.Setting.GmOnlyWhisperHint',
			scope: 'world',
			type: Boolean,
			default: false,
			config: true
		});
		SETTINGS.register(DFAdventureLogProcessor.PREF_USE_TIME, {
			scope: 'world',
			type: Boolean,
			name: "DF_CHAT_LOG.Setting.UseTimeName",
			hint: "DF_CHAT_LOG.Setting.UseTimeHint",
			default: true,
			config: true
		});
		SETTINGS.register(DFAdventureLogProcessor.PREF_MESSAGES, {
			name: 'DF_CHAT_LOG.Setting.PrintMessagesName',
			hint: 'DF_CHAT_LOG.Setting.PrintMessagesHint',
			scope: 'world',
			type: Boolean,
			default: true,
			config: true
		});
		SETTINGS.register(DFAdventureLogProcessor.PREF_SORTDESC, {
			name: 'DF_CHAT_LOG.Setting.SortDescendingName',
			hint: 'DF_CHAT_LOG.Setting.SortDescendingHint',
			scope: 'world',
			type: Boolean,
			default: false,
			config: true,
			onChange: () => this.reSortLog()
		});
		SETTINGS.register(DFAdventureLogProcessor.PREF_DISABLE_FORMATTING, {
			name: 'DF_CHAT_LOG.Setting.DisableFormatName'.localize(),
			hint: 'DF_CHAT_LOG.Setting.DisableFormatHint'.localize(),
			config: true,
			scope: 'world',
			type: Boolean,
			default: false
		});
		SETTINGS.register(DFAdventureLogProcessor.PREF_DISABLE_AUTHOR, {
			name: 'DF_CHAT_LOG.Setting.DisableEntryAuthorName'.localize(),
			hint: 'DF_CHAT_LOG.Setting.DisableEntryAuthorHint'.localize(),
			config: true,
			scope: 'world',
			type: Boolean,
			default: false
		});
		// If Simple Calendar is enabled
		if (game.modules.get('foundryvtt-simple-calendar')?.active) {
			SETTINGS.register(DFAdventureLogProcessor.PREF_SIMPLE_CALENDAR, {
				scope: 'world',
				type: Boolean,
				name: "DF_CHAT_LOG.Setting.SimpleCalendarName",
				hint: "DF_CHAT_LOG.Setting.SimpleCalendarHint",
				default: false,
				config: true
			});
		}

		Hooks.on('closeDFAdventureLogConfig', () => { DFAdventureLogProcessor.logConfig = null; });
		if (game.chatCommands)
			DFAdventureLogProcessor.registerCommand();
		else
			Hooks.on('chatCommandsReady', () => DFAdventureLogProcessor.registerCommand());
	}

	static deregisterCommand() {
		game.chatCommands.deregisterCommand(DFAdventureLogProcessor.logCommand);
		game.chatCommands.deregisterCommand(DFAdventureLogProcessor.plogCommand);
		if (DFAdventureLogProcessor.gmlogCommand)
			game.chatCommands.deregisterCommand(DFAdventureLogProcessor.gmlogCommand);
		DFAdventureLogProcessor.logCommand = null;
		DFAdventureLogProcessor.plogCommand = null;
		DFAdventureLogProcessor.gmlogCommand = null;
	}

	static registerCommand() {
		if (!SETTINGS.get(DFAdventureLogProcessor.PREF_ENABLE))
			return;
		if (SETTINGS.get(DFAdventureLogProcessor.PREF_GMONLY) && !game.user.isGM)
			return;
		if (DFAdventureLogProcessor.logCommand)
			return;

		/**@type {ChatCommands}*/
		const commands = game.chatCommands;

		DFAdventureLogProcessor.logCommand = commands.register({
			name: "/log",
			module: SETTINGS.MOD_NAME,
			callback: async (_log, msg, _message) => {await DFAdventureLogProcessor.commandProcessor(msg, false, false);},
			icon: "fa-edit",
			description: "DF_CHAT_LOG.CommandDescription".localize()
		});

		DFAdventureLogProcessor.plogCommand = commands.register({
			name: "/plog",
			module: SETTINGS.MOD_NAME,
			callback: async (_log, msg, _message) => {await DFAdventureLogProcessor.commandProcessor(msg, false, true);},
			icon: "fa-edit",
			description: "DF_CHAT_LOG.PCCommandDescription".localize()
		});

		// Register the /gmlog command
		DFAdventureLogProcessor.gmlogCommand = commands.register({
			name: "/gmlog",
			module: SETTINGS.MOD_NAME,
			callback: async (_log, msg, _message) => {await DFAdventureLogProcessor.commandProcessor(msg, true, false);},
			icon: "fa-edit",
			description: "DF_CHAT_LOG.GMCommandDescription".localize(),
			requiredRole: 'ASSISTANT'
		});
	}

	static #_getTimestamp() {
		const useTime = SETTINGS.get(DFAdventureLogProcessor.PREF_USE_TIME);
		if (game.modules.get('foundryvtt-simple-calendar')?.active && SETTINGS.get(DFAdventureLogProcessor.PREF_SIMPLE_CALENDAR)) {
			const stamp = SimpleCalendar.api.formatDateTime(SimpleCalendar.api.timestampToDate(SimpleCalendar.api.timestamp()));
			return useTime ? `${stamp.date} ${stamp.time}` : stamp.date;
		}
		else if (useTime)
			return new Date().toLocaleString('sv').replace(',', '').replace(/ ([AP])/, '$1');
		else {
			return new Date().toLocaleString('sv').replace(',', '').replace(/ ([AP])/, '$1').split(' ')[0];
		}
	}

	/**@type {DFAdventureLogConfig|null}*/
	static #logConfig = null;
	/**
	 * 
	 * @param {string} messageText
	 * @param {boolean} gmLog
	 * @param {boolean} isPlayerLog
	 * @param {boolean} [preventPostToChat = false]
	 * @returns {Promise<void>}
	 */
	static async commandProcessor(messageText, gmLog, isPlayerLog, preventPostToChat = false) {
		messageText = messageText.trim();
		const tokens = messageText.split(' ');

		if (!SETTINGS.get(DFAdventureLogProcessor.PREF_ENABLE)) {
			game.chatCommands.deregisterCommand(DFAdventureLogProcessor.logCommand);
			ui.notifications.warn('DF_CHAT_LOG.Error.Disabled'.localize());
			return;
		}

		// If the user did not enter anything, send them a help message
		if (messageText.length == 0 || tokens.every(x => x.length == 0)) {
			setTimeout(async () => {
				await Dialog.prompt({
					title: 'DF_CHAT_LOG.HelpDialog_Title'.localize(),
					label: 'OK',
					callback: () => { },
					content: await renderTemplate(`modules/df-chat-enhance/templates/lang/log-help.${'DF_CHAT_ENHANCE.LANG'.localize()}.hbs`, {
						isGM: game.user.isGM
					}),
					options: { width: 800 }
				});
			}, 1);
			return;
		}

		const speaker = ChatMessage.getSpeaker({ user: game.user });
		/**@type {ChatMessage}*/
		const messageData = {
			flavor: '',
			user: game.user.id,
			speaker: speaker,
			type: foundry.CONST.CHAT_MESSAGE_STYLES.OOC,
			content: '',
		};
		/**@type {string}*/
		let line;
		const disableFormatting = SETTINGS.get(DFAdventureLogProcessor.PREF_DISABLE_FORMATTING);
		const disableAuthor = isPlayerLog || SETTINGS.get(DFAdventureLogProcessor.PREF_DISABLE_AUTHOR);
		switch (tokens[0].toLowerCase()) {
			case 'config':
				if (!game.user.isGM) {
					ui.notifications.warn('DF_CHAT_LOG.Error.ConfigGmOnly'.localize());
					return;
				}
				setTimeout(async () => {
					if (DFAdventureLogProcessor.logConfig)
						DFAdventureLogProcessor.logConfig.bringToTop();
					else {
						DFAdventureLogProcessor.logConfig = new DFAdventureLogConfig({});
						DFAdventureLogProcessor.logConfig.render(true);
					}
				}, 1);
				return;
			case 'q':
			case 'quote':
				messageText = messageText.replace(tokens[0], '').trimStart();
				/**@type {string}*/
				let source;
				// If the token starts with a quote and ends with one
				if (tokens[1][0] === '"' && tokens[1][tokens[1].length - 1] === '"') {
					// Extract the quoted Source
					let index = -1;
					for (let c = 1; c < messageText.length; c++) {
						if (messageText[c] === '"') {
							index = c;
							break;
						}
					}
					if (index < 0) {
						ui.notifications.error('DF_CHAT_LOG.Error.MissingQuote'.localize().replace('{0}', tokens[1]));
						setTimeout(() => $('#chat-message').val('/log q ' + messageText), 1);
						return;
					}
					source = messageText.slice(0, index + 1);
					messageText = messageText.slice(index + 1).trimStart();
				}
				else
					source = tokens[1];
				messageText = DFChatEditor.processMarkdown(messageText)[1].replace(source, '').trim();
				// Remove any double-quotes surrounding the source token
				source = source.replace(/"/gm, '');
				messageData.flavor = `${game.user.name} quoted ${source}`;
				messageData.content = `<span class="dfal-qu">${messageText}</span>`;
				if (messageText.length == 0) {
					ui.notifications.error('DF_CHAT_LOG.Error.MissingMessage'.localize());
					setTimeout(() => $('#chat-message').val(`/log q "${source}" ${messageText}`), 1);
					return;
				}
				line = 'DF_CHAT_LOG.Log_Quote';
				if (disableFormatting) line += '_Bland';
				if (disableAuthor) line += '_NoAuth';
				line = line.localize();
				line = line.replace('{0}', this.#_getTimestamp());
				line = line.replace('{1}', game.user.name);
				line = line.replace('{2}', source);
				messageText = line.replace('{3}', messageText);
				break;
			case 'e':
			case 'event':
				messageText = messageText.replace(tokens[0], '').trim();
			// fallthrough
			default:
				messageText = DFChatEditor.processMarkdown(messageText)[1].trim();
				messageData.flavor = 'Event Logged';
				messageData.content = `<span class="dfal-ev">${messageText}</span>`;
				line = 'DF_CHAT_LOG.Log_Event';
				if (disableFormatting) line += '_Bland';
				if (disableAuthor) line += '_NoAuth';
				line = line.localize();
				line = line.replace('{0}', this.#_getTimestamp());
				line = line.replace('{1}', game.user.name);
				messageText = line.replace('{2}', messageText);
				break;
		}

		// fetch the log to submit to
		const journalId = (isPlayerLog ? game.user.getFlag(SETTINGS.MOD_NAME, this.PREF_PLAYER_LOG_JOURNAL) :
			SETTINGS.get(gmLog ? DFAdventureLogConfig.PREF_JOURNAL_GM : DFAdventureLogConfig.PREF_JOURNAL))?.split('.');
		if (!journalId || !game.journal.has(journalId[0])) {
			if (isPlayerLog)
				ui.notifications.error('DF_CHAT_LOG.Error.NoPlayerJournalSet'.localize());
			else if (game.user.isGM)
				ui.notifications.error('DF_CHAT_LOG.Error.NoJournalSetGM'.localize(), { permanent: true });
			else
				ui.notifications.warn('DF_CHAT_LOG.Error.NoJournalSet'.localize());
			return;
		}
		const journal = game.journal.get(journalId[0]).pages.get(journalId[1]);
		let html = $(journal.text.content);
		const messageHtml = $(messageText);
		let section = html.find('section.df-adventure-log');
		if (section.length == 0) {
			await DFAdventureLogConfig.initializeJournal(journalId.join('.'), false, gmLog, isPlayerLog);
			html = $(journal.text.content);
			section = html.find('section.df-adventure-log');
		}
		/**@type {boolean}*/
		const descending = SETTINGS.get(this.PREF_SORTDESC);
		if (descending) section.prepend(messageHtml); else section.append(messageHtml);
		await journal.update({ 'text.content': $('<div></div>').append(html).html() });
		const rollType = game.settings.get("core", "rollMode");
		if (game.user.isGM) {
			if (
				// If the roll type is anything but Public
				rollType !== 'publicroll'
				// If logs are GM Only and the Whisper All settings is true
				|| (SETTINGS.get(DFAdventureLogProcessor.PREF_GMONLY) &&
					SETTINGS.get(DFAdventureLogProcessor.PREF_GMONLY_WHISPER))
			) {
				// Make the message a whisper
				messageData.whisper = [game.user.id];
			}
		}
		// All GM and Player logs are whispered
		if (isPlayerLog || gmLog) {
			messageData.whisper = [game.user.id];
		}
		// Post message to chat if Messages are enabled
		if (!preventPostToChat && SETTINGS.get(DFAdventureLogProcessor.PREF_MESSAGES))
			await ChatMessage.create(messageData, {});
	}

	static async reSortLog() {
		/**@type {boolean}*/
		const descending = SETTINGS.get(this.PREF_SORTDESC);
		/**@type {string|undefined}*/
		const journalAll = SETTINGS.get(DFAdventureLogConfig.PREF_JOURNAL)?.split('.');
		/**@type {string|undefined}*/
		const journalGM = SETTINGS.get(DFAdventureLogConfig.PREF_JOURNAL_GM)?.split('.');

		/**
		 * @param {JournalEntryPage} journal
		 */
		const journalSort = async journal => {
			const html = $(journal.text?.content);
			const article = html.find('article.df-adventure-log');
			const result = article.find('p').sort(function (/**@type {HTMLElement}*/a, /**@type {HTMLElement}*/b) {
				return descending ?
					$(b).find('span.dfal-ts').text().localeCompare($(a).find('span.dfal-ts').text()) :
					$(a).find('span.dfal-ts').text().localeCompare($(b).find('span.dfal-ts').text());

			});
			article.html(result);
			await journal.update({ 'text.content': $('<div></div>').append(html).html() });
		};

		if (game.journal.has(journalAll[0]))
			await journalSort(game.journal.get(journalAll[0]).pages.get(journalAll[1]));
		if (game.journal.has(journalGM[0]))
			await journalSort(game.journal.get(journalGM[0]).pages.get(journalGM[1]));
	}
}