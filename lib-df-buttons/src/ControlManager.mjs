/// <reference path="./ToolType.d.ts" />
/// <reference path="../../fvtt-scripts/foundry.mjs" />

import { renderTemplate } from "../common/fvtt.mjs";

/**
 * @typedef {object} ToolUI
 * @property {string} path
 * @property {string} title
 * @property {string} icon
 * @property {string | false} class
 * @property {boolean} active
 * @property {boolean} button
 * @property {boolean} toggle
 * @property {boolean} radial
 */

/**
 * @typedef {object} Menu
 * @property {string} id
 * @property {ToolUI[]} tools
 */

/**
 * @typedef {Record<string, Tool>} ToolSet
 */

/**
 * @implements {IControlManager}
 */
export default class ControlManager {
	// region Class Method
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

	/**
	 * @param {string} id
	 * @param {Tool} tool
	 */
	static #initializeFields(id, tool) {
		if (tool.type === undefined || tool.type === null)
			tool.type = 'radial';
		else if (!['radial', 'button', 'toggle'].includes(tool.type)) {
			console.warn(`ControlManager::#initializeFields > tool (${id}) declared with invalid type ('${tool.type}'). Defaulting to 'radial'`);
			tool.type = 'radial';
		}
		tool.isActive = tool.toggle ? (tool.isActive ?? false) : false;
		tool.visible = tool.visible ?? true;
		tool.onClick = tool.onClick ?? null;
		if (tool.type != 'radial' && !tool.onClick)
			throw new Error(`ControlManager::#initializeFields > ${tool.type} tool is missing onClick handler`);
		if (tool.tools === undefined)
			return;
		if (!tool.tools)
			delete tool.tools;
		else if (!(tool.tools instanceof Object))
			delete tool.tools;
		else if (Object.keys(tool.tools).length == 0)
			delete tool.tools;
	}

	/** @param {ToolSet} tools */
	static async #processToolsRecursively(tools) {
		const entries = Object.entries(tools);
		let foundFirstRadial = false;
		for (const [id, tool] of entries) {
			// Initialize all unset fields to their defaults
			ControlManager.#initializeFields(id, tool);
			// Detect if this tool should be the default active radial tool
			if (!foundFirstRadial && tool.type === 'radial') {
				foundFirstRadial = true;
				tool.isActive = true;
				// Notify the auto-selected group they are now selected
				ControlManager.#invokeHandler(tool?.onClick, tool, true);
			}
			if (!tool.tools || tool.type !== 'radial') continue;
			// If our tool has tools, recurse
			this.#processToolsRecursively(tool.tools);
		}
	}

	/**
	 * @param {Tool} owner
	 * @param {boolean} [active]
	 */
	static async #invokeHandler(owner, active) {
		if (owner.onClick === null || owner.onClick === undefined) return;
		if (owner.onClick.prototype) await owner.onClick(active);
		else await owner.onClick.call(owner, active);
	}
	// endregion

	/**@type {{[x:string]:Tool}}*/ #tools = {};
	/**@type {Record<string, number>}*/ #hooksRegister = {};

	get tools() { return [...this.#tools]; }

	/**
	 * Uses a JS Path to retrieve a chain of tools.
	 * 
	 * @example
	 * 'radial1.radial2.myButton' => [ Tool#radial1, Tool#radial2, Tool#myButton ]
	 * @param {string} path
	 * @returns {Tool[]}
	 */
	#toolsFromPath(path) {
		const tokens = path.split('.');
		if (tokens.length < 1) return [];
		let currentMenu = this.#tools;
		const tools = [];
		do {
			const id = tokens.shift();
			/**@type {Tool|undefined}*/
			const tool = currentMenu[id];
			if (tool === undefined)
				throw new Error(`ControlManager::#toolFromPath > Tool set does not contain id '${id}' from path '${path}'`);
			tools.push(tool);
			currentMenu = tool?.tools;
		} while (currentMenu && tokens.length > 0);
		return tools;
	}

	/**
	 * @param {Tool[]} toolSet
	 * @param {boolean} deferRender If true, will not call {@link render}.
	 */
	async #triggerTool(toolSet, deferRender = false) {
		const tool = toolSet.at(-1);
		/**@type {ToolSet}*/
		const parent = (toolSet.at(-2)?.tools ?? this.#tools);
		switch (tool.type) {
			case 'button':
				await ControlManager.#invokeHandler(tool);
				break;
			case 'toggle':
				const newState = !await ControlManager.checkBoolean(tool.isActive);
				// If the tool's active state is not a function, use it to store state
				if (!(tool.isActive instanceof Function))
					tool.isActive = newState;
				await ControlManager.#invokeHandler(tool, newState);
				if (!deferRender) await this.render();
				break;
			case 'radial':
				/**@type {[string, Tool]}*/
				const [_, currentTool] = Object.entries(parent)
					.find(([_, tool]) => tool.type === 'radial' && tool.isActive);
				currentTool.isActive = false;
				await ControlManager.#invokeHandler(currentTool, false);
				tool.isActive = true;
				await ControlManager.#invokeHandler(tool, true);
				if (!deferRender) await this.render();
				break;
			default:
				break;
		}
	}

	/**
	 * @param {string[]} path
	 * @param {ToolSet} tools
	 * @returns {Menu[]}
	 */
	async #createMenus(path, tools) {
		const entries = Object.entries(tools);
		if (entries.length == 0) return [];
		const menu = {
			id: path.join('.'),
			tools: []
		};
		let activeRadialMenu = null;
		for (const [id, tool] of entries) {
			if (!await ControlManager.checkBoolean(tool.visible))
				continue;
			menu.tools.push({
				path: [...path, id].join('.'),
				title: tool.title,
				icon: tool.icon,
				class: tool.class ?? false,
				active: tool.type !== 'button' && await ControlManager.checkBoolean(tool.isActive),
				button: tool.type === 'button',
				toggle: tool.type === 'toggle',
				radial: tool.type !== 'button' && tool.type !== 'toggle',
			});
			if (tool.type === 'radial' && tool.isActive === true && activeRadialMenu === null && tool.tools)
				activeRadialMenu = [id, tool.tools] ?? null;
		}
		if (activeRadialMenu !== null)
			return [menu, ...await this.#createMenus([...path, activeRadialMenu[0]], activeRadialMenu[1])];
		else return [menu];
	}

	/** @param {PointerEvent} event */
	async #onClickTool(event) {
		event.preventDefault();
		/**@type {HTMLElement*/
		const button = event.currentTarget;
		const tools = this.#toolsFromPath(button.dataset.path);
		this.#triggerTool(tools);
	}

	async render() {
		if (!game.ready) throw new Error("ControlManager#render called before game is ready");
		/**@type {HTMLElement}*/
		const sceneControls = document.querySelector("aside#scene-controls");
		// Remove the old menus
		sceneControls.querySelectorAll("menu[data-ldfb]").forEach(x => x.remove());
		const menus = await this.#createMenus([], this.#tools);
		for (const menu of menus) {
			const html = await renderTemplate(ControlManager.TEMPLATE, menu);
			html.querySelectorAll('button').forEach(btn => btn.onclick = this.#onClickTool.bind(this));
			sceneControls.appendChild(html);
		}
		/**@type {HTMLElement}*/
		const uiLeft = sceneControls.closest("#ui-left");
		uiLeft.style.setProperty('--control-columns', (menus.length + 2).toString());
	}
	refresh = this.render;

	async setup() {
		this.#tools = [];
		Hooks.callAll(`getModuleToolsPre`, this, this.#tools);
		Hooks.callAll(`getModuleTools`, this, this.#tools);
		Hooks.callAll(`getModuleToolsPost`, this, this.#tools);
		ControlManager.#processToolsRecursively(this.#tools);
	}

	reloadModuleButtons() {
		Hooks.callAll("moduleButtonsReloading", this);
		// Notify the current group that they are now disabled before we rebuild
		const currentGroup = this.activeGroup;
		ControlManager.#invokeHandler(currentGroup?.onClick, currentGroup, false);
		// Notify all selected tools of being deactivated
		const tools = this.#tools;
		while (tools) {
			for (const [_, tool] of Object.entries(tools)) {
				if (tool.type !== 'radial' || !tool.isActive) continue;
				tool.isActive = false;
				ControlManager.#invokeHandler(tool, false);
			}
		}
		this.setup();
		this.render();
	}

	activateHooks() {
		this.#hooksRegister['activateToolByPath'] = Hooks.on('activateToolByPath', this.activateToolByPath.bind(this));
		this.#hooksRegister['reloadModuleButtons'] = Hooks.on('reloadModuleButtons', this.reloadModuleButtons.bind(this));
		this.#hooksRegister['refreshModuleButtons'] = Hooks.on('refreshModuleButtons', this.render.bind(this));
		this.#hooksRegister['renderSceneControls'] = Hooks.on('renderSceneControls', this.render.bind(this));
	}

	/**
	 * @param {string} path
	 * @param {boolean} activateParents
	 * @returns {Promise<void>}
	 */
	async activateToolByPath(path, activateParents = true) {
		const tools = this.#toolsFromPath(path);
		if (!activateParents)
			return await this.#triggerTool(tools);
		while (tools.length > 0) {
			await this.#triggerTool(tools, true);
			tools.pop();
		}
		await this.render();
	}
}