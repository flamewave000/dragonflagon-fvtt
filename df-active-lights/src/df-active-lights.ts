import ActiveLightConfig from "./ActiveLightConfig";
import { LightAnimator } from "./LightAnimator";
import SETTINGS from "../../common/Settings";
SETTINGS.init('df-active-lights');

Hooks.once('init', function () {
	LightAnimator.init();

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
					canvas.perception.schedule({
						lighting: { refresh: true },
						sight: {
							refresh: true,
							forceUpdateFog: true // Update exploration even if the token hasn't moved
						}
					});
				});
			}
		});
	});
});
Hooks.once('ready', function () {
	ActiveLightConfig.ready();
	LightAnimator.ready();
});