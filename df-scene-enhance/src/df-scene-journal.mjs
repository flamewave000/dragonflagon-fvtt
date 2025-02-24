/// <reference path="../../fvtt-scripts/foundry.js" />
import SETTINGS from "../common/Settings.mjs";

/**
 * @typedef {object} Button
 * @property {string} icon
 * @property {string} label
 * @property {Function} callback
 */
/** */
export default class DFSceneJournal {
	static ON_CLICK_JOURNAL = 'nav-on-click-journal';
	static ON_CLICK_JOURNAL_ONLY_ONE = 'nav-on-click-journal-only-one';

	/**
	 * @param {Scene} scene
	 * @returns {Promise<any>}
	 */
	static async displayDialog(scene) {
		const permScene = scene.testUserPermission(game.user, "LIMITED");
		const hasConfig = game.user.isGM;
		const hasJournal = !!scene.journal && scene.journal.testUserPermission(game.user, "OBSERVER");
		if (!permScene && !hasConfig && !hasJournal)
			return ui.notifications.warn(`You do not have permission to view this ${scene.documentName}.`);

		/**@type {Record<string, Button>}*/
		const buttons = {};
		let defaultButton = '';
		if (hasConfig) {
			defaultButton = 'config';
			buttons.config = {
				icon: '<i class="fas fa-cog"></i>',
				label: game.i18n.localize('DF-SCENE-ENHANCE.Dialog.JournalConfig'),
				callback: async () => { return scene.sheet.render(true); }
			};
		}
		if (hasJournal) {
			defaultButton = 'journal';
			buttons.journal = {
				icon: '<i class="fas fa-book-open"></i>',
				label: game.i18n.localize('DF-SCENE-ENHANCE.Dialog.JournalJournal'),
				callback: async () => { return scene.journal.sheet.render(true); }
			};
		}
		if (permScene) {
			defaultButton = 'navigate';
			buttons.navigate = {
				icon: '<i class="fas fa-directions"></i>',
				label: game.i18n.localize('DF-SCENE-ENHANCE.Dialog.JournalNavigate'),
				callback: async () => { return scene.view(); }
			};
		}

		// if there is only one option, execute it and return
		const immediateIfOnlyOne = SETTINGS.get(DFSceneJournal.ON_CLICK_JOURNAL_ONLY_ONE);
		if (immediateIfOnlyOne && Object.keys(buttons).length == 1)
			return buttons[Object.keys(buttons)[0]].callback();

		return (new Dialog({
			title: game.i18n.localize("DF-SCENE-ENHANCE.Dialog.JournalTitle") + scene.name,
			content: "<p>" + game.i18n.localize("DF-SCENE-ENHANCE.Dialog.JournalMessage") + "</p>",
			buttons: buttons,
			default: defaultButton,
		})).render(true);
	}

	/**
	 * This is copied directly from the `TextEditor._onClickContentLink` static method. It is only
	 * modified to display a dialog for scene links.
	 * @param {JQuery.ClickEvent} event
	 */
	static async _onClickContentLink(event) {
		event.preventDefault();
		const doc = await fromUuid(event.currentTarget.dataset.uuid);
		if (doc instanceof Scene)
			return DFSceneJournal.displayDialog(doc);
		// @ts-ignore
		return doc?._onClickDocumentLink(event);
	}

	/** @param {boolean} [newValue] */
	static patchTextEditor(newValue) {
		let journalClick = SETTINGS.get(DFSceneJournal.ON_CLICK_JOURNAL);
		if (newValue !== undefined) {
			journalClick = newValue;
		}
		const body = $("body");
		if (journalClick) {
			body.off("click", "a[data-link]", TextEditor._onClickContentLink);
			body.on("click", "a[data-link]", DFSceneJournal._onClickContentLink);
		}
		else {
			body.on("click", "a[data-link]", TextEditor._onClickContentLink);
			body.off("click", "a[data-link]", DFSceneJournal._onClickContentLink);
		}
	}

	static init() {
		SETTINGS.register(DFSceneJournal.ON_CLICK_JOURNAL, {
			name: "DF-SCENE-ENHANCE.Nav.SettingOnClickJournal",
			hint: "DF-SCENE-ENHANCE.Nav.SettingOnClickJournalHint",
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			onChange: (/**@type {boolean}*/value) => DFSceneJournal.patchTextEditor(value)
		});
		SETTINGS.register(DFSceneJournal.ON_CLICK_JOURNAL_ONLY_ONE, {
			name: "DF-SCENE-ENHANCE.Nav.SettingOnClickJournalOnlyOne",
			hint: "DF-SCENE-ENHANCE.Nav.SettingOnClickJournalOnlyOneHint",
			scope: "world",
			config: true,
			type: Boolean,
			default: false
		});
	}

	static ready() {
		DFSceneJournal.patchTextEditor();
	}
}