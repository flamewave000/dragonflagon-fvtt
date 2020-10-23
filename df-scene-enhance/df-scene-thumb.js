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
		const hasDefaultDims = (this.data.width === 4000) && (this.data.height === 3000);
		const hasImage = data.img || this.data.img;
		const changedBackground = (!!dfSceneConfig && data.img !== undefined && data.img !== this.data.img);
		const clearedDims = (data.width === null) || (data.height === null);
		const needsThumb = changedBackground || !this.data.thumb || (!!dfSceneConfig && !dfSceneConfig.thumb);
		const needsDims = data.img && (clearedDims || hasDefaultDims);
		// Update thumbnail and image dimensions
		if (((!!dfSceneConfig && !!dfSceneConfig.url) || hasImage) && (needsThumb || needsDims)) {
			let td = {};
			try {
				let img = (dfSceneConfig && dfSceneConfig.url) ?? data.img ?? this.data.img;
				td = await this.createThumbnail({ img: img });
				if (!!dfSceneConfig) {
					dfSceneConfig.thumb = true;
					DFSceneThumb.updateThumb(this.id, img, true);
				}
			} catch (err) {
				ui.notifications.error("Thumbnail generation for Scene failed: " + err.message);
			}
			if (needsThumb) data.thumb = td.thumb || null;
			if (needsDims) {
				data.width = td.width;
				data.height = td.height;
			}
		}
		// Warn the user if Scene dimensions are changing
		if (options["fromSheet"] === true) {
			const delta = diffObject(this.data, data);
			const changed = Object.keys(delta);
			if (["width", "height", "padding", "shiftX", "shiftY", "size"].some(k => changed.includes(k))) {
				const confirm = await Dialog.confirm({
					title: game.i18n.localize("SCENES.DimensionChangeTitle"),
					content: `<p>${game.i18n.localize("SCENES.DimensionChangeWarning")}</p>`
				});
				if (!confirm) return;
			}
			delete options["fromSheet"];
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
	let imgInput = html.find('section > form > div > div > input[name ="img"]')[0];
	if (!form || !imgInput) return;
	if (!imgInput.parentElement || !imgInput.parentElement.parentElement) return;
	let target = imgInput.parentElement.parentElement;
	let sceneId = data.entity._id;
	const thumbConfig = DFSceneThumb.getThumb(sceneId);
	const thumbPath = (thumbConfig && thumbConfig.url) || "";
	const injection = $.parseHTML(`			<div class="form-group">
				<label>${game.i18n.localize('DRAGON_FLAGON.Thumbnail_Label')}</label>
				<div class="form-fields">
					<button id="df-thumb-btn" type="button" class="file-picker" data-type="image" data-target="df-thumb-img" title="${game.i18n.localize('DRAGON_FLAGON.Thumbnail_Button')}" tabindex="-1">
						<i class="fas fa-file-import fa-fw"></i>
					</button>
					<input id="df-thumb-img" class="image" type="text" name="df-thumb-img" placeholder="${game.i18n.localize('DRAGON_FLAGON.Thumbnail_Hint')}" value="${thumbPath}">
				</div>
			</div>`);
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
});