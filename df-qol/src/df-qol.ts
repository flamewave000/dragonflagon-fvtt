
const MODULE_NAME = 'df-qol';

function apply(shouldApply: Boolean, hookName: string, func: Hooks.General) {
	if (shouldApply) Hooks.on(hookName, func);
	else Hooks.off(hookName, func);
}

async function requestReload() {
	if (await Dialog.confirm({
		title: game.i18n.localize("DRAGON_FLAGON_QOL.ReloadGameTitle"),
		content: game.i18n.localize("DRAGON_FLAGON_QOL.ReloadGameContent"),
		defaultYes: true
	} as any) as any as Boolean) {
		window.location.reload();
	}
}

Hooks.once('init', function () {
	game.settings.register(MODULE_NAME, 'quick-roll', {
		name: 'DRAGON_FLAGON_QOL.QuickRollTitle',
		hint: 'DRAGON_FLAGON_QOL.QuickRollHint',
		scope: 'world',
		type: Boolean,
		default: true,
		config: true,
		onChange: async () => await requestReload()
	});
	apply(game.settings.get(MODULE_NAME, 'quick-roll'), 'getRollTableDirectoryEntryContext', DF_QUICK_ROLL);

	game.settings.register(MODULE_NAME, 'auto-focus', {
		name: 'DRAGON_FLAGON_QOL.AutoFocusTitle',
		hint: 'DRAGON_FLAGON_QOL.AutoFocusHint',
		scope: 'world',
		type: Boolean,
		default: true,
		config: true,
		onChange: newValue => {
			apply(newValue, 'renderDialog', DF_AUTO_FOCUS);
			apply(newValue, 'renderFolderConfig', DF_AUTO_FOCUS);
		}
	});
	apply(game.settings.get(MODULE_NAME, 'auto-focus'), 'renderDialog', DF_AUTO_FOCUS);
	apply(game.settings.get(MODULE_NAME, 'auto-focus'), 'renderFolderConfig', DF_AUTO_FOCUS);

	game.settings.register(MODULE_NAME, 'folder-colour', {
		name: 'DRAGON_FLAGON_QOL.FolderTextColourName',
		hint: 'DRAGON_FLAGON_QOL.FolderTextColourHint',
		scope: 'world',
		type: Boolean,
		default: true,
		config: true,
		onChange: newValue => {
			apply(newValue, 'renderFolderConfig', DF_FOLDER_TEXT_COLOUR);
			apply(newValue, 'renderSceneDirectory', DF_SCENE_DIRECTORY_RENDER);
			ui.sidebar.render(false);
		}
	});
	apply(game.settings.get(MODULE_NAME, 'folder-colour'), 'renderFolderConfig', DF_FOLDER_TEXT_COLOUR);
	apply(game.settings.get(MODULE_NAME, 'folder-colour'), 'renderSceneDirectory', DF_SCENE_DIRECTORY_RENDER);

	game.settings.register(MODULE_NAME, 'better-toggle', {
		name: 'DRAGON_FLAGON_QOL.BetterToggleName',
		hint: 'DRAGON_FLAGON_QOL.BetterToggleHint',
		scope: 'world',
		type: Boolean,
		default: true,
		config: true,
		onChange: newValue => {
			const style = `<style id="dfqol-better-toggle">#controls .control-tool.toggle.active{background:rgba(60,0,120,0.8);color:#BBB;}#controls .control-tool.toggle.active:hover{color:#FFF;}</style>`;
			const styleElement = $('#dfqol-better-toggle');
			if (styleElement.length == 0 && newValue) {
				$('body').append(style);
			} else if (styleElement.length != 0 && !newValue) {
				styleElement.remove();
			}
		}
	});
	game.settings.settings.get(`${MODULE_NAME}.better-toggle`).onChange(game.settings.get(MODULE_NAME, 'better-toggle'));
});

function DF_QUICK_ROLL(_html: any, entryOptions: any) {
	entryOptions.unshift({
		name: "DRAGON_FLAGON_QOL.QuickRollMenuItem",
		icon: '<i class="fas fa-dice-d20"></i>',
		condition: () => true,
		callback: async (header: any) => {
			const table = game.tables.get(header.data('entityId'));
			const roll = table.roll();
			await table.draw({ roll: roll } as any);
		}
	});
}

function DF_AUTO_FOCUS(_app: any, html: JQuery, _data: any) {
	const inputs = html.find('input[type="text"]');
	if (inputs.length == 0) return
	inputs[0].focus();
}

function DF_FOLDER_TEXT_COLOUR(app: FolderConfig, html: JQuery, data: { folder: Folder.Data, sortingModes: { a: string, m: string }, submitText: string }) {
	console.log(data);
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
function DF_SCENE_DIRECTORY_RENDER(app: SceneDirectory, html: JQuery<HTMLElement>, data: any) {
	console.log(data);
	game.folders.forEach((value: Folder, key: string) => {
		const element = html.find(`li[data-folder-id="${key}"]`);
		if (element.length == 0)
			return;
		element.find('header > h3').css('color', (value.data.flags as any).textColour);
	});
}