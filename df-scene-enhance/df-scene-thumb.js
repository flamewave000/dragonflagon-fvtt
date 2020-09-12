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
	static updateThumb(sceneId, value) {
		let config = JSON.parse(game.settings.get(DFSceneThumb.MODULE, DFSceneThumb.THUMBS));
		if (!value) delete config[sceneId];
		else config[sceneId] = { url: value, thumb: false };
		game.settings.set(DFSceneThumb.MODULE, DFSceneThumb.THUMBS, JSON.stringify(config));
	}
	static getThumb(sceneId) {
		return JSON.parse(game.settings.get(DFSceneThumb.MODULE, DFSceneThumb.THUMBS))[sceneId] ?? { url: "", thumb: false };
	}

	/** @override */
	static async updateOverride(data, options = {}) {
		if (!game.user.isGM) return this.dfThumb_update(data, options);
		const dfSceneConfig = DFSceneThumb.getThumb(this.id);
		let image = dfSceneConfig.url ? dfSceneConfig.url : data.img;
		const imgChange = !!data.img && (data.img !== this.data.img || !dfSceneConfig.thumb);
		const needsThumb = !!(this.data.img || data.img || dfSceneConfig.url) && !this.data.thumb;
		// Update the Scene thumbnail if necessary
		if (imgChange || needsThumb) {
			try {
				dfSceneConfig.thumb = true;
				const thumbData = await BackgroundLayer.createThumbnail(image);
				data.thumb = thumbData.thumb;
				// If no image was previously set, or if no dimensions were provided - use the native dimensions
				const hasDims = !!data.width && !!data.height;
				if (!this.data.img || !hasDims) {
					data.width = thumbData.width;
					data.height = thumbData.height;
				}
			}
			catch (err) {
				ui.notifications.error("Thumbnail generation for Scene failed: " + err.message);
				data["thumb"] = null;
			}
		}
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
	})
	Scene.prototype.dfThumb_update = Scene.prototype.update;
	Scene.prototype.update = DFSceneThumb.updateOverride;
});

Hooks.once('ready', DFSceneThumb.purge);

Hooks.on('renderSceneConfig', (app, html, data) => {
	let form = html.find('section > form')[0];
	let hrule = html.find('section > form > hr')[1];
	let sceneId = data.entity._id;
	if (!form || !hrule) return;
	const injection = $.parseHTML(`			<div class="form-group">
				<label>${game.i18n.localize('DRAGON_FLAGON.Thumbnail_Label')}</label>
				<div class="form-fields">
					<button id="df-thumb-btn" type="button" class="file-picker" data-type="image" data-target="df-thumb-img" title="${game.i18n.localize('DRAGON_FLAGON.Thumbnail_Button')}" tabindex="-1">
						<i class="fas fa-file-import fa-fw"></i>
					</button>
					<input id="df-thumb-img" class="image" type="text" name="df-thumb-img" placeholder="${game.i18n.localize('DRAGON_FLAGON.Thumbnail_Hint')}" value="${DFSceneThumb.getThumb(sceneId).url}">
				</div>
			</div>`);
	for (var c = 0; c < injection.length; c++) {
		if (injection[c].nodeType != 1) continue;
		hrule.before(injection[c]);
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
});