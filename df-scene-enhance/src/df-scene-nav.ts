import SETTINGS from "../../common/Settings";
import DFSceneThumb from "./df-scene-thumb";


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
		DFSceneThumb._getEntryContextOptions(options);

		const blackList = ['SCENES.Activate', 'SCENES.Configure', 'SCENES.ToggleNav', 'SCENES.GenerateThumb'];
		if (!game.user.isGM)
			return options.filter(x => !blackList.includes(x.name));
		return options;
	}

	static patchSceneDirectory() {
		libWrapper.register(SETTINGS.MOD_NAME, 'SceneDirectory.prototype._render', async function (this: SceneDirectory, wrapper: (force: any, options: any) => any, force: any, options: any) {
			if (!game.user.isGM && SETTINGS.get(DFSceneNav.ON_CLICK_PLAYER))
				return SidebarDirectory.prototype._render.apply(this, <any>[force, options]);
			return wrapper(force, options);
		}, 'MIXED');
	}

	static patchSidebar() {
		libWrapper.register(SETTINGS.MOD_NAME, 'Sidebar.prototype.getData', (wrapper: (options: any) => any, options: any) => {
			const data = wrapper(options);
			if (game.user.isGM || !SETTINGS.get(DFSceneNav.ON_CLICK_PLAYER))
				return data;
			return {
				tabs: {
					chat: data.tabs.chat,
					combat: data.tabs.combat,
					scenes: {
						tooltip: Scene.metadata.labelPlural,
						icon: CONFIG.Scene.sidebarIcon
					},
					actors: data.tabs.actors,
					items: data.tabs.items,
					journal: data.tabs.journal,
					tables: data.tabs.tables,
					cards: data.tabs.cards,
					playlists: data.tabs.playlists,
					compendium: data.tabs.compendium,
					settings: data.tabs.settings
				}
			};
		}, 'WRAPPER');
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
			return ((game.user && game.user.isGM) || !scene.navName) ? scene.name : scene.navName;
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
			const scene = <Scene>game.scenes.get(element.getAttribute('data-scene-id'));

			// Players will get a tooltip if the nav name is longer than 32 characters
			if (!game.user.isGM) {
				const title = scene.navName ?? scene.name;
				if (title.length > 32)
					element.title = scene.navName ?? scene.name;
				return;
			}

			// Don't add a title if there is no Nav Name
			if (!scene.navName || scene.navName.trim().length === 0) return;
			// If we are displaying the scene's Real Name
			if (SETTINGS.get(DFSceneNav.SCENE_NAV_REAL_NAME))
				element.title = 'DF-SCENE-ENHANCE.Nav.Tooltip_PC'.localize() + scene.navName;
			else
				element.title = scene.name;
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
					maximize: () => { }
				});
				return gridConfig.render(true);
			}
		});
		return options;
	}
}
