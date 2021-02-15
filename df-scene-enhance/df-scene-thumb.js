import DFSceneRatio from "./df-scene-ratio.js";

class DFSceneThumb {
	static MODULE = 'df-scene-enhance';
	static THUMBS = 'thumbs';
	static purge() {
		if (!game.user.isGM) return;
		let ids = []
		for (var scene of game.scenes.entries) {
			ids.push(scene.id);
		}
		let config = JSON.parse(game.settings.get(DFSceneThumb.MODULE, DFSceneThumb.THUMBS));
		for (var id in config) {
			if (!ids.includes(id))
				delete config[id];
		}
		game.settings.set(DFSceneThumb.MODULE, DFSceneThumb.THUMBS, JSON.stringify(config));
	}
	static updateThumb(sceneId, value, generated = false) {
		let config = JSON.parse(game.settings.get(DFSceneThumb.MODULE, DFSceneThumb.THUMBS));
		if (!value) delete config[sceneId];
		else config[sceneId] = { url: value, thumb: generated };
		game.settings.set(DFSceneThumb.MODULE, DFSceneThumb.THUMBS, JSON.stringify(config));
	}
	static getThumb(sceneId) {
		return JSON.parse(game.settings.get(DFSceneThumb.MODULE, DFSceneThumb.THUMBS))[sceneId] ?? null;
	}

	/** @override */
	static async updateOverride(data, options = {}) {
		// Determine what type of change has occurred
		const dfSceneConfig = DFSceneThumb.getThumb(this.id);
		if (!dfSceneConfig || !dfSceneConfig.url)
			return this.dfThumb_update(data, options);
		let normalData = this.dfThumb_update(data, options);
		// Update thumbnail and image dimensions
		let td = {};
		try {
			let img = (dfSceneConfig && dfSceneConfig.url) ?? data.img ?? this.data.img;
			td = await ImageHelper.createThumbnail(img, { width: 300, height: 100 });
			dfSceneConfig.thumb = true;
			DFSceneThumb.updateThumb(this.id, img, true);
		} catch (err) {
			ui.notifications.error("Thumbnail Override generation for Scene failed: " + err.message);
		}
		data.thumb = td.thumb || null;
		if (!!normalData.width) data.width = normalData.width;
		if (!!normalData.height) data.height = normalData.height;
		// Call the Entity update
		return Entity.prototype.update.bind(this)(data, options);
	}
}

Hooks.once('init', function () {
	game.settings.register(DFSceneThumb.MODULE, DFSceneThumb.THUMBS, {
		scope: "world",
		config: false,
		type: String,
		default: "{}"
	});
	Scene.prototype.dfThumb_update = Scene.prototype.update;
	Scene.prototype.update = DFSceneThumb.updateOverride;
});

Hooks.once('ready', DFSceneThumb.purge);

Hooks.on('renderSceneConfig', async (app, html, data) => {
	let form = html.find('section > form')[0];
	let imgInput = html.find('input[name ="img"]')[0];
	if (!form || !imgInput) return;
	if (!imgInput.parentElement || !imgInput.parentElement.parentElement) return;
	let target = imgInput.parentElement.parentElement;
	let sceneId = data.entity._id;
	const thumbConfig = DFSceneThumb.getThumb(sceneId);
	const injection = $(await renderTemplate(`modules/${DFSceneThumb.MODULE}/templates/scene-thumb.hbs`, { thumbPath: (thumbConfig && thumbConfig.url) || "" }));
	for (var c = 0; c < injection.length; c++) {
		if (injection[c].nodeType != 1) continue;
		target.after(injection[c]);
	}
	html.find('#df-thumb-btn').click(() => {
		let fp = FilePicker.fromButton(html.find('#df-thumb-btn')[0]);
		let target = html.find('#df-thumb-btn')[0].getAttribute("data-target");
		app.filepickers.push({
			target: target,
			app: fp
		});
		fp.browse();
	});

	html.find('#df-thumb-img').change(() => DFSceneThumb.updateThumb(sceneId, html.find('#df-thumb-img').val()));
	app.ratioScaler = new DFSceneRatio();
	await app.ratioScaler.render(app, html, data);
});