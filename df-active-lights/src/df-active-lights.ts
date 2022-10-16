import ActiveLightConfig from "./ActiveLightConfig";
import { LightAnimator } from "./LightAnimator";
import SETTINGS from "../../common/Settings";
SETTINGS.init('df-active-lights');

Hooks.once('init', function () {
	// LightAnimator.init();

	SETTINGS.register('enabled', {
		config: false,
		scope: 'world',
		type: Boolean,
		default: true
	});

	Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
		controls.find(x => x.name === 'lighting').tools.unshift({
			icon: 'fas fa-video',
			name: 'active-lights',
			title: 'DF_ACTIVE_LIGHTS.animationToggleTitle',
			toggle: true,
			active: SETTINGS.get('enabled'),
			onClick: async (toggled: boolean) => {
				await SETTINGS.set('enabled', toggled);
				if (toggled) return;
				canvas.lighting.objects.children.forEach(x => {
					(x as AmbientLight).updateSource({ defer: true });
					(x as AmbientLight).refresh();
					canvas.perception.update({
						refreshLighting: true,
						refreshVision: true
						// @ts-expect-error
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