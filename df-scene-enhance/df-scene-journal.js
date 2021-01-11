class DFSceneJournal {
	static MODULE = 'df-scene-enhance';
	static ON_CLICK_JOURNAL = 'nav-on-click-journal';

	static async displayDialog(scene) {
		return (new Dialog({
			title: game.i18n.localize("DRAGON_FLAGON.Dialog_JournalTitle"),
			content: game.i18n.localize("DRAGON_FLAGON.Dialog_JournalMessage"),
			buttons: {
				config: {
					icon: '<i class="fas fa-cog"></i>',
					label: game.i18n.localize('DRAGON_FLAGON.Dialog_JournalConfig'),
					callback: async () => { return scene.sheet.render(true); }
				},
				navigate: {
					icon: '<i class="fas fa-directions"></i>',
					label: game.i18n.localize('DRAGON_FLAGON.Dialog_JournalNavigate'),
					callback: async () => { return scene.view(); }
				}
			}, callback: () => { },
			default: 'navigate',
		})).render(true);
	}

	/**
	 * This is copied directly from the `TextEditor._onClickEntityLink` static method. It is only
	 * modified for `Target 2` to display a dialog for navigation.
	 */
	static async onClickEntityLink(event) {
		event.preventDefault();
		const a = event.currentTarget;
		let entity = null;

		// Target 1 - Compendium Link
		if (a.dataset.pack) {
			const pack = game.packs.get(a.dataset.pack);
			let id = a.dataset.id;
			if (a.dataset.lookup) {
				if (!pack.index.length) await pack.getIndex();
				const entry = pack.index.find(i => (i._id === a.dataset.lookup) || (i.name === a.dataset.lookup));
				id = entry._id;
			}
			entity = id ? await pack.getEntity(id) : null;
		}

		// Target 2 - World Entity Link
		else {
			const cls = CONFIG[a.dataset.entity].entityClass;
			entity = cls.collection.get(a.dataset.id);
			if (entity.entity === "Scene" && entity.journal) entity = entity.journal;
			if (!entity.hasPerm(game.user, "LIMITED")) {
				return ui.notifications.warn(`You do not have permission to view this ${entity.entity} sheet.`);
			}
			// This is sole addition to this original code from `TextEditor._onClickEntityLink`
			return DFSceneJournal.displayDialog(entity);
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

	static patchTextEditor(newValue) {
		var journalClick = game.settings.get(DFSceneJournal.MODULE, DFSceneJournal.ON_CLICK_JOURNAL);
		if (newValue !== undefined) {
			journalClick = newValue;
		}
		const body = $("body");
		if (journalClick) {
			body.off("click", "a.entity-link", TextEditor._onClickEntityLink);
			body.on("click", "a.entity-link", DFSceneJournal.onClickEntityLink);
		}
		else {
			body.off("click", "a.entity-link", DFSceneJournal.onClickEntityLink);
			body.on("click", "a.entity-link", TextEditor._onClickEntityLink);
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
});

Hooks.on('ready', function () {
	DFSceneJournal.patchTextEditor();
});
