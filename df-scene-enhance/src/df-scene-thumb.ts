import DFSceneRatio from "./df-scene-ratio";
import SETTINGS from "../../common/Settings";

export default class DFSceneThumb {
	static MODULE = 'df-scene-enhance';
	static THUMBS = 'thumbs';
	static purge() {
		if (!game.user.isGM) return;
		const ids: string[] = [];
		for (const scene of game.scenes.values() as any as Scene[]) {
			ids.push(scene.id);
		}
		const config = JSON.parse(SETTINGS.get(DFSceneThumb.THUMBS));
		for (const id in config) {
			if (!ids.includes(id))
				delete config[id];
		}
		SETTINGS.set(DFSceneThumb.THUMBS, JSON.stringify(config));
	}
	static updateThumb(sceneId: string, value?: string, generated: boolean = false) {
		const config = JSON.parse(SETTINGS.get(DFSceneThumb.THUMBS));
		if (!value) delete config[sceneId];
		else config[sceneId] = { url: value, thumb: generated };
		SETTINGS.set(DFSceneThumb.THUMBS, JSON.stringify(config));
	}
	static getThumb(sceneId: string) {
		return JSON.parse(SETTINGS.get(DFSceneThumb.THUMBS))[sceneId] ?? null;
	}

	static init() {
		SETTINGS.register(DFSceneThumb.THUMBS, {
			scope: "world",
			config: false,
			type: String,
			default: "{}"
		});
		Hooks.on('renderSceneConfig', async (app: SceneConfig, html: JQuery<HTMLElement>, data: SceneConfig.Data) => {
			const imgInput = html.find('input[name ="img"]')[0];
			if (!imgInput || !imgInput.parentElement || !imgInput.parentElement.parentElement) return;
			const sceneId = data.document.id;
			const thumbConfig = DFSceneThumb.getThumb(sceneId);
			const injection = $(await renderTemplate(`modules/${DFSceneThumb.MODULE}/templates/scene-thumb.hbs`, { thumbPath: (thumbConfig && thumbConfig.url) || "" }));
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
			html.find('#df-thumb-img').on('change', () => DFSceneThumb.updateThumb(sceneId, html.find('#df-thumb-img').val() as string));
			// @ts-ignore
			app.ratioScaler = new DFSceneRatio();
			// @ts-ignore
			await (<DFSceneRatio>app.ratioScaler).render(app, html, data);
		});
		Hooks.on('closeSceneConfig', async (app: SceneConfig, _: JQuery<HTMLElement>) => {
			const dfSceneConfig = DFSceneThumb.getThumb(app.document.id);
			const scene: Scene = app.entity;
			if (!dfSceneConfig || !dfSceneConfig.url) return;
			// Update thumbnail and image dimensions
			try {
				const img = (dfSceneConfig && dfSceneConfig.url) ?? scene.data.img;
				const td = await ImageHelper.createThumbnail(img, { width: 300, height: 100 });
				dfSceneConfig.thumb = true;
				DFSceneThumb.updateThumb(scene.id, img, true);
				await scene.update({ thumb: td.thumb } as any, {});
			} catch (err: any) {
				ui.notifications.error("Thumbnail Override generation for Scene failed: " + err.message);
			}
		});
	}

	static ready() {
		DFSceneThumb.purge();
	}
}