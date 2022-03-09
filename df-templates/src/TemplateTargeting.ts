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

	private static readonly PREVIEW_PREF = "template-preview";
	private static readonly TARGETING_TOGGLE_PREF = "template-targeting-toggle";
	private static readonly TARGETING_MODE_PREF = "template-targeting";
	private static readonly GRIDLESS_RESOLUTION_PREF = "template-gridless-resolution";
	private static readonly PATCH_5E_PREF = "template-targeting-patch5e";
	private static readonly PATCH_5E_CIRCLE_PREF = "template-targeting-patch5e-circle";

	private static readonly PointGraphContainer = new PIXI.Graphics();

	private static toggleTemplatePatch(enabled: boolean) {
		libWrapper.unregister(SETTINGS.MOD_NAME, 'MeasuredTemplate.prototype.highlightGrid', false);
		libWrapper.register(SETTINGS.MOD_NAME, 'MeasuredTemplate.prototype.highlightGrid', this._MeasuredTemplate_highlightGrid, enabled ? 'OVERRIDE' : 'WRAPPER');
	}

	static init() {
		SETTINGS.register(TemplateTargeting.TARGETING_TOGGLE_PREF, {
			config: false,
			scope: 'client',
			type: Boolean,
			default: true,
			onChange: () => { if (SETTINGS.get(TemplateTargeting.TARGETING_MODE_PREF) !== 'toggle') return; }
		});
		SETTINGS.register(TemplateTargeting.TARGETING_MODE_PREF, {
			config: true,
			scope: 'world',
			name: 'DF_TEMPLATES.AutoTargetName',
			hint: 'DF_TEMPLATES.AutoTargetHint',
			type: String,
			choices: {
				never: 'Never',
				toggle: 'Toggle (Add toggle button)',
				always: 'Always'
			},
			default: 'toggle',
			onChange: () => { ui.controls.initialize(); ui.controls.render(true); }
		});
		SETTINGS.register<number>(TemplateTargeting.GRIDLESS_RESOLUTION_PREF, {
			config: true,
			scope: 'world',
			name: 'DF_TEMPLATES.GridlessPointResolutionName',
			hint: 'DF_TEMPLATES.GridlessPointResolutionHint',
			range: {
				max: 10,
				min: 1,
				step: 1
			},
			type: Number,
			default: 3
		});
		SETTINGS.register(TemplateTargeting.PREVIEW_PREF, {
			config: true,
			scope: 'world',
			name: 'DF_TEMPLATES.PreviewName',
			hint: 'DF_TEMPLATES.PreviewHint',
			type: Boolean,
			default: true,
			onChange: (newValue: boolean) => TemplateTargeting.toggleTemplatePatch(newValue || SETTINGS.get(TemplateTargeting.PATCH_5E_PREF))
		});
		SETTINGS.register(TemplateTargeting.PATCH_5E_PREF, {
			name: 'DF_TEMPLATES.Patch5e_Name',
			hint: 'DF_TEMPLATES.Patch5e_Hint',
			config: true,
			type: Boolean,
			default: false,
			scope: 'world',
			onChange: (newValue: boolean) => {
				TemplateTargeting.toggleTemplatePatch(newValue || SETTINGS.get(TemplateTargeting.PREVIEW_PREF));
				canvas.templates?.placeables.forEach((t: MeasuredTemplate) => t.draw());
			}
		});
		SETTINGS.register(TemplateTargeting.PATCH_5E_CIRCLE_PREF, {
			name: 'DF_TEMPLATES.Patch5e_Circle_Name',
			hint: 'DF_TEMPLATES.Patch5e_Circle_Hint',
			config: true,
			type: Boolean,
			default: false,
			scope: 'world',
			onChange: () => canvas.templates?.placeables.filter((t: MeasuredTemplate) => t.data.t === "circle")
				.forEach((t: MeasuredTemplate) => t.draw())
		});
		libWrapper.register(SETTINGS.MOD_NAME, 'MeasuredTemplate.prototype.highlightGrid', this._MeasuredTemplate_highlightGrid,
			SETTINGS.get(TemplateTargeting.PATCH_5E_PREF) || SETTINGS.get(TemplateTargeting.PREVIEW_PREF) ? 'OVERRIDE' : 'WRAPPER');

		Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
			if (SETTINGS.get(TemplateTargeting.TARGETING_MODE_PREF) !== 'toggle') return;
			const control = controls.find(x => x.name === 'measure');
			control.tools.splice(0, 0, {
				icon: 'fas fa-bullseye',
				name: 'autoTarget',
				title: 'DF_TEMPLATES.ToggleTitle',
				visible: true,
				toggle: true,
				active: SETTINGS.get(TemplateTargeting.TARGETING_TOGGLE_PREF),
				onClick: (toggled: boolean) => { SETTINGS.set(TemplateTargeting.TARGETING_TOGGLE_PREF, toggled); }
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
			TemplateTargeting._MeasuredTemplate_highlightGrid.apply(this, [wrapped]);
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

		// Add the point graph container to the controls layer for rendering
		canvas.controls.addChild(TemplateTargeting.PointGraphContainer);
	}

	private static _MeasuredTemplate_highlightGrid(this: MeasuredTemplate, wrapped?: () => void) {
		const mode = SETTINGS.get<string>(TemplateTargeting.TARGETING_MODE_PREF);
		const shouldAutoSelect = mode === 'always' || (mode === 'toggle' && SETTINGS.get<boolean>(TemplateTargeting.TARGETING_TOGGLE_PREF));
		const isOwner = this.document.author.id === game.userId;
		// Release all previously targeted tokens
		if (isOwner && shouldAutoSelect && canvas.tokens.objects) {
			for (const t of game.user.targets) {
				t.setTarget(false, { releaseOthers: false, groupSelection: true });
			}
		}
		// @ts-ignore
		if (!game.dnd5e || !SETTINGS.get(TemplateTargeting.PATCH_5E_PREF)) {
			TemplateTargeting._handleCoreTemplate.bind(this)(isOwner, shouldAutoSelect, wrapped);
		} else {
			TemplateTargeting._handleDnD5eTemplate.bind(this)(isOwner, shouldAutoSelect);
		}
	}

	private static _calculateGridTestArea(this: MeasuredTemplate) {
		const shape: {
			radius?: number,
			points?: number[],
			x?: number,
			y?: number,
			width?: number,
			height?: number
		} = <any>this.shape;
		const points: number[] = shape.points ? shape.points :
			(shape.radius ?
				[-shape.radius, -shape.radius, shape.radius, shape.radius] :
				[shape.x, shape.y, shape.x + shape.width, shape.y + shape.height]);
		const shapeBounds = {
			left: Number.MAX_VALUE, right: Number.MIN_VALUE,
			top: Number.MAX_VALUE, bottom: Number.MIN_VALUE,
			width: function () { return this.right - this.left; },
			height: function () { return this.bottom - this.top; }
		};
		for (let c = 0; c < points.length; c += 2) {
			if (points[c] < shapeBounds.left) shapeBounds.left = points[c];
			if (points[c] > shapeBounds.right) shapeBounds.right = points[c];
			if (points[c + 1] < shapeBounds.top) shapeBounds.top = points[c + 1];
			if (points[c + 1] > shapeBounds.bottom) shapeBounds.bottom = points[c + 1];
		}
		const snappedTopLeft = canvas.grid.grid.getSnappedPosition(shapeBounds.left, shapeBounds.top, 1);
		const snappedBottomRight = canvas.grid.grid.getSnappedPosition(shapeBounds.right, shapeBounds.bottom, 1);
		[shapeBounds.left, shapeBounds.top] = [snappedTopLeft.x, snappedTopLeft.y];
		[shapeBounds.right, shapeBounds.bottom] = [snappedBottomRight.x, snappedBottomRight.y];
		return shapeBounds;
	}

	private static _handleCoreTemplate(this: MeasuredTemplate, isOwner: boolean, shouldAutoSelect: boolean, wrapped?: () => void) {
		// Call the original function if we are not doing previews
		if (!SETTINGS.get(TemplateTargeting.PREVIEW_PREF)) {
			wrapped?.();
		}
		// Otherwise run the 
		else {
			/************** THIS CODE IS DIRECTLY COPIED FROM 'MeasuredTemplate.prototype.highlightGrid' ****************/
			const grid = canvas.grid;
			const border: number = <number>this.borderColor;
			const color: number = <number>this.fillColor;
			const DEBUG = SETTINGS.get('template-debug');

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
				//* REMOVED THE RETURN STATEMENT HERE
				grid.grid.highlightGridPosition(hl, { border, color, shape: <PIXI.Polygon>shape });
				//* ADDED THIS TOKEN TARGETTING CALL
				TemplateTargeting._selectTokensByPointContainment.bind(this)(isOwner, shouldAutoSelect, this.data, <PIXI.Polygon>this.shape);
				//* MOVED RETURN TO AFTER TOKEN SELECTION
				return;
			}
			// Get number of rows and columns
			const shapeBounds = TemplateTargeting._calculateGridTestArea.apply(this);
			const colCount = Math.ceil(shapeBounds.width() / grid.w) + 2; //? Add a padding ring around for any outlier cases
			const rowCount = Math.ceil(shapeBounds.height() / grid.h) + 2; //? Add a padding ring around for any outlier cases

			// Get the offset of the template origin relative to the top-left grid space
			const [tx, ty] = canvas.grid.getTopLeft(this.data.x, this.data.y);
			const [row0, col0] = grid.grid.getGridPositionFromPixels(shapeBounds.left + tx, shapeBounds.top + ty);
			const hx = canvas.grid.w / 2;
			const hy = canvas.grid.h / 2;

			// Identify grid coordinates covered by the template Graphics
			for (let r = -1; r < rowCount; r++) {
				for (let c = -1; c < colCount; c++) {
					const [gx, gy] = canvas.grid.grid.getPixelsFromGridPosition(row0 + r, col0 + c);
					const testX = (gx + hx) - this.data.x;
					const testY = (gy + hy) - this.data.y;
					const contains = (testX === 0 && testY === 0) || this.shape.contains(testX, testY);
					if (!DEBUG && !contains) continue;
					try { grid.grid.highlightGridPosition(hl, { x: gx, y: gy, border, color: DEBUG ? (contains ? 0x00FF00 : 0xFF0000) : color }); }
					catch (error) {
						// Catches a specific "highlight" error that will randomly occur inside of `grid.grid.highlightGridPosition()`
						if (!(error instanceof Error) || error.message.includes("'highlight'")) throw error;
					}
					if (!contains) continue;
				}
			}
			//* MOVED TOKEN SELECTION TO SEPARATE FUNCTION
			TemplateTargeting._selectTokensByPointContainment.bind(this)(isOwner, shouldAutoSelect, this.data, <PIXI.Polygon>this.shape);
		}
		/******************************************** END OF COPIED CODE ********************************************/
	}

	private static _handleDnD5eTemplate(this: MeasuredTemplate, isOwner: boolean, shouldAutoSelect: boolean) {
		/************** THIS CODE IS DIRECTLY COPIED FROM 'MeasuredTemplate.prototype.highlightGrid' ****************/
		const grid = canvas.grid;
		const d = canvas.dimensions;
		const border = <number>this.borderColor;
		const color = <number>this.fillColor;
		const DEBUG = SETTINGS.get('template-debug');

		// Only highlight for objects which have a defined shape
		const id: string = this.id ?? (<any>this)['_original']?.id;
		if ((!this.id && !SETTINGS.get(TemplateTargeting.PREVIEW_PREF)) || !this.shape) return;

		// Clear existing highlight
		const hl = grid.getHighlightLayer(`Template.${id ?? null}`);
		hl?.clear();

		// If we are in gridless mode, highlight the shape directly
		if (grid.type === CONST.GRID_TYPES.GRIDLESS) {
			const shape = this.shape.clone();
			//* ADDED CODE: This try-catch was added to handle a random error that occurs where
			//* Foundry Core tries to update the MeasuredTemplate when it doesn't have a position.
			try {
				if ("points" in shape) {
					shape.points = shape.points.map((p, i) => {
						if (i % 2) return this.y + p;
						else return this.x + p;
					});
				} else {
					shape.x += this.x;
					shape.y += this.y;
				}
			}// eslint-disable-next-line no-empty
			catch (error) { }
			grid.grid.highlightGridPosition(hl, { border, color: <any>color, shape: <any>shape });
			TemplateTargeting._selectTokensByPointContainment.bind(this)(isOwner, shouldAutoSelect, this.data, <PIXI.Polygon>this.shape, true);
			return;
		}

		// Get number of rows and columns
		const shapeBounds = TemplateTargeting._calculateGridTestArea.apply(this);
		const colCount = Math.ceil(shapeBounds.width() / grid.w) + 2; //? Add a padding ring around for any outlier cases
		const rowCount = Math.ceil(shapeBounds.height() / grid.h) + 2; //? Add a padding ring around for any outlier cases

		// Get the offset of the template origin relative to the top-left grid space
		const [tx, ty] = canvas.grid.getTopLeft(this.data.x, this.data.y);
		const [row0, col0] = grid.grid.getGridPositionFromPixels(shapeBounds.left + tx, shapeBounds.top + ty);
		const hx = canvas.grid.w / 2;
		const hy = canvas.grid.h / 2;

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
		//? Start on -1 to account for padding ring of cells around test area
		for (let r = -1; r < rowCount; r++) {
			//? Start on -1 to account for padding ring of cells around test area
			for (let c = -1; c < colCount; c++) {
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
						if (contains || !SETTINGS.get(TemplateTargeting.PATCH_5E_CIRCLE_PREF)) break;

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
						const rect = (this as any)._getRectShape(direction, distance, true);
						if (rect instanceof PIXI.Polygon) {
							contains = this.shape.contains(testX - this.data.x, testY - this.data.y);
							if (contains) break;
							/* Rectangle vertex data order
								A1───▶B1
								▲      │
								│      ▼
								A2◀───B2
							*/
							// Translate points to the position of the MeasuredTemplate and map the points to the dataset
							[ax1, ay1, bx1, by1, bx2, by2, ax2, ay2] = rect.points.map((e, i) => e + (i % 2 ? this.data.y : this.data.x));
							// check the top line
							contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax1, ay1, bx1, by1, testRect)
								// check the right line
								|| LineToBoxCollision.cohenSutherlandLineClipAndDraw(bx1, by1, bx2, by2, testRect)
								// check the bottom line
								|| LineToBoxCollision.cohenSutherlandLineClipAndDraw(bx2, by2, ax2, ay2, testRect)
								// check the left line
								|| LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax2, ay2, ax1, ay1, testRect);
						} else {
							rect.x += this.data.x;
							rect.y += this.data.y;
							// The normalized rectangle always adds 1 to the width and height
							rect.width -= 1;
							rect.height -= 1;
							// Standard 2D Box Collision detection
							contains = !(rect.left >= testRect.right || rect.right <= testRect.left
								|| rect.top >= testRect.bottom || rect.bottom <= testRect.top);
						}
						break;
					}
					case "cone": {
						contains = this.shape.contains(testX - this.data.x, testY - this.data.y);
						if (contains) break;
						generateConeData();
						// check the top line
						contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax1, ay1, bx1, by1, testRect);
						if (contains) break;
						// check the bottom line
						contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax2, ay2, bx2, by2, testRect);
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
							contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(bx1, by1, bx2, by2, testRect);
						break;
					}
					case "ray": {
						contains = this.shape.contains(testX - this.data.x, testY - this.data.y);
						if (contains) break;
						generateRayData();
						// check the top line
						contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax1, ay1, bx1, by1, testRect)
							// check the bottom line
							|| LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax2, ay2, bx2, by2, testRect)
							// check the left endcap line
							|| LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax1, ay1, ax2, ay2, testRect)
							// check the right endcap line
							|| LineToBoxCollision.cohenSutherlandLineClipAndDraw(bx1, by1, bx2, by2, testRect);
						break;
					}
				}

				if (!DEBUG && !contains) continue;
				try { grid.grid.highlightGridPosition(hl, { x: gx, y: gy, border, color: DEBUG ? (contains ? 0x00FF00 : 0xFF0000) : color }); }
				catch (error) {
					// Catches a specific "highlight" error that will randomly occur inside of `grid.grid.highlightGridPosition()`
					if (!(error instanceof Error) || error.message.includes("'highlight'")) throw error;
				}
				if (!contains) continue;

				// Ignore changing the target selection if we don't own the template, or `shouldAutoSelect` is false
				if (!isOwner || !shouldAutoSelect) continue;
				// Iterate over all existing tokens and target the ones within the template area
				for (const token of canvas.tokens.placeables) {
					const tokenRect = new NormalizedRectangle(token.x, token.y, token.w, token.h);
					if (testRect.left >= tokenRect.right || testRect.right <= tokenRect.left
						|| testRect.top >= tokenRect.bottom || testRect.bottom <= tokenRect.top) continue;
					token.setTarget(true, { user: game.user, releaseOthers: false, groupSelection: true });
				}
				/****** END OF CODE EDIT ******/
			}
		}
		/******************************************** END OF COPIED CODE ********************************************/
	}

	private static _selectTokensByPointContainment(this: MeasuredTemplate, isOwner: boolean, shouldAutoSelect: boolean, data: { x: number, y: number }, shape: PIXI.Polygon, useMultiPointTest: boolean = false) {
		//* THIS CODE WAS ORIGINALLY COPIED FROM `MeasuredTemplate.prototype.highlightGrid`
		// Ignore changing the target selection if we don't own the template, or `shouldAutoSelect` is false
		if (!isOwner || !shouldAutoSelect) return;

		const DebugMode = SETTINGS.get<boolean>('template-debug');
		TemplateTargeting.PointGraphContainer.clear();
		TemplateTargeting.PointGraphContainer.removeChildren();
		let pointGraphics: PIXI.Graphics;
		if (DebugMode) {
			pointGraphics = new PIXI.Graphics();
			TemplateTargeting.PointGraphContainer.addChild(pointGraphics);
		}
		// If we are multi-point grab the gridless resolution, otherwise we test for each grid square center
		const pointResolution = useMultiPointTest ? SETTINGS.get<number>(TemplateTargeting.GRIDLESS_RESOLUTION_PREF) : 1;
		// Iterate over all existing tokens and target the ones within the template area
		for (const token of canvas.tokens.placeables) {
			// Get the center offset of the token
			const hx = token.w / 2;
			const hy = token.h / 2;
			// Adjust the token position to be relative to the template
			const [tokenX, tokenY] = [token.x - data.x, token.y - data.y];
			// Calculate how many points there should be along the X and Y axes
			let horPoints = pointResolution > 1 ? Math.roundDecimals(token.w / canvas.grid.w, 1) * (pointResolution - 1) + 1 : Math.ceil(token.w / canvas.grid.w);
			let verPoints = pointResolution > 1 ? Math.roundDecimals(token.h / canvas.grid.h, 1) * (pointResolution - 1) + 1 : Math.ceil(token.h / canvas.grid.h);
			// Make a small adjustment for tokens smaller than 1x1
			if (token.w / canvas.grid.w < 1) horPoints = Math.floor(horPoints);
			if (token.h / canvas.grid.h < 1) verPoints = Math.floor(verPoints);
			// Calculate the distance between each point on the vertical and horizontal
			const horStep = horPoints > 1 ? token.w / (horPoints - 1) : token.w;
			const verStep = verPoints > 1 ? token.h / (verPoints - 1) : token.h;
			// Generate the points relative to the token position
			let x = 0;
			let y = 0;
			let pointFound = false;
			if (DebugMode) pointGraphics.beginFill(0xFF0000);
			for (let row = 0; !pointFound && row < verPoints; row++) {
				for (let col = 0; col < horPoints; col++) {
					if (pointResolution > 1) {
						x = horPoints > 1 ? tokenX + (horStep * col) : tokenX + hx;
						y = verPoints > 1 ? tokenY + (verStep * row) : tokenY + hy;
					}
					else {
						x = horPoints > 1 ? tokenX + (canvas.grid.w * col) + (canvas.grid.w / 2) : tokenX + hx;
						y = verPoints > 1 ? tokenY + (canvas.grid.h * row) + (canvas.grid.h / 2) : tokenY + hy;
					}
					if (DebugMode) pointGraphics.drawCircle(x + data.x, y + data.y, 3);
					// If the point is not contained in the shape, ignore it
					if (!shape.contains(x, y)) continue;
					// Otherwise, mark the token as selected
					token.setTarget(true, { user: game.user, releaseOthers: false, groupSelection: true });
					if (!DebugMode) {
						pointFound = true;
						break;
					}
				}
			}
			if (DebugMode) pointGraphics.endFill();
		}
	}
}
