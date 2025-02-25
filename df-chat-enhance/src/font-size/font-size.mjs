/// <reference path="../../../fvtt-scripts/foundry.js" />
import SETTINGS from "../../common/Settings.mjs";

export default class FontSizePatch {

	/**@readonly*/static #PREF_SIZE = 'FontSizePatch.FontSize';

	static init() {
		SETTINGS.register(this.#PREF_SIZE, {
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
			default: 13,
			onChange: (newSize) => this.#updateFontSize(newSize)
		});
		this.#updateFontSize(SETTINGS.get(this.#PREF_SIZE));
	}

	/**@param {number} size*/
	static #updateFontSize(size) {
		/**@type {HTMLElement}*/
		const element = document.querySelector(':root');
		element.style.setProperty('--dfce-chat-font-size', size.toString() + 'px');
	}
}