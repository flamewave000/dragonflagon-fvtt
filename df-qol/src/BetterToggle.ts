import SETTINGS from "../../common/Settings";

export default class BetterToggle {
	static init() {
		SETTINGS.register('better-toggle', {
			name: 'DF_QOL.BetterToggle.Name',
			hint: 'DF_QOL.BetterToggle.Hint',
			scope: 'world',
			type: Boolean,
			default: true,
			config: true,
			onChange: newValue => {
				const style = `<style id="dfqol-better-toggle">#controls .control-tool.toggle.active{background:rgba(60,0,120,0.8) !important;color:#BBB;}#controls .control-tool.toggle.active:hover{color:#FFF;}</style>`;
				const styleElement = $('#dfqol-better-toggle');
				if (styleElement.length == 0 && newValue)
					$('body').append(style);
				else if (styleElement.length != 0 && !newValue)
					styleElement.remove();
			}
		});
		game.settings.settings.get(`${SETTINGS.MOD_NAME}.better-toggle`).onChange(SETTINGS.get('better-toggle'));
	}
}