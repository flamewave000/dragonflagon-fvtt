class DFSceneNav {
	static MODULE = 'df-scene-enhance';
	static ON_CLICK = 'nav-on-click';
	static ON_CLICK_PLAYER = 'nav-on-click-player';

	static patchSceneDirectoryClick(newValue, isPlayer) {
		var gmClick = game.settings.get(DFSceneNav.MODULE, DFSceneNav.ON_CLICK);
		var pcClick = game.settings.get(DFSceneNav.MODULE, DFSceneNav.ON_CLICK_PLAYER);
		if (newValue !== undefined) {
			if (isPlayer) pcClick = newValue;
			else gmClick = newValue;
		}

		// Determine our enabled state
		let enabled = (game.user.isGM && gmClick) || (!game.user.isGM && pcClick);

		if (enabled == !!SceneDirectory.prototype.dfSceneNav_onClickEntityName)
			return;
		if (enabled) {
			SceneDirectory.prototype.dfSceneNav_onClickEntityName = SceneDirectory.prototype._onClickEntityName;
			SceneDirectory.prototype._onClickEntityName = function (event) {
				event.preventDefault();
				const entity = this.constructor.collection.get(event.currentTarget.parentElement.dataset.entityId);
				if (entity instanceof Scene) entity.view();
				else this.dfSceneNav_onClickEntityName(event);
			};
		} else {
			SceneDirectory.prototype._onClickEntityName = SceneDirectory.prototype.dfSceneNav_onClickEntityName;
			delete SceneDirectory.prototype.dfSceneNav_onClickEntityName;
		}
	}

	static patchSceneDirectory() {
		let sidebarDirDefOpts = Object.getOwnPropertyDescriptor(SidebarDirectory, 'defaultOptions');
		Object.defineProperty(SceneDirectory, 'defaultOptions', {
			get: function () {
				let options = mergeObject(sidebarDirDefOpts.get.bind(SceneDirectory)(), {
					template: `modules/${DFSceneNav.MODULE}/templates/scene-directory.hbs`,
				});
				return options;
			}
		});
	}

	static patchSidebar() {
		Sidebar.prototype.dfSceneNav_render = Sidebar.prototype._render;
		Sidebar.prototype._render = async function (...args) {
			// Render the Sidebar container only once
			if (!this.rendered) await this.dfSceneNav_render(...args);
			var pcClick = game.settings.get(DFSceneNav.MODULE, DFSceneNav.ON_CLICK_PLAYER);
			// Define the sidebar tab names to render
			const tabs = ["chat", "combat", "actors", "items", "journal", "tables", "playlists", "compendium", "settings"];
			if (game.user.isGM || pcClick) tabs.push("scenes");
			// Render sidebar Applications
			for (let name of tabs) {
				const app = ui[name];
				try {
					await app._render(true, {})
				} catch (err) {
					console.error(`Failed to render Sidebar tab ${name}`);
					console.error(err);
				}
			}
		}
		Sidebar.prototype.getData = function (options) {
			return {
				coreUpdate: game.data.coreUpdate ? game.i18n.format("SETUP.UpdateAvailable", game.data.coreUpdate) : false,
				user: game.user,
				scenesAllowed: game.user.isGM || game.settings.get(DFSceneNav.MODULE, DFSceneNav.ON_CLICK_PLAYER)
			};
		}
		let sidebarDefaultOptions = Object.getOwnPropertyDescriptor(Sidebar, 'defaultOptions');
		Object.defineProperty(Sidebar, 'defaultOptions', {
			get: function () {
				return mergeObject(sidebarDefaultOptions.get(), {
					template: `modules/${DFSceneNav.MODULE}/templates/sidebar.hbs`
				});
			}
		});
	}
}

Hooks.once('init', function () {
	game.settings.register(DFSceneNav.MODULE, DFSceneNav.ON_CLICK, {
		name: "DRAGON_FLAGON.Nav_SettingOnClick",
		hint: "DRAGON_FLAGON.Nav_SettingOnClickHint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		onChange: value => DFSceneNav.patchSceneDirectoryClick(value, false)
	});
	game.settings.register(DFSceneNav.MODULE, DFSceneNav.ON_CLICK_PLAYER, {
		name: "DRAGON_FLAGON.Nav_SettingOnClickPC",
		hint: "DRAGON_FLAGON.Nav_SettingOnClickPCHint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		onChange: value => DFSceneNav.patchSceneDirectoryClick(value, true)
	});

	Handlebars.registerHelper('dfCheck', function (scene) {
		return ((game.user && game.user.isGM) || !scene.data.navName) ? scene.data.name : scene.data.navName;
	})

	DFSceneNav.patchSceneDirectory();
	DFSceneNav.patchSidebar();
});

Hooks.on('ready', function () {
	DFSceneNav.patchSceneDirectoryClick();
});
