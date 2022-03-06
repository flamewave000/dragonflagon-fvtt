import SETTINGS from "../../common/Settings";
import LineToBoxCollision from "./LineToBoxCollision";

function throttle<T>(fn: AnyFunction, threshhold?: number): T {
	threshhold || (threshhold = 250);
	let last: number;
	let hasTimer = false;
	let mostRecent: any[];
	return <any>function (this: any, ...args: any) {
		// Preserve the most recent arguments
		mostRecent = [...args];
		// Grab the current time
		const now = +new Date;
		const context = this;
		// If we have been called before, and we are within the timeout period
		if (last && now < last + threshhold) {
			// If we already have a timer set, return immediately
			if (hasTimer) return;
			// Create a timeout with the delta from `now` to end of `last + threshold`
			hasTimer = true;
			setTimeout(function () {
				// Unset the timer
				hasTimer = false;
				// Update last invocation time
				last = +new Date;
				// Invoke the original function
				fn.apply(context, mostRecent);
			}, threshhold - (now - last));
		}
		// This is the first time we've been called
		else {
			// Set the last time value
			last = now;
			// Invoke the original function
			fn.apply(context, mostRecent);
		}
	};
}

export default class TemplateTargeting {

	private static toggleTemplatePatch(enabled: boolean) {
		libWrapper.unregister(SETTINGS.MOD_NAME, 'MeasuredTemplate.prototype.highlightGrid', false);
		libWrapper.register(SETTINGS.MOD_NAME, 'MeasuredTemplate.prototype.highlightGrid', this.UPDATE_TARGETS, enabled ? 'OVERRIDE' : 'WRAPPER');
	}

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
			name: game.i18n.localize('DF_TEMPLATES.SettingName'),
			hint: 'DF_TEMPLATES.SettingHint',
			type: String,
			choices: {
				never: 'Never',
				toggle: 'Toggle (Add toggle button)',
				always: 'Always'
			},
			default: 'toggle',
			onChange: () => { ui.controls.initialize(); ui.controls.render(true); }
		});
		SETTINGS.register('template-preview', {
			config: true,
			scope: 'world',
			name: 'DF_TEMPLATES.PreviewName',
			hint: 'DF_TEMPLATES.PreviewHint',
			type: Boolean,
			default: true,
			onChange: (newValue: boolean) => TemplateTargeting.toggleTemplatePatch(newValue || SETTINGS.get('template-targeting-patch5e'))
		});
		SETTINGS.register('template-targeting-patch5e', {
			name: 'DF_TEMPLATES.Patch5e_Name',
			hint: 'DF_TEMPLATES.Patch5e_Hint',
			config: true,
			type: Boolean,
			default: false,
			scope: 'world',
			onChange: (newValue: boolean) => {
				TemplateTargeting.toggleTemplatePatch(newValue || SETTINGS.get('template-preview'));
				canvas.templates?.placeables.forEach((t: MeasuredTemplate) => t.draw());
			}
		});
		SETTINGS.register('template-targeting-patch5e-circle', {
			name: 'DF_TEMPLATES.Patch5e_Circle_Name',
			hint: 'DF_TEMPLATES.Patch5e_Circle_Hint',
			config: true,
			type: Boolean,
			default: false,
			scope: 'world',
			onChange: () => canvas.templates?.placeables.filter((t: MeasuredTemplate) => t.data.t === "circle")
				.forEach((t: MeasuredTemplate) => t.draw())
		});
		libWrapper.register(SETTINGS.MOD_NAME, 'MeasuredTemplate.prototype.highlightGrid', this.UPDATE_TARGETS,
			SETTINGS.get('template-targeting-patch5e') || SETTINGS.get('template-preview') ? 'OVERRIDE' : 'WRAPPER');

		Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
			if (SETTINGS.get('template-targeting') !== 'toggle') return;
			const control = controls.find(x => x.name === 'measure');
			control.tools.splice(0, 0, {
				icon: 'fas fa-bullseye',
				name: 'autoTarget',
				title: 'DF_TEMPLATES.ToggleTitle',
				visible: true,
				toggle: true,
				active: SETTINGS.get('template-targeting-toggle'),
				onClick: (toggled: boolean) => { SETTINGS.set('template-targeting-toggle', toggled); }
			});
		});
		// When dragging a template, we need to catch the cancellation in order for us to refresh the template to draw back in its original position.
		libWrapper.register(SETTINGS.MOD_NAME, 'PlaceableObject.prototype._createInteractionManager', function (this: PlaceableObject, wrapper: () => MouseInteractionManager) {
			if (!(this instanceof MeasuredTemplate)) return wrapper();
			// We wrap the interaction manager construction method
			const manager = wrapper();
			// Replacing the `dragLeftCancel` with our own wrapper function
			manager.callbacks.dragLeftCancel = function (this: PlaceableObject, event: any) {
				this.refresh();
				PlaceableObject.prototype._onDragLeftCancel.apply(this, [event]);
			};
			return manager;
		}, 'WRAPPER');
	}

	static ready() {
		// This is used to throttle the number of UI updates made to a set number of Frames Per Second.
		const ThrottledTemplateRefresh = throttle<(w?: AnyFunction) => void>(function (this: MeasuredTemplate, wrapped: AnyFunction) {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			TemplateTargeting.UPDATE_TARGETS.apply(this, [wrapped]);
		}, 1000 / 20);// Throttle to 20fps

		// Register for the D&D5e Ability Template preview
		// @ts-ignore
		if (game.dnd5e) {
			libWrapper.register(SETTINGS.MOD_NAME, 'game.dnd5e.canvas.AbilityTemplate.prototype.refresh', function (this: MeasuredTemplate, wrapper: AnyFunction, ...args: any) {
				ThrottledTemplateRefresh.apply(this);
				return wrapper(...args);
			}, 'WRAPPER');
		}
		// Register for the regular template movement preview
		libWrapper.register(SETTINGS.MOD_NAME, 'MeasuredTemplate.prototype.refresh', function (this: MeasuredTemplate, wrapper: AnyFunction) {
			ThrottledTemplateRefresh.apply(this, [null]);
			return wrapper();
			// return wrapper();
		}, 'WRAPPER');

		// Register for the regular template creation completion and cancellation
		const handleTemplateCreation = function (this: TemplateLayer, wrapper: AnyFunction, ...args: any) {
			// clear the highlight preview layer
			canvas.grid.getHighlightLayer('Template.null')?.clear();
			return wrapper(...args);
		};
		libWrapper.register(SETTINGS.MOD_NAME, 'TemplateLayer.prototype._onDragLeftDrop', handleTemplateCreation, 'WRAPPER');
		libWrapper.register(SETTINGS.MOD_NAME, 'TemplateLayer.prototype._onDragLeftCancel', handleTemplateCreation, 'WRAPPER');
	}

	static UPDATE_TARGETS(this: MeasuredTemplate, wrapped?: () => void) {
		const mode = SETTINGS.get<string>('template-targeting');
		const shouldAutoSelect = mode === 'always' || (mode === 'toggle' && SETTINGS.get<boolean>('template-targeting-toggle'));
		const isOwner = this.document.author.id === game.userId;
		// Release all previously targeted tokens
		if (isOwner && shouldAutoSelect && canvas.tokens.objects) {
			for (const t of game.user.targets) {
				t.setTarget(false, { releaseOthers: false, groupSelection: true });
			}
		}
		// @ts-ignore
		if (!game.dnd5e || !SETTINGS.get('template-targeting-patch5e')) {
			// Call the original function if we are not doing previews
			if (!SETTINGS.get('template-preview')) {
				wrapped?.();
			}
			// Otherwise run the 
			else {
				/************** THIS CODE IS DIRECTLY COPIED FROM 'MeasuredTemplate.prototype.highlightGrid' ****************/
				const grid = canvas.grid;
				const d = canvas.dimensions;
				const border: number = <number>this.borderColor;
				const color: number = <number>this.fillColor;

				/***** START OF CODE EDIT *****/
				// Only highlight for objects which have a defined shape
				const id: string = this.id ?? (<any>this)['_original']?.id;
				if (!this.shape) return;
				/****** END OF CODE EDIT ******/

				// Clear existing highlight
				const hl = grid.getHighlightLayer(`Template.${id ?? null}`);
				hl?.clear();

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
					return grid.grid.highlightGridPosition(hl, { border, color, shape: <any>shape });
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

				// Identify grid coordinates covered by the template Graphics
				for (let r = -nr; r < nr; r++) {
					for (let c = -nc; c < nc; c++) {
						const [gx, gy] = canvas.grid.grid.getPixelsFromGridPosition(row0 + r, col0 + c);
						const testX = (gx + hx) - this.data.x;
						const testY = (gy + hy) - this.data.y;
						const contains = ((r === 0) && (c === 0) && isCenter) || this.shape.contains(testX, testY);
						if (!contains) continue;
						grid.grid.highlightGridPosition(hl, { x: gx, y: gy, border, color });
					}
				}
			}
			// Ignore changing the target selection if we don't own the template, or `shouldAutoSelect` is false
			if (!isOwner || !shouldAutoSelect) return;
			// Get the offset of the template origin relative to the top-left grid space
			const hx = canvas.grid.w / 2;
			const hy = canvas.grid.h / 2;
			// Iterate over all existing tokens and target the ones within the template area
			for (const token of canvas.tokens.placeables) {
				if (this.shape.contains((token.x + hx) - this.data.x, (token.y + hy) - this.data.y)) {
					token.setTarget(true, { user: game.user, releaseOthers: false, groupSelection: true });
				}
			}
			/******************************************** END OF COPIED CODE ********************************************/
		} else {
			/************** THIS CODE IS DIRECTLY COPIED FROM 'MeasuredTemplate.prototype.highlightGrid' ****************/
			const grid = canvas.grid;
			const d = canvas.dimensions;
			const border = <number>this.borderColor;
			const color = this.fillColor;

			// Only highlight for objects which have a defined shape
			const id: string = this.id ?? (<any>this)['_original']?.id;
			if (!this.shape) return;

			// Clear existing highlight
			const hl = grid.getHighlightLayer(`Template.${id ?? null}`);
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
			direction = Math.toRadians((direction % 360) + 360);
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

					// Ignore changing the target selection if we don't own the template, or `shouldAutoSelect` is false
					if (!isOwner || !shouldAutoSelect) continue;
					// Iterate over all existing tokens and target the ones within the template area
					for (const token of canvas.tokens.placeables) {
						const tokenRect = new NormalizedRectangle(token.x, token.y, token.width, token.height);
						if (testRect.left >= tokenRect.right || testRect.right <= testRect.left
							|| testRect.top >= tokenRect.bottom || testRect.bottom <= tokenRect.top) continue;
						token.setTarget(true, { user: game.user, releaseOthers: false, groupSelection: true });
					}
					/****** END OF CODE EDIT ******/
				}
			}
			/******************************************** END OF COPIED CODE ********************************************/
		}
	}
}
