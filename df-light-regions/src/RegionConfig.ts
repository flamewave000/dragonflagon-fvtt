import SETTINGS from "../../common/Settings";
import Flags from "./Flags";
import RegionProcessor from "./RegionProcessor";

declare class DrawingConfigEx extends DrawingConfig {
	dflrGfx: PIXI.Graphics;
}

export default class RegionConfig {
	static init() {
		libWrapper.register(SETTINGS.MOD_NAME, "DrawingConfig.prototype._renderInner", this.DrawingConfig_renderInner, 'WRAPPER');
		libWrapper.register(SETTINGS.MOD_NAME, "DrawingConfig.prototype._updateObject", this.DrawingConfig_updateObject, 'WRAPPER');
		libWrapper.register(SETTINGS.MOD_NAME, "DrawingConfig.prototype.close", this.DrawingConfig_close, 'WRAPPER');

		//async close(options={})

		Hooks.on("getSceneControlButtons", this.appendSceneControls.bind(this));
	}

	private static async DrawingConfig_renderInner(this: DrawingConfigEx, wrapper: (...args: any) => JQuery<HTMLElement>, ...args: any) {
		const html = await wrapper(...args);
		if (this.options.configureDefault || ["t", "f", "e"].includes(this.object.data.type)) return html;

		this.dflrGfx = this.dflrGfx ?? new PIXI.Graphics();
		canvas.foreground.addChild(this.dflrGfx);
		this.dflrGfx.clear();

		const enabled = <boolean>this.object.getFlag(SETTINGS.MOD_NAME, Flags.ENABLED);
		this.dflrGfx.visible = enabled;
		// If enabled, draw a highlight for all of the walls and lights contained in this region
		if (enabled) {
			const includedLights = <string[]>this.object.getFlag(SETTINGS.MOD_NAME, Flags.LIGHTS) ?? [];
			const lights = includedLights.map(x => game.scenes.viewed.lights.get(x)).filter(x => !!x);
			this.dflrGfx.beginFill(0x00FF00, 0.25);
			const pixelsPerUnit = game.scenes.viewed.data.grid / game.scenes.viewed.data.gridDistance;
			for (const light of lights) {
				this.dflrGfx.drawCircle(light.data.x, light.data.y, Math.max(light.data.config.dim, light.data.config.dim) * pixelsPerUnit);
			}
			this.dflrGfx.endFill();
		}

		const regionSettings = $(await renderTemplate("modules/df-light-regions/templates/region-config.hbs", { enabled }));
		html.find('div[data-tab="text"]').after(regionSettings);
		html.find('nav.sheet-tabs.tabs').append(`<a class="item" data-tab="dflr-region"><i class="far fa-object-group"></i> ${"Light Region".localize()}</a>`);
		return html;
	}

	private static async DrawingConfig_updateObject(this: DrawingConfig, wrapped: (...args: any) => void, event: any, formData: any) {
		const enabled = formData['dflr-enabled'];
		await this.object.setFlag(SETTINGS.MOD_NAME, Flags.ENABLED, enabled);
		return wrapped(event, formData);
	}

	private static DrawingConfig_close(this: DrawingConfigEx, wrapped: (...args: any) => any, ...args: any): any {
		canvas.foreground.removeChild(this.dflrGfx);
		return wrapped(...args);
	}

	private static appendSceneControls(controls: SceneControl[]) {
		const drawingTools = controls.find(x => x.name === "drawings");
		drawingTools.tools.push({
			name: "dflr-calc-regions",
			icon: "fas fa-calculator",
			title: "Recalculate All Light Regions",
			button: true,
			onClick: RegionProcessor.processAllRegions.bind(RegionProcessor)
		});
	}
}