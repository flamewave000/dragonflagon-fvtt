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
		this.#hooksRegister['activateGroupByName'] = Hooks.on('activateGroupByName', this.activateGroupByName.bind(this));
		this.#hooksRegister['activateToolByName'] = Hooks.on('activateToolByName', this.activateToolByName.bind(this));
		this.#hooksRegister['reloadModuleButtons'] = Hooks.on('reloadModuleButtons', this.reloadModuleButtons.bind(this));
		this.#hooksRegister['refreshModuleButtons'] = Hooks.on('refreshModuleButtons', this.refresh.bind(this));
		this.#hooksRegister['renderSceneControls'] = Hooks.on('renderSceneControls', () => { this.refresh(); this.#_applyPosition(); });
		this.#hooksRegister['collapseSceneNavigation'] = Hooks.on('collapseSceneNavigation', this.#_applyPosition.bind(this));
		this.#hooksRegister['renderPlayerList'] = Hooks.on('renderPlayerList', this.#_applyPosition.bind(this));
		window.addEventListener('resize', this.#_applyPosition.bind(this));
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
	 * Compute default position adjacent to scene controls.
	 * @returns {{left: number, top: number}}
	 */
	#getDefaultPosition() {
		const controls = document.querySelector('#controls');
		if (controls) {
			const rect = controls.getBoundingClientRect();
			return { left: rect.right + 8, top: rect.top };
		}
		return { left: 110, top: 73 };
	}

	/**
	 * @param {JQuery<HTMLElement>} html
	 */
	activateListeners(html) {
		html.find('.control-tool[data-group]').on('click', this.#_onClickGroup.bind(this));
		html.find('.control-tool[data-tool]').on('click', this.#_onClickTool.bind(this));

		// Drag via grip handle
		const el = html[0];
		const grip = html.find('#df-buttons-grip');
		grip.on('mousedown', (e) => {
			if (e.button !== 0) return;
			e.preventDefault();
			const startX = e.clientX;
			const startY = e.clientY;
			const rect = el.getBoundingClientRect();
			const startLeft = rect.left;
			const startTop = rect.top;

			const onMouseMove = (/** @type {MouseEvent} */ moveEvent) => {
				el.style.left = (startLeft + moveEvent.clientX - startX) + 'px';
				el.style.top = (startTop + moveEvent.clientY - startY) + 'px';
			};
			const onMouseUp = () => {
				document.removeEventListener('mousemove', onMouseMove);
				document.removeEventListener('mouseup', onMouseUp);
				const finalRect = el.getBoundingClientRect();
				SETTINGS.set('toolbar-pos', {
					left: finalRect.left,
					top: finalRect.top,
				});
			};
			document.addEventListener('mousemove', onMouseMove);
			document.addEventListener('mouseup', onMouseUp);
		});

		// Double-click grip to reset to default position
		grip.on('dblclick', async () => {
			await SETTINGS.set('toolbar-pos', null);
			const pos = this.#getDefaultPosition();
			el.style.left = pos.left + 'px';
			el.style.top = pos.top + 'px';
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
		if (!this.element || !this.element[0]) return;
		this.#_applyPosition();
	}
	/**
	 * @param {Application.CloseOptions} [options]
	 * @returns {Promise<void>}
	 */
	close(options) {
		Hooks.off('activateGroupByName', this.#hooksRegister['activateGroupByName']);
		Hooks.off('activateToolByName', this.#hooksRegister['activateToolByName']);
		Hooks.off('reloadModuleButtons', this.#hooksRegister['reloadModuleButtons']);
		Hooks.off('renderSceneControls', this.#hooksRegister['renderSceneControls']);
		Hooks.off('collapseSceneNavigation', this.#hooksRegister['collapseSceneNavigation']);
		Hooks.off('renderPlayerList', this.#hooksRegister['renderPlayerList']);
		window.removeEventListener('resize', this.#_applyPosition);
		return super.close(options);
	}

	#_applyPosition() {
		const element = this._element;
		if (!element || element.length === 0) return;
		const el = element[0];

		const savedPos = SETTINGS.get('toolbar-pos');
		if (savedPos) {
			el.style.left = Math.max(0, Math.min(savedPos.left, window.innerWidth - 50)) + 'px';
			el.style.top = Math.max(0, Math.min(savedPos.top, window.innerHeight - 50)) + 'px';
		} else {
			const pos = this.#getDefaultPosition();
			el.style.left = pos.left + 'px';
			el.style.top = pos.top + 'px';
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
