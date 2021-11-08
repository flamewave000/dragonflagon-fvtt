import FlagEditor from "./FlagEditor";
import SETTINGS from "./SETTINGS";
SETTINGS.init('df-flag-edit');

Hooks.once('init', function() {
	FlagEditor.init();
});