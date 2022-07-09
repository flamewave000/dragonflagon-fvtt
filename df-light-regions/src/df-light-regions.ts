import SETTINGS from "../../common/Settings";
import RegionConfig from "./RegionConfig";
SETTINGS.init("df-light-regions");


// Hooks.on("setup", () => {

// });
Hooks.on("init", () => {
	RegionConfig.init();
});
// Hooks.on("ready", () => {

// });