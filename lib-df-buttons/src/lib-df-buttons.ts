import {} from "../../common/global";
import ControlManager from "./ControlManager";

const MOD_NAME = 'lib-df-buttons';

Hooks.once('init', () => {
	(<ControlManager>(<any>ui).moduleControls) = new ControlManager();

	game.settings.register(MOD_NAME, 'position', {
		scope: 'client',
		choices: {
			right: 'LIB_DF_BUTTONS.choices.right',
			left: 'LIB_DF_BUTTONS.choices.left',
			top: 'LIB_DF_BUTTONS.choices.top',
			bottom: 'LIB_DF_BUTTONS.choices.bottom'
		},
		name: 'LIB_DF_BUTTONS.name',
		hint: 'LIB_DF_BUTTONS.hint',
		config: true,
		default: 'right',
		type: String,
		onChange: () => (<ControlManager>(<any>ui).moduleControls).render()
	});

	// Soft Dependency on `libwrapper`. Only use it if it already exists
	if (game.modules.get('libWrapper')) {
		libWrapper.register(MOD_NAME, 'Sidebar.prototype.expand', function (this: Sidebar, wrapped: Function) {
			Hooks.callAll('collapseSidebarPre', this, !this._collapsed);
			wrapped();
		}, 'WRAPPER');
		libWrapper.register(MOD_NAME, 'Sidebar.prototype.collapse', function (this: Sidebar, wrapped: Function) {
			Hooks.callAll('collapseSidebarPre', this, !this._collapsed);
			wrapped();
		}, 'WRAPPER');
	}// Otherwise do the traditional style of monkey-patch wrapper
	else {
		(<any>Sidebar.prototype).expand_ORIG = Sidebar.prototype.expand;
		Sidebar.prototype.expand = function (this: Sidebar) {
			Hooks.callAll('collapseSidebarPre', this, !this._collapsed);
			(<any>Sidebar.prototype).expand_ORIG.bind(this)();
		};
		(<any>Sidebar.prototype).collapse_ORIG = Sidebar.prototype.collapse;
		Sidebar.prototype.collapse = function (this: Sidebar) {
			Hooks.callAll('collapseSidebarPre', this, !this._collapsed);
			(<any>Sidebar.prototype).collapse_ORIG.bind(this)();
		};
	}
});
Hooks.once('setup', () => {
	(<ControlManager>(<any>ui).moduleControls).initialize();
});
Hooks.once('ready', () => {
	(<ControlManager>(<any>ui).moduleControls).render(true);
});
/* Example code for appending ToolGroups and Tools */
/**
import { Tool, ToolGroup } from "./ToolType";
Hooks.on('getModuleToolGroups', (app: ControlManager, groups: ToolGroup[]) => {
	const handleClick = function (this: Tool, active?: boolean) {
		if (active !== undefined)
			console.log(`${this.name}: active=${active}`);
		else
			console.log(this.name);
	}
	groups.push({
		name: 'radial1',
		icon: '<i class="fas fa-dice-one"></i>',
		title: 'radial1',
		onClick: handleClick,
		tools: [
			{ name: 'tool1-1', title: 'tool1-1', onClick: handleClick, icon: '<i class="fas fa-dice-one"></i>' },
			{ name: 'tool1-2', title: 'tool1-2', onClick: handleClick, icon: '<i class="fas fa-dice-one"></i>' },
			{ name: 'tool1-3', title: 'tool1-3', onClick: handleClick, icon: '<i class="fas fa-dice-one"></i>', button: true },
			{ name: 'tool1-4', title: 'tool1-4', onClick: handleClick, icon: '<i class="fas fa-dice-one"></i>', toggle: true },
		]
	});
	groups.push({
		name: 'radial2',
		icon: '<i class="fas fa-dice-two"></i>',
		title: 'radial2',
		onClick: handleClick,
		tools: [
			{ name: 'tool2-1', title: 'tool2-1', onClick: handleClick, icon: '<i class="fas fa-dice-two"></i>' },
			{ name: 'tool2-2', title: 'tool2-2', onClick: handleClick, icon: '<i class="fas fa-dice-two"></i>' },
			{ name: 'tool2-3', title: 'tool2-3', onClick: handleClick, icon: '<i class="fas fa-dice-two"></i>', button: true },
			{ name: 'tool2-4', title: 'tool2-4', onClick: handleClick, icon: '<i class="fas fa-dice-two"></i>', toggle: true },
		]
	});
	groups.push({
		name: 'radial3',
		icon: '<i class="fas fa-dice-three"></i>',
		title: 'radial3',
		onClick: handleClick,
		tools: [
			{ name: 'tool3-1', title: 'tool3-1', onClick: handleClick, icon: '<i class="fas fa-dice-three"></i>' },
			{ name: 'tool3-2', title: 'tool3-2', onClick: handleClick, icon: '<i class="fas fa-dice-three"></i>' },
			{ name: 'tool3-3', title: 'tool3-3', onClick: handleClick, icon: '<i class="fas fa-dice-three"></i>', button: true },
			{ name: 'tool3-4', title: 'tool3-4', onClick: handleClick, icon: '<i class="fas fa-dice-three"></i>', toggle: true },
		]
	});
	groups.push({
		name: 'button1',
		icon: '<i class="fas fa-dice-one"></i>',
		title: 'button1',
		button: true,
		onClick: handleClick,
	});
	groups.push({
		name: 'button2',
		icon: '<i class="fas fa-dice-two"></i>',
		title: 'button2',
		button: true,
		onClick: handleClick,
	});

	groups.push({
		name: 'toggle1',
		icon: '<i class="fas fa-dice-one"></i>',
		title: 'toggle1',
		toggle: true,
		onClick: handleClick,
	});
	groups.push({
		name: 'toggle2',
		icon: '<i class="fas fa-dice-two"></i>',
		title: 'toggle2',
		toggle: true,
		active: true,
		onClick: handleClick,
	});
});
/**/