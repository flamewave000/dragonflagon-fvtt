import { } from "./lib/fuzzysort.js";

abstract class SettingsProcessor {
	static readonly DELIM = ' `````` ';
	abstract processSettings(html: JQuery<HTMLElement>): void;
	abstract injectSearch(html: JQuery<HTMLElement>): JQuery<HTMLInputElement>;
	abstract performSearch(pattern: string): void;

	protected _updateLabels(text: string, div: JQuery<HTMLElement>, percentage?: number) {
		var [label, hint] = text.split(SettingsProcessor.DELIM);
		if (percentage !== undefined) {
			if (isNaN(percentage)) percentage = 0;
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
	protected _getOptions(query: string): Fuzzysort.KeysOptions<any> {
		const threshold = Math.min(100000, 10000 + ((query.length - 2) * 10000));
		return {
			keys: ['text'],
			limit: Infinity,
			threshold: -threshold,
			allowTypo: false,
		}
	}
}

interface DefaultModuleItem { el: JQuery<HTMLElement>, text: string }
class DefaultSettingsProcessor extends SettingsProcessor {
	private _settings: DefaultModuleItem[] = [];
	private _getMenuData(div: JQuery<HTMLElement>): DefaultModuleItem {
		return {
			el: div,
			text: $(div).find('>label').text() + SettingsProcessor.DELIM + $(div).find('button').find('label').text(),
		};
	}
	private _getRegularData(div: JQuery<HTMLElement>): DefaultModuleItem {
		return {
			el: div,
			text: $(div).find('>label').text() + SettingsProcessor.DELIM + $(div).find('.notes').text(),
		};
	}
	processSettings(html: JQuery<HTMLElement>) {
		const children = $(html.find('.settings-list')[2]).children();
		children.each((idx: number, element: HTMLElement) => {
			if (element instanceof HTMLHeadingElement) return;
			else {
				if (element.classList.contains('submenu'))
					this._settings.push(this._getMenuData($(element)));
				else
					this._settings.push(this._getRegularData($(element)));
			}
		});
	}
	injectSearch(html: JQuery<HTMLElement>): JQuery<HTMLInputElement> {
		const search = <JQuery<HTMLInputElement>>$(`
<div id="dfsc_search">
	<input type="text" placeholder="${game.i18n.localize('DF_SETTINGS_CLARITY.SearchPlaceholder')}">
	<button class="dfsc_clear-search" style="display:none"><i class="fas fa-times"></i></button>
</div>`);
		$(html.find('.settings-list')[2]).prepend(search);
		html.find('button[name="reset"]').css('height', 'fit-content');
		html.find('button[name="reset"]').css('margin-top', 'auto');
		html.find('button[name="submit"]').css('height', 'fit-content');
		html.find('button[name="submit"]').css('margin-top', 'auto');
		return search;
	}
	performSearch(pattern: string) {
		if (pattern.length < 2) {
			for (let item of this._settings) {
				item.el.show();
				this._updateLabels(item.text, item.el);
			}
			return;
		}
		const results = fuzzysort.go(pattern, this._settings, this._getOptions(pattern));
		console.log(results.map(x => x.score));
		for (let c = 0; c < this._settings.length; c++) {
			const resultIdx = results.findIndex(x => x.obj === this._settings[c]);
			var text: string;
			var percentage: number = undefined;
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

interface TidyUiModuleItem { article: HTMLElement, el: JQuery<HTMLElement>, text: string }
class TidyUiSettingsProcessor extends SettingsProcessor {
	private _settings: TidyUiModuleItem[] = [];
	private _articles: Map<HTMLElement, boolean> = new Map();

	private _toggleArticle(article: JQuery<HTMLElement>, open: boolean) {
		if (open) {
			article.find('h2').addClass('open');
			article.find('section').show();
		}
		else {
			article.find('h2').removeClass('open');
			article.find('section').hide();
		}
	}
	private _getMenuData(article: HTMLElement, div: JQuery<HTMLElement>): TidyUiModuleItem {
		return {
			article,
			el: div,
			text: $(div).find('>label').text() + SettingsProcessor.DELIM + $(div).find('button>label').text()
		};
	}
	private _getRegularData(article: HTMLElement, div: JQuery<HTMLElement>): TidyUiModuleItem {
		return {
			article,
			el: div,
			text: $(div).find('>label').text() + SettingsProcessor.DELIM + $(div).find('.notes').text()
		};
	}

	processSettings(html: JQuery<HTMLElement>) {
		const articles = html.find('.settings-list > article');
		articles.each((_, element: HTMLElement) => {
			this._articles.set(element, false);
			$(element).find('section').children().each((_, childElement) => {
				const child = $(childElement);
				if (childElement.classList.contains('submenu'))
					this._settings.push(this._getMenuData(element, child));
				else
					this._settings.push(this._getRegularData(element, child));
			})
		});
	}
	injectSearch(html: JQuery<HTMLElement>): JQuery<HTMLInputElement> {
		const search = <JQuery<HTMLInputElement>>$(`
<div id="dfsc_search" class="tidy-ui">
	<input type="text" placeholder="${game.i18n.localize('DF_SETTINGS_CLARITY.SearchPlaceholder')}">
	<button class="dfsc_clear-search" style="display:none"><i class="fas fa-times"></i></button>
</div>`);
		html.find('#searchField').after(search);
		return search;
	}
	performSearch(pattern: string) {
		if (pattern.length < 2) {
			for (let item of this._settings) {
				item.el.show();
				super._updateLabels(item.text, item.el);
			}
			for (let article of this._articles.entries()) {
				this._articles.set(article[0], false);
				this._toggleArticle($(article[0]), false);
			}
			return;
		}
		const results = fuzzysort.go(pattern, this._settings, this._getOptions(pattern));
		for (let article of this._articles.keys()) {
			this._articles.set(article, false);
		}
		for (let c = 0; c < this._settings.length; c++) {
			const resultIdx = results.findIndex(x => x.obj === this._settings[c]);
			var text: string;
			var percentage: number = undefined;
			if (resultIdx >= 0) {
				this._articles.set(this._settings[c].article, true);
				this._settings[c].el.show();
				text = fuzzysort.highlight(results[resultIdx][0]);
				percentage = resultIdx / (results.length - 1);
			}
			else {
				this._settings[c].el.hide();
				text = this._settings[c].text;
			}
			this._updateLabels(text, this._settings[c].el, percentage)
		}
		for (let article of this._articles.entries()) {
			this._toggleArticle($(article[0]), article[1]);
		}
	}
}

export default class FuzzySearch {
	private static _settingsProcessor: SettingsProcessor = null;
	static init() {
		Hooks.on('renderSettingsConfig', (_settingsConfig, html: JQuery<HTMLElement>, _data) => {
			// Process entire settings list
			// First detect if Tidy UI is installed
			if (game.modules.get('tidy-ui_game-settings')?.active)
				this._settingsProcessor = new TidyUiSettingsProcessor();
			// If not, do regular processing
			else
				this._settingsProcessor = new DefaultSettingsProcessor();

			this._settingsProcessor.processSettings(html);
			// Add the search box to the view
			const searchField = this._settingsProcessor.injectSearch(html);
			// Activate listeners
			searchField.find('input').on('input', function () {
				const value = <string>$(this).val();
				FuzzySearch._settingsProcessor.performSearch(value);
				if (value === '') searchField.find('button').hide();
				else searchField.find('button').show();
			});
			// Clear search
			searchField.find('button').on('click', function (event) {
				event.preventDefault();
				searchField.find('input').val('');
				$(this).hide();
				FuzzySearch._settingsProcessor.performSearch('');
			});
		});
	}
}
// add weights to the strings. Names have higher priority than Hints