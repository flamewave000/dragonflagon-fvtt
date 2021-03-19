
declare class ClientSettingsExt extends ClientSettings {
	dfSettingsClarity_register(module: string, key: string, data: ClientSettings.PartialData<any>): void
	dfSettingsClarity_registerMenu(module: string, key: string, data: ClientSettings.PartialMenuSettings): void;
}

class DFSettingsClarity {
	static types = ["client", "world"];

	static patchGameSettings() {
		(ClientSettings.prototype as any).dfSettingsClarity_register = ClientSettings.prototype.register;
		ClientSettings.prototype.register = DFSettingsClarity.settingsRegister;
		for (var pair of game.settings.settings) {
			pair[1].name = DFSettingsClarity.formatName(pair[1].name ?? '', pair[1]);
		}
	}

	static patchGameSettingsMenus() {
		(ClientSettings.prototype as any).dfSettingsClarity_registerMenu = ClientSettings.prototype.registerMenu;
		ClientSettings.prototype.registerMenu = DFSettingsClarity.settingsRegisterMenu;
		for (var pair of game.settings.menus) {
			pair[1].name = DFSettingsClarity.formatName(pair[1].name ?? '', pair[1]);
		}
	}

	static formatName(name: string, data: ClientSettings.PartialData<any> | ClientSettings.PartialMenuSettings): string {
		if (name.startsWith('👤') || name.startsWith('🌎'))
			return name;
		var scope;
		if (!!(data as ClientSettings.PartialData<any>).scope)
			scope = DFSettingsClarity.types.includes((data as ClientSettings.PartialData<any>).scope)
				? (data as ClientSettings.PartialData<any>).scope
				: "client";
		else if (!!(data as ClientSettings.PartialMenuSettings).restricted)
			scope = (data as ClientSettings.PartialMenuSettings) ? 'world' : 'client';
		else {
			console.warn('Unknown restriction/scope on registered setting for ' + name + '". Defaulting to "client"');
			scope = 'client';
		}
		if (scope === 'client') return !name ? '👤' : '👤 ' + game.i18n.localize(name);
		else if (scope === 'world') return !name ? '🌎' : '🌎 ' + game.i18n.localize(name);
		return name;
	}

	static settingsRegister(this: ClientSettingsExt, module: string, key: string, data: ClientSettings.PartialData<any>) {
		data.name = DFSettingsClarity.formatName(data.name ?? '', data);
		this.dfSettingsClarity_register(module, key, data);
	}

	static settingsRegisterMenu(this: ClientSettingsExt, module: string, key: string, data: ClientSettings.PartialMenuSettings) {
		data.name = DFSettingsClarity.formatName(data.name ?? '', data);
		this.dfSettingsClarity_registerMenu(module, key, data);
	}

	static showWorldHover(event: JQuery.MouseMoveEvent) {
		if (event.clientX > $(event.target).offset().left + 30) DFSettingsClarity.hideHover();
		else DFSettingsClarity.showHover($(event.target), 'world');
	}
	static showClientHover(event: JQuery.MouseMoveEvent) {
		if (event.clientX > $(event.target).offset().left + 30) DFSettingsClarity.hideHover();
		else DFSettingsClarity.showHover($(event.target), 'client');
	}

	static hover = $(`<div class="df-settings-clarity-tooltip" style="visibility:hidden"><span class="msg"></span><img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMzAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtMCAwLjVhMTEuNDA4IDExLjQwOCAyNC4wNTcgMCAxIDcuNjUxNCAzLjQxNThsMTEuODQ5IDExLjA4NC0xMS44NDkgMTEuMDg0YTExLjQwOCAxMS40MDggMTU1Ljk0IDAgMS03LjY1MTQgMy40MTU4IiBmaWxsPSIjMDAwMDAwQmYiIHN0cm9rZT0iI2Y2MCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg=="></div>`);
	static showHover(element: JQuery<HTMLElement>, scope: string) {
		const hover = DFSettingsClarity.hover;
		if (hover.parent().length != 0) return;
		hover.find('span.msg').text(game.i18n.localize('DRAGON_FLAGON.SettingsClarity_' + scope))
		$(document.body).append(hover);
		const css = {
			position: 'absolute',
			left: `${element.offset().left - hover.outerWidth()}px`,
			top: `${element.offset().top - 15}px`
		};
		hover.css(css);
	}
	static hideHover() {
		if (DFSettingsClarity.hover.parent().length == 0) return;
		DFSettingsClarity.hover.remove();
	}
}


Hooks.on('setup', function () {
	var user = game.data.users.find(x => x._id === game.userId) as any as User.Data;
	if (!!user && user.role >= 3) {
		DFSettingsClarity.patchGameSettings();
		DFSettingsClarity.patchGameSettingsMenus();
	}
	$(document.body).append(DFSettingsClarity.hover);
});
Hooks.on('ready', function () {
	DFSettingsClarity.hover.remove();
	DFSettingsClarity.hover.attr("style", "");
})

Hooks.on('renderSettingsConfig', function (settingsConfig, html, data) {
	html.find("label:contains('🌎')").mousemove(DFSettingsClarity.showWorldHover);
	html.find("label:contains('🌎')").mouseleave(DFSettingsClarity.hideHover);
	html.find("label:contains('👤')").mousemove(DFSettingsClarity.showClientHover);
	html.find("label:contains('👤')").mouseleave(DFSettingsClarity.hideHover);
});