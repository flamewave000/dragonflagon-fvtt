import '../../common/HooksExt.shim';
import SETTINGS from "../../common/Settings";
import FlagEditor from "./FlagEditor";
SETTINGS.init('df-flag-edit');

Hooks.once('init', function () {
	FlagEditor.init();
});

function launchFlagEditorForEvent(event: JQuery.ClickEvent) {
	const id = $(event.currentTarget).parents('.window-app').attr('id').split('-').pop();
	if (!id) return;
	SETTINGS.set(FlagEditor.PREF_LAST_OBJ, id);
	new FlagEditor().render(true);
}
Hooks.once('ready', function () {
	if (!game.user.isGM) return;
	Hooks.onRE(/get.*HeaderButtons/, (app: Application, buttons: Application.HeaderButton[]) => {
		if (buttons.find(x => x.class === 'edit-flags')) return;
		if (app instanceof DocumentSheet) {
			buttons.unshift({
				icon: 'fas fa-code',
				label: 'Edit Flags',
				class: 'edit-flags',
				onclick: launchFlagEditorForEvent
			});
		}
	});
});

Hooks.on('editFlags', (id: string) => {
	id = id?.trim();
	if (!id) return false;
	SETTINGS.set(FlagEditor.PREF_LAST_OBJ, id);
	new FlagEditor().render(true);
	return false;
});