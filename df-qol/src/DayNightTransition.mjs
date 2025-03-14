/// <reference path="../../fvtt-scripts/foundry.js" />
import SETTINGS from "../common/Settings.mjs";

export default class DayNightTransition {
	static init() {
		SETTINGS.register('day-night-progress', {
			scope: 'world',
			config: true,
			type: Boolean,
			default: true,
			name: 'DF_QOL.DayNight.ProgressSettingName',
			hint: 'DF_QOL.DayNight.ProgressSettingHint',
			onChange: toggled => {
				if (toggled)
					libWrapper.register(SETTINGS.MOD_NAME, 'EffectsCanvasGroup.prototype.animateDarkness', this.#animateDarkness, 'OVERRIDE');
				else
					libWrapper.unregister(SETTINGS.MOD_NAME, 'EffectsCanvasGroup.prototype.animateDarkness');
			}
		});
		if (SETTINGS.get('day-night-progress')) {
			libWrapper.register(SETTINGS.MOD_NAME, 'EffectsCanvasGroup.prototype.animateDarkness', this.#animateDarkness, 'OVERRIDE');
		}
		SETTINGS.register('day-night-duration', {
			scope: 'world',
			config: true,
			type: Number,
			default: 10,
			range: { min: 1, max: 60, step: 1 },
			name: 'DF_QOL.DayNight.DurationSettingName',
			hint: 'DF_QOL.DayNight.DurationSettingHint'
		});
	}

/*

Display a time wheel that shows the current day-night cycle. The wheel can look
like a sun and moon on a horizon. When they click from one to another it can
rotate the sun and moon until one or the other is at the zenith. At which point
the image will fade away.

We can then set the dawn/day/dusk/night 

 */

	static async #animateDarkness(target = 1.0, { duration = 10000 } = {}) {
		const animationName = "lighting.animateDarkness";
		/********************************************************************************************/
		/** COPYRIGHT START FoundryVTT : foundry.js > EffectsCanvasGroup.prototype.animateDarkness **/
		/********************************************************************************************/
		CanvasAnimation.terminateAnimation(animationName);
		if (target === canvas.darknessLevel) return false;
		if (duration <= 0) return canvas.colorManager.initialize({ darknessLevel: target });

		// Update with an animation
		const animationData = [{
			parent: { darkness: canvas.darknessLevel },
			attribute: "darkness",
			to: Math.clamp(target, 0, 1)
		}];

		/***************************/
		/** DF QOL ADDITION START **/
		/***************************/
		if (duration === 10000)
			duration = SETTINGS.get('day-night-duration') * 1000;
		// Trigger the animation function
		let elapsed = 0.0;
		let last = new Date().getTime();
		/*************************/
		/** DF QOL ADDITION END **/
		/*************************/

		// Trigger the animation function
		
		return CanvasAnimation.animate(animationData, {
			name: animationName,
			duration: duration,
			ontick: (dt, animation) => {
				canvas.environment.initialize({environment: {darknessLevel: animation.attributes[0].parent.darkness}});
				/***************************/
				/** DF QOL ADDITION START **/
				/***************************/
				// do not display the transition progress to the PCs, only to GMs
				if (!game.user.isGM) return;
				// show progress here
				const now = new Date().getTime();
				elapsed += now - last;
				last = now;
				// const loader = document.getElementById("loading");
				const pct = Math.ceil((elapsed / duration) * 100);
				SceneNavigation.displayProgressBar({label:'Day/Night Transitioning...', pct});
				/*************************/
				/** DF QOL ADDITION END **/
				/*************************/
			}
		}).then(completed => {
			if ( !completed ) canvas.environment.initialize({environment: {darknessLevel: target}});
		});
		/******************************************************************************************/
		/** COPYRIGHT END FoundryVTT : foundry.js > EffectsCanvasGroup.prototype.animateDarkness **/
		/******************************************************************************************/
	}
}