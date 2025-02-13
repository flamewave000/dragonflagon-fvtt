import SETTINGS from "../common/Settings.mjs";

export default class DnD5eBetterAttackDialog {
	static init() {
		// @ts-ignore
		if (game.dnd5e) {
			SETTINGS.register('better-attack', {
				name: 'DF_QOL.BetterAttack.Name',
				hint: 'DF_QOL.BetterAttack.Hint',
				scope: 'world',
				type: Boolean,
				default: true,
				config: true,
				onChange: newValue => {
					const style = `<style id="dfqol-better-attack">
	.roll-configuration .dialog-buttons [data-action="advantage"] {
		border: 2px groove green !important;
	}
	.roll-configuration .dialog-buttons [data-action="normal"] {
		border: 2px groove grey !important;
	}
	.roll-configuration .dialog-buttons [data-action="disadvantage"] {
		border: 2px groove red !important;
	}
</style>`;
					const styleElement = $('#dfqol-better-attack');
					if (styleElement.length == 0 && newValue)
						$('body').append(style);
					else if (styleElement.length != 0 && !newValue)
						styleElement.remove();
				}
			});
			game.settings.settings.get(`${SETTINGS.MOD_NAME}.better-attack`).onChange(SETTINGS.get('better-attack'));
		}
	}
}