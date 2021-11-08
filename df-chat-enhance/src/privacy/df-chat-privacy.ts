import SETTINGS from "../../../common/Settings";
import CONFIG from "../CONFIG";


const ICONS_FOR_KNOWN_ROLL_TYPES: {
	[key: string]: string;
	roll: string;
	gmroll: string;
	blindroll: string;
	selfroll: string;
} = {
	roll: 'fas fa-dice-d20',
	gmroll: 'fas fa-user-secret',
	blindroll: 'fas fa-user-ninja',
	selfroll: 'fas fa-ghost'
};

function calcColour(current: number, count: number): string {
	return `rgb(${(current / count) * 255},${(1 - (current / count)) * 255},0)`;
}

interface ChatLogData {
	user: User,
	rollMode: String,
	rollModes: any,
	isStream: Boolean
}

async function handleChatLogRendering(chat: ChatLog, html: JQuery<HTMLElement>, data: ChatLogData) {
	const modes = Object.keys(data.rollModes);
	const buttons: any[] = [];
	const iconKeys = Object.keys(ICONS_FOR_KNOWN_ROLL_TYPES);
	for (let c = 0; c < modes.length; c++) {
		const rt = modes[c];
		if (!(rt in ICONS_FOR_KNOWN_ROLL_TYPES)) {
			console.warn(Error(`Unknown roll type '${rt}'`));
			continue;
		}
		buttons.push({
			rt: rt,
			name: data.rollModes[rt],
			active: data.rollMode === rt,
			icon: ICONS_FOR_KNOWN_ROLL_TYPES[rt],
			colour: calcColour(iconKeys.findIndex(x => x == rt), iconKeys.length)
		});
	}
	const buttonHtml = $(await renderTemplate('modules/df-chat-enhance/templates/privacy-button.hbs', { buttons }));
	buttonHtml.find('button').on('click', function () {
		const rollType = $(this).attr('data-id');
		game.settings.set("core", "rollMode", <any>rollType);
		buttonHtml.find('button.active').removeClass('active');
		$(this).addClass('active');
	});
	html.find('select[name=rollMode]').after(buttonHtml);
	html.find('select[name=rollMode]').remove();

	if (!SETTINGS.get('replace-buttons'))
		return;

	// Adjust the button container to remove the extra margin since those buttons are now moving in.
	buttonHtml.attr('style', 'margin:0 0 0 0.5em');

	// Convert the old <a> tag elements to <button> tags
	var first = true;
	html.find('#chat-controls div.control-buttons a').each(function (idx, element) {
		let html = $(this).html();
		let classes = $(this).attr('class');
		let title = $(this).attr('title');
		let style = $(this).attr('style');
		let click = ($ as any)._data(this, 'events')['click'][0].handler;
		let button = $(`<button class="${classes}" title="${title}" style="${style}">${html}</button>`);
		button.on('click', click);
		// Add a small margin between the first button and the RollTypes
		if (first) {
			button.attr('style', 'margin-left:0.5em');
			first = false;
		}
		buttonHtml.append(button);
	});

	html.find('#chat-controls div.control-buttons').remove();
}

export default function initDFChatPrivacy() {
	SETTINGS.register('enabled', {
		name: 'DF_CHAT_PRIVACY.Settings_EnableTitle',
		hint: 'DF_CHAT_PRIVACY.Settings_EnableHint',
		scope: 'client',
		type: Boolean,
		default: true,
		config: true,
		onChange: CONFIG.requestReload
	});
	SETTINGS.register('replace-buttons', {
		name: 'DF_CHAT_PRIVACY.Settings_ReplaceButtonsTitle',
		hint: 'DF_CHAT_PRIVACY.Settings_ReplaceButtonsHint',
		scope: 'client',
		type: Boolean,
		default: true,
		config: true,
		onChange: CONFIG.requestReload
	});

	if (SETTINGS.get('enabled') === false)
		return;

	Hooks.on('renderChatLog', handleChatLogRendering);
}
