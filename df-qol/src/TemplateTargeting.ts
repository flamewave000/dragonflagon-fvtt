import SETTINGS from "../../common/Settings";

export default class TemplateTargeting {
	static init() {
		SETTINGS.register('template-targeting-toggle', {
			config: false,
			scope: 'client',
			type: Boolean,
			default: true,
			onChange: () => { if (SETTINGS.get('template-targeting') !== 'toggle') return; }
		});
		SETTINGS.register('template-targeting', {
			config: true,
			scope: 'world',
			name: game.i18n.localize('DF_QOL.TemplateTargeting.SettingName'),
			hint: 'DF_QOL.TemplateTargeting.SettingHint',
			type: String,
			choices: {
				never: 'Never',
				toggle: 'Toggle (Add toggle button)',
				always: 'Always'
			},
			default: 'toggle',
			onChange: () => { ui.controls.initialize(); ui.controls.render(true); }
		});
		SETTINGS.register('template-targeting-patch5e', {
			name: 'DF_QOL.TemplateTargeting.Patch5e_Name',
			hint: 'DF_QOL.TemplateTargeting.Patch5e_Hint',
			config: true,
			type: Boolean,
			default: false,
			scope: 'world',
			onChange: (newValue: boolean) => {
				libWrapper.unregister(SETTINGS.MOD_NAME, 'MeasuredTemplate.prototype.highlightGrid', false);
				libWrapper.register(SETTINGS.MOD_NAME, 'MeasuredTemplate.prototype.highlightGrid', this.UPDATE_TARGETS, newValue ? 'OVERRIDE' : 'WRAPPER');
				canvas.templates?.placeables.forEach((t: MeasuredTemplate) => t.draw());
			}
		});
		SETTINGS.register('template-targeting-patch5e-circle', {
			name: 'DF_QOL.TemplateTargeting.Patch5e_Circle_Name',
			hint: 'DF_QOL.TemplateTargeting.Patch5e_Circle_Hint',
			config: true,
			type: Boolean,
			default: false,
			scope: 'world',
			onChange: () => canvas.templates?.placeables.filter((t: MeasuredTemplate) => t.data.t === "circle")
				.forEach((t: MeasuredTemplate) => t.draw())
		});
		libWrapper.register(SETTINGS.MOD_NAME, 'MeasuredTemplate.prototype.highlightGrid', this.UPDATE_TARGETS,
			SETTINGS.get('template-targeting-patch5e') ? 'OVERRIDE' : 'WRAPPER');

		Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
			if (SETTINGS.get('template-targeting') !== 'toggle') return;
			const control = controls.find(x => x.name === 'measure');
			control.tools.splice(0, 0, {
				icon: 'fas fa-bullseye',
				name: 'autoTarget',
				title: 'DF_QOL.TemplateTargeting.ToggleTitle',
				visible: true,
				toggle: true,
				active: SETTINGS.get('template-targeting-toggle'),
				onClick: (toggled: boolean) => { SETTINGS.set('template-targeting-toggle', toggled); }
			});
		});
	}

	static UPDATE_TARGETS(this: MeasuredTemplate, wrapped: ()=>void) {
		const mode = SETTINGS.get<string>('template-targeting');
		const shouldAutoSelect = mode === 'always' || (mode === 'toggle' && SETTINGS.get<boolean>('template-targeting-toggle'));

		// Release all previously targeted tokens
		if (shouldAutoSelect && canvas.tokens.objects) {
			for (const t of game.user.targets) {
				t.setTarget(false, { releaseOthers: false, groupSelection: true });
			}
		}
		// @ts-ignore
		if (!game.dnd5e || !SETTINGS.get('template-targeting-patch5e')) {
			// Call the original function
			wrapped();
			if (!shouldAutoSelect) return;
			// Get the offset of the template origin relative to the top-left grid space
			const hx = canvas.grid.w / 2;
			const hy = canvas.grid.h / 2;
			// Iterate over all existing tokens and target the ones within the template area
			for (const token of canvas.tokens.placeables) {
				if (this.shape.contains((token.x + hx) - this.data.x, (token.y + hy) - this.data.y)) {
					token.setTarget(true, { user: game.user, releaseOthers: false, groupSelection: true });
				}
			}
		} else {
			/************** THIS CODE IS DIRECTLY COPIED FROM 'MeasuredTemplate.prototype.highlightGrid' ****************/
			const grid = canvas.grid;
			const d = canvas.dimensions;
			const border = <number>this.borderColor;
			const color = this.fillColor;

			// Only highlight for objects which have a defined shape
			if (!this.id || !this.shape) return;

			// Clear existing highlight
			const hl = grid.getHighlightLayer(`Template.${this.id}`);
			hl.clear();

			// If we are in gridless mode, highlight the shape directly
			if (grid.type === CONST.GRID_TYPES.GRIDLESS) {
				const shape = this.shape.clone();
				if ("points" in shape) {
					shape.points = shape.points.map((p, i) => {
						if (i % 2) return this.y + p;
						else return this.x + p;
					});
				} else {
					shape.x += this.x;
					shape.y += this.y;
				}
				return grid.grid.highlightGridPosition(hl, { border, color: <any>color, shape: <any>shape });
			}

			// Get number of rows and columns
			const nr = Math.ceil(((this.data.distance * 1.5) / d.distance) / (d.size / grid.h));
			const nc = Math.ceil(((this.data.distance * 1.5) / d.distance) / (d.size / grid.w));

			// Get the offset of the template origin relative to the top-left grid space
			const [tx, ty] = canvas.grid.getTopLeft(this.data.x, this.data.y);
			const [row0, col0] = grid.grid.getGridPositionFromPixels(tx, ty);
			const hx = canvas.grid.w / 2;
			const hy = canvas.grid.h / 2;
			const isCenter = (this.data.x - tx === hx) && (this.data.y - ty === hy);

			/***** START OF CODE EDIT *****/
			// Extract and prepare data
			let { direction, distance, angle, width } = this.data;
			distance *= (d.size / d.distance);
			width *= (d.size / d.distance);
			angle = Math.toRadians(angle);
			direction = Math.toRadians(direction);
			// If we are round, the side is of length `distance`, otherwise calculate the true length of the hypotenouse
			const isRound = game.settings.get("core", "coneTemplateType") === 'round';
			const rayLength = isRound ? distance : (distance / Math.sin((Math.PI / 2) - (angle / 2))) * Math.sin(Math.PI / 2);

			let [ax1, ay1, bx1, by1] = [0, 0, 0, 0];
			let [ax2, ay2, bx2, by2] = [0, 0, 0, 0];
			let coneInitialized = false;
			const generateConeData = () => {
				if (coneInitialized) return;
				coneInitialized = true;
				[ax1, ay1, bx1, by1] = [
					this.data.x,
					this.data.y,
					this.data.x + (Math.cos(direction - (angle / 2)) * rayLength),
					this.data.y + (Math.sin(direction - (angle / 2)) * rayLength)
				];
				[ax2, ay2, bx2, by2] = [
					this.data.x,
					this.data.y,
					this.data.x + (Math.cos(direction + (angle / 2)) * rayLength),
					this.data.y + (Math.sin(direction + (angle / 2)) * rayLength)
				];
			};
			const generateRayData = () => {
				if (coneInitialized) return;
				[ax1, ay1] = [
					this.data.x + (Math.cos(direction - (Math.PI / 2)) * (width / 2)),
					this.data.y + (Math.sin(direction - (Math.PI / 2)) * (width / 2))
				];
				[bx1, by1] = [
					ax1 + (Math.cos(direction) * distance),
					ay1 + (Math.sin(direction) * distance)
				];
				[ax2, ay2] = [
					this.data.x + (Math.cos(direction + (Math.PI / 2)) * (width / 2)),
					this.data.y + (Math.sin(direction + (Math.PI / 2)) * (width / 2))
				];
				[bx2, by2] = [
					ax2 + (Math.cos(direction) * distance),
					ay2 + (Math.sin(direction) * distance)
				];
			};
			// Identify grid coordinates covered by the template Graphics
			for (let r = -nr; r < nr; r++) {
				for (let c = -nc; c < nc; c++) {
					const [gx, gy] = canvas.grid.grid.getPixelsFromGridPosition(row0 + r, col0 + c);
					const testX = gx + hx;
					const testY = gy + hy;
					const testRect = new NormalizedRectangle(gx, gy, canvas.grid.w, canvas.grid.h);
					let contains = false;
					switch (this.data.t) {
						case "circle": {
							// Calculate the vector from the PoI to the grid square center
							const [rcx, rcy] = [testX - this.data.x, testY - this.data.y];
							// If the distance between the centres is <= the circle's radius
							contains = ((rcx * rcx) + (rcy * rcy)) <= (distance * distance);
							if (contains || !SETTINGS.get('template-targeting-patch5e-circle')) break;

							const sqrDistance = distance * distance;
							let [vx, vy] = [0, 0];
							const testPoint = (x: number, y: number) => {
								[vx, vy] = [x - this.data.x, y - this.data.y];
								return (vx * vx + vy * vy) < sqrDistance;
							};

							contains = testPoint(testRect.left, testRect.top)
								|| testPoint(testRect.right, testRect.top)
								|| testPoint(testRect.left, testRect.bottom)
								|| testPoint(testRect.right, testRect.bottom);
							break;
						}
						case "rect": {
							const rect = this._getRectShape(direction, distance);
							rect.x += this.data.x;
							rect.y += this.data.y;
							// The normalized rectangle always adds 1 to the width and height
							rect.width -= 1;
							rect.height -= 1;
							// Standard 2D Box Collision detection
							contains = !(rect.left >= testRect.right || rect.right <= testRect.left
								|| rect.top >= testRect.bottom || rect.bottom <= testRect.top);
							break;
						}
						case "cone": {
							contains = ((r === 0) && (c === 0) && isCenter) || this.shape.contains(testX - this.data.x, testY - this.data.y);
							if (contains) break;
							const bounds = {
								xMin: testRect.left,
								xMax: testRect.right,
								yMin: testRect.top,
								yMax: testRect.bottom
							};
							generateConeData();
							// check the top line
							contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax1, ay1, bx1, by1, bounds);
							if (contains) break;
							// check the bottom line
							contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax2, ay2, bx2, by2, bounds);
							if (contains) break;
							// check the end-cap
							if (isRound) {
								const sqrDistance = distance * distance;
								let [vx, vy] = [0, 0];
								let mag = 0;
								let vecAngle = 0;
								const testPoint = (x: number, y: number) => {
									[vx, vy] = [x - this.data.x, y - this.data.y];
									return (vx * vx + vy * vy) < sqrDistance;
								};
								const testAngle: () => boolean = () => {
									// calculate vector magnitude
									mag = Math.sqrt(vx * vx + vy * vy);
									// normalize the vector
									vx /= mag;
									// Calculate the vector's angle, adjusting for bottom hemisphere if Y is negative
									vecAngle = Math.acos(vx);
									if (vy < 0) vecAngle = (Math.PI * 2) - vecAngle;
									const minAngle = direction - (angle / 2);
									const maxAngle = direction + (angle / 2);
									if (minAngle < 0)
										return vecAngle <= maxAngle || vecAngle >= ((Math.PI * 2) + minAngle);
									else if (maxAngle > Math.PI * 2)
										return vecAngle <= (maxAngle - (Math.PI * 2)) || vecAngle >= minAngle;
									else return vecAngle <= maxAngle && vecAngle >= minAngle;
								};
								if (testPoint(testRect.left, testRect.top)) {
									contains = testAngle();
									if (contains) break;
								}
								if (testPoint(testRect.right, testRect.top)) {
									contains = testAngle();
									if (contains) break;
								}
								if (testPoint(testRect.left, testRect.bottom)) {
									contains = testAngle();
									if (contains) break;
								}
								if (testPoint(testRect.right, testRect.bottom)) {
									contains = testAngle();
								}
							} else
								contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(bx1, by1, bx2, by2, bounds);
							break;
						}
						case "ray": {
							contains = ((r === 0) && (c === 0) && isCenter) || this.shape.contains(testX - this.data.x, testY - this.data.y);
							if (contains) break;
							const bounds = {
								xMin: testRect.left,
								xMax: testRect.right,
								yMin: testRect.top,
								yMax: testRect.bottom
							};
							generateRayData();
							// check the top line
							contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax1, ay1, bx1, by1, bounds);
							if (contains) break;
							// check the bottom line
							contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax2, ay2, bx2, by2, bounds);
							if (contains) break;
							// check the left endcap line
							contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax1, ay1, ax2, ay2, bounds);
							if (contains) break;
							// check the right endcap line
							contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(bx1, by1, bx2, by2, bounds);
							if (contains) break;
							break;
						}
					}

					if (!contains) continue;
					grid.grid.highlightGridPosition(hl, { x: gx, y: gy, border, color: <any>color });

					if (!shouldAutoSelect) continue;
					// Iterate over all existing tokens and target the ones within the template area
					for (const token of canvas.tokens.placeables) {
						if (!testRect.contains(token.x + hx, token.y + hy)) continue;
						token.setTarget(true, { user: game.user, releaseOthers: false, groupSelection: true });
					}
					/****** END OF CODE EDIT ******/
				}
			}
			/******************************************** END OF COPIED CODE ********************************************/
		}
	}
}


enum OutCode {
	INSIDE = 0x0000,
	LEFT = 0x0001,
	RIGHT = 0x0010,
	BOTTOM = 0x0100,
	TOP = 0x1000
}

/**
 * Uses the highly optimized Cohen–Sutherland algorithm for detecting if a line segment passes through a rectangle on a 2D plane.
 * https://en.wikipedia.org/wiki/Cohen%E2%80%93Sutherland_algorithm
 */
class LineToBoxCollision {
	private static _computeOutCode(x: number, y: number, bounds: { xMin: number, xMax: number, yMin: number, yMax: number }): OutCode {
		let code: OutCode;
		code = OutCode.INSIDE;          // initialised as being inside of [[clip window]]
		if (x <= bounds.xMin)           // to the left of clip window
			code |= OutCode.LEFT;
		else if (x >= bounds.xMax)      // to the right of clip window
			code |= OutCode.RIGHT;
		if (y <= bounds.yMin)           // below the clip window
			code |= OutCode.BOTTOM;
		else if (y >= bounds.yMax)      // above the clip window
			code |= OutCode.TOP;
		return code;
	}

	// Cohen–Sutherland clipping algorithm clips a line from
	// P0 = (x0, y0) to P1 = (x1, y1) against a rectangle with 
	// diagonal from (xmin, ymin) to (xmax, ymax).
	static cohenSutherlandLineClipAndDraw(x0: number, y0: number, x1: number, y1: number,
		bounds: { xMin: number, xMax: number, yMin: number, yMax: number }): boolean {
		// compute outcodes for P0, P1, and whatever point lies outside the clip rectangle
		let outcode0: OutCode = this._computeOutCode(x0, y0, bounds);
		let outcode1: OutCode = this._computeOutCode(x1, y1, bounds);
		let accept = false;

		while (true) {
			if (!(outcode0 | outcode1)) {
				// bitwise OR is 0: both points inside window; trivially accept and exit loop
				accept = true;
				break;
			} else if (outcode0 & outcode1) {
				// bitwise AND is not 0: both points share an outside zone (LEFT, RIGHT, TOP,
				// or BOTTOM), so both must be outside window; exit loop (accept is false)
				break;
			} else {
				// failed both tests, so calculate the line segment to clip
				// from an outside point to an intersection with clip edge
				let [x, y] = [0, 0];

				// At least one endpoint is outside the clip rectangle; pick it.
				const outcodeOut: OutCode = outcode1 > outcode0 ? outcode1 : outcode0;

				// Now find the intersection point;
				// use formulas:
				//   slope = (y1 - y0) / (x1 - x0)
				//   x = x0 + (1 / slope) * (ym - y0), where ym is ymin or ymax
				//   y = y0 + slope * (xm - x0), where xm is xmin or xmax
				// No need to worry about divide-by-zero because, in each case, the
				// outcode bit being tested guarantees the denominator is non-zero
				if (outcodeOut & OutCode.TOP) {           // point is above the clip window
					x = x0 + (x1 - x0) * (bounds.yMax - y0) / (y1 - y0);
					y = bounds.yMax - 1;
				} else if (outcodeOut & OutCode.BOTTOM) { // point is below the clip window
					x = x0 + (x1 - x0) * (bounds.yMin - y0) / (y1 - y0);
					y = bounds.yMin + 1;
				} else if (outcodeOut & OutCode.RIGHT) {  // point is to the right of clip window
					y = y0 + (y1 - y0) * (bounds.xMax - x0) / (x1 - x0);
					x = bounds.xMax - 1;
				} else if (outcodeOut & OutCode.LEFT) {   // point is to the left of clip window
					y = y0 + (y1 - y0) * (bounds.xMin - x0) / (x1 - x0);
					x = bounds.xMin + 1;
				}

				// Now we move outside point to intersection point to clip
				// and get ready for next pass.
				if (outcodeOut == outcode0) {
					x0 = x;
					y0 = y;
					outcode0 = this._computeOutCode(x0, y0, bounds);
				} else {
					x1 = x;
					y1 = y;
					outcode1 = this._computeOutCode(x1, y1, bounds);
				}
			}
		}
		return accept;
	}
}