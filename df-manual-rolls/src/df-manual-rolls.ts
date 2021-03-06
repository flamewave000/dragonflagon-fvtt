import Actor5eExt from "./dnd5e/Actor5eExt.js";
import DFManualRolls from "./DFManualRolls.js";
import Item5eExt from './dnd5e/Item5eExt.js';

Hooks.on('init', function () {

	game.settings.register(DFManualRolls.MODULE, DFManualRolls.FORCED, {
		name: "DF_MANUAL_ROLLS.Settings_Force_Name",
		hint: "DF_MANUAL_ROLLS.Settings_Force_Hint",
		scope: 'world',
		config: true,
		type: Boolean,
		default: false,
		onChange: async _ => await Dialog.confirm({
			title: game.i18n.localize("DF_MANUAL_ROLLS.Reload_Title"),
			content: `<p>${game.i18n.localize("DF_MANUAL_ROLLS.Reload_Content")}</p>`,
			yes: () => window.location.reload(),
			no: () => { },
			defaultYes: true
		})
	});
	game.settings.register(DFManualRolls.MODULE, DFManualRolls.FLAGGED, {
		name: "DF_MANUAL_ROLLS.Settings_Flagged_Name",
		hint: "DF_MANUAL_ROLLS.Settings_Flagged_Hint",
		scope: 'world',
		config: true,
		type: Boolean,
		default: false
	});
	if (!DFManualRolls.forced) {
		game.settings.register(DFManualRolls.MODULE, DFManualRolls.ENABLED, {
			name: "DF_MANUAL_ROLLS.Settings_Enabled_Name",
			hint: "DF_MANUAL_ROLLS.Settings_Enabled_Hint",
			scope: 'client',
			config: true,
			type: Boolean,
			default: true,
			onChange: value => {
				if (value || DFManualRolls.forced) DFManualRolls.patch();
				else DFManualRolls.unpatch();
			}
		});
		game.settings.register(DFManualRolls.MODULE, DFManualRolls.ROLLBACK, {
			name: "DF_MANUAL_ROLLS.Settings_Rollback_Name",
			hint: "DF_MANUAL_ROLLS.Settings_Rollback_Hint",
			scope: 'client',
			config: true,
			type: Boolean,
			default: true
		});
	}

	if (game.dnd5e) {
		game.settings.register(DFManualRolls.MODULE, DFManualRolls.FLAVOUR_5E, {
			name: "DF_MANUAL_ROLLS.Settings_Flavour5e_Name",
			hint: "DF_MANUAL_ROLLS.Settings_Flavour5e_Hint",
			scope: 'world',
			config: true,
			type: Boolean,
			default: true,
			onChange: async _ => await Dialog.confirm({
				title: game.i18n.localize("DF_MANUAL_ROLLS.Reload_Title"),
				content: `<p>${game.i18n.localize("DF_MANUAL_ROLLS.Reload_Content")}</p>`,
				yes: () => window.location.reload(),
				no: () => { },
				defaultYes: true
			})
		});
		if (game.settings.get(DFManualRolls.MODULE, DFManualRolls.FLAVOUR_5E)) {
			CONFIG.Item.entityClass = Item5eExt as any;
			CONFIG.Actor.entityClass = Actor5eExt as any;
		}
	}
});
Hooks.on('ready', function () {
	if (DFManualRolls.enabled || DFManualRolls.forced)
		DFManualRolls.patch();
});

Hooks.on('createChatMessage', async (chatMessage: ChatMessage) => {
	if (!chatMessage.isRoll || !DFManualRolls.flagged || !(DFManualRolls.enabled || DFManualRolls.forced)) return;
	var flavor = game.i18n.localize("DF_MANUAL_ROLLS.Flag");
	// If all of the manual rolls were cancelled, don't set the flag
	if (!chatMessage.roll.terms.some((value) => value instanceof DiceTerm && value.options.isManualRoll))
		return;
	if (!!chatMessage.data.flavor)
		flavor += " " + chatMessage.data.flavor;
	await chatMessage.update({ flavor: flavor });
});