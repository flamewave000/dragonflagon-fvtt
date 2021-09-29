import FlagEditor from "./FlagEditor.js";
import SETTINGS from "./SETTINGS.js";
SETTINGS.init('df-flag-edit');

Hooks.once('init', function() {
	FlagEditor.init();
});