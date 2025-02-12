/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
Application.prototype._recalculateDimensions = function () {
	this.element[0].style.height = '';
	this.setPosition({});
};
class SettingsProcessor {
	static DELIM = ' `````` ';
	_updateLabels(/**@type {string}*/text, /**@type {JQuery<HTMLDivElement>}*/div, /**@type {number}*/percentage) {
		const [label, hint] = text.split(SettingsProcessor.DELIM);
		if (percentage !== undefined) {
			if (isNaN(percentage))
				percentage = 0;
			const [redPerc, greenPerc] = percentage <= 0.5
				? [percentage / 0.5, 1] // <= 0.5, calc green to yellow
				: [1, 1 - ((percentage - 0.5) / 0.5)]; // > 0.5, calc yellow to red
			const red = Math.round(redPerc * 255).toString(16).padStart(2, '0');
			const green = Math.round(greenPerc * 255).toString(16).padStart(2, '0');
			div.css('border-left', `thick solid #${red}${green}00`);
			div.css('padding-left', '6px');
		}
		else {
			div.css('border-left', '');
			div.css('padding-left', '');
		}
		div.find('>label').html(label);
		if (div[0].classList.contains('submenu'))
			div.find('button>label').html(hint);
		else
			div.find('.notes').html(hint);
	}
	_getOptions(query) {
		const threshold = Math.min(100000, 10000 + (query.length * 10000));
		return {
			keys: ['text'],
			limit: Infinity,
			threshold: -threshold,
			allowTypo: false,
		};
	}
}
class DefaultSettingsProcessor extends SettingsProcessor {
	_settings = [];
	_getMenuData(/**@type {HTMLDivElement}*/div) {
		return {
			el: div,
			text: $(div).find('>label').text()
				+ SettingsProcessor.DELIM + $(div).find('button').find('label').text()
				+ SettingsProcessor.DELIM + $(div).find('.notes').text(),
		};
	}
	_getRegularData(/**@type {HTMLDivElement}*/div) {
		return {
			el: div,
			text: $(div).find('>label').text() + SettingsProcessor.DELIM + $(div).find('.notes').text(),
		};
	}
	processSettings(/**@type {JQuery<HTMLElement>}*/html) {
		html.find('.categories > .scrollable .form-group').each((_, element) => {
			if (element.classList.contains('submenu'))
				this._settings.push(this._getMenuData($(element)));
			else
				this._settings.push(this._getRegularData($(element)));
		});
	}
	injectSearch(/**@type {JQuery<HTMLElement>}*/html) {
		return html.find('input[name="filter"]');
	}
	performSearch(/**@type {string}*/pattern) {
		if (pattern.length < 2) {
			for (const item of this._settings) {
				item.el.show();
				this._updateLabels(item.text, item.el);
			}
			return;
		}
		const results = fuzzysort.go(pattern, this._settings, this._getOptions(pattern));
		for (let c = 0; c < this._settings.length; c++) {
			const resultIdx = results.findIndex(x => x.obj === this._settings[c]);
			let text;
			let percentage = undefined;
			if (resultIdx >= 0) {
				this._settings[c].el.show();
				text = fuzzysort.highlight(results[resultIdx][0]);
				percentage = resultIdx / (results.length - 1);
			}
			else {
				this._settings[c].el.hide();
				text = this._settings[c].text;
			}
			this._updateLabels(text, this._settings[c].el, percentage);
		}
	}
}
export default class FuzzySearch {
	static _settingsProcessor = null;
	static init() {
		Hooks.on('renderSettingsConfig', (_settingsConfig, html, _data) => {
			// Process entire settings list
			this._settingsProcessor = new DefaultSettingsProcessor();
			this._settingsProcessor.processSettings(html);
			// Add the search box to the view
			const searchField = this._settingsProcessor.injectSearch(html);
			// Activate listeners
			searchField.on('input', function () {
				FuzzySearch._settingsProcessor.performSearch($(this).val());
			});
			_settingsConfig._recalculateDimensions();
		});
	}
}
// add weights to the strings. Names have higher priority than Hints