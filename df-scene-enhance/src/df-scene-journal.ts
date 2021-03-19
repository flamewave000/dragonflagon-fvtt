

interface Button {
	icon: string,
	label: string,
	callback: Function
}
declare interface DataSet {
	entity?: string;
	pack?: string;
	lookup?: string;
	id: string;
}

class DFSceneJournal {
	static MODULE = 'df-scene-enhance';
	static ON_CLICK_JOURNAL = 'nav-on-click-journal';
	static ON_CLICK_JOURNAL_ONLY_ONE = 'nav-on-click-journal-only-one';

	static async displayDialog(scene: Scene) {
		const permScene = scene.hasPerm(game.user, "LIMITED");
		const hasConfig = game.user.isGM;
		const hasJournal = !!scene.journal && scene.journal.hasPerm(game.user, "OBSERVER");
		if (!permScene && !hasConfig && !hasJournal)
			return ui.notifications.warn(`You do not have permission to view this ${scene.entity}.`);

		// const buttons: {
		// 	config?: Button,
		// 	journal?: Button,
		// 	navigate?: Button
		// } = {};
		const buttons: Record<string, Button> = {};
		let defaultButton = '';
		if (hasConfig) {
			defaultButton = 'config';
			buttons.config = {
				icon: '<i class="fas fa-cog"></i>',
				label: game.i18n.localize('DRAGON_FLAGON.Dialog_JournalConfig'),
				callback: async () => { return scene.sheet.render(true); }
			}
		}
		if (hasJournal) {
			defaultButton = 'journal';
			buttons.journal = {
				icon: '<i class="fas fa-book-open"></i>',
				label: game.i18n.localize('DRAGON_FLAGON.Dialog_JournalJournal'),
				callback: async () => { return scene.journal.sheet.render(true); }
			}
		}
		if (permScene) {
			defaultButton = 'navigate';
			buttons.navigate = {
				icon: '<i class="fas fa-directions"></i>',
				label: game.i18n.localize('DRAGON_FLAGON.Dialog_JournalNavigate'),
				callback: async () => { return scene.view(); }
			}
		}

		// if there is only one option, execute it and return
		const immediateIfOnlyOne = game.settings.get(DFSceneJournal.MODULE, DFSceneJournal.ON_CLICK_JOURNAL_ONLY_ONE);
		if (immediateIfOnlyOne && Object.keys(buttons).length == 1)
			return buttons[Object.keys(buttons)[0]].callback();

		return (new Dialog({
			title: game.i18n.localize("DRAGON_FLAGON.Dialog_JournalTitle") + scene.name,
			content: "<p>" + game.i18n.localize("DRAGON_FLAGON.Dialog_JournalMessage") + "</p>",
			buttons: buttons as any,
			default: defaultButton,
		})).render(true);
	}

	/**
	 * This is copied directly from the `TextEditor._onClickEntityLink` static method. It is only
	 * modified for `Target 2` to display a dialog for navigation.
	 */
	static async onClickEntityLink(event: JQuery.ClickEvent) {
		event.preventDefault();
		const a: EventTarget = event.currentTarget;
		const dataset: DataSet = (a as any).dataset;
		let entity = null;

		// Target 1 - Compendium Link
		if (dataset.pack) {
			const pack = game.packs.get(dataset.pack);
			let id = dataset.id;
			if (dataset.lookup) {
				if (!pack.index.length) await pack.getIndex();
				const entry = pack.index.find(i => (i._id === dataset.lookup) || (i.name === dataset.lookup));
				id = entry._id;
			}
			entity = id ? await pack.getEntity(id) : null;
		}

		// Target 2 - World Entity Link MODIFIED SECTION
		else {
			const cls = (CONFIG[dataset.entity] as any).entityClass;
			entity = cls.collection.get(dataset.id);
			if (entity.entity === "Scene") {
				return DFSceneJournal.displayDialog(entity);
			}
		}
		if (!entity) return;

		// Action 1 - Execute an Action
		if (entity.entity === "Macro") {
			if (!entity.hasPerm(game.user, "LIMITED")) {
				return ui.notifications.warn(`You do not have permission to use this ${entity.entity}.`);
			}
			return entity.execute();
		}

		// Action 2 - Render the Entity sheet
		return entity.sheet.render(true);
	}

	static patchTextEditor(newValue?: Boolean) {
		var journalClick = game.settings.get(DFSceneJournal.MODULE, DFSceneJournal.ON_CLICK_JOURNAL);
		if (newValue !== undefined) {
			journalClick = newValue;
		}
		const body = $("body");
		if (journalClick) {
			body.off("click", "a.entity-link", (TextEditor as any)._onClickEntityLink);
			body.on("click", "a.entity-link", DFSceneJournal.onClickEntityLink);
		}
		else {
			body.off("click", "a.entity-link", DFSceneJournal.onClickEntityLink);
			body.on("click", "a.entity-link", (TextEditor as any)._onClickEntityLink);
		}
	}
}

Hooks.once('init', function () {
	game.settings.register(DFSceneJournal.MODULE, DFSceneJournal.ON_CLICK_JOURNAL, {
		name: "DRAGON_FLAGON.Nav_SettingOnClickJournal",
		hint: "DRAGON_FLAGON.Nav_SettingOnClickJournalHint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		onChange: value => DFSceneJournal.patchTextEditor(value)
	});
	game.settings.register(DFSceneJournal.MODULE, DFSceneJournal.ON_CLICK_JOURNAL_ONLY_ONE, {
		name: "DRAGON_FLAGON.Nav_SettingOnClickJournalOnlyOne",
		hint: "DRAGON_FLAGON.Nav_SettingOnClickJournalOnlyOneHint",
		scope: "scene",
		config: true,
		type: Boolean,
		default: false
	});
});

Hooks.on('ready', function () {
	DFSceneJournal.patchTextEditor();
});
