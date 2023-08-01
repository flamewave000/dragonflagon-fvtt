import { ChatMessageData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
import SETTINGS from "../../../common/Settings";
import UTIL from "../Util";

export default class ChatTime {

	private static readonly PREF_ENABLED = 'ChatTime.UseSimpleCalender';
	private static readonly PREF_FORMAT = 'ChatTime.SimpleCalendarFormat';
	private static readonly FLAG_CHAT_TIME = 'ChatTime.WorldTime';

	private static get enabled() { return SETTINGS.get(this.PREF_ENABLED); }
	private static get simpleCalendarActive() { return !!game.modules.get('foundryvtt-simple-calendar')?.active; }

	static ready() {
		if (!this.simpleCalendarActive && game.user.isGM && this.enabled)
			ui.notifications.warn('DF_CHAT_TIME.ErrorSimpleCalendarMissing', { permanent: true, localize: true });
	}

	static init() {
		SETTINGS.register(this.PREF_ENABLED, {
			scope: 'world',
			type: Boolean,
			name: "DF_CHAT_TIME.EnabledName",
			hint: "DF_CHAT_TIME.EnabledHint",
			default: false,
			config: true,
			onChange: UTIL.reloadChatLog
		});

		SETTINGS.register(this.PREF_FORMAT, {
			scope: 'world',
			type: String,
			name: 'DF_CHAT_TIME.FormatName',
			hint: 'DF_CHAT_TIME.FormatHint',
			default: 'YYYY, MMM DD, HH:mm',
			config: this.simpleCalendarActive,
			onChange: UTIL.reloadChatLog
		});

		libWrapper.register(SETTINGS.MOD_NAME, 'ChatMessage.implementation.create',
			(wrapped: (...args: any) => unknown, chatData: Partial<ChatMessageData>, createOptions: any) => {
				const timeFlags:any = {
					flags: {
						[SETTINGS.MOD_NAME]: {
							[this.FLAG_CHAT_TIME]: game.time.worldTime
						}
					}
				};
				foundry.utils.mergeObject(chatData, timeFlags, {insertKeys: true, recursive: true});
				return wrapped(chatData, createOptions);
			}, 'WRAPPER');

		Hooks.on('renderChatMessage', (message: ChatMessage, html: JQuery<HTMLElement>, _data: any) => {
			if (!this.simpleCalendarActive || !this.enabled) return;
			const simpleTimestamp = <number>message.getFlag(SETTINGS.MOD_NAME, this.FLAG_CHAT_TIME);
			if (simpleTimestamp === undefined) return;
			const timeElement = html.find('.message-timestamp');
			const simpleTimeElement = $(`<time class="dfce-simple-timestamp">${SimpleCalendar.api.formatDateTime(
				SimpleCalendar.api.timestampToDate(simpleTimestamp), SETTINGS.get<string>(this.PREF_FORMAT)
			)}</time>`);
			timeElement.after(simpleTimeElement);
			timeElement.hide();
		});
	}
}