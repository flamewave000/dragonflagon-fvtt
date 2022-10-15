import SETTINGS from "../../common/Settings";
import { Tool, ToolGroup, ControlManager as IControlManager, Predicate, Handler } from "./ToolType";

interface ToolUI {
	name: string;
	title: string;
	icon: string;
	class: string | false;
	active: boolean;
	button: boolean;
	toggle: boolean;
}

interface ToolGroupUI extends ToolUI {
	tools: Partial<ToolUI>[];
}

type CMData = {
	groups: Partial<ToolGroupUI>[];
	singleGroup: boolean;
};

export default class ControlManager extends Application implements IControlManager {
	static async checkBoolean(field?: Predicate | boolean | null, invertFalsey = false): Promise<boolean> {
		return field instanceof Function ? await field() :
			((invertFalsey && (field === null || field === undefined || field)) || (!invertFalsey && !!field));
	}

	private initializationIncomplete = false;
	private _groups: ToolGroup[];
	private magnetMenu: JQuery<HTMLElement> | null = null;
	private hooksRegister: Record<string, number> = {};
	get groups(): ToolGroup[] { return this._groups; }
	private _activeGroupName: string;
	get activeGroupName(): string { return this._activeGroupName; }
	set activeGroupName(value: string) { this._activeGroupName = value; }

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
	static get defaultOptions(): ApplicationOptions {
		return mergeObject(super.defaultOptions, {
			width: 100,
			id: "moduleControls",
			template: `modules/lib-df-buttons/templates/controls.hbs`,
			popOut: false,
			resizable: false,

		});
	}

	private static initializeFields(control: Tool) {
		// TODO: Remove this block in the future!
		//! Handle deprecated `active` field
		if ((<any>control).active !== undefined)
			control.isActive = (<any>control).active;
		// TODO: END OF BLOCK
		control.toggle = !!control.toggle;
		control.button = !!control.button;
		control.isActive = control.toggle ? (control.isActive ?? false) : false;
		control.visible = control.visible ?? true;
		control.onClick = control.onClick ?? null;
	}

	async initialize() {
		this._groups = <any>this._getModuleToolGroups();
		this.activeGroupName = null;
		// Defer initialization completion to the first render call
		this.initializationIncomplete = true;
	}
	private async completeInitialization() {
		this.initializationIncomplete = false;
		for (const group of this._groups) {
			// Initialize all unset fields to their defaults
			ControlManager.initializeFields(group);
			// Detect if this group should be the default active group
			if (!this.activeGroupName && !group.toggle && !group.button && await ControlManager.checkBoolean(group.visible)) {
				this.activeGroupName = group.name;
				group.isActive = true;
				// Notify the auto-selected group they are now selected
				const currentGroup = this.activeGroup;
				this._invokeHandler(currentGroup?.onClick, currentGroup, false);
			}
			// Initialize the tools for the group
			for (const tool of (group.tools ?? [])) {
				ControlManager.initializeFields(tool);
				if (!group.activeTool && !tool.toggle && !tool.button && await ControlManager.checkBoolean(tool.visible)) {
					group.activeTool = tool.name;
					tool.isActive = true;
					// Notify the auto-selected tool they are now selected
					const currentTool = this.activeTool;
					this._invokeHandler(currentTool?.onClick, currentTool, false);
				}
			}
		}
	}

	refresh(): void {
		this.render();
	}

	private _getModuleToolGroups(): ToolGroup[] {
		const groups: ToolGroup[] = [];
		Hooks.callAll(`getModuleToolGroupsPre`, this, groups);
		Hooks.callAll(`getModuleToolGroups`, this, groups);
		Hooks.callAll(`getModuleToolGroupsPost`, this, groups);
		return groups;
	}

	async getData(_?: Application.RenderOptions): Promise<CMData> {
		if (this.groups.length == 0) return { groups: [], singleGroup: false };
		const groups: ToolGroupUI[] = [];
		for (const group of this._groups) {
			if (!await ControlManager.checkBoolean(group.visible, true)) continue;
			const groupUI: ToolGroupUI = {
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
				if (!await ControlManager.checkBoolean(tool.visible, true)) continue;
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
		return { groups, singleGroup: groups.length === 1 && !groups[0].button && !groups[0].toggle };
	}

	/** @inheritdoc */
	activateListeners(html: JQuery<HTMLElement>) {
		html.find('.control-tool[data-group]').on('click', this._onClickGroup.bind(this));
		html.find('.control-tool[data-tool]').on('click', this._onClickTool.bind(this));
		html.find('#magnet').on('click', async () => {
			if (this.magnetMenu) return;
			this.magnetMenu = $(await renderTemplate(`/modules/${SETTINGS.MOD_NAME}/templates/magnet.hbs`, {}));
			this.magnetMenu.find('button').on('click', async event => {
				this.magnetMenu.remove();
				this.magnetMenu = null;
				await SETTINGS.set('position', event.currentTarget.classList[0]);
			});
			this.magnetMenu.find('.close').on('click', () => {
				this.magnetMenu.remove();
				this.magnetMenu = null;
			});
			$('body').append(this.magnetMenu);
		});
	}

	private async _invokeHandler(handler: Handler<boolean> | null | undefined, owner: Tool, active?: boolean) {
		if (handler === null || handler === undefined) return;
		if (!handler.prototype) await handler(active);
		else await handler.bind(owner)(active);
	}

	private async _onClickGroup(event: JQuery.ClickEvent) {
		event.preventDefault();
		if (!canvas.ready) return;
		const li = event.currentTarget;
		const groupName = li.dataset.group;
		const group = this.groups.find(c => c.name === groupName);
		// Handle Toggles
		if (group.toggle) {
			const newState = !await ControlManager.checkBoolean(group.isActive);
			// If the group's active state is not a function, use it to store state
			if (!(group.isActive instanceof Function))
				group.isActive = newState;
			this._invokeHandler(group.onClick, group, newState);
			// Render the controls
			this.refresh();
		}
		// Handle Buttons
		else if (group.button) {
			await this._invokeHandler(group.onClick, group);
		}
		// Handle Groups
		else
			this.activateGroupByName(groupName);
	}
	private async _onClickTool(event: JQuery.ClickEvent) {
		event.preventDefault();
		if (!canvas.ready) return;
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
			this._invokeHandler(tool.onClick, tool, newState);
			// Render the controls
			this.refresh();
		}
		// Handle Buttons
		else if (tool.button)
			this._invokeHandler(tool.onClick, tool);
		// Handle Tools
		else
			this.activateToolByName(this.activeGroupName, toolName, true);
	}

	protected _injectHTML(html: JQuery<HTMLElement>): void {
		$('body').append(html);
		this._element = html;
	}

	async _render(force = false, options = {}): Promise<void> {
		// If initialization needs to be completed, invoke the completion
		if (this.initializationIncomplete) await this.completeInitialization();
		if (this._state !== Application.RENDER_STATES.RENDERED) {
			this.hooksRegister['collapseSidebarPre'] = Hooks.on('collapseSidebarPre', this._handleSidebarCollapse.bind(this));
			this.hooksRegister['activateGroupByName'] = Hooks.on('activateGroupByName', this.activateGroupByName);
			this.hooksRegister['activateToolByName'] = Hooks.on('activateToolByName', this.activateToolByName);
			this.hooksRegister['reloadModuleButtons'] = Hooks.on('reloadModuleButtons', this.reloadModuleButtons);
			this.hooksRegister['renderSceneControls'] = Hooks.on('renderSceneControls', this._handleWindowResize);
			this.hooksRegister['collapseSceneNavigation'] = Hooks.on('collapseSceneNavigation', this._handleWindowResize);
			this.hooksRegister['renderPlayerList'] = Hooks.on('renderPlayerList', this._handleWindowResize);
			window.addEventListener('resize', this._handleWindowResize);
		}
		await super._render(force, options);
		if ((<any>ui.sidebar)._collapsed) {
			this.element.css('right', '35px');
		}

		this.element[0].removeAttribute('class');
		this.element[0].classList.add('app');
		switch (SETTINGS.get('position')) {
			case 'top': this.element[0].classList.add('top'); break;
			case 'left': this.element[0].classList.add('left'); break;
			case 'bottom': this.element[0].classList.add('bottom'); break;
			case 'right': default: break;
		}

		this._handleSidebarCollapse(ui.sidebar, (<any>ui.sidebar)._collapsed);
		this._handleWindowResize();
	}
	close(options?: Application.CloseOptions): Promise<void> {
		Hooks.off('collapseSidebarPre', this.hooksRegister['collapseSidebarPre']);
		Hooks.off('activateGroupByName', this.hooksRegister['activateGroupByName']);
		Hooks.off('activateToolByName', this.hooksRegister['activateToolByName']);
		Hooks.off('reloadModuleButtons', this.hooksRegister['reloadModuleButtons']);
		Hooks.off('renderSceneControls', this.hooksRegister['renderSceneControls']);
		Hooks.off('collapseSceneNavigation', this.hooksRegister['collapseSceneNavigation']);
		Hooks.off('renderPlayerList', this.hooksRegister['renderPlayerList']);
		window.removeEventListener('resize', this._handleWindowResize);
		return super.close(options);
	}

	private _handleSidebarCollapse(sideBar: Sidebar, collapsed: boolean) {
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

	private static readonly CONTROL_WIDTH = 38 + 5;
	private static readonly CONTROL_HEIGHT = 48;

	private getLeftWidth(): number {
		//? This may need to be reintroduced for ardittristan's Button Overflow module
		// const sceneLayers = document.querySelector<HTMLElement>('#controls > ol.main-controls.app.control-tools.flexcol');
		// max = Math.floor(sceneLayers.offsetHeight / ControlManager.CONTROL_WIDTH);
		// cols = Math.ceil(sceneLayers.childElementCount / max);
		let cols = 1;
		const sceneTools = document.querySelector<HTMLElement>('#controls > ol.sub-controls.app.control-tools.flexcol.active');
		const max = Math.floor(sceneTools.offsetHeight / ControlManager.CONTROL_HEIGHT);
		cols += Math.ceil(sceneTools.childElementCount / max);
		return cols * ControlManager.CONTROL_WIDTH + 20;
	}
	private getTopHeight(magnetToSceneControls: boolean): number {
		const uiTop = document.querySelector<HTMLElement>('#ui-middle #ui-top #navigation');
		let top = uiTop.offsetHeight + uiTop.offsetTop;
		if (magnetToSceneControls) {
			const layers = document.querySelector<HTMLElement>('#ui-left > #controls > ol.main-controls.app.control-tools.flexcol');
			top = Math.max(top, layers.offsetTop);
		}
		return top;
	}
	private _handleWindowResize() {
		const self = <ControlManager>(<any>ui).moduleControls;
		if (self.element.length === 0) return;
		let max: number;
		let cols: number;

		const position = SETTINGS.get<string>('position');
		self.element.addClass(position);
		switch (position) {
			case 'top': {
				self.element[0].style.marginTop = self.getTopHeight(false) + 'px';
				self.element[0].style.marginLeft = self.getLeftWidth() + 'px';
				break;
			}
			case 'left': {
				const controls = document.querySelector<HTMLElement>('#ui-left > #controls');
				self.element[0].style.height = `${controls.offsetHeight}px`;
				max = Math.floor(controls.offsetHeight / ControlManager.CONTROL_WIDTH);
				cols = Math.ceil(self.groups.length / max);
				self.element.find('.group-tools').css('margin-left', `${(cols - 1) * (ControlManager.CONTROL_WIDTH + 2)}px`);
				self.element[0].style.marginTop = self.getTopHeight(true) + 'px';
				self.element[0].style.marginLeft = self.getLeftWidth() + 'px';
				break;
			}
			case 'bottom': {
				self.element[0].style.left = (document.getElementById("ui-middle").offsetLeft +
					document.getElementById("hotbar-directory-controls").offsetLeft) + 'px';
				self.element[0].style.bottom = (document.getElementById('hotbar').offsetHeight + 10) + 'px';
				break;
			}
			case 'right': default: {
				max = Math.floor(self.element[0].offsetHeight / ControlManager.CONTROL_WIDTH);
				cols = Math.ceil(self.groups.length / max);
				self.element.find('.group-tools').css('margin-right', `${(cols - 1) * (ControlManager.CONTROL_WIDTH + 2)}px`);
				self.element[0].style.top = document.getElementById("sidebar-tabs").offsetTop + 'px';
				break;
			}
		}
	}

	async activateGroupByName(groupName: string) {
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
		if (this.activeGroupName === groupName) {
			self.refresh();
			return;
		}
		const prevGroup = this.activeGroup;
		this.activeGroupName = groupName;
		// Deactivate previous group
		if (prevGroup) {
			prevGroup.isActive = false;
			await this._invokeHandler(prevGroup.onClick, prevGroup, false);
		}
		// Activate new group
		group.isActive = true;
		await this._invokeHandler(group.onClick, group, true);
		self.refresh();
		Hooks.callAll("toolGroupActivated", this, group);
	}
	async activateToolByName(groupName: string, toolName: string, activateGroup: boolean = true) {
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
		if (group.activeTool === toolName) {
			self.refresh();
			return;
		}
		const prevTool = group.tools.find(x => x.name === group.activeTool);
		group.activeTool = toolName;
		// Deactivate previous group
		if (prevTool) {
			prevTool.isActive = false;
			await this._invokeHandler(prevTool.onClick, prevTool, false);
		}
		// Activate new group
		tool.isActive = true;
		await this._invokeHandler(tool.onClick, tool, true);
		if (activateGroup && self.activeGroupName !== groupName) {
			this.activateGroupByName(groupName);
		}
		else if (self.activeGroupName === groupName) {
			self.refresh();
		}
		Hooks.callAll("toolActivated", this, group, tool);
	}
	reloadModuleButtons() {
		Hooks.callAll("moduleButtonsReloading", this);
		// Notify the current group that they are now disabled before we rebuild
		const currentGroup = this.activeGroup;
		this._invokeHandler(currentGroup?.onClick, currentGroup, false);
		// Notify all selected tools of being deactivated
		for (const group of this._groups) {
			const currentTool = group.activeTool && group.tools ? group.tools.find(x => x.name === group.activeTool) : undefined;
			this._invokeHandler(currentTool?.onClick, currentTool, false);
		}
		(<ControlManager>(<any>ui).moduleControls).initialize();
		(<ControlManager>(<any>ui).moduleControls).render();
	}
}