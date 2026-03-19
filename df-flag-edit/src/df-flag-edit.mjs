/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../common/fvtt.mjs" />
import SETTINGS from "../common/Settings.mjs";
import FlagEditor from "./FlagEditor.mjs";
SETTINGS.init('df-flag-edit');

Hooks.once('init', function () {
	FlagEditor.init();
});

async function launchFlagEditorForEvent(/**@type {ApplicationV2}*/app) {
	const id = app.id.split('-');
	id.shift();
	if (!id) return;
	await FlagEditor.setLastObject(id.join('.'));
	new FlagEditor().render(true);
}
Hooks.once('ready', function () {
	if (!game.user.isGM) return;
	Hooks.on('getHeaderControlsApplicationV2', (/**@type {ApplicationV2}*/app, /**@type {ApplicationHeaderControlsEntry[]}*/buttons) => {
		if (buttons.find(x => x.action === 'edit-flags')) return;
		if (app instanceof foundry.applications.api.DocumentSheetV2) {
			buttons.unshift({
				icon: 'fas fa-code',
				label: 'DF_FLAG_EDIT.HeaderButtonLabel',
				action: 'edit-flags',
				onClick: () => launchFlagEditorForEvent(app)
			});
		}
	});
});

/**
 * @typedef ApplicationHeaderControlsEntry
 * @property {string} icon                      A font-awesome icon class which denotes the control button
 * @property {string} label                     The text label for the control button. This label will be automatically
 *                                              localized when the button is rendered
 * @property {string} action                    The action name triggered by clicking the control button
 * @property {boolean|(() => boolean)} [visible] Is the control button visible for the current client?
 * @property {DocumentOwnershipLevel} [ownership] A key or value in {@link CONST.DOCUMENT_OWNERSHIP_LEVELS} that
 *                                                restricts visibility of this option for the current user. This option
 *                                                only applies to DocumentSheetV2 instances.
 * @property {(event: PointerEvent) => void|Promise<void>} [onClick] A custom click handler function. Asynchronous
 *                                                                   functions are not awaited.
 */

Hooks.on('editFlags', (/**@type {string}*/id) => {
	id = id?.trim();
	if (!id) return false;
	SETTINGS.set(FlagEditor.PREF_LAST_OBJ, id);
	new FlagEditor().render(true);
	return false;
});