import { d20Roll, damageRoll } from "/systems/dnd5e/module/dice.js";
import { DND5E } from '/systems/dnd5e/module/config.js';
import Actor5e from '/systems/dnd5e/module/actor/entity.js';

/**
 * Extend the base Actor class to implement additional system-specific logic.
 */
export default class Actor5eExt extends Actor5e {

	/**
	 * Roll a Skill Check
	 * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
	 * @param {string} skillId      The skill id (e.g. "ins")
	 * @param {Object} options      Options which configure how the skill check is rolled
	 * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
	 */
	rollSkill(skillId, options = {}) {
		const skl = this.data.data.skills[skillId];
		const bonuses = getProperty(this.data.data, "bonuses.abilities") || {};

		// Compose roll parts and data
		const parts = ["@mod"];
		const data = { mod: skl.mod + skl.prof };

		// Ability test bonus
		if (bonuses.check) {
			data["checkBonus"] = bonuses.check;
			parts.push("@checkBonus");
		}

		// Skill check bonus
		if (bonuses.skill) {
			data["skillBonus"] = bonuses.skill;
			parts.push("@skillBonus");
		}

		// Add provided extra roll parts now because they will get clobbered by mergeObject below
		if (options.parts?.length > 0) {
			parts.push(...options.parts);
		}

		// Reliable Talent applies to any skill check we have full or better proficiency in
		const reliableTalent = (skl.value >= 1 && this.getFlag("dnd5e", "reliableTalent"));

		// Roll and return
		const rollData = mergeObject(options, {
			parts: parts,
			data: data,
			title: game.i18n.format("DND5E.SkillPromptTitle", { skill: CONFIG.DND5E.skills[skillId] }),
			halflingLucky: this.getFlag("dnd5e", "halflingLucky"),
			reliableTalent: reliableTalent,
			messageData: { "flags.dnd5e.roll": { type: "skill", skillId } }
		});
		rollData.data.flavor = rollData.title;
		rollData.speaker = options.speaker || ChatMessage.getSpeaker({ actor: this });
		return d20Roll(rollData);
	}

	/**
	 * Roll an Ability Test
	 * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
	 * @param {String} abilityId    The ability ID (e.g. "str")
	 * @param {Object} options      Options which configure how ability tests are rolled
	 * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
	 */
	rollAbilityTest(abilityId, options = {}) {
		const label = CONFIG.DND5E.abilities[abilityId];
		const abl = this.data.data.abilities[abilityId];

		// Construct parts
		const parts = ["@mod"];
		const data = { mod: abl.mod };

		// Add feat-related proficiency bonuses
		const feats = this.data.flags.dnd5e || {};
		if (feats.remarkableAthlete && DND5E.characterFlags.remarkableAthlete.abilities.includes(abilityId)) {
			parts.push("@proficiency");
			data.proficiency = Math.ceil(0.5 * this.data.data.attributes.prof);
		}
		else if (feats.jackOfAllTrades) {
			parts.push("@proficiency");
			data.proficiency = Math.floor(0.5 * this.data.data.attributes.prof);
		}

		// Add global actor bonus
		const bonuses = getProperty(this.data.data, "bonuses.abilities") || {};
		if (bonuses.check) {
			parts.push("@checkBonus");
			data.checkBonus = bonuses.check;
		}

		// Add provided extra roll parts now because they will get clobbered by mergeObject below
		if (options.parts?.length > 0) {
			parts.push(...options.parts);
		}

		// Roll and return
		const rollData = mergeObject(options, {
			parts: parts,
			data: data,
			title: game.i18n.format("DND5E.AbilityPromptTitle", { ability: label }),
			halflingLucky: feats.halflingLucky,
			messageData: { "flags.dnd5e.roll": { type: "ability", abilityId } }
		});
		rollData.data.flavor = rollData.title;
		rollData.speaker = options.speaker || ChatMessage.getSpeaker({ actor: this });
		return d20Roll(rollData);
	}

	/* -------------------------------------------- */

	/**
	 * Roll an Ability Saving Throw
	 * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
	 * @param {String} abilityId    The ability ID (e.g. "str")
	 * @param {Object} options      Options which configure how ability tests are rolled
	 * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
	 */
	rollAbilitySave(abilityId, options = {}) {
		const label = CONFIG.DND5E.abilities[abilityId];
		const abl = this.data.data.abilities[abilityId];

		// Construct parts
		const parts = ["@mod"];
		const data = { mod: abl.mod };

		// Include proficiency bonus
		if (abl.prof > 0) {
			parts.push("@prof");
			data.prof = abl.prof;
		}

		// Include a global actor ability save bonus
		const bonuses = getProperty(this.data.data, "bonuses.abilities") || {};
		if (bonuses.save) {
			parts.push("@saveBonus");
			data.saveBonus = bonuses.save;
		}

		// Add provided extra roll parts now because they will get clobbered by mergeObject below
		if (options.parts?.length > 0) {
			parts.push(...options.parts);
		}

		// Roll and return
		const rollData = mergeObject(options, {
			parts: parts,
			data: data,
			title: game.i18n.format("DND5E.SavePromptTitle", { ability: label }),
			halflingLucky: this.getFlag("dnd5e", "halflingLucky"),
			messageData: { "flags.dnd5e.roll": { type: "save", abilityId } }
		});
		rollData.data.flavor = rollData.title;
		rollData.speaker = options.speaker || ChatMessage.getSpeaker({ actor: this });
		return d20Roll(rollData);
	}

	/* -------------------------------------------- */

	/**
	 * Perform a death saving throw, rolling a d20 plus any global save bonuses
	 * @param {Object} options        Additional options which modify the roll
	 * @return {Promise<Roll|null>}   A Promise which resolves to the Roll instance
	 */
	async rollDeathSave(options = {}) {

		// Display a warning if we are not at zero HP or if we already have reached 3
		const death = this.data.data.attributes.death;
		if ((this.data.data.attributes.hp.value > 0) || (death.failure >= 3) || (death.success >= 3)) {
			ui.notifications.warn(game.i18n.localize("DND5E.DeathSaveUnnecessary"));
			return null;
		}

		// Evaluate a global saving throw bonus
		const parts = [];
		const data = {};
		const speaker = options.speaker || ChatMessage.getSpeaker({ actor: this });

		// Diamond Soul adds proficiency
		if (this.getFlag("dnd5e", "diamondSoul")) {
			parts.push("@prof");
			data.prof = this.data.data.attributes.prof;
		}

		// Include a global actor ability save bonus
		const bonuses = getProperty(this.data.data, "bonuses.abilities") || {};
		if (bonuses.save) {
			parts.push("@saveBonus");
			data.saveBonus = bonuses.save;
		}

		// Evaluate the roll
		const rollData = mergeObject(options, {
			parts: parts,
			data: data,
			title: game.i18n.localize("DND5E.DeathSavingThrow"),
			speaker: speaker,
			halflingLucky: this.getFlag("dnd5e", "halflingLucky"),
			targetValue: 10,
			messageData: { "flags.dnd5e.roll": { type: "death" } }
		});
		rollData.data.flavor = rollData.title;
		rollData.speaker = speaker;
		const roll = await d20Roll(rollData);
		if (!roll) return null;

		// Take action depending on the result
		const success = roll.total >= 10;
		const d20 = roll.dice[0].total;

		// Save success
		if (success) {
			let successes = (death.success || 0) + 1;

			// Critical Success = revive with 1hp
			if (d20 === 20) {
				await this.update({
					"data.attributes.death.success": 0,
					"data.attributes.death.failure": 0,
					"data.attributes.hp.value": 1
				});
				await ChatMessage.create({ content: game.i18n.format("DND5E.DeathSaveCriticalSuccess", { name: this.name }), speaker });
			}

			// 3 Successes = survive and reset checks
			else if (successes === 3) {
				await this.update({
					"data.attributes.death.success": 0,
					"data.attributes.death.failure": 0
				});
				await ChatMessage.create({ content: game.i18n.format("DND5E.DeathSaveSuccess", { name: this.name }), speaker });
			}

			// Increment successes
			else await this.update({ "data.attributes.death.success": Math.clamped(successes, 0, 3) });
		}

		// Save failure
		else {
			let failures = (death.failure || 0) + (d20 === 1 ? 2 : 1);
			await this.update({ "data.attributes.death.failure": Math.clamped(failures, 0, 3) });
			if (failures >= 3) {  // 3 Failures = death
				await ChatMessage.create({ content: game.i18n.format("DND5E.DeathSaveFailure", { name: this.name }), speaker });
			}
		}

		// Return the rolled result
		return roll;
	}

	/* -------------------------------------------- */

	/**
	 * Roll a hit die of the appropriate type, gaining hit points equal to the die roll plus your CON modifier
	 * @param {string} [denomination]   The hit denomination of hit die to roll. Example "d8".
	 *                                  If no denomination is provided, the first available HD will be used
	 * @param {boolean} [dialog]        Show a dialog prompt for configuring the hit die roll?
	 * @return {Promise<Roll|null>}     The created Roll instance, or null if no hit die was rolled
	 */
	async rollHitDie(denomination, { dialog = true } = {}) {

		// If no denomination was provided, choose the first available
		let cls = null;
		if (!denomination) {
			cls = this.itemTypes.class.find(c => c.data.data.hitDiceUsed < c.data.data.levels);
			if (!cls) return null;
			denomination = cls.data.data.hitDice;
		}

		// Otherwise locate a class (if any) which has an available hit die of the requested denomination
		else {
			cls = this.items.find(i => {
				const d = i.data.data;
				return (d.hitDice === denomination) && ((d.hitDiceUsed || 0) < (d.levels || 1));
			});
		}

		// If no class is available, display an error notification
		if (!cls) {
			ui.notifications.error(game.i18n.format("DND5E.HitDiceWarn", { name: this.name, formula: denomination }));
			return null;
		}

		// Prepare roll data
		const parts = [`1${denomination}`, "@abilities.con.mod"];
		const title = game.i18n.localize("DND5E.HitDiceRoll");
		const rollData = duplicate(this.data.data);

		// Call the roll helper utility
		const roll = await damageRoll({
			event: new Event("hitDie"),
			parts: parts,
			data: rollData,
			title: title,
			speaker: ChatMessage.getSpeaker({ actor: this }),
			allowcritical: false,
			fastForward: !dialog,
			dialogOptions: { width: 350 },
			messageData: { "flags.dnd5e.roll": { type: "hitDie" } }
		});
		roll.data.flavor = roll.title;
		if (!roll) return null;

		// Adjust actor data
		await cls.update({ "data.hitDiceUsed": cls.data.data.hitDiceUsed + 1 });
		const hp = this.data.data.attributes.hp;
		const dhp = Math.min(hp.max + (hp.tempmax ?? 0) - hp.value, roll.total);
		await this.update({ "data.attributes.hp.value": hp.value + dhp });
		return roll;
	}
}