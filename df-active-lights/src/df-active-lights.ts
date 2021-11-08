import ActiveLightConfig from "./ActiveLightConfig";
import { LightAnimator } from "./LightAnimator";
import SETTINGS from "./libs/SETTINGS";
SETTINGS.init('df-active-lights');

Hooks.once('init', function () {
	ActiveLightConfig.init();
	LightAnimator.init();
});
Hooks.once('ready', function () {
	ActiveLightConfig.ready();
	LightAnimator.ready();
});