import DFSceneRatio from "./df-scene-ratio.js";

declare class SceneExt extends Scene {
	dfThumb_update(data: Scene.Data, options: any): Promise<Scene>;
	get width(): number
	get height(): number
}

class DFSceneThumb {
	static MODULE = 'df-scene-enhance';
	static THUMBS = 'thumbs';
	static purge() {
		if (!game.user.isGM) return;
		let ids = []
		for (var scene of game.scenes.entries as any as Entity[]) {
			ids.push(scene.id);
		}
		let config = JSON.parse(game.settings.get(DFSceneThumb.MODULE, DFSceneThumb.THUMBS));
		for (var id in config) {
			if (!ids.includes(id))
				delete config[id];
		}
		game.settings.set(DFSceneThumb.MODULE, DFSceneThumb.THUMBS, JSON.stringify(config));
	}
	static updateThumb(sceneId: string, value?: string, generated: boolean = false) {
		let config = JSON.parse(game.settings.get(DFSceneThumb.MODULE, DFSceneThumb.THUMBS));
		if (!value) delete config[sceneId];
		else config[sceneId] = { url: value, thumb: generated };
		game.settings.set(DFSceneThumb.MODULE, DFSceneThumb.THUMBS, JSON.stringify(config));
	}
	static getThumb(sceneId: string) {
		return JSON.parse(game.settings.get(DFSceneThumb.MODULE, DFSceneThumb.THUMBS))[sceneId] ?? null;
	}
}

Hooks.once('init', function () {
	game.settings.register(DFSceneThumb.MODULE, DFSceneThumb.THUMBS, {
		scope: "world",
		config: false,
		type: String,
		default: "{}"
	});
});

Hooks.once('ready', DFSceneThumb.purge);

Hooks.on('renderSceneConfig', async (app: any, html: JQuery<HTMLElement>, data: { entity: SceneExt }) => {
	const imgInput = html.find('input[name ="img"]')[0];
	if (!imgInput || !imgInput.parentElement || !imgInput.parentElement.parentElement) return;
	const sceneId = data.entity._id;
	const thumbConfig = DFSceneThumb.getThumb(sceneId);
	const injection = $(await renderTemplate(`modules/${DFSceneThumb.MODULE}/templates/scene-thumb.hbs`, { thumbPath: (thumbConfig && thumbConfig.url) || "" }));
	const target = imgInput.parentElement.parentElement;
	for (var c = 0; c < injection.length; c++) {
		if (injection[c].nodeType != 1) continue;
		target.after(injection[c]);
	}
	html.find('#df-thumb-btn').on('click', () => {
		let fp = FilePicker.fromButton(html.find('#df-thumb-btn')[0] as HTMLButtonElement);
		let target = html.find('#df-thumb-btn')[0].getAttribute("data-target");
		app.filepickers.push({
			target: target,
			app: fp
		});
		fp.browse();
	});
	html.find('#df-thumb-img').on('change', () => DFSceneThumb.updateThumb(sceneId, html.find('#df-thumb-img').val() as string));
	app.ratioScaler = new DFSceneRatio();
	await app.ratioScaler.render(app, html, data);
});

Hooks.on('closeSceneConfig', async (app: SceneConfig, html: JQuery<HTMLElement>) => {
	const dfSceneConfig = DFSceneThumb.getThumb(app.entity.id);
	const scene: SceneExt = app.entity as SceneExt;
	if (!dfSceneConfig || !dfSceneConfig.url) return;
	// Update thumbnail and image dimensions
	try {
		let img = (dfSceneConfig && dfSceneConfig.url) ?? scene.data.img;
		const td = await ImageHelper.createThumbnail(img, { width: 300, height: 100 });
		dfSceneConfig.thumb = true;
		DFSceneThumb.updateThumb(scene.id, img, true);
		await scene.update({ thumb: td.thumb } as any, {});
	} catch (err) {
		ui.notifications.error("Thumbnail Override generation for Scene failed: " + err.message);
	}
});