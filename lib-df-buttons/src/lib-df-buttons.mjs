/// <reference path="./ToolType.d.ts" />

import SETTINGS from "../common/Settings.mjs";
import ControlManagerImpl from "./ControlManager.mjs";

SETTINGS.init('lib-df-buttons');

Hooks.once('init', () => {
	ui.moduleControls = new ControlManagerImpl();

	// Legacy setting — kept registered so existing worlds don't error on load
	SETTINGS.register('position', {
		scope: 'client',
		type: String,
		config: false,
		default: 'left',
	});
	SETTINGS.register('toolbar-pos', {
		scope: 'client',
		type: Object,
		config: false,
		default: null,
	});

	// Use the v13 namespaced Sidebar, falling back to the global for v12
	const SidebarClass = foundry.applications?.sidebar?.Sidebar ?? Sidebar;

	// Soft Dependency on `libwrapper`. Only use it if it already exists
	if (game.modules.get('libWrapper')?.active) {
		libWrapper.register(SETTINGS.MOD_NAME, 'foundry.applications.sidebar.Sidebar.prototype.expand', function (wrapped) {
			Hooks.callAll('collapseSidebarPre', this, !this._collapsed);
			wrapped();
		}, 'WRAPPER');
		libWrapper.register(SETTINGS.MOD_NAME, 'foundry.applications.sidebar.Sidebar.prototype.collapse', function (wrapped) {
			Hooks.callAll('collapseSidebarPre', this, !this._collapsed);
			wrapped();
		}, 'WRAPPER');
	}// Otherwise do the traditional style of monkey-patch wrapper
	else {
		const origExpand = SidebarClass.prototype.expand;
		SidebarClass.prototype.expand = function() {
			Hooks.callAll('collapseSidebarPre', this, !this._collapsed);
			origExpand.call(this);
		};
		const origCollapse = SidebarClass.prototype.collapse;
		SidebarClass.prototype.collapse = function() {
			Hooks.callAll('collapseSidebarPre', this, !this._collapsed);
			origCollapse.call(this);
		};
	}
});
Hooks.once('setup', () => ui.moduleControls.initialize());
Hooks.once('ready', () => ui.moduleControls.render(true));
