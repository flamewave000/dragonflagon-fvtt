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
					case 'disabled': html = `<i class="fas fa-dice" data-tooltip="${'DF_MANUAL_ROLLS.Setting_Options.Disabled'.localize()}"></i>`; break;
					case 'always': html = `<i class="fas fa-keyboard" data-tooltip="${'DF_MANUAL_ROLLS.Setting_Options.Always'.localize()}"></i>`; break;
					case 'toggle': html = `<i class="fas fa-toggle-on" data-tooltip="${'DF_MANUAL_ROLLS.Setting_Options.Toggle'.localize()}"></i>`; break;
				}
				$(element).append(`<span class="player-roll-type">${html}</span>`);
			});
		});
		Hooks.on('renderUserConfig', (/**@type {UserConfig}*/ app, /**@type {HTMLElement}*/ html) => {
			if (!game.user.isGM) return;
			const rollType = app.document.getFlag(SETTINGS.MOD_NAME, ManualRolls.FLAG_ROLL_TYPE);
			const rollConfig = $(`
<fieldset>
	<legend>${'DF_MANUAL_ROLLS.UserConfig.Title'.localize()}</legend>
	<div class="form-group">
		<div class="form-fields">
			<select name="dfmr_roll_type">
				<option value="" ${!rollType ? 'selected' : ''}></option>
				<option value="disabled" ${rollType === 'disabled' ? 'selected' : ''}>${'DF_MANUAL_ROLLS.Setting_Options.Disabled'.localize()}</option>
				<option value="always" ${rollType === 'always' ? 'selected' : ''}>${'DF_MANUAL_ROLLS.Setting_Options.Always'.localize()}</option>
				<option value="toggle" ${rollType === 'toggle' ? 'selected' : ''}>${'DF_MANUAL_ROLLS.Setting_Options.Toggle'.localize()}</option>
			</select>
		</div>
	</div>
</fieldset>`);
			$(html.querySelector('div.character').parentElement).before(rollConfig);
			// Resize the window
			app.element[0].style.height = '';
			app.element[0].style.width = '';
			app.setPosition({});
		});
		libWrapper.register(SETTINGS.MOD_NAME, 'foundry.applications.sheets.UserConfig.prototype._processFormData',
					/**
					 * @this {foundry.applications.sheets.UserConfig}
					 * @param {(...any) => any} wrapped
					 * @param {SubmitEvent} event
					 * @param {HTMLFormElement} form
					 * @param { { "chat-color": string } } formData
					 * @returns {Promise<any>}
					 */
					async function (wrapped, event, form, formData) {
						const flag = formData.object.dfmr_roll_type;
						delete formData.object.dfmr_roll_type;
						await this.document.setFlag(SETTINGS.MOD_NAME, ManualRolls.FLAG_ROLL_TYPE, flag);
						const result = await wrapped(event, form, formData);
						ui.controls.initialize();
						ui.players.render(true);
						return result;
					}, "WRAPPER");
	}
}