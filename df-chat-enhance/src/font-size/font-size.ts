import SETTINGS from "../../../common/Settings";

export default class FontSizePatch {

	private static readonly PREF_SIZE = 'FontSizePatch.FontSize';

	static init() {
		SETTINGS.register<number>(this.PREF_SIZE, {
			name: 'DF_CHAT_FONT_SIZE.FontSizeName'.localize(),
			hint: 'DF_CHAT_FONT_SIZE.FontSizeHint'.localize(),
			config: true,
			type: Number,
			scope: 'client',
			range: {
				min: 10,
				max: 30,
				step: 0.5
			},
			default: 14,
			onChange: (newSize) => this.updateFontSize(newSize)
		});
		this.updateFontSize(SETTINGS.get<number>(this.PREF_SIZE));
	}

	private static updateFontSize(size: number) {
		(<HTMLElement>document.querySelector(':root')).style.setProperty('--dfce-chat-font-size', size.toString() + 'px');
	}
}