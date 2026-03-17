/// <reference path="../../common/libWrapper.d.ts" />
import { parseHTML } from "../common/fvtt.mjs";
class DFSettingsClarity {
	static types = ["client", "world"];
	static patchGameSettings() {
		libWrapper.register('df-settings-clarity', 'foundry.helpers.ClientSettings.prototype.register', DFSettingsClarity.settingsRegister, 'WRAPPER');
		for (const pair of game.settings.settings) {
			pair[1].name = DFSettingsClarity.formatName(pair[1].name ?? '', pair[1]);
		}
	}
	static patchGameSettingsMenus() {
		libWrapper.register('df-settings-clarity', 'foundry.helpers.ClientSettings.prototype.registerMenu', DFSettingsClarity.settingsRegisterMenu, 'WRAPPER');
		for (const pair of game.settings.menus) {
			pair[1].name = DFSettingsClarity.formatName(pair[1].name ?? '', pair[1]);
		}
	}
	/**
	 * @param {string} name
	 * @param {object} data
	 * @returns {string}
	 */
	static formatName(name, data) {
		if (name.startsWith('👤') || name.startsWith('🌎'))
			return name;
		let scope;
		if (data.scope)
			scope = DFSettingsClarity.types.includes(data.scope) ? data.scope : "client";
		else if (data.restricted)
			scope = data ? 'world' : 'client';
		else {
			console.debug('Unknown restriction/scope on registered setting for ' + name + '". Defaulting to "client"');
			scope = 'client';
		}
		if (scope === 'client')
			return !name ? '👤' : '👤 ' + game.i18n.localize(name);
		else if (scope === 'world')
			return !name ? '🌎' : '🌎 ' + game.i18n.localize(name);
		return name;
	}
	/**
	 * @param {Function} wrapper 
	 * @param {string} module 
	 * @param {string} key 
	 * @param {object} data 
	 */
	static settingsRegister(wrapper, module, key, data) {
		data.name = DFSettingsClarity.formatName(data.name ?? '', data);
		wrapper(module, key, data);
	}
	/**
	 * @param {Function} wrapper 
	 * @param {string} module 
	 * @param {string} key 
	 * @param {object} data 
	 */
	static settingsRegisterMenu(wrapper, module, key, data) {
		data.name = DFSettingsClarity.formatName(data.name ?? '', data);
		wrapper(module, key, data);
	}
	/** @param {Event} event */
	static showWorldHover(event) {
		if (event.clientX > event.target.getBoundingClientRect().left + 30)
			DFSettingsClarity.hideHover();
		else
			DFSettingsClarity.showHover(event.target, 'world');
	}
	/** @param {Event} event */
	static showClientHover(event) {
		if (event.clientX > event.target.getBoundingClientRect().left + 30)
			DFSettingsClarity.hideHover();
		else
			DFSettingsClarity.showHover(event.target, 'client');
	}
	static hover = parseHTML(`<div class="df-settings-clarity-tooltip" style="visibility:hidden"><span class="msg"></span><img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMzAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtMCAwLjVhMTEuNDA4IDExLjQwOCAyNC4wNTcgMCAxIDcuNjUxNCAzLjQxNThsMTEuODQ5IDExLjA4NC0xMS44NDkgMTEuMDg0YTExLjQwOCAxMS40MDggMTU1Ljk0IDAgMS03LjY1MTQgMy40MTU4IiBmaWxsPSIjMDAwMDAwQmYiIHN0cm9rZT0iI2Y2MCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg=="></div>`);
	/**
	 * @param {HTMLElement} element
	 * @param {string} scope
	 */
	static showHover(element, scope) {
		const hover = DFSettingsClarity.hover;
		if (hover.parentElement != null)
			return;
		hover.querySelector('span.msg').textContent = game.i18n.localize('DF_SETTINGS_CLARITY.Scope_' + scope);
		document.body.appendChild(hover);
		const bounds = element.getBoundingClientRect();
		hover.style.left = `${bounds.left - hover.offsetWidth}px`;
		hover.style.top = `${bounds.top - 15}px`;
	}
	static hideHover() {
		DFSettingsClarity.hover.remove();
	}
}

Hooks.once('setup', function () {
	const user = game.data.users.find(x => x._id === game.userId);
	const perms = game.settings.get('core', 'permissions');
	if (!!user && perms['SETTINGS_MODIFY'].includes(user.role)) {
		DFSettingsClarity.patchGameSettings();
		DFSettingsClarity.patchGameSettingsMenus();
	}
	document.body.appendChild(DFSettingsClarity.hover);
});

Hooks.once('ready', function () {
	if (!game.modules.get('lib-wrapper')?.active) {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error(game.i18n.localize('DF_SETTINGS_CLARITY.errorLibWrapperMissing'));
		return;
	}
	DFSettingsClarity.hover.remove();
	DFSettingsClarity.hover.removeAttribute("style");
});

Hooks.on('renderSettingsConfig', /** @param {HTMLElement} html */ function (_app, html, _data) {
	const labels = [...html.querySelectorAll("label")];
	labels.filter(x => x.textContent.includes('🌎')).forEach(world => {
		world.addEventListener('mousemove', DFSettingsClarity.showWorldHover);
		world.addEventListener('mouseleave', DFSettingsClarity.hideHover);
	});
	labels.filter(x => x.textContent.includes('👤')).forEach(client => {
		client.addEventListener('mousemove', DFSettingsClarity.showClientHover);
		client.addEventListener('mouseleave', DFSettingsClarity.hideHover);
	});
});