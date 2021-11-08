import {} from '../../common/global';
import FlagEditor from "./FlagEditor";
import SETTINGS from "../../common/Settings";
SETTINGS.init('df-flag-edit');

Hooks.once('init', function() {
	FlagEditor.init();
});