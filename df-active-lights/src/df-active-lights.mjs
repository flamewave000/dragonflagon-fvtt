/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../common/foundry.d.ts" />
/// <reference path="./types.d.ts" />
import ActiveLightConfig from "./ActiveLightConfig.mjs";
import LightAnimator from "./LightAnimator.mjs";
import SETTINGS from "../common/Settings.mjs";
SETTINGS.init('df-active-lights');

Hooks.once('init', function () {
	SETTINGS.register('enabled', {
		config: false,
		scope: 'world',
		type: Boolean,
		default: true
	});

	Hooks.on('getSceneControlButtons', (/**@type {SceneControl[]}*/ controls) => {
		controls.find(x => x.name === 'lighting').tools.unshift({
			icon: 'fas fa-video',
			name: 'active-lights',
			title: 'DF_ACTIVE_LIGHTS.animationToggleTitle',
			toggle: true,
			active: SETTINGS.get('enabled'),
			onClick: async toggled => {
				await SETTINGS.set('enabled', toggled);
				if (toggled) return;
				canvas.lighting.objects.children.forEach((/**@type {AmbientLight}*/ x) => {
					x.initializeLightSource({deleted:false});
					x.refresh();
					canvas.perception.update({
						refreshLighting: true,
						refreshVision: true
					}, true);
				});
			}
		});
	});
});
Hooks.once('ready', function () {
	ActiveLightConfig.ready();
	LightAnimator.ready();
});