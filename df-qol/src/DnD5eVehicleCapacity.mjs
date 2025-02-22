/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../fvtt-scripts/foundry-esm.js" />
/// <reference path="../../common/foundry.d.ts" />
/// <reference path="../../common/libWrapper.d.ts" />

import SETTINGS from "../common/Settings.mjs";

/**
 * @typedef {object} WeightCategory
 * @property {number} factor
 * @property {string} shortLabel
 * @property {string} longLabel
 */

/** @type { { [key: string]: WeightCategory } } */
const WEIGHTS = {
	lt: { factor: 2240, shortLabel: 'L.Ton', longLabel: 'DF_QOL.VehicleUnit.Units_LongTon' },
	st: { factor: 2000, shortLabel: 'S.Ton', longLabel: 'DF_QOL.VehicleUnit.Units_ShortTon' },
	lb: { factor: 1, shortLabel: 'lb.', longLabel: 'DF_QOL.VehicleUnit.Units_Pounds' }
}
const DEFAULT_UNIT = 'st';

export default class DnD5eVehicleCapacity {
	static init() {
		// If we have D&D5e running
		if (game.dnd5e) {
			SETTINGS.register('vehicle-unit', {
				scope: 'world',
				config: true,
				name: 'DF_QOL.VehicleUnit.SettingName',
				hint: 'DF_QOL.VehicleUnit.SettingHint',
				type: Boolean,
				default: true,
				onChange: DnD5eVehicleCapacity.DF_VEHICLE_UNITS
			});
			Hooks.on('renderDocumentSheetConfig', DnD5eVehicleCapacity.DF_VEHICLE_UNIT_CONFIG);
		}
	}

	static ready() {
		// If we have D&D5e running
		if (game.dnd5e)
			DnD5eVehicleCapacity.DF_VEHICLE_UNITS();
	}

	static DF_VEHICLE_UNITS() {
		if (SETTINGS.get('vehicle-unit')) {
			Hooks.on('renderActorSheet5eVehicle', DnD5eVehicleCapacity.renderActorSheet5eVehicle);
			CONFIG.DND5E.encumbrance.baseUnits.vehicle.imperial = 'lb';
		}
		else {
			Hooks.off('renderActorSheet5eVehicle', DnD5eVehicleCapacity.renderActorSheet5eVehicle);
			CONFIG.DND5E.encumbrance.baseUnits.vehicle.imperial = 'tn';
		}
	}

	/**
	 * @param {ActorSheet} app
	 * @param {JQuery<HTMLElement>} html
	 * @param { {encumbrance:{value:number,max:number,mod:number,pct:number}} } data
	 */
	static async renderActorSheet5eVehicle(app, html, data) {
		const unitSelection = app.object.getFlag(SETTINGS.MOD_NAME, 'unit');
		if (!unitSelection) {
			await app.object.setFlag(SETTINGS.MOD_NAME, 'unit', DEFAULT_UNIT);
			await app.object.update({'system.attributes.capacity.cargo': app.object.system.attributes.capacity.cargo * WEIGHTS[DEFAULT_UNIT].factor});
			return;
		}

		const unit = WEIGHTS[unitSelection || DEFAULT_UNIT];
		const originalField = html.find('input[name="system.attributes.capacity.cargo"]').hide();
		originalField.attr('step', '0.1')
		$(`<input type="number" value="${(app.object.system.attributes.capacity.cargo / unit.factor).toNearest(0.01)}" min="0" step="0.01">`)
			.on("change", el => {
				const unit = WEIGHTS[app.object.getFlag(SETTINGS.MOD_NAME, 'unit') || DEFAULT_UNIT];
				const input = $(el.target);
				const weight = parseFloat(input.val()).toNearest(0.01);
				const actual = (weight * unit.factor).toNearest(1);
				originalField.val(actual);
			})
			.insertAfter(originalField)
			.after(`<label class="df-qol-cargo-unit" title="${game.i18n.localize(unit.longLabel)}">${unit.shortLabel}</label>`);
		html.find('div.encumbrance label')
			.text(`${(data.encumbrance.value / unit.factor).toNearest(0.01)} / ${(data.encumbrance.max / unit.factor).toNearest(0.01)} ${unit.shortLabel}`);
	}

	/**
	 * 
	 * @param {EntitySheetConfig} app
	 * @param {JQuery<HTMLElement>} html
	 * @param {EntityConfigData<ActorData>} data
	 * @returns 
	 */
	static DF_VEHICLE_UNIT_CONFIG(app, html, data) {
		if (data.object.type !== "vehicle") return;
		const submitButton = html.find('section > form > button');
		let current = !!data.object.flags && !!data.object.flags[SETTINGS.MOD_NAME] ? data.object.flags[SETTINGS.MOD_NAME].unit : DEFAULT_UNIT;
		const unitSelector = $(`<div class="form-group">
	<label>${game.i18n.localize('DF_QOL.VehicleUnit.ConfigName')}</label>
	<select name="units">
		<option value="lt"${current === 'lt' ? ' selected' : ''}>${game.i18n.localize(WEIGHTS.lt.longLabel)}</option>
		<option value="st"${current === 'st' ? ' selected' : ''}>${game.i18n.localize(WEIGHTS.st.longLabel)}</option>
		<option value="lb"${current === 'lb' ? ' selected' : ''}>${game.i18n.localize(WEIGHTS.lb.longLabel)}</option>
	</select>
	<p class="notes">${game.i18n.localize('DF_QOL.VehicleUnit.ConfigHint')}</p>
</div>`);
		submitButton.before(unitSelector);
		const newHeight = unitSelector.outerHeight(true) + 8;
		app.setPosition(foundry.utils.mergeObject(app.position, { height: app.position.height + newHeight }));

		const core = app._updateObject.bind(app);
		app._updateObject = async function (/**@type {Event|undefined}*/event, /**@type {any|undefined}*/formData) {
			const current = this.object.getFlag(SETTINGS.MOD_NAME, 'unit') || DEFAULT_UNIT;
			// Only update if the unit has been changed
			if (current !== formData.units)
				await this.object.setFlag(SETTINGS.MOD_NAME, 'unit', formData.units);
			return core(event, formData);
		};
	}

}