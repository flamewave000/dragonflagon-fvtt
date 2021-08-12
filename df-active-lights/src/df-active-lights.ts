import ActiveLightConfig from "./ActiveLightConfig.js";
import { LightAnimator } from "./LightAnimator.js";
import SETTINGS from "./libs/SETTINGS.js";
SETTINGS.init('df-active-lights');

Hooks.once('init', function () {
	ActiveLightConfig.init();
	LightAnimator.init();
});
Hooks.once('ready', function () {
	ActiveLightConfig.ready();
	LightAnimator.ready();
});