/// <reference path="./ToolType.d.ts" />

import ControlManagerImpl from "./ControlManager.mjs";

// CONFIG.debug.hooks = true;
Hooks.once('init', () => { ui.moduleControls = new ControlManagerImpl(); });
Hooks.once('ready', () => {
	ui.moduleControls.activateHooks();
	ui.moduleControls.setup();
	ui.moduleControls.render();
});

/* Example code for appending Tools */
/// <reference path="ToolType.d.ts" />
// Hooks.on('getModuleTools', (/**@type {ControlManager}*/app, /**@type {Record<String, Tool>}*/tools) => {
// 	const handleClick = /**@this {Tool} @param {Boolean} [active]*/function (active) {
// 		if (active === undefined) console.log(this.title);
// 		else console.log(`${this.title}: active=${active}`);
// 	};
// 	tools.radial0 = {
// 		icon: 'fas fa-expand',
// 		title: 'radial0',
// 		onClick: handleClick,
// 	};
// 	tools.radial1 = {
// 		icon: 'fas fa-dice-one',
// 		title: 'radial1',
// 		visible: () => ui.controls.control.name === 'tokens',
// 		onClick: handleClick,
// 		tools: {
// 			'tool1-1': { title: 'tool1-1', onClick: handleClick, icon: 'fas fa-dice-one' },
// 			'tool1-2': { title: 'tool1-2', onClick: handleClick, icon: 'fas fa-dice-one' },
// 			'tool1-3': { title: 'tool1-3', onClick: handleClick, icon: 'fas fa-dice-one', type: 'button' },
// 			'tool1-4': { title: 'tool1-4', onClick: handleClick, icon: 'fas fa-dice-one', type: 'toggle' },
// 		}
// 	};
// 	tools.radial2 = {
// 		icon: 'fas fa-dice-two',
// 		title: 'radial2',
// 		visible: () => ui.controls.control.name === 'walls',
// 		onClick: handleClick,
// 		tools: {
// 			'tool2-1': { title: 'tool2-1', onClick: handleClick, icon: 'fas fa-dice-two' },
// 			'tool2-2': { title: 'tool2-2', onClick: handleClick, icon: 'fas fa-dice-two' },
// 			'tool2-3': { title: 'tool2-3', onClick: handleClick, icon: 'fas fa-dice-two', type: 'button' },
// 			'tool2-4': { title: 'tool2-4', onClick: handleClick, icon: 'fas fa-dice-two', type: 'toggle' },
// 		}
// 	};
// 	tools.radial3 = {
// 		icon: 'fas fa-dice-three',
// 		title: 'radial3',
// 		onClick: handleClick,
// 		tools: {
// 			'tool3-1': {
// 				icon: 'fas fa-dice-three',
// 				title: 'tool3-1',
// 				onClick: handleClick,
// 				tools: {
// 					'tool3-1-1': { title: 'tool3-1-1', onClick: handleClick, icon: 'fas fa-dice-four' },
// 					'tool3-1-2': { title: 'tool3-1-2', onClick: handleClick, icon: 'fas fa-dice-four' },
// 					'tool3-1-3': { title: 'tool3-1-3', onClick: handleClick, icon: 'fas fa-dice-four', type: 'button' },
// 					'tool3-1-4': { title: 'tool3-1-4', onClick: handleClick, icon: 'fas fa-dice-four', type: 'toggle' },
// 				}
// 			},
// 			'tool3-2': {
// 				icon: 'fas fa-dice-three',
// 				title: 'tool3-2',
// 				onClick: handleClick,
// 				tools: {
// 					'tool3-2-1': { title: 'tool3-2-1', onClick: handleClick, icon: 'fas fa-dice-five' },
// 					'tool3-2-2': { title: 'tool3-2-2', onClick: handleClick, icon: 'fas fa-dice-five' },
// 					'tool3-2-3': { title: 'tool3-2-3', onClick: handleClick, icon: 'fas fa-dice-five', type: 'button' },
// 					'tool3-2-4': { title: 'tool3-2-4', onClick: handleClick, icon: 'fas fa-dice-five', type: 'toggle' },
// 				}
// 			},
// 			'tool3-3': { title: 'tool3-3', onClick: handleClick, icon: 'fas fa-dice-three', type: 'button' },
// 			'tool3-4': { title: 'tool3-4', onClick: handleClick, icon: 'fas fa-dice-three', type: 'toggle' },
// 		}
// 	};
// 	tools.radial4 = {
// 		icon: 'fas fa-dice-four',
// 		title: 'radial4',
// 		onClick: handleClick
// 	};
// 	tools.button1 = {
// 		icon: 'fas fa-dice-one',
// 		title: 'button1',
// 		type: 'button',
// 		onClick: handleClick,
// 	};
// 	tools.button2 = {
// 		icon: 'fas fa-dice-two',
// 		title: 'button2',
// 		type: 'button',
// 		onClick: handleClick,
// 	};
// 	tools.toggle1 = {
// 		icon: 'fas fa-dice-one',
// 		title: 'toggle1',
// 		type: 'toggle',
// 		onClick: handleClick,
// 	};
// 	tools.toggle2 = {
// 		icon: 'fas fa-dice-two',
// 		title: 'toggle2',
// 		type: 'toggle',
// 		isActive: true,
// 		onClick: handleClick,
// 	};
// });
