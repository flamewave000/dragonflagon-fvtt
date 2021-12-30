import DFManualRolls from "./DFManualRolls";
import DFManualRollsLegacy from "./DFManualRollsLegacy";
import DFRollPrompt from "./DFRollPrompt";
import SETTINGS from "../../common/Settings";

SETTINGS.init('df-manual-rolls');

Hooks.on('init', function () {

	SETTINGS.register(DFManualRolls.PREF_GM_STATE, {
		config: true,
		scope: 'world',
		name: 'DF_MANUAL_ROLLS.Settings.GM_Name',
		hint: 'DF_MANUAL_ROLLS.Settings.GM_Hint',
		type: String,
		default: 'disabled',
		choices: {
			disabled: 'DF_MANUAL_ROLLS.Setting_Options.Disabled',
			always: 'DF_MANUAL_ROLLS.Setting_Options.Always',
			toggle: 'DF_MANUAL_ROLLS.Setting_Options.Toggle'
		},
		onChange: () => { ui.controls.initialize(); }
	});

	SETTINGS.register(DFManualRolls.PREF_PC_STATE, {
		config: true,
		scope: 'world',
		name: 'DF_MANUAL_ROLLS.Settings.PC_Name',
		hint: 'DF_MANUAL_ROLLS.Settings.PC_Hint',
		type: String,
		default: 'disabled',
		choices: {
			disabled: 'DF_MANUAL_ROLLS.Setting_Options.Disabled',
			always: 'DF_MANUAL_ROLLS.Setting_Options.Always',
			toggle: 'DF_MANUAL_ROLLS.Setting_Options.Toggle'
		},
		onChange: () => { ui.controls.initialize(); }
	});

	SETTINGS.register(DFRollPrompt.PREF_FOCUS_INPUT, {
		config: true,
		scope: 'client',
		name: 'DF_MANUAL_ROLLS.Settings.FocusInput_Name',
		hint: 'DF_MANUAL_ROLLS.Settings.FocusInput_Hint',
		type: Boolean,
		default: true
	});

	SETTINGS.register(DFManualRolls.PREF_FLAGGED, {
		name: "DF_MANUAL_ROLLS.Settings.Flagged_Name",
		hint: "DF_MANUAL_ROLLS.Settings.Flagged_Hint",
		scope: 'world',
		config: true,
		type: Boolean,
		default: false
	});

	SETTINGS.register(DFManualRolls.PREF_TOGGLED, {
		config: false,
		scope: 'client',
		type: Boolean,
		default: false,
		onChange: (value: boolean) => {
			const button = $('ol#controls>li#df-manual-roll-toggle');
			if (value) button.addClass('active');
			else button.removeClass('active');
		}
	});
	Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
		if (!DFManualRolls.toggleable) return;
		controls.find(x => x.name === 'token').tools.push({
			icon: 'fas fa-dice-d20',
			name: 'manualRoll',
			title: 'DF_MANUAL_ROLLS.SceneControlTitle',
			visible: DFManualRolls.toggleable,
			toggle: true,
			active: DFManualRolls.toggled,
			onClick: (toggled: boolean) => DFManualRolls.setToggled(toggled)
		});
	});


	SETTINGS.register(DFManualRollsLegacy.PREF_USE_LEGACY, {
		name: 'Enable Legacy Synchronous Rolls',
		hint: 'Some systems and modules have not migrated their roll calls to the new Async Roll System in FoundryVTT. To handle the use of the deprecated legacy roll system, this will enabled the old prompts for roll input.',
		config: true,
		scope: 'world',
		type: Boolean,
		default: false,
		onChange: (value: boolean) => {
			if (value) DFManualRollsLegacy.patch();
			else DFManualRollsLegacy.unpatch();
		}
	});
});
Hooks.on('ready', function () {
	if (!game.modules.get('lib-wrapper')?.active && game.user.isGM) {
		ui.notifications.error(game.i18n.localize("DF_MANUAL_ROLLS.Error_libWrapper_Missing"));
		return;
	}
	Handlebars.registerHelper({ dfmr_mul: (v1, v2) => v1 * v2 });
	DFManualRolls.patch();
	if (SETTINGS.get(DFManualRollsLegacy.PREF_USE_LEGACY))
		DFManualRollsLegacy.patch();
});

Hooks.on('createChatMessage', async (chatMessage: ChatMessage) => {
	if (chatMessage.user.id !== game.userId) return;
	// Ignore non-roll, non-flagged, non-manual messages
	if (!chatMessage.isRoll || !DFManualRolls.flagged || !DFManualRolls.shouldRollManually) return;
	let flavor = game.i18n.localize("DF_MANUAL_ROLLS.Flag");
	// If all of the manual rolls were cancelled, don't set the flag
	if (!chatMessage.roll.terms.some((value: any) => value instanceof DiceTerm && (<any>value.options).isManualRoll))
		return;
	if (chatMessage.data.flavor)
		flavor += " " + chatMessage.data.flavor;
	await chatMessage.update({ flavor: flavor });
});