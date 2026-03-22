/// <reference path="./ToolType.d.ts" />
/// <reference path="../../fvtt-scripts/foundry.mjs" />

import { renderTemplate } from "../common/fvtt.mjs";

/**
 * @typedef {object} ControlUI
 * @property {string} name
 * @property {string} title
 * @property {string} icon
 * @property {string | false} class
 * @property {boolean} active
 * @property {boolean} button
 * @property {boolean} toggle
 */

/**
 * @typedef {object} ControlManagerData
 * @property {ControlUI[]} groups
 * @property {ControlUI[] | null} tools
 */

/**
 * @implements {IControlManager}
 */
export default class ControlManager {
	/** @readonly */
	static TEMPLATE = 'modules/lib-df-buttons/templates/controls.hbs';

	/**
	 * If `field` is a function, it will be async-called and the result will be double banged and returned.
	 * @param {Predicate | boolean | null} field Function or value to check for boolean state.
	 * @param {boolean} [defaultIfMissing=false] Defines the default value if `field` is `null` or `undefined`.
	 * @returns {Promise<boolean>}
	 */
	static async checkBoolean(field, defaultIfMissing = false) {
		const result = (field instanceof Function) ? await field() : field;
		if (!defaultIfMissing) return !!result;
		return result === null || result === undefined || !!result;
	}

	/**@type {ToolGroup[]}*/ #groups = [];
	/**@type {Record<string, number>}*/ #hooksRegister = {};
	/**@type {ToolGroup[]}*/ get groups() { return this.#groups; }
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

	/** @param {Tool} control */
	static #initializeFields(control) {
		control.toggle = !!control.toggle;
		control.button = !!control.button;
		control.isActive = control.toggle ? (control.isActive ?? false) : false;
		control.visible = control.visible ?? true;
		control.onClick = control.onClick ?? null;
	}

	activateHooks() {
		this.#hooksRegister['activateGroupByName'] = Hooks.on('activateGroupByName', this.activateGroupByName.bind(this));
		this.#hooksRegister['activateToolByName'] = Hooks.on('activateToolByName', this.activateToolByName.bind(this));
		this.#hooksRegister['reloadModuleButtons'] = Hooks.on('reloadModuleButtons', this.reloadModuleButtons.bind(this));
		this.#hooksRegister['refreshModuleButtons'] = Hooks.on('refreshModuleButtons', this.render.bind(this));
		this.#hooksRegister['renderSceneControls'] = Hooks.on('renderSceneControls', this.render.bind(this));
	}

	async setup() {
		/**@type {ToolGroup[]}*/ this.#groups = [];
		Hooks.callAll(`getModuleToolGroupsPre`, this, this.#groups);
		Hooks.callAll(`getModuleToolGroups`, this, this.#groups);
		Hooks.callAll(`getModuleToolGroupsPost`, this, this.#groups);
		for (const group of this.#groups) {
			// Initialize all unset fields to their defaults
			ControlManager.#initializeFields(group);
			// Detect if this group should be the default active group
			if (!this.activeGroupName && !group.toggle && !group.button && await ControlManager.checkBoolean(group.visible)) {
				this.activeGroupName = group.name;
				group.isActive = true;
				// Notify the auto-selected group they are now selected
				const currentGroup = this.activeGroup;
				this.#invokeHandler(currentGroup?.onClick, currentGroup, false);
			}
			// Initialize the tools for the group
			for (const tool of (group.tools ?? [])) {
				ControlManager.#initializeFields(tool);
				if (!group.activeTool && !tool.toggle && !tool.button && await ControlManager.checkBoolean(tool.visible)) {
					group.activeTool = tool.name;
					tool.isActive = true;
					// Notify the auto-selected tool they are now selected
					const currentTool = this.activeTool;
					this.#invokeHandler(currentTool?.onClick, currentTool, false);
				}
			}
		}
	}

	/** @returns {Promise<ControlManagerData>} */
	async #getData() {
		if (this.groups.length == 0) return { groups: [], singleGroup: false };

		/**@type {ControlUI[]}*/
		let groups = [];
		/**@type {Partial<ControlUI>[] | null}*/
		let tools = null;

		for (const group of this.#groups) {
			if (
				!await ControlManager.checkBoolean(group.visible, true) ||
				(game.settings.get('core', 'noCanvas') && !await ControlManager.checkBoolean(group.noCanvas, false))
			) continue;
			/**@type {ControlUI}*/ const groupUI = {
				name: group.name,
				icon: group.icon,
				title: group.title,
				button: group.button,
				toggle: group.toggle,
				class: group.class ?? false,
				active: await ControlManager.checkBoolean(group.isActive)
			};
			if (groupUI.active && !groupUI.toggle && !groupUI.button) {
				tools = [];
				for (const tool of (group.tools ?? [])) {
					if (
						!await ControlManager.checkBoolean(tool.visible, true) ||
						(game.settings.get('core', 'noCanvas') && !await ControlManager.checkBoolean(group.noCanvas, false))
					) continue;
					tools.push({
						name: tool.name,
						icon: tool.icon,
						title: tool.title,
						button: tool.button,
						toggle: tool.toggle,
						class: tool.class ?? false,
						active: await ControlManager.checkBoolean(tool.isActive)
					});
				}
			}
			groups.push(groupUI);
		}
		// If there is only a single group containing tools, remove the group and just display the tools
		if (groups.length === 1 && !groups[0].button && !groups[0].toggle) {
			groups = tools || [];
			tools = null;
		}
		if (groups.length > 0 && groups.every(x => !x.active)) {
			const firstGroup = groups.find(x => !x.button && !x.toggle);
			firstGroup.active = true;
			if (firstGroup)
				this.activateGroupByName(firstGroup.name);
		}
		return { groups, tools };
	}

	/**
	 * @param {Handler<boolean> | null | undefined} handler
	 * @param {Tool} owner
	 * @param {boolean} [active]
	 */
	async #invokeHandler(handler, owner, active) {
		if (handler === null || handler === undefined) return;
		if (!handler.prototype) await handler(active);
		else await handler.bind(owner)(active);
	}

	/** @param {JQuery.ClickEvent} event */
	async #onClickGroup(event) {
		event.preventDefault();
		const li = event.currentTarget;
		const groupName = li.dataset.control;
		const group = this.groups.find(c => c.name === groupName);
		// Handle Toggles
		if (group.toggle) {
			const newState = !await ControlManager.checkBoolean(group.isActive);
			// If the group's active state is not a function, use it to store state
			if (!(group.isActive instanceof Function))
				group.isActive = newState;
			this.#invokeHandler(group.onClick, group, newState);
			// Render the controls
			this.refresh();
		}
		// Handle Buttons
		else if (group.button)
			await this.#invokeHandler(group.onClick, group);
		// Handle Groups
		else
			this.activateGroupByName(groupName);
	}
	/** @param {JQuery.ClickEvent} event */
	async #onClickTool(event) {
		event.preventDefault();
		const li = event.currentTarget;
		const group = this.activeGroup;
		const toolName = li.dataset.control;
		const tool = group.tools.find(t => t.name === toolName);
		// Handle Toggles
		if (tool.toggle) {
			const newState = !await ControlManager.checkBoolean(tool.isActive);
			// If the tool's active state is not a function, use it to store state
			if (!(tool.isActive instanceof Function))
				tool.isActive = newState;
			this.#invokeHandler(tool.onClick, tool, newState);
			// Render the controls
			this.refresh();
		}
		// Handle Buttons
		else if (group.button)
			this.#invokeHandler(tool.onClick, tool);
		// Handle Tools
		else
			this.activateToolByName(group.name, toolName);
	}

	async render() {
		if (!game.ready) throw new Error("ControlManager#render called before game is ready");

		// Remove the old menus completely
		document.querySelector("menu#ldfb-groups")?.remove();
		document.querySelector("menu#ldfb-tools")?.remove();
		/**@type {HTMLElement}*/const sceneControls = document.querySelector("#scene-controls");
		const { groups, tools } = await this.#getData();
		var columnCount = 2;
		if (groups.length > 0) {
			columnCount++;
			await this.#renderControls('ldfb-groups', groups, sceneControls, this.#onClickGroup);
		}
		if (tools != null && tools.length > 0) {
			columnCount++;
			await this.#renderControls('ldfb-tools', tools, sceneControls, this.#onClickTool);
		}
		document.querySelector("#ui-left").style.setProperty('--control-columns', columnCount.toString());
	}
	refresh = this.render;

	/**
	 * @param {string} id
	 * @param {ControlUI[]} controls
	 * @param {HTMLElement} sceneControls
	 * @param {Function} onClick
	 */
	async #renderControls(id, controls, sceneControls, onClick) {
		const html = await renderTemplate(ControlManager.TEMPLATE, { id, controls });
		html.querySelectorAll('button').forEach(btn => btn.onclick = onClick.bind(this));
		sceneControls.appendChild(html);
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
			await this.#invokeHandler(prevGroup.onClick, prevGroup, false);
		}
		// Activate new group
		group.isActive = true;
		await this.#invokeHandler(group.onClick, group, true);
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
		// Deactivate previous tool
		if (prevTool) {
			prevTool.isActive = false;
			await this.#invokeHandler(prevTool.onClick, prevTool, false);
		}
		// Activate new tool
		tool.isActive = true;
		await this.#invokeHandler(tool.onClick, tool, true);
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
		this.#invokeHandler(currentGroup?.onClick, currentGroup, false);
		// Notify all selected tools of being deactivated
		for (const group of this.#groups) {
			const currentTool = group.activeTool && group.tools ? group.tools.find(x => x.name === group.activeTool) : undefined;
			this.#invokeHandler(currentTool?.onClick, currentTool, false);
		}
		this.setup();
		this.render();
	}
}