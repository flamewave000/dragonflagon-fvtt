import SETTINGS from './libs/Settings.js';

function apply(shouldApply: Boolean, hookName: string, func: Hooks.General) {
	if (shouldApply) Hooks.on(hookName, func);
	else Hooks.off(hookName, func);
}

export default class FolderColours {
	static init() {
		SETTINGS.register('folder-colour', {
			name: 'DRAGON_FLAGON_QOL.FolderTextColour.Name',
			hint: 'DRAGON_FLAGON_QOL.FolderTextColour.Hint',
			scope: 'world',
			type: Boolean,
			default: true,
			config: true,
			onChange: newValue => {
				apply(newValue, 'renderFolderConfig', FolderColours.DF_FOLDER_TEXT_COLOUR);
				apply(newValue, 'renderSceneDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
				ui.sidebar.render(false);
			}
		});
		apply(SETTINGS.get('folder-colour'), 'renderFolderConfig', FolderColours.DF_FOLDER_TEXT_COLOUR);
		apply(SETTINGS.get('folder-colour'), 'renderSceneDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
		apply(SETTINGS.get('folder-colour'), 'renderActorDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
		apply(SETTINGS.get('folder-colour'), 'renderItemDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
		apply(SETTINGS.get('folder-colour'), 'renderJournalDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
		apply(SETTINGS.get('folder-colour'), 'renderRollTableDirectory', FolderColours.DF_SCENE_DIRECTORY_RENDER);
	}

	static DF_FOLDER_TEXT_COLOUR(app: FolderConfig, html: JQuery, data: { folder: Folder.Data, sortingModes: { a: string, m: string }, submitText: string }) {
		if (!data.folder.flags) {
			data.folder.flags = {};
		}
		const textColour: string = data.folder.flags.textColour as string ?? "";
		html.find('button[type="submit"]').before(`<div class="form-group">
	<label>${'Text Color'}</label>
	<div class="form-fields">
		<input type="text" name="flags.textColour" value="${textColour}" data-dtype="String">
		<input type="color" value="${textColour.length == 0 ? '#f0f0e0' : textColour}" data-edit="flags.textColour">
	</div>
</div>`);
		app.setPosition({
			height: "auto"
		});
	}
	static DF_SCENE_DIRECTORY_RENDER(app: SceneDirectory, html: JQuery<HTMLElement>, data: any) {
		html.find('li[data-folder-id]').each((idx: number, element: HTMLElement) => {
			const id = element.getAttribute('data-folder-id');
			if (id === null || id === undefined) return;
			const folder = game.folders.get(id);
			if (folder === null || folder === undefined) return;
			$(element).find('header *').css('color', (<any>folder.data.flags).textColour);
		});
	}
}