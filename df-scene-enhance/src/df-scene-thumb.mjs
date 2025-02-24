/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../types/ContextOption.d.ts" />
import DFSceneRatio from "./df-scene-ratio.mjs";
import SETTINGS from "../common/Settings.mjs";

/**
 * @typedef {object} Thumb
 * @property {string} src
 * @property {boolean} gen
 */

/** */
export default class DFSceneThumb {
	static MODULE = 'df-scene-enhance';
	static THUMBS = 'thumbs';
	static FLAG_THUMB = "thumb";

	static async _migrateThumbData() {
		const config = JSON.parse(SETTINGS.get(DFSceneThumb.THUMBS) || "{}");
		for (const id in config) {
			await game.scenes.get(id)?.setFlag(SETTINGS.MOD_NAME, DFSceneThumb.FLAG_THUMB, {
				src: config[id].url,
				gen: config[id].thumb
			});
		}
		await SETTINGS.set(DFSceneThumb.THUMBS, '{}');
	}

	static init() {
		SETTINGS.register(DFSceneThumb.THUMBS, {
			scope: "world",
			config: false,
			type: String
		});

		Hooks.on('renderSceneConfig',/** @param {SceneConfig} app @param {JQuery<HTMLElement>} html @param {SceneConfig.Data} data @returns {DFSceneRatio}*/async (app, html, data) => {
			const imgInput = html.find('file-picker[name="foreground"]')[0];
			if (!imgInput || !imgInput.parentElement || !imgInput.parentElement.parentElement) return;
			/**@type {Thumb}*/
			const thumbConfig = data.document.getFlag(SETTINGS.MOD_NAME, DFSceneThumb.FLAG_THUMB);
			const injection = $(await renderTemplate(`modules/${DFSceneThumb.MODULE}/templates/scene-thumb.hbs`));
			const target = imgInput.parentElement.parentElement;
			for (let c = 0; c < injection.length; c++) {
				if (injection[c].nodeType != 1) continue;
				target.after(injection[c]);
			}
			injection.find('file-picker[name="thumbnail"] input').val((thumbConfig && thumbConfig.src) || "");
			app.ratioScaler = new DFSceneRatio();
			await app.ratioScaler.render(app, html, data);
		});
		Hooks.on('closeSceneConfig', /** @param {SceneConfig} app @param {JQuery<HTMLElement>} html */ async (app, html) => {
			/**@type {Thumb}*/
			const dfSceneConfig = app.document.getFlag(SETTINGS.MOD_NAME, DFSceneThumb.FLAG_THUMB) ?? {};
			const newThumb = html.find('file-picker[name="thumbnail"] input').val();
			if (newThumb !== dfSceneConfig.src) {
				dfSceneConfig.src = newThumb;
				dfSceneConfig.gen = false;
				await app.document.setFlag(SETTINGS.MOD_NAME, DFSceneThumb.FLAG_THUMB, dfSceneConfig);
			}
			/**@type {Scene}*/
			const scene = app.object;
			if (!dfSceneConfig || !dfSceneConfig.src || dfSceneConfig.gen) return;
			// Update thumbnail and image dimensions
			try {
				dfSceneConfig.src = (dfSceneConfig && dfSceneConfig.src) ?? scene.data.img;
				const td = await ImageHelper.createThumbnail(dfSceneConfig.src, { width: 300, height: 100 });
				dfSceneConfig.gen = true;
				await app.document.setFlag(SETTINGS.MOD_NAME, DFSceneThumb.FLAG_THUMB, dfSceneConfig);
				await scene.update({ thumb: td.thumb }, {});
			} catch (err) {
				console.error("Thumbnail Override generation for Scene failed", err);
				ui.notifications.error("Thumbnail Override generation for Scene failed: " + err.message);
			}
		});
	}

	static ready() {
		DFSceneThumb._migrateThumbData();
	}

	/**
	 * @param {ContextOption[]} options
	 */
	static _getEntryContextOptions(options) {
		options.find(x => x.name === "SCENES.GenerateThumb").callback = async (/**@type {JQuery<HTMLLIElement>}*/li) => {
			const scene = game.scenes.get(li[0].dataset.documentId);
			/**@type {Thumb}*/
			const thumbConfig = scene.getFlag(SETTINGS.MOD_NAME, DFSceneThumb.FLAG_THUMB);
			// If we have a thumbnail override image
			if (thumbConfig && thumbConfig.src) {
				const td = await ImageHelper.createThumbnail(thumbConfig.src, { width: 300, height: 100 });
				thumbConfig.gen = true;
				scene.setFlag(SETTINGS.MOD_NAME, DFSceneThumb.FLAG_THUMB, thumbConfig);
				await scene.update({ thumb: td.thumb }, {});
			}
			else {
				scene.createThumbnail().then(data => {
					scene.update({ thumb: data.thumb }, { diff: false });
					ui.notifications.info(`Regenerated thumbnail image for ${scene.name} background image`);
				}).catch(err => ui.notifications.error(err.message));
			}
		};
	}
}