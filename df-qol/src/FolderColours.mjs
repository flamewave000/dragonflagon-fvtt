import SETTINGS from "../common/Settings.mjs";

function apply(/**@type {boolean}*/ shouldApply, /**@type {string}*/ hookName, /**@type {AnyFunction}*/ func) {
	if (shouldApply) Hooks.on(hookName, func);
	else Hooks.off(hookName, func);
}

export default class FolderColours {
	static FLAG_COLOUR = "colour";

	static init() {
		SETTINGS.register('folder-colour', {
			name: 'DF_QOL.FolderTextColour.Name',
			hint: 'DF_QOL.FolderTextColour.Hint',
			scope: 'world',
			type: Boolean,
			default: true,
			config: true,
			onChange: (/**@type {boolean}*/ newValue) => {
				apply(newValue, 'renderFolderConfig', FolderColours.DF_FOLDER_TEXT_COLOUR);
				apply(newValue, 'renderSceneDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
				apply(newValue, 'renderActorDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
				apply(newValue, 'renderItemDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
				apply(newValue, 'renderJournalDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
				apply(newValue, 'renderRollTableDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
				apply(newValue, 'renderCardsDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
				apply(newValue, 'renderPlaylistDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
				apply(newValue, 'renderCompendiumDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
				
				// Special hook just for Monk's Enhanced Journal
				apply(newValue, 'renderEnhancedJournal', FolderColours.DF_SCENE_DIRECTORY_RENDER);
				ui.sidebar.render(false);
			}
		});
		if(SETTINGS.get('folder-colour')) {
			Hooks.on('renderFolderConfig', FolderColours.DF_FOLDER_TEXT_COLOUR);
			Hooks.on('renderSceneDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
			Hooks.on('renderActorDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
			Hooks.on('renderItemDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
			Hooks.on('renderJournalDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
			Hooks.on('renderRollTableDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
			Hooks.on('renderCardsDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
			Hooks.on('renderPlaylistDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
			Hooks.on('renderCompendiumDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
			// Special hook just for Monk's Enhanced Journal
			Hooks.on('renderEnhancedJournal', FolderColours.DF_SCENE_DIRECTORY_RENDER);
		}
	}

	static DF_FOLDER_TEXT_COLOUR(/**@type {FolderConfig}*/ app, /**@type {JQuery}*/ html, /**@type { { folder: FolderData, sortingModes: { a: string, m: string }, submitText: string } }*/ _data) {
		/**@type {string}*/ const textColour = app.object.getFlag(SETTINGS.MOD_NAME, FolderColours.FLAG_COLOUR) ?? "";
		html.find('button[type="submit"]').before(`<div class="form-group">
	<label>${'Text Color'}</label>
	<div class="form-fields">
		<color-picker name="flags.${SETTINGS.MOD_NAME}.${FolderColours.FLAG_COLOUR}" value="${textColour}">
			<input type="text" placeholder="">
			<input type="color">
		</color-picker>
	</div>
</div>`);

		app.setPosition({
			height: "auto"
		});
	}
	static DF_SCENE_DIRECTORY_RENDER(/**@type {Application}*/ app, /**@type {JQuery<HTMLElement>}*/ html, _data) {
		const colorize = (/**@type {JQuery<HTMLElement>}*/ element) => {
			const id = element[0].getAttribute('data-folder-id');
			if (id === null || id === undefined) return;
			const folder = game.folders.get(id);
			if (folder === null || folder === undefined) return;

			//! If we have old data, migrate it
			if (folder.flags?.textColour) {
				folder.flags[SETTINGS.MOD_NAME] = {};
				folder.flags[SETTINGS.MOD_NAME][FolderColours.FLAG_COLOUR] = folder.flags.textColour;
				delete folder.flags.textColour;
				folder.update({flags: folder.flags});
			}

			element.find('header *').css('color', folder.getFlag(SETTINGS.MOD_NAME, FolderColours.FLAG_COLOUR) ?? "");
		};
		// If the app is Monk's Enhanced Journal, let it render first before we apply our colour
		if (app.constructor.name === 'EnhancedJournal')
			setTimeout(() => html.find('li[data-folder-id]').each((_, /**@type {HTMLElement}*/ element) => colorize($(element))), 10);
		else
			html.find('li[data-folder-id]').each((_, /**@type {HTMLElement}*/ element) => colorize($(element)));
	}
}