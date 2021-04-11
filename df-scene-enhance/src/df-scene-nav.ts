export default class DFSceneNav {
	static MODULE = 'df-scene-enhance';
	static ON_CLICK = 'nav-on-click';
	static ON_CLICK_PLAYER = 'nav-on-click-player';

	static patchSceneDirectoryClick(newValue?: Boolean, isPlayer?: Boolean) {
		var gmClick = game.settings.get(DFSceneNav.MODULE, DFSceneNav.ON_CLICK);
		var pcClick = game.settings.get(DFSceneNav.MODULE, DFSceneNav.ON_CLICK_PLAYER);
		if (newValue !== undefined) {
			if (isPlayer) pcClick = newValue;
			else gmClick = newValue;
		}

		// Determine our enabled state
		let enabled = (game.user.isGM && gmClick) || (!game.user.isGM && pcClick);

		if (enabled == !!(SceneDirectory.prototype as any).dfSceneNav_onClickEntityName)
			return;
		if (enabled) {
			(SceneDirectory.prototype as any).dfSceneNav_onClickEntityName = (SceneDirectory.prototype as any)._onClickEntityName;
			(SceneDirectory.prototype as any)._onClickEntityName = function (event: JQuery.ClickEvent) {
				event.preventDefault();
				const entity = this.constructor.collection.get(event.currentTarget.parentElement.dataset.entityId);
				if (entity instanceof Scene) entity.view();
				else this.dfSceneNav_onClickEntityName(event);
			};
			(SceneDirectory.prototype as any).dfSceneNav_getEntryContextOptions = (SceneDirectory.prototype as any)._getEntryContextOptions;
			(SceneDirectory.prototype as any)._getEntryContextOptions = function () {
				if (game.user.isGM) return this.dfSceneNav_getEntryContextOptions();
				else return [{
					name: "SCENES.View",
					icon: '<i class="fas fa-eye"></i>',
					condition: (li: JQuery<HTMLLIElement>) => !canvas.ready || (li.data("entityId") !== (canvas as Canvas).scene._id),
					callback: (li: JQuery<HTMLLIElement>) => {
						const scene = game.scenes.get(li.data("entityId"));
						scene.view();
					}
				}];
			}
		} else {
			(SceneDirectory.prototype as any)._onClickEntityName = (SceneDirectory.prototype as any).dfSceneNav_onClickEntityName;
			delete (SceneDirectory.prototype as any).dfSceneNav_onClickEntityName;
			(SceneDirectory.prototype as any)._getEntryContextOptions = (SceneDirectory.prototype as any).dfSceneNav_getEntryContextOptions;
			delete (SceneDirectory.prototype as any).dfSceneNav_getEntryContextOptions;
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
		(Sidebar.prototype as any).dfSceneNav_render = (Sidebar.prototype as any)._render;
		(Sidebar.prototype as any)._render = async function (...args: any[]) {
			// Render the Sidebar container only once
			if (!this.rendered) await this.dfSceneNav_render(...args);
			var pcClick = game.settings.get(DFSceneNav.MODULE, DFSceneNav.ON_CLICK_PLAYER);
			// Define the sidebar tab names to render
			const tabs = ["chat", "combat", "actors", "items", "journal", "tables", "playlists", "compendium", "settings"];
			if (game.user.isGM || pcClick) tabs.push("scenes");
			// Render sidebar Applications
			for (let name of tabs) {
				const app = (ui as any)[name] as Application;
				try {
					await (app as any)._render(true, {})
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
	static init() {
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
	}

	static ready() {
		DFSceneNav.patchSceneDirectoryClick();
	}
}
