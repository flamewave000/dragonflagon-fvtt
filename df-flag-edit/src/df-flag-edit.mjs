/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
import '../common/HooksExt.shim.mjs';
import SETTINGS from "../common/Settings.mjs";
import FlagEditor from "./FlagEditor.mjs";
SETTINGS.init('df-flag-edit');

Hooks.once('init', function () {
	FlagEditor.init();
});

function launchFlagEditorForEvent(/**@type {JQuery.ClickEvent}*/event) {
	const id = $(event.currentTarget).parents('.window-app').attr('id').split('-');
	id.shift();
	if (!id) return;
	SETTINGS.set(FlagEditor.PREF_LAST_OBJ, id.join('.'));
	new FlagEditor().render(true);
}
Hooks.once('ready', function () {
	if (!game.user.isGM) return;
	Hooks.onRE(/get.*HeaderButtons/, (/**@type {Application}*/app, /**@type {Application.HeaderButton[]}*/buttons) => {
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

Hooks.on('editFlags', (/**@type {string}*/id) => {
	id = id?.trim();
	if (!id) return false;
	SETTINGS.set(FlagEditor.PREF_LAST_OBJ, id);
	new FlagEditor().render(true);
	return false;
});