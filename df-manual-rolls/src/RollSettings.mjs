/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../common/foundry.d.ts" />
/// <reference path="../../common/libWrapper.d.ts" />
/// <reference path="./types.d.ts" />
import SETTINGS from "../common/Settings.mjs";
import ManualRolls from "./ManualRolls.mjs";

export default class RollSettings {
	static init() {
		Hooks.on('renderPlayerList', (/**@type {PlayerList}*/ app, /**@type {JQuery<HTMLElement>}*/ html) => {
			if (!game.user.isGM) return;
			html.find('li.player').each((_idx, element) => {
				const userId = element.getAttribute('data-user-id');
				const user = game.users.get(userId);
				const rollType = user.getFlag(SETTINGS.MOD_NAME, ManualRolls.FLAG_ROLL_TYPE);
				if (!rollType) return;
				let html = '';
				switch (user.getFlag(SETTINGS.MOD_NAME, ManualRolls.FLAG_ROLL_TYPE) ?? SETTINGS.get(ManualRolls.PREF_PC_STATE)) {
					case 'disabled': html = `<i class="fas fa-dice" title="${'DF_MANUAL_ROLLS.Setting_Options.Disabled'.localize()}"></i>`; break;
					case 'always': html = `<i class="fas fa-keyboard" title="${'DF_MANUAL_ROLLS.Setting_Options.Always'.localize()}"></i>`; break;
					case 'toggle': html = `<i class="fas fa-toggle-on" title="${'DF_MANUAL_ROLLS.Setting_Options.Toggle'.localize()}"></i>`; break;
				}
				$(element).append(`<span class="player-roll-type">${html}</span>`);
			});
		});
		Hooks.on('renderUserConfig', (/**@type {UserConfig}*/ app, /**@type {JQuery<HTMLElement>}*/ html) => {
			if (!game.user.isGM) return;
			const rollType = app.object.getFlag(SETTINGS.MOD_NAME, ManualRolls.FLAG_ROLL_TYPE);
			const rollConfig = $(`<div class="form-group">
	<label>${'Manual Roll Override'.localize()}</label>
	<div class="form-fields" style="width:${html.find('#characters').parent().outerWidth()}px">
		<select name="flags.df-manual-rolls.roll-type">
			<option value="" ${!rollType ? 'selected' : ''}></option>
			<option value="disabled" ${rollType === 'disabled' ? 'selected' : ''}>${'DF_MANUAL_ROLLS.Setting_Options.Disabled'.localize()}</option>
			<option value="always" ${rollType === 'always' ? 'selected' : ''}>${'DF_MANUAL_ROLLS.Setting_Options.Always'.localize()}</option>
			<option value="toggle" ${rollType === 'toggle' ? 'selected' : ''}>${'DF_MANUAL_ROLLS.Setting_Options.Toggle'.localize()}</option>
		</select>
	</div>
</div>`);
			html.find('#characters').parent().before(rollConfig);
			// Resize the window
			app.element[0].style.height = '';
			app.element[0].style.width = '';
			app.setPosition({});
			if (!app._updateObject_ORIG) {
				app._updateObject_ORIG = app._updateObject;
				app._updateObject = async function (...args) {
					const result = await this._updateObject_ORIG(...args);
					ui.controls.initialize();
					return result;
				};
			}
		});
	}
}