import { AmbientLightData, WallData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
import SETTINGS from "../../common/Settings";
import Flags from "./Flags";

interface Circle {
	p: Point, r: number
}

interface Point {
	x: number, y: number
}

interface Line {
	p1: Point, p2: Point
}

function sqr(value: number) { return value * value; }
function dist2(p1: Point, p2: Point) { return sqr(p1.x - p2.x) + sqr(p1.y - p2.y); }

export default class RegionProcessor {
	private static processing: Promise<void> | null = null;

	public static processAllRegions() {
		if (this.processing !== null) {
			ui.notifications.warn("Light Regions are already being processed".localize());
			return;
		}
		this.processing = new Promise(async (res, _) => {
			const regions = game.scenes.viewed.drawings.filter(x =>
				x.getFlag(SETTINGS.MOD_NAME, Flags.ENABLED) && ["r", "e", "p"].includes(x.data.type)
			);

			// Fetch a temporary cache of all walls and lights
			const walls = game.scenes.viewed.walls.map(x => x.data);
			const lights = game.scenes.viewed.lights.map(x => x.data).filter(x => !x.hidden);

			for (let c = 0; c < regions.length; c++) {
				// Report progress
				this.updateProgress(c + 1, regions.length);

				const region = regions[c];
				switch (region.data.type) {
					case "r":
						await this.processRectangle(region, walls, lights);
						break;
				}
			}
			this.updateProgress(regions.length, regions.length);
			this.processing = null;
			res();
		});
	}

	private static updateProgress(num: number, den: number) {
		SceneNavigation.displayProgressBar({
			label: "Calculating Light Regions... {0}/{1}".localize()
				.replace("{0}", num.toString())
				.replace("{1}", den.toString()),
			pct: Math.ceil((num / den) * 100)
		});
	}

	private static async processRectangle(rect: DrawingDocument, walls: WallData[], lights: AmbientLightData[]) {
		const left = rect.data.x;
		const top = rect.data.y;
		const right = left + rect.data.width;
		const bottom = top + rect.data.height;

		const pixelsPerUnit = game.scenes.viewed.data.grid / game.scenes.viewed.data.gridDistance;

		const sides: Line[] = [
			// Top
			{ p1: { x: left, y: top }, p2: { x: right, y: top } },
			// Bottom
			{ p1: { x: left, y: bottom }, p2: { x: right, y: bottom } },
			// Right
			{ p1: { x: right, y: top }, p2: { x: right, y: bottom } },
			// Left
			{ p1: { x: left, y: top }, p2: { x: left, y: bottom } }
		];

		// Determine which lights interect, and or are contained within the rect
		const includedLights: string[] = [];
		let circle: Circle;
		for (const light of lights) {
			// Fast-Check light origin inside rect
			if (light.x >= left && light.x <= right && light.y >= top && light.y <= bottom) {
				includedLights.push(light._id);
				continue;
			}

			// Check light radius collision with rectangle sides
			circle = {
				p: { x: light.x, y: light.y },
				r: Math.max(light.config.dim, light.config.bright) * pixelsPerUnit
			};
			if (sides.some(x => this.detectCircleToLineCollision(circle, x))) {
				includedLights.push(light._id);
			}
		}
		// Store the light ids in the flags for the region
		await rect.setFlag(SETTINGS.MOD_NAME, Flags.LIGHTS, includedLights);

		// Determine which walls intersect, and or are contained within the rect
		// Store the wall ids in the flags for the region
	}

	private static detectCircleToLineCollision(circle: Circle, line: Line): boolean {
		// Fast-Check distance to end-points
		const longDistance = circle.r * circle.r;
		if (longDistance >= (sqr(line.p1.x - circle.p.x) + sqr(line.p1.y - circle.p.y))) return true;
		if (longDistance >= (sqr(line.p2.x - circle.p.x) + sqr(line.p2.y - circle.p.y))) return true;

		/*
		Equation for Point to Line Segment : https://stackoverflow.com/a/1501725/1418155
		 */

		const p = circle.p;
		const v = line.p1;
		const w = line.p2;

		const mag = dist2(v, w);
		// If the line segment has zero length, return distance from endpoint to circle origin
		if (mag === 0) return dist2(v, p) <= longDistance;

		// Calculate dot product clamped to 0-1 
		const t = Math.clamped(((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / mag, 0, 1);
		return dist2(p, {
			x: v.x + t * (w.x - v.x),
			y: v.y + t * (w.y - v.y)
		}) <= longDistance;
	}
}