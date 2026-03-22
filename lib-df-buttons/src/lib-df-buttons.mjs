/// <reference path="./ToolType.d.ts" />

import ControlManagerImpl from "./ControlManager.mjs";

// CONFIG.debug.hooks = true;
Hooks.once('init', () => { ui.moduleControls = new ControlManagerImpl(); });
Hooks.once('ready', () => {
	ui.moduleControls.activateHooks();
	ui.moduleControls.setup();
	ui.moduleControls.render();
});

/* Example code for appending ToolGroups and Tools */
/// <reference path="ToolType.d.ts" />
// Hooks.on('getModuleToolGroups', (/**@type {ControlManager}*/app, /**@type {ToolGroup[]}*/groups) => {
// 	const handleClick = /**@this {Tool} @param {Boolean} [active]*/function (active) {
// 		if (active !== undefined)
// 			console.log(`${this.name}: active=${active}`);
// 		else
// 			console.log(this.name);
// 	};
// 	groups.push({
// 		name: 'radial1',
// 		icon: 'fas fa-dice-one',
// 		title: 'radial1',
// 		visible: () => ui.controls.control.name === 'tokens',
// 		onClick: handleClick,
// 		tools: [
// 			{ name: 'tool1-1', title: 'tool1-1', onClick: handleClick, icon: 'fas fa-dice-one' },
// 			{ name: 'tool1-2', title: 'tool1-2', onClick: handleClick, icon: 'fas fa-dice-one' },
// 			{ name: 'tool1-3', title: 'tool1-3', onClick: handleClick, icon: 'fas fa-dice-one', button: true },
// 			{ name: 'tool1-4', title: 'tool1-4', onClick: handleClick, icon: 'fas fa-dice-one', toggle: true },
// 		]
// 	});
// 	groups.push({
// 		name: 'radial2',
// 		icon: 'fas fa-dice-two',
// 		title: 'radial2',
// 		visible: () => ui.controls.control.name === 'walls',
// 		onClick: handleClick,
// 		tools: [
// 			{ name: 'tool2-1', title: 'tool2-1', onClick: handleClick, icon: 'fas fa-dice-two' },
// 			{ name: 'tool2-2', title: 'tool2-2', onClick: handleClick, icon: 'fas fa-dice-two' },
// 			{ name: 'tool2-3', title: 'tool2-3', onClick: handleClick, icon: 'fas fa-dice-two', button: true },
// 			{ name: 'tool2-4', title: 'tool2-4', onClick: handleClick, icon: 'fas fa-dice-two', toggle: true },
// 		]
// 	});
// 	groups.push({
// 		name: 'radial3',
// 		icon: 'fas fa-dice-three',
// 		title: 'radial3',
// 		onClick: handleClick,
// 		tools: [
// 			{ name: 'tool3-1', title: 'tool3-1', onClick: handleClick, icon: 'fas fa-dice-three' },
// 			{ name: 'tool3-2', title: 'tool3-2', onClick: handleClick, icon: 'fas fa-dice-three' },
// 			{ name: 'tool3-3', title: 'tool3-3', onClick: handleClick, icon: 'fas fa-dice-three', button: true },
// 			{ name: 'tool3-4', title: 'tool3-4', onClick: handleClick, icon: 'fas fa-dice-three', toggle: true },
// 		]
// 	});
// 	groups.push({
// 		name: 'radial4',
// 		icon: 'fas fa-dice-four',
// 		title: 'radial4',
// 		onClick: handleClick
// 	});

// 	groups.push({
// 		name: 'button1',
// 		icon: 'fas fa-dice-one',
// 		title: 'button1',
// 		button: true,
// 		onClick: handleClick,
// 	});
// 	groups.push({
// 		name: 'button2',
// 		icon: 'fas fa-dice-two',
// 		title: 'button2',
// 		button: true,
// 		onClick: handleClick,
// 	});

// 	groups.push({
// 		name: 'toggle1',
// 		icon: 'fas fa-dice-one',
// 		title: 'toggle1',
// 		toggle: true,
// 		onClick: handleClick,
// 	});
// 	groups.push({
// 		name: 'toggle2',
// 		icon: 'fas fa-dice-two',
// 		title: 'toggle2',
// 		toggle: true,
// 		isActive: true,
// 		onClick: handleClick,
// 	});
// });
