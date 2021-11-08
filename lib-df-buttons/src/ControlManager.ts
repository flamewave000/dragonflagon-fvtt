import { Tool, ToolGroup } from "./ToolType";

type PartialOptions = Partial<Application.Options>;
const MOD_NAME = 'lib-df-buttons';

interface ToolUI {
	name: string;
	title: string;
	icon: string;
	active: boolean;
	button: boolean;
	toggle: boolean;
}

interface ToolGroupUI extends ToolUI {
	tools: Partial<ToolUI>[];
}

type CMData = { groups: Partial<ToolGroupUI>[] };

export default class ControlManager extends Application {
	groups: ToolGroup[];
	activeGroupName: string;

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
	static get defaultOptions(): Application.Options {
		return mergeObject<PartialOptions>(super.defaultOptions as PartialOptions, {
			width: 100,
			id: "moduleControls",
			template: `modules/lib-df-buttons/templates/controls.hbs`,
			popOut: false
		}) as Application.Options;
	}

	initialize() {
		this.groups = this._getModuleToolGroups();
		this.activeGroupName = this.groups.length > 0 ? this.groups[0].name : null;
	}

	private _getModuleToolGroups(): ToolGroup[] {
		const groups: ToolGroup[] = [];
		Hooks.callAll(`getModuleToolGroupsPre`, this, groups);
		Hooks.callAll(`getModuleToolGroups`, this, groups);
		Hooks.callAll(`getModuleToolGroupsPost`, this, groups);
		return groups;
	}

	getData(options?: Application.RenderOptions): CMData {
		if (this.groups.length == 0) return { groups: [] };
		const visible = (x: Tool) => x.visible instanceof Function ? x.visible() : (x.visible === null || x.visible === undefined || !!x.visible);
		const data = this.groups.filter(visible).map<ToolGroupUI>((group: ToolGroup) => {
			return {
				name: group.name,
				icon: group.icon,
				title: group.title,
				button: group.button,
				toggle: group.toggle,
				active: group.active || group.name === this.activeGroupName,
				tools: group.tools ? group.tools.filter(visible).map<ToolUI>(tool => {
					return {
						name: tool.name,
						icon: tool.icon,
						title: tool.title,
						button: tool.button,
						toggle: tool.toggle,
						active: tool.active || tool.name === (group.activeTool ? group.activeTool : group.tools.filter(visible)[0].name),
					};
				}) : []
			};
		});
		return { groups: data };
	}

	/** @inheritdoc */
	activateListeners(html: JQuery<HTMLElement>) {
		html.find('.control-tool[data-group]').on('click', this._onClickGroup.bind(this));
		html.find('.control-tool[data-tool]').on('click', this._onClickTool.bind(this));
	}

	private _invokeHandler(handler: (active?: boolean) => void, owner: Tool, active?: boolean) {
		if (!handler.prototype) handler(active);
		else handler.bind(owner)(active);
	}

	private _onClickGroup(event: JQuery.ClickEvent) {
		event.preventDefault();
		if (!canvas.ready) return;
		const li = event.currentTarget;
		const groupName = li.dataset.group;
		const group = this.groups.find(c => c.name === groupName);
		// Handle Toggles
		if (group.toggle) {
			group.active = !group.active;
			if (group.onClick instanceof Function) this._invokeHandler(group.onClick, group, group.active);
			// Render the controls
			this.render();
		}
		// Handle Buttons
		else if (group.button) {
			if (group.onClick instanceof Function) this._invokeHandler(group.onClick, group);
		}
		// Handle Tools
		else
			this.activateGroupByName(groupName);
	}
	private _onClickTool(event: JQuery.ClickEvent) {
		event.preventDefault();
		if (!canvas.ready) return;
		const li = event.currentTarget;
		const group = this.activeGroup;
		const toolName = li.dataset.tool;
		const tool = group.tools.find(t => t.name === toolName);
		// Handle Toggles
		if (tool.toggle) {
			tool.active = !tool.active;
			if (tool.onClick instanceof Function) this._invokeHandler(tool.onClick, tool, tool.active);
			// Render the controls
			this.render();
		}
		// Handle Buttons
		else if (tool.button) {
			if (tool.onClick instanceof Function) this._invokeHandler(tool.onClick, tool);
		}
		// Handle Tools
		else {
		}
	}

	async _render(force = false, options = {}): Promise<void> {
		if (this._state !== Application.RENDER_STATES.RENDERED) {
			Hooks.on('collapseSidebarPre', this._handleSidebarCollapse.bind(this));
			Hooks.on('activateGroupByName', this.activateGroupByName);
			Hooks.on('activateToolByName', this.activateToolByName);
			Hooks.on('reloadModuleButtons', this.reloadModuleButtons);
			Hooks.on('renderSceneControls', this._handleWindowResize);
			window.addEventListener('resize', this._handleWindowResize);
		}
		await super._render(force, options);
		if ((<any>ui.sidebar)._collapsed) {
			this.element.css('right', '35px');
		}

		this.element[0].removeAttribute('class');
		this.element[0].classList.add('app');
		switch (game.settings.get(MOD_NAME, 'position')) {
			case 'top': this.element[0].classList.add('top'); break;
			case 'left': this.element[0].classList.add('left'); break;
			case 'bottom': this.element[0].classList.add('bottom'); break;
			case 'right': default: break;
		}

		this._handleSidebarCollapse(ui.sidebar, (<any>ui.sidebar)._collapsed);
		this._handleWindowResize();
	}
	close(options: Application.CloseOptions = {}): Promise<unknown> {
		Hooks.off('collapseSidebarPre', this._handleSidebarCollapse);
		Hooks.off('activateGroupByName', this.activateGroupByName);
		Hooks.off('activateToolByName', this.activateToolByName);
		Hooks.off('reloadModuleButtons', this.reloadModuleButtons);
		window.removeEventListener('resize', this._handleWindowResize);
		return super.close(options);
	}

	private _handleSidebarCollapse(sideBar: Sidebar, collapsed: boolean) {
		if (game.settings.get(MOD_NAME, 'position') !== 'right') {
			(<ControlManager>(<any>ui).moduleControls).element.css('right', 'unset');
			return;
		}
		if (collapsed)
			(<ControlManager>(<any>ui).moduleControls).element.delay(250).animate({ right: '40px' }, 150);
		else
			(<ControlManager>(<any>ui).moduleControls).element.animate({ right: '310px' }, 150);
	}

	private static readonly CONTROL_SIZE = 46;
	private _handleWindowResize() {
		const self = <ControlManager>(<any>ui).moduleControls;

		switch (game.settings.get(MOD_NAME, 'position')) {
			case 'top': {
				const sceneTools = document.querySelector<HTMLElement>('#controls > li.scene-control.active > ol');
				var max = Math.floor(sceneTools.offsetHeight / ControlManager.CONTROL_SIZE);
				var cols = Math.ceil(sceneTools.childElementCount / max);
				self.element[0].style.marginLeft = `${(cols - 1) * (ControlManager.CONTROL_SIZE - 2)}px`;
				break;
			}
			case 'left': {
				var max = Math.floor(self.element[0].offsetHeight / ControlManager.CONTROL_SIZE);
				var cols = Math.ceil(self.groups.length / max);
				self.element.find('.group-tools').css('margin-left', `${(cols - 1) * (ControlManager.CONTROL_SIZE - 2)}px`);

				const sceneTools = document.querySelector<HTMLElement>('#controls > li.scene-control.active > ol');
				var max = Math.floor(sceneTools.offsetHeight / ControlManager.CONTROL_SIZE);
				var cols = Math.ceil(sceneTools.childElementCount / max);
				self.element[0].style.marginLeft = `${(cols - 1) * (ControlManager.CONTROL_SIZE - 2)}px`;
				break;
			}
			case 'bottom': {
				break;
			}
			case 'right': default: {
				const max = Math.floor(self.element[0].offsetHeight / ControlManager.CONTROL_SIZE);
				const cols = Math.ceil(self.groups.length / max);
				self.element.find('.group-tools').css('margin-right', `${(cols - 1) * (ControlManager.CONTROL_SIZE - 2)}px`);
				break;
			}
		}
	}

	activateGroupByName(groupName: string) {
		const self = <ControlManager>(<any>ui).moduleControls;
		const group = self.groups.find(x => x.name === groupName);
		if (!group) {
			console.warn(`ControlManager::activateGroupByName > Attempted to activate ToolGroup with non-existant name '${groupName}'`);
			return;
		}
		if (group.button || group.toggle) {
			console.warn(`ControlManager::activateGroupByName > Attempted to activate ToolGroup that is either a button or toggle`);
			return;
		}
		if (this.activeGroupName === groupName) return;
		const prevGroup = this.activeGroup;
		this.activeGroupName = groupName;
		// Deactivate previous group
		if (prevGroup?.onClick instanceof Function) this._invokeHandler(group.onClick, group, false);
		// Activate new group
		if (group.onClick instanceof Function) this._invokeHandler(group.onClick, group, true);
		self.render();
		Hooks.callAll("toolGroupActivated", this, group);
	}
	activateToolByName(groupName: string, toolName: string, activateGroup?: boolean) {
		const self = <ControlManager>(<any>ui).moduleControls;
		const group = self.groups.find(x => x.name === groupName);
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
		if (group.activeTool === toolName) return;
		const prevTool = group.tools.find(x => x.name === group.activeTool);
		group.activeTool = toolName;
		// Deactivate previous group
		if (prevTool?.onClick instanceof Function) this._invokeHandler(prevTool.onClick, prevTool, false);
		// Activate new group
		if (tool.onClick instanceof Function) this._invokeHandler(tool.onClick, tool, true);
		if (activateGroup && self.activeGroupName !== groupName) {
			this.activateGroupByName(groupName);
		}
		else if (self.activeGroupName === groupName) {
			self.render();
		}
		Hooks.callAll("toolActivated", this, group, tool);
	}
	reloadModuleButtons() {
		(<ControlManager>(<any>ui).moduleControls).initialize();
		(<ControlManager>(<any>ui).moduleControls).render();
	}
}