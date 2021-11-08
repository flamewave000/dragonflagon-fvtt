import SETTINGS from "../../common/SETTINGS";

interface DND5E {
	encumbrance: {
		currencyPerWeight: number;
		vehicleWeightMultiplier: number;
	}
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

export default class DnD5eVehicleCapacity {
	static init() {
		// If we have D&D5e running
		if (!!game.dnd5e) {
			SETTINGS.register('vehicle-unit', {
				scope: 'world',
				config: true,
				name: 'DF_QOL.VehicleUnit.SettingName',
				hint: 'DF_QOL.VehicleUnit.SettingHint',
				type: Boolean,
				default: true,
				onChange: DnD5eVehicleCapacity.DF_VEHICLE_UNITS
			});
			Hooks.on('renderEntitySheetConfig', DnD5eVehicleCapacity.DF_VEHICLE_UNIT_CONFIG);
		}
	}

	static ready() {
		// If we have D&D5e running
		if (!!game.dnd5e)
			DnD5eVehicleCapacity.DF_VEHICLE_UNITS();
	}

	static DF_VEHICLE_UNITS() {
		const clazz = (<any>CONFIG.Actor.sheetClasses).vehicle['dnd5e.ActorSheet5eVehicle'].cls;
		if (!SETTINGS.get('vehicle-unit')) {
			if (!clazz.prototype.dfqol_computeEncumbrance) return;
			clazz.prototype._computeEncumbrance = clazz.prototype.dfqol_computeEncumbrance;
			delete clazz.prototype.dfqol_computeEncumbrance;
			Hooks.off('renderActorSheet5eVehicle', DnD5eVehicleCapacity.renderActorSheet5eVehicle);
			return;
		}
		if (!!clazz.prototype.dfqol_computeEncumbrance) return;
		clazz.prototype.dfqol_computeEncumbrance = clazz.prototype._computeEncumbrance
		clazz.prototype._computeEncumbrance = DnD5eVehicleCapacity.VehicleComputeEncumbrance;
		Hooks.on('renderActorSheet5eVehicle', DnD5eVehicleCapacity.renderActorSheet5eVehicle);
	}
	static VehicleComputeEncumbrance(this: ActorSheet, totalWeight: number, actorData: Actor.Data) {
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
	static renderActorSheet5eVehicle(app: ActorSheet, html: JQuery<HTMLElement>, data: any) {
		var unit: any = app.object.getFlag(SETTINGS.MOD_NAME, 'unit') || (<DND5E>CONFIG.DND5E).encumbrance.vehicleWeightMultiplier;
		switch (unit) {
			case 2240: unit = ['L.Ton', 'DF_QOL.VehicleUnit.Units_LongTon']; break;
			case 2000: unit = ['S.Ton', 'DF_QOL.VehicleUnit.Units_ShortTon']; break;
			case 1: unit = ['lb.', 'DF_QOL.VehicleUnit.Units_Pounds']; break;
		}
		html.find('input[name="data.attributes.capacity.cargo"]')
			.after(`<label style="margin-left:0.5em" title="${game.i18n.localize(unit[1])}">${unit[0]}</label>`);
	}
	static DF_VEHICLE_UNIT_CONFIG(app: EntitySheetConfig, html: JQuery<HTMLElement>, data: EntityConfigData<Actor.Data>) {
		if (data.object.type !== "vehicle") return;
		const submitButton = html.find('section > form > button');
		var current = !!data.object.flags && !!(<any>data.object.flags[SETTINGS.MOD_NAME]) ? (<any>data.object.flags[SETTINGS.MOD_NAME]).unit : null;
		if (!current) current = (<DND5E>CONFIG.DND5E).encumbrance.vehicleWeightMultiplier;

		const unitSelector = $(`<div class="form-group">
	<label>${game.i18n.localize('DF_QOL.VehicleUnit.ConfigName')}</label>
	<select name="units">
		<option value="lt"${current === 2240 ? ' selected' : ''}>${game.i18n.localize('DF_QOL.VehicleUnit.Units_LongTon')}</option>
		<option value="st"${current === 2000 ? ' selected' : ''}>${game.i18n.localize('DF_QOL.VehicleUnit.Units_ShortTon')}</option>
		<option value="lb"${current === 1 ? ' selected' : ''}>${game.i18n.localize('DF_QOL.VehicleUnit.Units_Pounds')}</option>
	</select>
	<p class="notes">${game.i18n.localize('DF_QOL.VehicleUnit.ConfigHint')}</p>
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
				title: game.i18n.localize('DF_QOL.VehicleUnit.ConvertTitle'),
				content: game.i18n.localize('DF_QOL.VehicleUnit.ConvertContent')
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

}