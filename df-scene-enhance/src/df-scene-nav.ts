import SETTINGS from "../../common/Settings";

interface ContextOption {
	name: string;
	icon: string;
	condition?: (li: JQuery<HTMLLIElement>) => boolean;
	callback: ((li: JQuery<HTMLLIElement>) => Promise<unknown>) | ((li: JQuery<HTMLLIElement>) => void)
}

export default class DFSceneNav {
	private static readonly ON_CLICK = 'nav-on-click';
	private static readonly ON_CLICK_PLAYER = 'nav-on-click-player';
	private static readonly SCENE_NAV_REAL_NAME = 'nav-label-type';

	static patchSceneDirectoryClick(newValue?: boolean, isPlayer?: boolean) {
		let gmClick = SETTINGS.get(DFSceneNav.ON_CLICK);
		let pcClick = SETTINGS.get(DFSceneNav.ON_CLICK_PLAYER);
		if (newValue !== undefined) {
			if (isPlayer) pcClick = newValue;
			else gmClick = newValue;
		}

		// Determine our enabled state
		const enabled = (game.user.isGM && gmClick) || (!game.user.isGM && pcClick);
		if (enabled) {
			libWrapper.register(SETTINGS.MOD_NAME, 'SceneDirectory.prototype._onClickDocumentName', this._onClickDocumentName, 'MIXED');
			libWrapper.register(SETTINGS.MOD_NAME, 'SceneDirectory.prototype._getEntryContextOptions', this._getEntryContextOptions, 'WRAPPER');
		} else {
			libWrapper.unregister(SETTINGS.MOD_NAME, 'SceneDirectory.prototype._onClickDocumentName', false);
			libWrapper.unregister(SETTINGS.MOD_NAME, 'SceneDirectory.prototype._getEntryContextOptions', false);
		}
	}

	private static _onClickDocumentName(this: SceneDirectory, wrapper: AnyFunction, event: JQuery.ClickEvent) {
		event.preventDefault();
		const entity = SceneDirectory.collection.get(event.currentTarget.parentElement.dataset.documentId);
		if (entity instanceof Scene) entity.view();
		else wrapper(event);
	}

	private static _getEntryContextOptions(wrapper: AnyFunction, ...args: any) {
		const options: ContextOption[] = wrapper(...args);
		if (!game.user.isGM) {
			options.push({
				name: "SCENES.View",
				icon: '<i class="fas fa-eye"></i>',
				condition: li => !canvas.ready || (li.data("entityId") !== (canvas as Canvas).scene.id),
				callback: li => {
					const scene = game.scenes.get(li.data("entityId"));
					scene.view();
				}
			});
		}
		return options;
	}

	static patchSceneDirectory() {
		const defaultOptions = duplicate(SceneDirectory.defaultOptions);
		Object.defineProperty(SceneDirectory, 'defaultOptions', {
			get: function () {
				const options = mergeObject(defaultOptions, {
					template: `modules/${SETTINGS.MOD_NAME}/templates/scene-directory.hbs`,
				});
				return options;
			}
		});
	}

	static patchSidebar() {
		libWrapper.register(SETTINGS.MOD_NAME, 'Sidebar.prototype._render', async function (this: Sidebar, wrapper: AnyFunction, force: boolean, options = {}) {
			if (!SETTINGS.get(DFSceneNav.ON_CLICK_PLAYER))
				return wrapper(force, options);
			/************** COPIED FROM Sidebar.prototype._render *************/
			// Render the Sidebar container only once
			// @ts-expect-error
			if (!this.rendered) await Application.prototype._render.apply(this, [force, options]);

			// Define the sidebar tab names to render
			const tabs = ["chat", "combat", "actors", "items", "journal", "tables", "cards", "playlists", "compendium", "settings"];
			if (game.user.isGM || SETTINGS.get(DFSceneNav.ON_CLICK_PLAYER)) tabs.push("scenes");

			// Render sidebar Applications
			for (const [name, app] of Object.entries(this.tabs)) {
				// @ts-expect-error
				app._render(true).catch(err => {
					// @ts-expect-error
					Hooks.onError("Sidebar#_render", err, {
						msg: `Failed to render Sidebar tab ${name}`,
						log: "error",
						name
					});
				});
			}
			/******************************************************************/
		}, 'MIXED');
		libWrapper.register(SETTINGS.MOD_NAME, 'SceneDirectory.prototype._render', async function (this: SceneDirectory, wrapper: AnyFunction, ...args: any) {
			if (!SETTINGS.get(DFSceneNav.ON_CLICK_PLAYER)) return wrapper(...args);
			// @ts-expect-error
			return SidebarDirectory.prototype._render.apply(this, <any>[...args]);
		}, 'MIXED');
		libWrapper.register(SETTINGS.MOD_NAME, 'Sidebar.prototype.getData', (wrapper: (options: any) => Sidebar.Data, options: any) => {
			return mergeObject(wrapper(options), { scenesAllowed: game.user.isGM || SETTINGS.get(DFSceneNav.ON_CLICK_PLAYER) });
		}, 'WRAPPER');
		const sidebarDefaultOptions = Object.getOwnPropertyDescriptor(Sidebar, 'defaultOptions');
		Object.defineProperty(Sidebar, 'defaultOptions', {
			get: function () {
				return mergeObject(sidebarDefaultOptions.get(), {
					template: `modules/${SETTINGS.MOD_NAME}/templates/sidebar.hbs`
				});
			}
		});
	}
	static init() {
		SETTINGS.register(DFSceneNav.ON_CLICK, {
			name: "DF-SCENE-ENHANCE.Nav.SettingOnClick",
			hint: "DF-SCENE-ENHANCE.Nav.SettingOnClickHint",
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			onChange: (value: boolean) => DFSceneNav.patchSceneDirectoryClick(value, false)
		});
		SETTINGS.register(DFSceneNav.ON_CLICK_PLAYER, {
			name: "DF-SCENE-ENHANCE.Nav.SettingOnClickPC",
			hint: "DF-SCENE-ENHANCE.Nav.SettingOnClickPCHint",
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			onChange: (value: boolean) => DFSceneNav.patchSceneDirectoryClick(value, true)
		});

		SETTINGS.register(DFSceneNav.SCENE_NAV_REAL_NAME, {
			name: 'DF-SCENE-ENHANCE.Nav.SettingRealName',
			hint: 'DF-SCENE-ENHANCE.Nav.SettingRealNameHint',
			scope: 'world',
			config: true,
			type: Boolean,
			default: false,
			onChange: () => {
				DFSceneNav.patchSceneNavGetData();
				ui.nav.render(false);
			}
		});

		Handlebars.registerHelper('dfCheck', function (scene) {
			return ((game.user && game.user.isGM) || !scene.data.navName) ? scene.data.name : scene.data.navName;
		});

		DFSceneNav.patchSceneDirectory();
		DFSceneNav.patchSidebar();
		DFSceneNav.patchSceneNavGetData();
		libWrapper.register(SETTINGS.MOD_NAME, 'SceneNavigation.prototype.activateListeners', DFSceneNav.SceneNavigation_activateListeners, 'WRAPPER');
		libWrapper.register(SETTINGS.MOD_NAME, 'SceneNavigation.prototype._getContextMenuOptions', DFSceneNav.SceneNavigation_getContextMenuOptions, 'WRAPPER');
	}

	static ready() {
		DFSceneNav.patchSceneDirectoryClick();
	}


	private static patchSceneNavGetData() {
		if (SETTINGS.get(DFSceneNav.SCENE_NAV_REAL_NAME))
			libWrapper.register(SETTINGS.MOD_NAME, 'SceneNavigation.prototype.getData', this.SceneNavigation_getData, 'WRAPPER');
		else
			libWrapper.unregister(SETTINGS.MOD_NAME, 'SceneNavigation.prototype.getData', false);
	}
	private static SceneNavigation_getData(this: SceneNavigation, wrapper: AnyFunction, _options: any) {
		const data: {
			collapsed: boolean,
			scenes: Scene[]
		} = wrapper(_options);
		for (const scene of data.scenes) {
			// @ts-expect-error
			scene.name = game.scenes.get(scene._id).name;
		}
		return data;
	}

	private static SceneNavigation_activateListeners(this: SceneNavigation, wrapper: (html: JQuery) => void, html: JQuery) {
		wrapper(html);
		html.find('li.scene.nav-item').each((_, element) => {
			const scene = game.scenes.get(element.getAttribute('data-scene-id'));

			// Players will get a tooltip if the nav name is longer than 32 characters
			if (!game.user.isGM) {
				const title = scene.data.navName ?? scene.data.name;
				if (title.length > 32)
					element.title = scene.data.navName ?? scene.data.name;
				return;
			}

			// Don't add a title if there is no Nav Name
			if (!scene.data.navName || scene.data.navName.trim().length === 0) return;
			// If we are displaying the scene's Real Name
			if (SETTINGS.get(DFSceneNav.SCENE_NAV_REAL_NAME))
				element.title = 'DF-SCENE-ENHANCE.Nav.Tooltip_PC'.localize() + scene.data.navName;
			else
				element.title = scene.data.name;
		});
	}

	private static SceneNavigation_getContextMenuOptions(this: SceneNavigation, wrapper: AnyFunction) {
		const options = <ContextOption[]>wrapper();
		options.push({
			name: 'DF-SCENE-ENHANCE.Nav.ContextOptions.SetView',
			icon: '<i class="fas fa-crop-alt fa-fw"></i>',
			condition: li => game.user.isGM && game.scenes.get(li.attr('data-scene-id')).isView,
			callback: async li => {
				const scene = game.scenes.get(li.attr('data-scene-id'));
				await scene.update({
					initial: {
						x: parseInt(<any>canvas.stage.pivot.x),
						y: parseInt(<any>canvas.stage.pivot.y),
						scale: canvas.stage.scale.x
					}
				});
				ui.notifications.info("DF-SCENE-ENHANCE.Nav.ContextOptions.SetViewConfirmation".localize());
			}
		}, {
			name: 'DF-SCENE-ENHANCE.Nav.ContextOptions.ConfigGrid',
			icon: '<i class="fas fa-ruler-combined"></i>',
			condition: li => game.user.isGM && game.scenes.get(li.attr('data-scene-id')).isView,
			callback: li => {
				const scene = game.scenes.get(li.attr('data-scene-id'));
				const gridConfig = new GridConfig(scene, <any>{
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					maximize: () => {}
				});
				return gridConfig.render(true);
			}
		});
		return options;
	}
}
