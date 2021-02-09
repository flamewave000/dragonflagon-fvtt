import CONFIG from "../CONFIG.js";


const ICONS_FOR_KNOWN_ROLL_TYPES = {
	'roll': 'fas fa-dice-d20',
	'gmroll': 'fas fa-user-secret',
	'blindroll': 'fas fa-user-ninja',
	'selfroll': 'fas fa-ghost'
} as any;

function calcColour(current: number, count: number): string {
	return `rgb(${(current / count) * 255},${(1 - (current / count)) * 255},0)`;
}

export default function initDFChatPrivacy() {
	game.settings.register(CONFIG.MOD_NAME, 'enabled', {
		name: 'DF_CHAT_PRIVACY.Settings_EnableTitle',
		hint: 'DF_CHAT_PRIVACY.Settings_EnableHint',
		scope: 'client',
		type: Boolean,
		default: true,
		config: true,
		onChange: async () => {
			if (await Dialog.confirm({
				title: game.i18n.localize("DF_CHAT_PRIVACY.ReloadGameTitle"),
				content: game.i18n.localize("DF_CHAT_PRIVACY.ReloadGameContent"),
				defaultYes: true
			} as any) as any as Boolean) {
				window.location.reload();
			}
		}
	});

	if (game.settings.get(CONFIG.MOD_NAME, 'enabled') === false)
		return;

	Hooks.on('renderChatLog', async function (chat, html: JQuery<HTMLElement>, data: {
		user: User,
		rollMode: String,
		rollModes: any,
		isStream: Boolean
	}) {
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
			game.settings.set("core", "rollMode", rollType);
			buttonHtml.find('button.active').removeClass('active');
			$(this).addClass('active');
		});
		html.find('select.roll-type-select').after(buttonHtml);
		html.find('select.roll-type-select').remove();
	});
}