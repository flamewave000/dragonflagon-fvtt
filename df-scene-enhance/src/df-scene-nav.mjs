/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../types/ContextOption.d.ts" />
import SETTINGS from "../common/Settings.mjs";
import DFSceneThumb from "./df-scene-thumb.mjs";


export default class DFSceneNav {
	/**@readonly*/static #ON_CLICK = 'nav-on-click';
	/**@readonly*/static #ON_CLICK_PLAYER = 'nav-on-click-player';
	/**@readonly*/static #SCENE_NAV_REAL_NAME = 'nav-label-type';
	/**@readonly*/static #SCENE_NAV_HINTS = 'nav-label-hint';

	/**
	 * @param {boolean} [newValue]
	 * @param {boolean} [isPlayer]
	 */
	static patchSceneDirectoryClick(newValue, isPlayer) {
		let gmClick = SETTINGS.get(DFSceneNav.#ON_CLICK);
		let pcClick = SETTINGS.get(DFSceneNav.#ON_CLICK_PLAYER);
		if (newValue !== undefined) {
			if (isPlayer) pcClick = newValue;
			else gmClick = newValue;
		}

		// Determine our enabled state
		const enabled = (game.user.isGM && gmClick) || (!game.user.isGM && pcClick);
		if (enabled) {
			libWrapper.register(SETTINGS.MOD_NAME, 'SceneDirectory.prototype._onClickEntryName', this._onClickDocumentName, 'MIXED');
			libWrapper.register(SETTINGS.MOD_NAME, 'SceneDirectory.prototype._getEntryContextOptions', this._getEntryContextOptions, 'WRAPPER');
		} else {
			libWrapper.unregister(SETTINGS.MOD_NAME, 'SceneDirectory.prototype._onClickEntryName', false);
			libWrapper.unregister(SETTINGS.MOD_NAME, 'SceneDirectory.prototype._getEntryContextOptions', false);
		}
	}

	/**
	 * @private
	 * @this {SceneDirectory}
	 * @param {Function} wrapper
	 * @param {JQuery.ClickEvent} event
	 */
	static _onClickDocumentName(wrapper, event) {
		event.preventDefault();
		const entity = SceneDirectory.collection.get(event.currentTarget.parentElement.dataset.documentId);
		if (entity instanceof Scene) entity.view();
		else wrapper(event);
	}

	/**
	 * @private
	 * @param {Function} wrapper
	 * @param {...any} args
	 * @returns {ContextOption[]}
	 */
	static _getEntryContextOptions(wrapper, ...args) {
		/**@type {ContextOption[]}*/ const options = wrapper(...args);
		DFSceneThumb._getEntryContextOptions(options);
		const blackList = ['SCENES.Activate', 'SCENES.Configure', 'SCENES.ToggleNav', 'SCENES.GenerateThumb'];
		if (!game.user.isGM)
			return options.filter(x => !blackList.includes(x.name));

		// Add preload button for scene tab items
		const activateIdx = options.findIndex(x => x.name == 'SCENES.Activate');
		options.splice(activateIdx + 1, 0, {
				name: "SCENES.Preload",
				icon: '<i class="fas fa-download"></i>',
				condition: li => game.user.isGM && !game.scenes.get(li[0].dataset.documentId).active,
				callback: li => game.scenes.preload(li[0].dataset.documentId, true)
			});
		return options;
	}

	static patchSceneDirectory() {
		libWrapper.register(SETTINGS.MOD_NAME, 'SceneDirectory.prototype._render',
			/**
			 * @this {SceneDirectory}
			 * @param {(force: any, options: any) => any} wrapper
			 * @param {any} force
			 * @param {any} options
			 * @returns 
			 */
			async function (wrapper, force, options) {
				if (!game.user.isGM && SETTINGS.get(DFSceneNav.#ON_CLICK_PLAYER))
					return DocumentDirectory.prototype._render.apply(this, [force, options]);
				return wrapper(force, options);
			}, 'MIXED');
	}

	static patchSidebar() {
		libWrapper.register(SETTINGS.MOD_NAME, 'Sidebar.prototype.getData', (/**@type {(options: any) => any}*/wrapper, options) => {
			const data = wrapper(options);
			if (game.user.isGM || !SETTINGS.get(DFSceneNav.#ON_CLICK_PLAYER))
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
		SETTINGS.register(DFSceneNav.#ON_CLICK, {
			name: "DF-SCENE-ENHANCE.Nav.SettingOnClick",
			hint: "DF-SCENE-ENHANCE.Nav.SettingOnClickHint",
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			onChange: (/**@type {boolean}*/value) => DFSceneNav.patchSceneDirectoryClick(value, false)
		});
		SETTINGS.register(DFSceneNav.#ON_CLICK_PLAYER, {
			name: "DF-SCENE-ENHANCE.Nav.SettingOnClickPC",
			hint: "DF-SCENE-ENHANCE.Nav.SettingOnClickPCHint",
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			onChange: (/**@type {boolean}*/value) => DFSceneNav.patchSceneDirectoryClick(value, true)
		});

		SETTINGS.register(DFSceneNav.#SCENE_NAV_REAL_NAME, {
			name: 'DF-SCENE-ENHANCE.Nav.SettingShowTitle',
			hint: 'DF-SCENE-ENHANCE.Nav.SettingShowTitleHint',
			scope: 'world',
			config: true,
			type: Boolean,
			default: false,
			onChange: () => {
				DFSceneNav.#patchSceneNavGetData();
				ui.nav.render(false);
			}
		});

		SETTINGS.register(DFSceneNav.#SCENE_NAV_HINTS, {
			name: 'DF-SCENE-ENHANCE.Nav.SettingRealName',
			hint: 'DF-SCENE-ENHANCE.Nav.SettingRealNameHint',
			scope: 'world',
			config: true,
			type: Boolean,
			default: false,
			onChange: () => {
				ui.nav.render(false);
			}
		});

		Handlebars.registerHelper('dfCheck', function (scene) {
			return ((game.user && game.user.isGM) || !scene.navName) ? scene.name : scene.navName;
		});

		DFSceneNav.patchSceneDirectory();
		DFSceneNav.patchSidebar();
		DFSceneNav.#patchSceneNavGetData();

		libWrapper.register(SETTINGS.MOD_NAME, 'SceneNavigation.prototype.activateListeners', DFSceneNav.#SceneNavigation_activateListeners, 'WRAPPER');
		libWrapper.register(SETTINGS.MOD_NAME, 'SceneNavigation.prototype._getContextMenuOptions', DFSceneNav.#SceneNavigation_getContextMenuOptions, 'WRAPPER');
	}

	static ready() {
		DFSceneNav.patchSceneDirectoryClick();
	}

	static #patchSceneNavGetData() {
		if (SETTINGS.get(DFSceneNav.#SCENE_NAV_REAL_NAME))
			libWrapper.register(SETTINGS.MOD_NAME, 'SceneNavigation.prototype.getData', this.#SceneNavigation_getData, 'WRAPPER');
		else
			libWrapper.unregister(SETTINGS.MOD_NAME, 'SceneNavigation.prototype.getData', false);
	}
	/**
	 * @this {SceneNavigation}
	 * @param {Function} wrapper
	 * @param {object} options
	 * @returns { {collapsed:boolean,scenes:Scene[]} }
	 */
	static #SceneNavigation_getData(wrapper, options) {
		if (!game.user.isGM) return wrapper(options);
		/**@type { {collapsed:boolean,scenes:Scene[]} }*/
		const data = wrapper(options);
		for (const scene of data.scenes) {
			scene.name = game.scenes.get(scene.id).name;
		}
		return data;
	}

	/**
	 * @this {SceneNavigation}
	 * @param {(html: JQuery)=>void} wrapper
	 * @param {JQuery} html
	 */
	static #SceneNavigation_activateListeners(wrapper, html) {
		wrapper(html);
		html.find('li.scene.nav-item').each((_, /**@type {HTMLLIElement}*/ element) => {
			/**@type {Scene}*/ const scene = game.scenes.get(element.dataset.sceneId);
			const SHOW_REAL = SETTINGS.get(DFSceneNav.#SCENE_NAV_REAL_NAME);
			delete element.dataset.tooltip;
			if (!game.user.isGM || !SETTINGS.get(DFSceneNav.#SCENE_NAV_HINTS)) {
				/**@type {string}*/
				let title = (game.user.isGM && SHOW_REAL) ? scene.name : (scene.navName || scene.name);
				if (title.length > 32)
					element.dataset.tooltip = title;
				return;
			}
			// If we are displaying the scene's Real Name
			if (SHOW_REAL && scene.navName?.length !== 0)
				element.dataset.tooltip = 'DF-SCENE-ENHANCE.Nav.Tooltip_PC'.localize() + scene.navName;
			else if (scene.name.length > 32) {
				element.dataset.tooltip = scene.name;
				element.querySelector('.scene-name').textContent = scene.name.substring(0, 29) + '...';
			}
		});
	}

	/**
	 * @this {SceneNavigation}
	 * @param {Function} wrapper
	 * @returns {ContextOption[]}
	 */
	static #SceneNavigation_getContextMenuOptions(wrapper) {
		return wrapper().concat([{
			name: 'DF-SCENE-ENHANCE.Nav.ContextOptions.SetView',
			icon: '<i class="fas fa-crop-alt fa-fw"></i>',
			condition: li => game.user.isGM && game.scenes.get(li.data("sceneId")).isView,
			callback: async li => {
				const scene = game.scenes.get(li.data("sceneId"));
				await scene.update({
					initial: {
						x: parseInt(canvas.stage.pivot.x),
						y: parseInt(canvas.stage.pivot.y),
						scale: canvas.stage.scale.x
					}
				});
				ui.notifications.info("DF-SCENE-ENHANCE.Nav.ContextOptions.SetViewConfirmation".localize());
			}
		}, {
			name: 'DF-SCENE-ENHANCE.Nav.ContextOptions.ConfigGrid',
			icon: '<i class="fas fa-ruler-combined"></i>',
			condition: li => game.user.isGM && game.scenes.get(li.data("sceneId")).isView,
			callback: li => {
				/**@type {Scene}*/const scene = game.scenes.get(li.data("sceneId"));
				const gridConfig = new GridConfig(scene, scene.sheet);
				return gridConfig.render(true);
			}
		}]);
	}
}
