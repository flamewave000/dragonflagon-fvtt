/// <reference path="./ToolType.d.ts" />
/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../fvtt-scripts/foundry-esm.js" />

import SETTINGS from "../common/Settings.mjs";

/**
 * @typedef {object} ToolUI
 * @property {string} name
 * @property {string} title
 * @property {string} icon
 * @property {string | false} class
 * @property {boolean} active
 * @property {boolean} button
 * @property {boolean} toggle
 */

/**
 * @typedef {ToolUI} ToolGroupUI
 * @property {Partial<ToolUI>[]} tools
 */

/**
 * @typedef {object} CMData
 * @property {Partial<ToolGroupUI>[]} groups
 * @property {boolean} singleGroup
 */

/**
 * @implements {IControlManager}
 */
export default class ControlManager extends Application {
	/**
	 * 
	 * @param {Predicate | boolean | null} [field]
	 * @param {*} invertFalsey 
	 * @returns {Promise<boolean>}
	 */
	static async checkBoolean(field, invertFalsey = false) {
		return field instanceof Function ? await field() :
			((invertFalsey && (field === null || field === undefined || field)) || (!invertFalsey && !!field));
	}

	#initializationIncomplete = false;
	/**@type {ToolGroup[]}*/ #_groups = [];
	/**@type {JQuery<HTMLElement> | null}*/ #magnetMenu = null;
	/**@type {Record<string, number>}*/ #hooksRegister = {};
	/**@type {ToolGroup[]}*/ get groups() { return this.#_groups; }
	/**@type {string|null}*/ activeGroupName = null;

	get activeToolName() {
		const group = this.activeGroup;
		return group ? group.activeTool : null;
	}
	get activeGroup() {
		if (!this.groups) return null;
		return this.groups.find(c => c.name === this.activeGroupName) || null;
	}
	get activeTool() {
		const group = this.activeGroup;
		if (!group) return null;
		const tool = group.tools.find(t => t.name === group.activeTool);
		return tool || null;
	}
	/**@type {ApplicationOptions}*/
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			width: 100,
			id: "moduleControls",
			template: `modules/lib-df-buttons/templates/controls.hbs`,
			popOut: false,
			resizable: false,

		});
	}

	/**
	 * @param {Tool} control
	 */
	static #initializeFields(control) {
		// TODO: Remove this block in the future!
		//! Handle deprecated `active` field
		if (control.active !== undefined)
			control.isActive = control.active;
		// TODO: END OF BLOCK
		control.toggle = !!control.toggle;
		control.button = !!control.button;
		control.isActive = control.toggle ? (control.isActive ?? false) : false;
		control.visible = control.visible ?? true;
		control.onClick = control.onClick ?? null;
	}

	async initialize() {
		this.#_groups = this.#_getModuleToolGroups();
		// Defer initialization completion to the first render call
		this.#initializationIncomplete = true;
	}
	async #completeInitialization() {
		this.#initializationIncomplete = false;
		this.#hooksRegister['collapseSidebarPre'] = Hooks.on('collapseSidebarPre', this.#_handleSidebarCollapse.bind(this));
		this.#hooksRegister['activateGroupByName'] = Hooks.on('activateGroupByName', this.activateGroupByName.bind(this));
		this.#hooksRegister['activateToolByName'] = Hooks.on('activateToolByName', this.activateToolByName.bind(this));
		this.#hooksRegister['reloadModuleButtons'] = Hooks.on('reloadModuleButtons', this.reloadModuleButtons.bind(this));
		this.#hooksRegister['refreshModuleButtons'] = Hooks.on('refreshModuleButtons', this.refresh.bind(this));
		this.#hooksRegister['renderSceneControls'] = Hooks.on('renderSceneControls', () => { this.refresh(); this.#_handleWindowResize(); });
		this.#hooksRegister['collapseSceneNavigation'] = Hooks.on('collapseSceneNavigation', this.#_handleWindowResize.bind(this));
		this.#hooksRegister['renderPlayerList'] = Hooks.on('renderPlayerList', this.#_handleWindowResize.bind(this));
		window.addEventListener('resize', this.#_handleWindowResize.bind(this));
		for (const group of this.#_groups) {
			// Initialize all unset fields to their defaults
			ControlManager.#initializeFields(group);
			// Detect if this group should be the default active group
			if (!this.activeGroupName && !group.toggle && !group.button && await ControlManager.checkBoolean(group.visible)) {
				this.activeGroupName = group.name;
				group.isActive = true;
				// Notify the auto-selected group they are now selected
				const currentGroup = this.activeGroup;
				this.#_invokeHandler(currentGroup?.onClick, currentGroup, false);
			}
			// Initialize the tools for the group
			for (const tool of (group.tools ?? [])) {
				ControlManager.#initializeFields(tool);
				if (!group.activeTool && !tool.toggle && !tool.button && await ControlManager.checkBoolean(tool.visible)) {
					group.activeTool = tool.name;
					tool.isActive = true;
					// Notify the auto-selected tool they are now selected
					const currentTool = this.activeTool;
					this.#_invokeHandler(currentTool?.onClick, currentTool, false);
				}
			}
		}
	}

	refresh() {
		this.render();
	}

	/**
	 * @returns {ToolGroup[]}
	 */
	#_getModuleToolGroups() {
		/**@type {ToolGroup[]}*/ const groups = [];
		Hooks.callAll(`getModuleToolGroupsPre`, this, groups);
		Hooks.callAll(`getModuleToolGroups`, this, groups);
		Hooks.callAll(`getModuleToolGroupsPost`, this, groups);
		return groups;
	}

	/**
	 * 
	 * @param {Application.RenderOptions} [_]
	 * @returns {Promise<CMData>}
	 */
	async getData(_) {
		if (this.groups.length == 0) return { groups: [], singleGroup: false };
		/**@type {ToolGroupUI[]}*/ const groups = [];
		for (const group of this.#_groups) {
			if (
				!await ControlManager.checkBoolean(group.visible, true) ||
				(game.settings.get('core', 'noCanvas') && !await ControlManager.checkBoolean(group.noCanvas, false))
			) continue;
			/**@type {ToolGroupUI}*/ const groupUI = {
				name: group.name,
				icon: group.icon,
				title: group.title,
				button: group.button,
				toggle: group.toggle,
				class: group.class ?? false,
				active: await ControlManager.checkBoolean(group.isActive),
				tools: []
			};
			for (const tool of (group.tools ?? [])) {
				if (
					!await ControlManager.checkBoolean(tool.visible, true) ||
					(game.settings.get('core', 'noCanvas') && !await ControlManager.checkBoolean(group.noCanvas, false))
				) continue;
				groupUI.tools.push({
					name: tool.name,
					icon: tool.icon,
					title: tool.title,
					button: tool.button,
					toggle: tool.toggle,
					class: tool.class ?? false,
					active: await ControlManager.checkBoolean(tool.isActive)
				});
			}
			groups.push(groupUI);
		}
		const singleGroup = groups.length === 1 && !groups[0].button && !groups[0].toggle;
		if (groups.length > 0 && groups.every(x => !x.active)) {
			const firstGroup = groups.find(x => !x.button && !x.toggle);
			firstGroup.active = true;
			if (firstGroup)
				this.activateGroupByName(firstGroup.name);
		}
		return { groups, singleGroup };
	}

	/**
	 * @param {JQuery<HTMLElement} html
	 */
	activateListeners(html) {
		html.find('.control-tool[data-group]').on('click', this.#_onClickGroup.bind(this));
		html.find('.control-tool[data-tool]').on('click', this.#_onClickTool.bind(this));
		html.find('#magnet').on('click', async () => {
			if (this.#magnetMenu) return;
			this.#magnetMenu = $(await renderTemplate(`/modules/${SETTINGS.MOD_NAME}/templates/magnet.hbs`, {}));
			this.#magnetMenu.find('button').on('click', async event => {
				this.#magnetMenu.remove();
				this.#magnetMenu = null;
				await SETTINGS.set('position', event.currentTarget.classList[0]);
			});
			this.#magnetMenu.find('.close').on('click', () => {
				this.#magnetMenu.remove();
				this.#magnetMenu = null;
			});
			$('body').append(this.#magnetMenu);
		});
	}

	/**
	 * 
	 * @param {Handler<boolean> | null | undefined} handler
	 * @param {Tool} owner
	 * @param {boolean} [active]
	 * @returns 
	 */
	async #_invokeHandler(handler, owner, active) {
		if (handler === null || handler === undefined) return;
		if (!handler.prototype) await handler(active);
		else await handler.bind(owner)(active);
	}

	/**
	 * @param {JQuery.ClickEvent} event 
	 */
	async #_onClickGroup(event) {
		event.preventDefault();
		const li = event.currentTarget;
		const groupName = li.dataset.group;
		const group = this.groups.find(c => c.name === groupName);
		// Handle Toggles
		if (group.toggle) {
			const newState = !await ControlManager.checkBoolean(group.isActive);
			// If the group's active state is not a function, use it to store state
			if (!(group.isActive instanceof Function))
				group.isActive = newState;
			this.#_invokeHandler(group.onClick, group, newState);
			// Render the controls
			this.refresh();
		}
		// Handle Buttons
		else if (group.button) {
			await this.#_invokeHandler(group.onClick, group);
		}
		// Handle Groups
		else
			this.activateGroupByName(groupName);
	}
	/**
	 * @param {JQuery.ClickEvent} event
	 */
	async #_onClickTool(event) {
		event.preventDefault();
		const li = event.currentTarget;
		const group = this.activeGroup;
		const toolName = li.dataset.tool;
		const tool = group.tools.find(t => t.name === toolName);
		// Handle Toggles
		if (tool.toggle) {
			const newState = !await ControlManager.checkBoolean(tool.isActive);
			// If the tool's active state is not a function, use it to store state
			if (!(tool.isActive instanceof Function))
				tool.isActive = newState;
			this.#_invokeHandler(tool.onClick, tool, newState);
			// Render the controls
			this.refresh();
		}
		// Handle Buttons
		else if (tool.button)
			this.#_invokeHandler(tool.onClick, tool);
		// Handle Tools
		else
			this.activateToolByName(this.activeGroupName, toolName, true);
	}

	/**
	 * @param {JQuery<HTMLElement>} html
	 */
	_injectHTML(html) {
		$('body').append(html);
		this._element = html;
	}

	/**
	 * @param {boolean} [force]
	 * @param {object} [options]
	 * @returns {Promise<void>}
	 */
	async _render(force = false, options = {}) {
		// If initialization needs to be completed, invoke the completion
		if (this.#initializationIncomplete) await this.#completeInitialization();
		if (!game.ready) return;
		await super._render(force, options);
		if (ui.sidebar._collapsed) {
			this.element.css('right', '35px');
		}
		if (!this.element || !this.element[0])
			return
		this.element[0].removeAttribute('class');
		this.element[0].classList.add('app');
		switch (SETTINGS.get('position')) {
			case 'top': this.element[0].classList.add('top'); break;
			case 'left': this.element[0].classList.add('left'); break;
			case 'bottom': this.element[0].classList.add('bottom'); break;
			case 'right': default: break;
		}

		this.#_handleSidebarCollapse(ui.sidebar, ui.sidebar._collapsed);
		this.#_handleWindowResize();
	}
	/**
	 * @param {Application.CloseOptions} [options]
	 * @returns {Promise<void>}
	 */
	close(options) {
		Hooks.off('collapseSidebarPre', this.#hooksRegister['collapseSidebarPre']);
		Hooks.off('activateGroupByName', this.#hooksRegister['activateGroupByName']);
		Hooks.off('activateToolByName', this.#hooksRegister['activateToolByName']);
		Hooks.off('reloadModuleButtons', this.#hooksRegister['reloadModuleButtons']);
		Hooks.off('renderSceneControls', this.#hooksRegister['renderSceneControls']);
		Hooks.off('collapseSceneNavigation', this.#hooksRegister['collapseSceneNavigation']);
		Hooks.off('renderPlayerList', this.#hooksRegister['renderPlayerList']);
		window.removeEventListener('resize', this.#_handleWindowResize);
		return super.close(options);
	}

	/**
	 * @param {Sidebar} sideBar
	 * @param {boolean} collapsed
	 * @returns 
	 */
	#_handleSidebarCollapse(sideBar, collapsed) {
		const collapsedSize = '40px';
		const expandedSize = '310px';
		const shouldAnimate = collapsed ? sideBar.element[0].offsetWidth !== 32 : sideBar.element[0].offsetWidth !== 300;
		if (SETTINGS.get('position') !== 'right') {
			this.element.css('right', 'unset');
			return;
		}
		if (shouldAnimate) {
			if (collapsed) this.element.delay(250).animate({ right: collapsedSize }, 150);
			else this.element.animate({ right: expandedSize }, 150);
		}
		else this.element[0].style.right = collapsed ? collapsedSize : expandedSize;
	}

	static #CONTROL_WIDTH = 38 + 5;
	static #CONTROL_HEIGHT = 48;

	/**
	 * @returns {number}
	 */
	#getLeftWidth() {
		//? This may need to be reintroduced for ardittristan's Button Overflow module
		// /**@type {HTMLElement}*/const sceneLayers = document.querySelector('#controls > ol.main-controls.app.control-tools.flexcol');
		// max = Math.floor(sceneLayers.offsetHeight / ControlManager.#CONTROL_WIDTH);
		// cols = Math.ceil(sceneLayers.childElementCount / max);
		let cols = 1;
		/**@type {HTMLElement}*/const sceneTools = document.querySelector('#controls > ol.sub-controls.app.control-tools.flexcol.active');
		const max = Math.floor(sceneTools.offsetHeight / ControlManager.#CONTROL_HEIGHT);
		cols += Math.ceil(sceneTools.childElementCount / max);
		return cols * ControlManager.#CONTROL_WIDTH + 25;
	}
	/**
	 * @param {boolean} magnetToSceneControls
	 * @returns {number}
	 */
	#getTopHeight(magnetToSceneControls) {
		/**@type {HTMLElement}*/const uiTop = document.querySelector('#ui-middle #ui-top #navigation');
		let top = uiTop.offsetHeight + uiTop.offsetTop;
		if (magnetToSceneControls) {
			/**@type {HTMLElement}*/const layers = document.querySelector('#ui-left > #controls > ol.main-controls.app.control-tools.flexcol');
			top = Math.max(top, layers.offsetTop);
		}
		return top;
	}
	#_handleWindowResize() {
		if (this.element.length === 0) return;
		/**@type {number}*/ let max;
		/**@type {number}*/ let cols;

		const position = SETTINGS.get('position');
		this.element.addClass(position);
		switch (position) {
			case 'top': {
				this.element[0].style.marginTop = this.#getTopHeight(false) + 'px';
				this.element[0].style.marginLeft = this.#getLeftWidth() + 'px';
				break;
			}
			case 'left': {
				/**@type {HTMLElement}*/const controls = document.querySelector('#ui-left > #controls');
				this.element[0].style.height = `${controls.offsetHeight}px`;
				max = Math.floor(controls.offsetHeight / ControlManager.#CONTROL_WIDTH);
				cols = Math.ceil(this.groups.length / max);
				this.element.find('.group-tools').css('margin-left', `${(cols - 1) * (ControlManager.#CONTROL_WIDTH + 2)}px`);
				this.element[0].style.marginTop = this.#getTopHeight(true) + 'px';
				this.element[0].style.marginLeft = this.#getLeftWidth() + 'px';
				break;
			}
			case 'bottom': {
				this.element[0].style.left = (document.getElementById("ui-middle").offsetLeft +
					document.getElementById("hotbar-directory-controls").offsetLeft) + 'px';
				this.element[0].style.bottom = (document.getElementById('hotbar').offsetHeight + 10) + 'px';
				break;
			}
			case 'right': default: {
				max = Math.floor(this.element[0].offsetHeight / ControlManager.#CONTROL_WIDTH);
				cols = Math.ceil(this.groups.length / max);
				this.element.find('.group-tools').css('margin-right', `${(cols - 1) * (ControlManager.#CONTROL_WIDTH + 2)}px`);
				this.element[0].style.top = document.getElementById("sidebar-tabs").offsetTop + 'px';
				break;
			}
		}
	}

	/**
	 * @param {string} groupName
	 * @returns {Promise<void>}
	 */
	async activateGroupByName(groupName) {
		const group = this.groups.find(x => x.name === groupName);
		if (!group) {
			console.warn(`ControlManager::activateGroupByName > Attempted to activate ToolGroup with non-existant name '${groupName}'`);
			return;
		}
		if (group.button || group.toggle) {
			console.warn(`ControlManager::activateGroupByName > Attempted to activate ToolGroup that is either a button or toggle`);
			return;
		}
		if (this.activeGroupName === groupName) {
			this.refresh();
			return;
		}
		const prevGroup = this.activeGroup;
		this.activeGroupName = groupName;
		// Deactivate previous group
		if (prevGroup) {
			prevGroup.isActive = false;
			await this.#_invokeHandler(prevGroup.onClick, prevGroup, false);
		}
		// Activate new group
		group.isActive = true;
		await this.#_invokeHandler(group.onClick, group, true);
		this.refresh();
		Hooks.callAll("toolGroupActivated", this, group);
	}
	/**
	 * @param {string} groupName
	 * @param {string} toolName
	 * @param {boolean} [activateGroup]
	 * @returns 
	 */
	async activateToolByName(groupName, toolName, activateGroup = true) {
		const group = this.groups.find(x => x.name === groupName);
		if (!group) {
			console.warn(`ControlManager::activateToolByName > Attempted to activate ToolGroup with non-existant name '${groupName}'`);
			return;
		}
		const tool = group.tools.find(x => x.name === toolName);
		if (!tool) {
			console.warn(`ControlManager::activateToolByName > Attempted to activate Tool with non-existant name '${toolName}'`);
			return;
		}
		if (tool.button || tool.toggle) {
			console.warn(`ControlManager::activateToolByName > Attempted to activate Tool that is either a button or toggle`);
			return;
		}
		if (group.activeTool === toolName) {
			this.refresh();
			return;
		}
		const prevTool = group.tools.find(x => x.name === group.activeTool);
		group.activeTool = toolName;
		// Deactivate previous group
		if (prevTool) {
			prevTool.isActive = false;
			await this.#_invokeHandler(prevTool.onClick, prevTool, false);
		}
		// Activate new group
		tool.isActive = true;
		await this.#_invokeHandler(tool.onClick, tool, true);
		if (activateGroup && this.activeGroupName !== groupName) {
			this.activateGroupByName(groupName);
		}
		else if (this.activeGroupName === groupName) {
			this.refresh();
		}
		Hooks.callAll("toolActivated", this, group, tool);
	}
	reloadModuleButtons() {
		Hooks.callAll("moduleButtonsReloading", this);
		// Notify the current group that they are now disabled before we rebuild
		const currentGroup = this.activeGroup;
		this.#_invokeHandler(currentGroup?.onClick, currentGroup, false);
		// Notify all selected tools of being deactivated
		for (const group of this.#_groups) {
			const currentTool = group.activeTool && group.tools ? group.tools.find(x => x.name === group.activeTool) : undefined;
			this.#_invokeHandler(currentTool?.onClick, currentTool, false);
		}
		ui.moduleControls.initialize();
		ui.moduleControls.render();
	}
}