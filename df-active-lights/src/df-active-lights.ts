import {} from '../../common/global';
import ActiveLightConfig from "./ActiveLightConfig";
import { LightAnimator } from "./LightAnimator";
import SETTINGS from "../../common/Settings";
SETTINGS.init('df-active-lights');

Hooks.once('init', function () {
	ActiveLightConfig.init();
	LightAnimator.init();
});
Hooks.once('ready', function () {
	ActiveLightConfig.ready();
	LightAnimator.ready();
});