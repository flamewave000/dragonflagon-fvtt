import SETTINGS from "../../common/Settings";
import ManualRolls from "./ManualRolls";

export default class RollSettings {
	static init() {
		Hooks.on('renderPlayerList', (app: PlayerList, html: JQuery<HTMLElement>) => {
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
		Hooks.on('renderUserConfig', (app: UserConfig, html: JQuery<HTMLElement>) => {
			if (!game.user.isGM) return;
			const rollType = app.object.getFlag(SETTINGS.MOD_NAME, ManualRolls.FLAG_ROLL_TYPE);
			const rollConfig = $(`<div class="form-group">
	<label>${'Manual Roll Override'.localize()}</label>
	<select name="flags.df-manual-rolls.roll-type">
		<option value="" ${!rollType ? 'selected' : ''}></option>
		<option value="disabled" ${rollType === 'disabled' ? 'selected' : ''}>${'DF_MANUAL_ROLLS.Setting_Options.Disabled'.localize()}</option>
		<option value="always" ${rollType === 'always' ? 'selected' : ''}>${'DF_MANUAL_ROLLS.Setting_Options.Always'.localize()}</option>
		<option value="toggle" ${rollType === 'toggle' ? 'selected' : ''}>${'DF_MANUAL_ROLLS.Setting_Options.Toggle'.localize()}</option>
	</select>
</div>`);
			html.find('input[name="color"]').parent().after(rollConfig);
			// Resize the window
			app.element[0].style.height = '';
			app.element[0].style.width = '';
			app.setPosition({});
			(app as any)._updateObject_ORIG = (app as any)._updateObject;
			(app as any)._updateObject = async function (...args: any) {
				const result = await (this as any)._updateObject_ORIG(...args);
				ui.controls.initialize();
				return result;
			};
		});
	}
}