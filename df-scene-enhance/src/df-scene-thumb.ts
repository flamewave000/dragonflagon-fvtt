import DFSceneRatio from "./df-scene-ratio";
import SETTINGS from "../../common/Settings";

interface Thumb {
	src: string;
	gen: boolean;
}

export default class DFSceneThumb {
	static MODULE = 'df-scene-enhance';
	static THUMBS = 'thumbs';
	static FLAG_THUMB = "thumb";

	static async _migrateThumbData() {
		const config = JSON.parse(SETTINGS.get(DFSceneThumb.THUMBS) || "{}");
		for (const id in config) {
			await game.scenes.get(id)?.setFlag(SETTINGS.MOD_NAME, DFSceneThumb.FLAG_THUMB, <Thumb>{
				src: config[id].url,
				gen: config[id].thumb
			});
		}
		await SETTINGS.set(DFSceneThumb.THUMBS, '{}');
	}

	static init() {
		/** @deprecated */
		SETTINGS.register(DFSceneThumb.THUMBS, {
			scope: "world",
			config: false,
			type: String
		});

		Hooks.on('renderSceneConfig', async (app: SceneConfig, html: JQuery<HTMLElement>, data: SceneConfig.Data) => {
			const imgInput = html.find('input[name="background.src"]')[0];
			if (!imgInput || !imgInput.parentElement || !imgInput.parentElement.parentElement) return;
			const thumbConfig = <Thumb>data.document.getFlag(SETTINGS.MOD_NAME, DFSceneThumb.FLAG_THUMB);
			const injection = $(await renderTemplate(`modules/${DFSceneThumb.MODULE}/templates/scene-thumb.hbs`, { thumbPath: (thumbConfig && thumbConfig.src) || "" }));
			const target = imgInput.parentElement.parentElement;
			for (let c = 0; c < injection.length; c++) {
				if (injection[c].nodeType != 1) continue;
				target.after(injection[c]);
			}
			html.find('#df-thumb-btn').on('click', () => {
				const fp = FilePicker.fromButton(html.find('#df-thumb-btn')[0] as HTMLButtonElement);
				app.filepickers.push(fp);
				fp.browse('');
			});
			html.find('#df-thumb-img').on('change', async () =>
				app.document.setFlag(SETTINGS.MOD_NAME, DFSceneThumb.FLAG_THUMB, <Thumb>{
					src: html.find('#df-thumb-img').val() as string,
					gen: false
				}));
			// @ts-ignore
			app.ratioScaler = new DFSceneRatio();
			// @ts-ignore
			await (<DFSceneRatio>app.ratioScaler).render(app, html, data);
		});
		Hooks.on('closeSceneConfig', async (app: SceneConfig, _: JQuery<HTMLElement>) => {
			const dfSceneConfig = <Thumb>app.document.getFlag(SETTINGS.MOD_NAME, DFSceneThumb.FLAG_THUMB);
			const scene: Scene = app.object;
			if (!dfSceneConfig || !dfSceneConfig.src || dfSceneConfig.gen) return;
			// Update thumbnail and image dimensions
			try {
				dfSceneConfig.src = (dfSceneConfig && dfSceneConfig.src) ?? scene.data.img;
				const td = await ImageHelper.createThumbnail(dfSceneConfig.src, { width: 300, height: 100 });
				dfSceneConfig.gen = true;
				app.document.setFlag(SETTINGS.MOD_NAME, DFSceneThumb.FLAG_THUMB, dfSceneConfig);
				await scene.update({ thumb: td.thumb } as any, {});
			} catch (err: any) {
				console.error("Thumbnail Override generation for Scene failed", err);
				ui.notifications.error("Thumbnail Override generation for Scene failed: " + err.message);
			}
		});
	}

	static ready() {
		DFSceneThumb._migrateThumbData();
	}

	static _getEntryContextOptions(options: ContextOption[]) {
		options.find(x => x.name === "SCENES.GenerateThumb").callback = async (li: JQuery<HTMLLIElement>) => {
			const scene = game.scenes.get(li[0].dataset.documentId);
			const thumbConfig = <Thumb>scene.getFlag(SETTINGS.MOD_NAME, DFSceneThumb.FLAG_THUMB);
			// If we have a thumbnail override image
			if (thumbConfig && thumbConfig.src) {
				const td = await ImageHelper.createThumbnail(thumbConfig.src, { width: 300, height: 100 });
				thumbConfig.gen = true;
				scene.setFlag(SETTINGS.MOD_NAME, DFSceneThumb.FLAG_THUMB, thumbConfig);
				await scene.update({ thumb: td.thumb } as any, {});
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