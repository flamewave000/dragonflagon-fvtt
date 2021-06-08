import SETTINGS from './Settings.js';
SETTINGS.init('df-qol');

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
	SETTINGS.register('quick-roll', {
		name: 'DRAGON_FLAGON_QOL.QuickRollTitle',
		hint: 'DRAGON_FLAGON_QOL.QuickRollHint',
		scope: 'world',
		type: Boolean,
		default: true,
		config: true,
		onChange: async () => await requestReload()
	});
	apply(SETTINGS.get('quick-roll'), 'getRollTableDirectoryEntryContext', DF_QUICK_ROLL);

	SETTINGS.register('auto-focus', {
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
	apply(SETTINGS.get('auto-focus'), 'renderDialog', DF_AUTO_FOCUS);
	apply(SETTINGS.get('auto-focus'), 'renderFolderConfig', DF_AUTO_FOCUS);

	SETTINGS.register('folder-colour', {
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
	apply(SETTINGS.get('folder-colour'), 'renderFolderConfig', DF_FOLDER_TEXT_COLOUR);
	apply(SETTINGS.get('folder-colour'), 'renderSceneDirectory', DF_SCENE_DIRECTORY_RENDER);
	apply(SETTINGS.get('folder-colour'), 'renderActorDirectory', DF_SCENE_DIRECTORY_RENDER);
	apply(SETTINGS.get('folder-colour'), 'renderItemDirectory', DF_SCENE_DIRECTORY_RENDER);
	apply(SETTINGS.get('folder-colour'), 'renderJournalDirectory', DF_SCENE_DIRECTORY_RENDER);
	apply(SETTINGS.get('folder-colour'), 'renderRollTableDirectory', DF_SCENE_DIRECTORY_RENDER);

	SETTINGS.register('better-toggle', {
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
	game.settings.settings.get(`${SETTINGS.MOD_NAME}.better-toggle`).onChange(SETTINGS.get('better-toggle'));

	// If we have D&D5e running
	if (!!game.dnd5e) {
		SETTINGS.register('vehicle-unit', {
			scope: 'world',
			config: true,
			name: 'DRAGON_FLAGON_QOL.VehicleUnit_SettingName',
			hint: 'DRAGON_FLAGON_QOL.VehicleUnit_SettingHint',
			type: Boolean,
			default: true,
			onChange: DF_VEHICLE_UNITS
		});
		Hooks.on('renderEntitySheetConfig', DF_VEHICLE_UNIT_CONFIG);
	}
});

Hooks.once('ready', () => {
	// If we have D&D5e running
	if (!!game.dnd5e)
		DF_VEHICLE_UNITS();
})

function DF_QUICK_ROLL(_html: any, entryOptions: any) {
	entryOptions.unshift({
		name: "DRAGON_FLAGON_QOL.QuickRollMenuItem",
		icon: '<i class="fas fa-dice-d20"></i>',
		condition: () => true,
		callback: async (header: any) => {
			const table = game.tables.get(header.data('entityId'));
			if (table.data.description === undefined)
				table.data.description = '';
			await table.draw();
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
	html.find('li[data-folder-id]').each((idx: number, element: HTMLElement) => {
		const id = element.getAttribute('data-folder-id');
		if (id === null || id === undefined) return;
		const folder = game.folders.get(id);
		if (folder === null || folder === undefined) return;
		$(element).find('header *').css('color', (<any>folder.data.flags).textColour);
	});
}

interface DND5E {
	encumbrance: {
		currencyPerWeight: number;
		vehicleWeightMultiplier: number;
	}
}
function DF_VEHICLE_UNITS() {
	const clazz = (<any>CONFIG.Actor.sheetClasses).vehicle['dnd5e.ActorSheet5eVehicle'].cls;
	if (!SETTINGS.get('vehicle-unit')) {
		if (!clazz.prototype.dfqol_computeEncumbrance) return;
		clazz.prototype._computeEncumbrance = clazz.prototype.dfqol_computeEncumbrance;
		delete clazz.prototype.dfqol_computeEncumbrance;
		Hooks.off('renderActorSheet5eVehicle', renderActorSheet5eVehicle);
		return;
	}
	if (!!clazz.prototype.dfqol_computeEncumbrance) return;
	clazz.prototype.dfqol_computeEncumbrance = clazz.prototype._computeEncumbrance
	clazz.prototype._computeEncumbrance = VehicleComputeEncumbrance;
	Hooks.on('renderActorSheet5eVehicle', renderActorSheet5eVehicle);
}
function VehicleComputeEncumbrance(this: ActorSheet, totalWeight: number, actorData: Actor.Data) {
	const DND5E = <DND5E>CONFIG.DND5E;
	// Compute currency weight
	const totalCoins = Object.values((<Record<string, number>>actorData.data.currency)).reduce((acc, denom) => acc + denom, 0);
	totalWeight += totalCoins / DND5E.encumbrance.currencyPerWeight;

	// Vehicle weights are an order of magnitude greater.
	totalWeight /= <number>this.object.getFlag(SETTINGS.MOD_NAME, 'unit') || DND5E.encumbrance.vehicleWeightMultiplier;

	// Compute overall encumbrance
	const max = actorData.data.attributes.capacity.cargo;
	const pct = Math.clamped((totalWeight * 100) / max, 0, 100);
	return { value: totalWeight.toNearest(0.01), max, pct };
}
function renderActorSheet5eVehicle(app: ActorSheet, html: JQuery<HTMLElement>, data: any) {
	var unit: any = app.object.getFlag(SETTINGS.MOD_NAME, 'unit') || (<DND5E>CONFIG.DND5E).encumbrance.vehicleWeightMultiplier;
	switch (unit) {
		case 2240: unit = ['L.Ton', 'DRAGON_FLAGON_QOL.VehicleUnit_Units_LongTon']; break;
		case 2000: unit = ['S.Ton', 'DRAGON_FLAGON_QOL.VehicleUnit_Units_ShortTon']; break;
		case 1: unit = ['lb.', 'DRAGON_FLAGON_QOL.VehicleUnit_Units_Pounds']; break;
	}
	html.find('input[name="data.attributes.capacity.cargo"]')
		.after(`<label style="margin-left:0.5em" title="${game.i18n.localize(unit[1])}">${unit[0]}</label>`);
}
interface EntityConfigData<T> {
	blankLabel: string
	defaultClass: string
	entityName: string
	isGM: true
	object: T
	options: object
	sheetClass: string
	sheetClasses: object
}
function DF_VEHICLE_UNIT_CONFIG(app: EntitySheetConfig, html: JQuery<HTMLElement>, data: EntityConfigData<Actor.Data>) {
	if (data.object.type !== "vehicle") return;
	const submitButton = html.find('section > form > button');
	var current = !!data.object.flags && !!(<any>data.object.flags[SETTINGS.MOD_NAME]) ? (<any>data.object.flags[SETTINGS.MOD_NAME]).unit : null;
	if (!current) current = (<DND5E>CONFIG.DND5E).encumbrance.vehicleWeightMultiplier;

	const unitSelector = $(`<div class="form-group">
	<label>${game.i18n.localize('DRAGON_FLAGON_QOL.VehicleUnit_ConfigName')}</label>
	<select name="units">
		<option value="lt"${current === 2240 ? ' selected' : ''}>${game.i18n.localize('DRAGON_FLAGON_QOL.VehicleUnit_Units_LongTon')}</option>
		<option value="st"${current === 2000 ? ' selected' : ''}>${game.i18n.localize('DRAGON_FLAGON_QOL.VehicleUnit_Units_ShortTon')}</option>
		<option value="lb"${current === 1 ? ' selected' : ''}>${game.i18n.localize('DRAGON_FLAGON_QOL.VehicleUnit_Units_Pounds')}</option>
	</select>
	<p class="notes">${game.i18n.localize('DRAGON_FLAGON_QOL.VehicleUnit_ConfigHint')}</p>
</div>`);
	submitButton.before(unitSelector);
	const newHeight = unitSelector.outerHeight(true);
	app.setPosition(mergeObject(app.position, <any>{ height: <number>app.position.height + newHeight }));
	const core = app._updateObject.bind(app);
	app._updateObject = async function (event?: Event, formData?: any) {
		const current = <number>(<Actor>this.object).getFlag(SETTINGS.MOD_NAME, 'unit') || (<DND5E>CONFIG.DND5E).encumbrance.vehicleWeightMultiplier;
		var unit = 0;
		var newLabel = '';
		switch (formData.units) {
			case 'lt': unit = 2240; newLabel = 'L.Ton'; break;
			case 'st': unit = 2000; newLabel = 'S.Ton'; break;
			case 'lb': unit = 1; newLabel = 'lbs'; break;
		}
		var oldLabel = '';
		switch (current) {
			case 2240: oldLabel = 'L.Ton'; break;
			case 2000: oldLabel = 'S.Ton'; break;
			case 1: oldLabel = 'lbs'; break;
		}
		// Ignore if the unit has not been changed
		if (current === unit) {
			return core(event, formData);
		}
		// Ask if they would like us to convert the current value to the new unit of measure.
		const confirm = await Dialog.confirm({
			title: game.i18n.localize('DRAGON_FLAGON_QOL.VehicleUnit_ConvertTitle'),
			content: game.i18n.localize('DRAGON_FLAGON_QOL.VehicleUnit_ConvertContent')
				.replace('{{OLD}}', oldLabel).replace('{{NEW}}', newLabel),
			defaultYes: true
		});
		// Convert the data
		if (confirm) {
			const pounds = Math.round((<Actor>this.object).data.data.attributes.capacity.cargo * current);
			await (<Actor>this.object).update({ 'data.attributes.capacity.cargo': (pounds / unit).toNearest(0.01) });
		}
		await (<Actor>this.object).setFlag(SETTINGS.MOD_NAME, 'unit', unit);
		return core(event, formData);
	}
}