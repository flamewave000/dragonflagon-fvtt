import FlagEditor from "./FlagEditor";
import SETTINGS from "../../common/SETTINGS";
SETTINGS.init('df-flag-edit');

Hooks.once('init', function() {
	FlagEditor.init();
});