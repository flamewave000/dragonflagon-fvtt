import { FolderData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
import SETTINGS from "../common/Settings.mjs";

function apply(shouldApply: boolean, hookName: string, func: AnyFunction) {
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
			onChange: (newValue: boolean) => {
				apply(newValue, 'renderFolderConfig', FolderColours.DF_FOLDER_TEXT_COLOUR);
				apply(newValue, 'renderSceneDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
				apply(newValue, 'renderActorDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
				apply(newValue, 'renderItemDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
				apply(newValue, 'renderJournalDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
				apply(newValue, 'renderRollTableDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
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
			// Special hook just for Monk's Enhanced Journal
			Hooks.on('renderEnhancedJournal', FolderColours.DF_SCENE_DIRECTORY_RENDER);
		}
	}

	static DF_FOLDER_TEXT_COLOUR(app: FolderConfig, html: JQuery, data: { folder: FolderData, sortingModes: { a: string, m: string }, submitText: string }) {
		const textColour: string = <string>app.object.getFlag(SETTINGS.MOD_NAME, FolderColours.FLAG_COLOUR) ?? /**@deprecated*/<string>data.folder.flags?.textColour ?? "";
		html.find('button[type="submit"]').before(`<div class="form-group">
	<label>${'Text Color'}</label>
	<div class="form-fields">
		<input class="color" type="text" name="flags.${SETTINGS.MOD_NAME}.${FolderColours.FLAG_COLOUR}" value="${textColour}" data-dtype="String">
		<input type="color" value="${textColour.length == 0 ? '#f0f0e0' : textColour}" data-edit="flags.${SETTINGS.MOD_NAME}.${FolderColours.FLAG_COLOUR}">
	</div>
</div>`);
		app.setPosition({
			height: "auto"
		});
	}
	static DF_SCENE_DIRECTORY_RENDER(app: Application, html: JQuery<HTMLElement>, _data: any) {
		const colorize = (element: JQuery<HTMLElement>) => {
			const id = element[0].getAttribute('data-folder-id');
			if (id === null || id === undefined) return;
			const folder = game.folders.get(id);
			if (folder === null || folder === undefined) return;

			//! If we have old data, migrate it
			if (folder.flags?.textColour) {
				folder.flags[SETTINGS.MOD_NAME] = {};
				(<any>folder.flags[SETTINGS.MOD_NAME])[FolderColours.FLAG_COLOUR] = folder.flags.textColour;
				delete folder.flags.textColour;
				folder.update({flags: folder.flags});
			}

			element.find('header *').css('color', <string>folder.getFlag(SETTINGS.MOD_NAME, FolderColours.FLAG_COLOUR)
				?? /**@deprecated*/ <string>folder.flags?.textColour ?? "");
		};
		// If the app is Monk's Enhanced Journal, let it render first before we apply our colour
		if (app.constructor.name === 'EnhancedJournal')
			setTimeout(() => html.find('li[data-folder-id]').each((_: any, element: HTMLElement) => colorize($(element))), 10);
		else
			html.find('li[data-folder-id]').each((_: any, element: HTMLElement) => colorize($(element)));
	}
}