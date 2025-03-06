/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../common/foundry.d.ts" />
/// <reference path="../../common/libWrapper.d.ts" />
/// <reference path="./types.d.ts" />
import ManualRolls from "./ManualRolls.mjs";
import ManualRollsLegacy from "./ManualRollsLegacy.mjs";
import RollPrompt from "./RollPrompt.mjs";
import SETTINGS from "../common/Settings.mjs";
import RollSettings from "./RollSettings.mjs";

SETTINGS.init('df-manual-rolls');

Hooks.on('init', function () {

	SETTINGS.register(ManualRolls.PREF_GM_STATE, {
		config: true,
		scope: 'world',
		name: 'DF_MANUAL_ROLLS.Settings.GM_Name',
		hint: 'DF_MANUAL_ROLLS.Settings.GM_Hint',
		default: 'disabled',
		choices: {
			disabled: 'DF_MANUAL_ROLLS.Setting_Options.Disabled',
			always: 'DF_MANUAL_ROLLS.Setting_Options.Always',
			toggle: 'DF_MANUAL_ROLLS.Setting_Options.Toggle'
		},
		onChange: () => { ui.controls.initialize(); }
	});

	SETTINGS.register(ManualRolls.PREF_PC_STATE, {
		config: true,
		scope: 'world',
		name: 'DF_MANUAL_ROLLS.Settings.PC_Name',
		hint: 'DF_MANUAL_ROLLS.Settings.PC_Hint',
		default: 'disabled',
		choices: {
			disabled: 'DF_MANUAL_ROLLS.Setting_Options.Disabled',
			always: 'DF_MANUAL_ROLLS.Setting_Options.Always',
			toggle: 'DF_MANUAL_ROLLS.Setting_Options.Toggle'
		},
		onChange: () => { ui.controls.initialize(); }
	});

	SETTINGS.register(RollPrompt.PREF_FOCUS_INPUT, {
		config: true,
		scope: 'client',
		name: 'DF_MANUAL_ROLLS.Settings.FocusInput_Name',
		hint: 'DF_MANUAL_ROLLS.Settings.FocusInput_Hint',
		type: Boolean,
		default: true
	});

	SETTINGS.register(ManualRolls.PREF_FLAGGED, {
		name: "DF_MANUAL_ROLLS.Settings.Flagged_Name",
		hint: "DF_MANUAL_ROLLS.Settings.Flagged_Hint",
		scope: 'world',
		config: true,
		type: Boolean,
		default: false
	});

	SETTINGS.register(ManualRolls.PREF_TOGGLED, {
		config: false,
		scope: 'client',
		type: Boolean,
		default: false,
		onChange: (/**@type {boolean}*/ value) => {
			const button = $('ol#controls>li#df-manual-roll-toggle');
			if (value) button.addClass('active');
			else button.removeClass('active');
		}
	});
	Hooks.on('getSceneControlButtons', (/**@type {SceneControl[]}*/ controls) => {
		if (!ManualRolls.toggleable) return;
		controls.find(x => x.name === 'token').tools.push({
			icon: 'fas fa-dice-d20',
			name: 'manualRoll',
			title: 'DF_MANUAL_ROLLS.SceneControlTitle',
			visible: ManualRolls.toggleable,
			toggle: true,
			active: ManualRolls.toggled,
			onClick: toggled => ManualRolls.setToggled(toggled)
		});
	});


	SETTINGS.register(ManualRollsLegacy.PREF_USE_LEGACY, {
		name: 'Enable Legacy Synchronous Rolls',
		hint: 'Some systems and modules have not migrated their roll calls to the new Async Roll System in FoundryVTT. To handle the use of the deprecated legacy roll system, this will enabled the old prompts for roll input.',
		config: true,
		scope: 'world',
		type: Boolean,
		default: false,
		onChange: value => {
			if (value) ManualRollsLegacy.patch();
			else ManualRollsLegacy.unpatch();
		}
	});

	RollSettings.init();
});
Hooks.on('ready', function () {
	if (!game.modules.get('lib-wrapper')?.active && game.user.isGM) {
		ui.notifications.error(game.i18n.localize("DF_MANUAL_ROLLS.Error_libWrapper_Missing"));
		return;
	}
	Handlebars.registerHelper({ dfmr_mul: (v1, v2) => v1 * v2 });
	ManualRolls.patch();
	if (SETTINGS.get(ManualRollsLegacy.PREF_USE_LEGACY))
		ManualRollsLegacy.patch();
});

Hooks.on('createChatMessage', async (/**@type {ChatMessage}*/ chatMessage) => {
	if (!chatMessage.author || chatMessage.author.id !== game.userId) return;
	// Ignore non-roll, non-flagged, non-manual messages
	if (!chatMessage.isRoll || !ManualRolls.flagged || !ManualRolls.shouldRollManually) return;
	let flavor = game.i18n.localize("DF_MANUAL_ROLLS.Flag");
	// If all of the manual rolls were cancelled, don't set the flag
	if (!chatMessage.roll.terms.some(value => value instanceof foundry.dice.terms.DiceTerm && value.options.isManualRoll))
		return;
	if (chatMessage.document.flavor)
		flavor += " " + chatMessage.document.flavor;
	await chatMessage.update({ flavor: flavor });
});