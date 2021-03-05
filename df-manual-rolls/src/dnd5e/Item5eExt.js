import Item5e from '/systems/dnd5e/module/item/entity.js';

/**
 * Override and extend the basic :class:`Item` implementation
 */
export default class Item5eExt extends Item5e {

	/* -------------------------------------------- */
	/*  Item Rolls - Attack, Damage, Saves, Checks  */
	/* -------------------------------------------- */

	/**
	 * Place an attack roll using an item (weapon, feat, spell, or equipment)
	 * Rely upon the d20Roll logic for the core implementation
	 *
	 * @param {object} options        Roll options which are configured and provided to the d20Roll function
	 * @return {Promise<Roll|null>}   A Promise which resolves to the created Roll instance
	 */
	async rollAttack(options = {}) {
		const itemData = this.data.data;
		const flags = this.actor.data.flags.dnd5e || {};
		if (!this.hasAttack) {
			throw new Error("You may not place an Attack Roll with this Item.");
		}
		let title = `${this.name} - ${game.i18n.localize("DND5E.AttackRoll")}`;

		// get the parts and rollData for this item's attack
		const { parts, rollData } = this.getAttackToHit();
		rollData.flavor = title;

		// Handle ammunition consumption
		delete this._ammo;
		let ammo = null;
		let ammoUpdate = null;
		const consume = itemData.consume;
		if (consume?.type === "ammo") {
			ammo = this.actor.items.get(consume.target);
			if (ammo?.data) {
				const q = ammo.data.data.quantity;
				const consumeAmount = consume.amount ?? 0;
				if (q && (q - consumeAmount >= 0)) {
					this._ammo = ammo;
					title += ` [${ammo.name}]`;
				}
			}

			// Get pending ammunition update
			const usage = this._getUsageUpdates({ consumeResource: true });
			if (usage === false) return null;
			ammoUpdate = usage.resourceUpdates || {};
		}

		// Compose roll options
		const rollConfig = mergeObject({
			parts: parts,
			actor: this.actor,
			data: rollData,
			title: title,
			flavor: title,
			speaker: ChatMessage.getSpeaker({ actor: this.actor }),
			dialogOptions: {
				width: 400,
				top: options.event ? options.event.clientY - 80 : null,
				left: window.innerWidth - 710
			},
			messageData: { "flags.dnd5e.roll": { type: "attack", itemId: this.id } }
		}, options);
		rollConfig.event = options.event;

		// Expanded critical hit thresholds
		if ((this.data.type === "weapon") && flags.weaponCriticalThreshold) {
			rollConfig.critical = parseInt(flags.weaponCriticalThreshold);
		} else if ((this.data.type === "spell") && flags.spellCriticalThreshold) {
			rollConfig.critical = parseInt(flags.spellCriticalThreshold);
		}

		// Elven Accuracy
		if (["weapon", "spell"].includes(this.data.type)) {
			if (flags.elvenAccuracy && ["dex", "int", "wis", "cha"].includes(this.abilityMod)) {
				rollConfig.elvenAccuracy = true;
			}
		}

		// Apply Halfling Lucky
		if (flags.halflingLucky) rollConfig.halflingLucky = true;

		// Invoke the d20 roll helper
		const roll = await game.dnd5e.dice.d20Roll(rollConfig);
		if (roll === false) return null;

		// Commit ammunition consumption on attack rolls resource consumption if the attack roll was made
		if (ammo && !isObjectEmpty(ammoUpdate)) await ammo.update(ammoUpdate);
		return roll;
	}

	/* -------------------------------------------- */

	/**
	 * Place a damage roll using an item (weapon, feat, spell, or equipment)
	 * Rely upon the damageRoll logic for the core implementation.
	 * @param {MouseEvent} [event]    An event which triggered this roll, if any
	 * @param {boolean} [critical]    Should damage be rolled as a critical hit?
	 * @param {number} [spellLevel]   If the item is a spell, override the level for damage scaling
	 * @param {boolean} [versatile]   If the item is a weapon, roll damage using the versatile formula
	 * @param {object} [options]      Additional options passed to the damageRoll function
	 * @return {Promise<Roll>}        A Promise which resolves to the created Roll instance
	 */
	rollDamage({ critical = false, event = null, spellLevel = null, versatile = false, options = {} } = {}) {
		if (!this.hasDamage) throw new Error("You may not make a Damage Roll with this Item.");
		const itemData = this.data.data;
		const actorData = this.actor.data.data;
		const messageData = { "flags.dnd5e.roll": { type: "damage", itemId: this.id } };

		// Get roll data
		const parts = itemData.damage.parts.map(d => d[0]);
		const rollData = this.getRollData();
		if (spellLevel) rollData.item.level = spellLevel;
		
		// Configure the damage roll
		const actionFlavor = game.i18n.localize(itemData.actionType === "heal" ? "DND5E.Healing" : "DND5E.DamageRoll");
		const title = `${this.name} - ${actionFlavor}`;
		rollData.flavor = title;
		const rollConfig = {
			actor: this.actor,
			critical: critical ?? event?.altKey ?? false,
			data: rollData,
			event: event,
			fastForward: event ? event.shiftKey || event.altKey || event.ctrlKey || event.metaKey : false,
			parts: parts,
			title: title,
			flavor: this.labels.damageTypes.length ? `${title} (${this.labels.damageTypes})` : title,
			speaker: ChatMessage.getSpeaker({ actor: this.actor }),
			dialogOptions: {
				width: 400,
				top: event ? event.clientY - 80 : null,
				left: window.innerWidth - 710
			},
			messageData: messageData
		};

		// Adjust damage from versatile usage
		if (versatile && itemData.damage.versatile) {
			parts[0] = itemData.damage.versatile;
			messageData["flags.dnd5e.roll"].versatile = true;
		}

		// Scale damage from up-casting spells
		if ((this.data.type === "spell")) {
			if ((itemData.scaling.mode === "cantrip")) {
				const level = this.actor.data.type === "character" ? actorData.details.level : actorData.details.spellLevel;
				this._scaleCantripDamage(parts, itemData.scaling.formula, level, rollData);
			}
			else if (spellLevel && (itemData.scaling.mode === "level") && itemData.scaling.formula) {
				const scaling = itemData.scaling.formula;
				this._scaleSpellDamage(parts, itemData.level, spellLevel, scaling, rollData);
			}
		}

		// Add damage bonus formula
		const actorBonus = getProperty(actorData, `bonuses.${itemData.actionType}`) || {};
		if (actorBonus.damage && (parseInt(actorBonus.damage) !== 0)) {
			parts.push(actorBonus.damage);
		}

		// Handle ammunition damage
		const ammoData = this._ammo?.data;

		// only add the ammunition damage if the ammution is a consumable with type 'ammo'
		if (this._ammo && (ammoData.type === "consumable") && (ammoData.data.consumableType === "ammo")) {
			parts.push("@ammo");
			rollData["ammo"] = ammoData.data.damage.parts.map(p => p[0]).join("+");
			rollConfig.flavor += ` [${this._ammo.name}]`;
			delete this._ammo;
		}

		// Scale melee critical hit damage
		if (itemData.actionType === "mwak") {
			rollConfig.criticalBonusDice = this.actor.getFlag("dnd5e", "meleeCriticalDamageDice") ?? 0;
		}

		// Call the roll helper utility
		return game.dnd5e.dice.damageRoll(mergeObject(rollConfig, options));
	}
	/**
	 * Roll a Tool Check. Rely upon the d20Roll logic for the core implementation
	 * @prarm {Object} options   Roll configuration options provided to the d20Roll function
	 * @return {Promise<Roll>}   A Promise which resolves to the created Roll instance
	 */
	rollToolCheck(options = {}) {
		if (this.type !== "tool") throw "Wrong item type!";

		// Prepare roll data
		let rollData = this.getRollData();
		const parts = [`@mod`, "@prof"];
		const title = `${this.name} - ${game.i18n.localize("DND5E.ToolCheck")}`;
		rollData.flavor = title;

		// Compose the roll data
		const rollConfig = mergeObject({
			parts: parts,
			data: rollData,
			template: "systems/dnd5e/templates/chat/tool-roll-dialog.html",
			title: title,
			speaker: ChatMessage.getSpeaker({ actor: this.actor }),
			flavor: title,
			dialogOptions: {
				width: 400,
				top: options.event ? options.event.clientY - 80 : null,
				left: window.innerWidth - 710,
			},
			halflingLucky: this.actor.getFlag("dnd5e", "halflingLucky") || false,
			reliableTalent: (this.data.data.proficient >= 1) && this.actor.getFlag("dnd5e", "reliableTalent"),
			messageData: { "flags.dnd5e.roll": { type: "tool", itemId: this.id } }
		}, options);
		rollConfig.event = options.event;

		// Call the roll helper utility
		return game.dnd5e.dice.d20Roll(rollConfig);
	}
}