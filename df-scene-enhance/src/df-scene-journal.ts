import SETTINGS from "../../common/Settings";

interface Button {
	icon: string,
	label: string,
	callback: AnyFunction
}

export default class DFSceneJournal {
	static ON_CLICK_JOURNAL = 'nav-on-click-journal';
	static ON_CLICK_JOURNAL_ONLY_ONE = 'nav-on-click-journal-only-one';

	static async displayDialog(scene: Scene) {
		const permScene = scene.testUserPermission(game.user, "LIMITED");
		const hasConfig = game.user.isGM;
		const hasJournal = !!scene.journal && scene.journal.testUserPermission(game.user, "OBSERVER");
		if (!permScene && !hasConfig && !hasJournal)
			return ui.notifications.warn(`You do not have permission to view this ${scene.documentName}.`);

		const buttons: Record<string, Button> = {};
		let defaultButton = '';
		if (hasConfig) {
			defaultButton = 'config';
			buttons.config = {
				icon: '<i class="fas fa-cog"></i>',
				label: game.i18n.localize('DF-SCENE-ENHANCE.Dialog_JournalConfig'),
				callback: async () => { return scene.sheet.render(true); }
			};
		}
		if (hasJournal) {
			defaultButton = 'journal';
			buttons.journal = {
				icon: '<i class="fas fa-book-open"></i>',
				label: game.i18n.localize('DF-SCENE-ENHANCE.Dialog_JournalJournal'),
				callback: async () => { return scene.journal.sheet.render(true); }
			};
		}
		if (permScene) {
			defaultButton = 'navigate';
			buttons.navigate = {
				icon: '<i class="fas fa-directions"></i>',
				label: game.i18n.localize('DF-SCENE-ENHANCE.Dialog_JournalNavigate'),
				callback: async () => { return scene.view(); }
			};
		}

		// if there is only one option, execute it and return
		const immediateIfOnlyOne = SETTINGS.get(DFSceneJournal.ON_CLICK_JOURNAL_ONLY_ONE);
		if (immediateIfOnlyOne && Object.keys(buttons).length == 1)
			return buttons[Object.keys(buttons)[0]].callback();

		return (new Dialog({
			title: game.i18n.localize("DF-SCENE-ENHANCE.Dialog_JournalTitle") + scene.name,
			content: "<p>" + game.i18n.localize("DF-SCENE-ENHANCE.Dialog_JournalMessage") + "</p>",
			buttons: buttons as any,
			default: defaultButton,
		})).render(true);
	}

	/**
	 * This is copied directly from the `TextEditor._onClickEntityLink` static method. It is only
	 * modified for `Target 2` to display a dialog for navigation.
	 */
	static async _onClickContentLink(event: JQuery.ClickEvent) {
		const a = event.currentTarget;
		let document = null;
		const id = a.dataset.id;
		if (!a.dataset.pack) {
			const collection = game.collections.get(a.dataset.entity);
			document = collection.get(id);
			if ((document.documentName === "Scene")) {
				event.preventDefault();
				return DFSceneJournal.displayDialog(document);
			}
		}
		// @ts-ignore
		return TextEditor._onClickContentLink(event);
	}

	static patchTextEditor(newValue?: boolean) {
		let journalClick = SETTINGS.get(DFSceneJournal.ON_CLICK_JOURNAL);
		if (newValue !== undefined) {
			journalClick = newValue;
		}
		const body = $("body");
		if (journalClick) {
			body.off("click", "a.content-link", (TextEditor as any)._onClickContentLink);
			body.on("click", "a.content-link", DFSceneJournal._onClickContentLink);
		}
		else {
			body.off("click", "a.content-link", DFSceneJournal._onClickContentLink);
			body.on("click", "a.content-link", (TextEditor as any)._onClickContentLink);
		}
	}

	static init() {
		SETTINGS.register(DFSceneJournal.ON_CLICK_JOURNAL, {
			name: "DF-SCENE-ENHANCE.Nav_SettingOnClickJournal",
			hint: "DF-SCENE-ENHANCE.Nav_SettingOnClickJournalHint",
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			onChange: (value: boolean) => DFSceneJournal.patchTextEditor(value)
		});
		SETTINGS.register(DFSceneJournal.ON_CLICK_JOURNAL_ONLY_ONE, {
			name: "DF-SCENE-ENHANCE.Nav_SettingOnClickJournalOnlyOne",
			hint: "DF-SCENE-ENHANCE.Nav_SettingOnClickJournalOnlyOneHint",
			scope: "scene",
			config: true,
			type: Boolean,
			default: false
		});
	}

	static ready() {
		DFSceneJournal.patchTextEditor();
	}
}