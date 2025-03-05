/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../../common/foundry.d.ts" />
/// <reference path="../../common/libWrapper.d.ts" />
/// <reference path="./types.d.ts" />
import SETTINGS from "../common/Settings.mjs";
import LineToBoxCollision from "./LineToBoxCollision.mjs";
import { TemplateConfig, HighlightMode } from "./TemplateConfig.mjs";

/**
 * @template {T}
 * @param {(...args) => void} fn
 * @param {number} [threshhold]
 * @returns {T}
 */
function throttle(fn, threshhold) {
	threshhold || (threshhold = 250);
	let last = 0;
	let hasTimer = false;
	/**@type {any[]}*/ let mostRecent;
	return function (...args) {
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

	/**@readonly*/ static #PREVIEW_PREF = "template-preview";
	/**@readonly*/ static #TARGETING_TOGGLE_PREF = "template-targeting-toggle";
	/**@readonly*/ static #TARGETING_MODE_PREF = "template-targeting";
	/**@readonly*/ static #GRIDLESS_RESOLUTION_PREF = "template-gridless-resolution";
	/**@readonly*/ static #GRIDLESS_PERCENTAGE_PREF = "template-gridless-percentage";
	/**@readonly*/ static #PointGraphContainer = new PIXI.Graphics();
	/**@type {Set<string>}*/
	static recentlyUpdated = new Set();

	static init() {
		TemplateConfig.init();

		SETTINGS.register(TemplateTargeting.#TARGETING_TOGGLE_PREF, {
			config: false,
			scope: 'client',
			type: Boolean,
			default: true,
			onChange: () => { if (SETTINGS.get(TemplateTargeting.#TARGETING_MODE_PREF) !== 'toggle') return; }
		});
		SETTINGS.register(TemplateTargeting.#TARGETING_MODE_PREF, {
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
		SETTINGS.register(TemplateTargeting.#GRIDLESS_RESOLUTION_PREF, {
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
		SETTINGS.register(TemplateTargeting.#GRIDLESS_PERCENTAGE_PREF, {
			config: true,
			scope: 'world',
			name: 'DF_TEMPLATES.GridlessPointPercentageName',
			hint: 'DF_TEMPLATES.GridlessPointPercentageHint',
			range: {
				max: 100,
				min: 0,
				step: 10
			},
			type: Number,
			default: 0
		});
		SETTINGS.register(TemplateTargeting.#PREVIEW_PREF, {
			config: true,
			scope: 'world',
			name: 'DF_TEMPLATES.PreviewName',
			hint: 'DF_TEMPLATES.PreviewHint',
			type: Boolean,
			default: true
		});
		Hooks.on('getSceneControlButtons', (/**@type {SceneControl[]}*/controls) => {
			if (SETTINGS.get(TemplateTargeting.#TARGETING_MODE_PREF) !== 'toggle') return;
			const control = controls.find(x => x.name === 'measure');
			control.tools.splice(0, 0, {
				icon: 'fas fa-bullseye',
				name: 'autoTarget',
				title: 'DF_TEMPLATES.ToggleTitle',
				visible: true,
				toggle: true,
				active: SETTINGS.get(TemplateTargeting.#TARGETING_TOGGLE_PREF),
				onClick: (/**@type {boolean}*/toggled) => { SETTINGS.set(TemplateTargeting.#TARGETING_TOGGLE_PREF, toggled); }
			});
		});

		libWrapper.register(SETTINGS.MOD_NAME, 'MeasuredTemplate.prototype.highlightGrid', this._MeasuredTemplate_highlightGrid, 'OVERRIDE');

		// When dragging a template, we need to catch the cancellation in order for us to refresh the template to draw back in its original position.
		libWrapper.register(SETTINGS.MOD_NAME, 'PlaceableObject.prototype._createInteractionManager',
			/**
			 * @this {PlaceableObject}
			 * @param {() => MouseInteractionManager} wrapper
			 * @returns {MouseInteractionManager}
			 */
			function (wrapper) {
				if (!(this instanceof MeasuredTemplate)) return wrapper();
				// We wrap the interaction manager construction method
				const manager = wrapper();
				// Replacing the `dragLeftCancel` with our own wrapper function
				manager.callbacks.dragLeftCancel = /** @this {PlaceableObject} @param {*} event */function (event) {
					PlaceableObject.prototype._onDragLeftCancel.apply(this, [event]);
					TemplateTargeting.recentlyUpdated.add(this.id);
				};
				return manager;
			}, 'WRAPPER');

		libWrapper.register(SETTINGS.MOD_NAME, 'PlaceablesLayer.prototype.clearPreviewContainer',
			/**
			 * @this {TemplatesLayer}
			 * @param {Function} wrapped
			 * @returns {any}
			 */
			function (wrapped) {
				const items = [...TemplateTargeting.recentlyUpdated.values()];
				TemplateTargeting.recentlyUpdated.clear();
				if (this instanceof TemplateLayer && items.length > 0) {
					items
						.map(x => this.get(x))
						.filter(x => !!x)
						.forEach(template => template.refresh());
				}
				return wrapped();
			}, 'WRAPPER');
	}

	static ready() {
		// This is used to throttle the number of UI updates made to a set number of Frames Per Second.
		const ThrottledTemplateRefresh = throttle(/**@this {MeasuredTemplate}*/ function () {
			TemplateTargeting._MeasuredTemplate_highlightGrid.apply(this);
		}, 1000 / 20);// Throttle to 20fps

		// Register for the D&D5e Ability Template preview
		if (game.dnd5e) {
			libWrapper.register(SETTINGS.MOD_NAME, 'game.dnd5e.canvas.AbilityTemplate.prototype.refresh',
				/**
				 * @this {MeasuredTemplate}
				 * @param {Function} wrapper
				 * @param  {...any} args
				 * @returns 
				 */
				function (wrapper, ...args) {
					ThrottledTemplateRefresh.apply(this);
					return wrapper(...args);
				}, 'WRAPPER');
		}
		// Register for the regular template movement preview
		libWrapper.register(SETTINGS.MOD_NAME, 'MeasuredTemplate.prototype.refresh',
			/**
			 * @this {MeasuredTemplate}
			 * @param {Function} wrapper
			 */
			function (wrapper) {
				ThrottledTemplateRefresh.apply(this);
				return wrapper();
			}, 'WRAPPER');

		// Register for the regular template creation completion and cancellation
		const handleTemplateCreation =
			/**
			 * @this {TemplateLayer}
			 * @param {Function} wrapper
			 * @param  {...any} args
			 */
			function (wrapper, ...args) {
				// clear the highlight preview layer
				canvas.interface.grid.getHighlightLayer('Template.null')?.clear();
				return wrapper(...args);
			};
		libWrapper.register(SETTINGS.MOD_NAME, 'TemplateLayer.prototype._onDragLeftDrop', handleTemplateCreation, 'WRAPPER');
		libWrapper.register(SETTINGS.MOD_NAME, 'TemplateLayer.prototype._onDragLeftCancel', handleTemplateCreation, 'WRAPPER');

		// Add the point graph container to the controls layer for rendering
		canvas.controls.addChild(TemplateTargeting.#PointGraphContainer);
	}

	/** @this {MeasuredTemplate}*/
	static _MeasuredTemplate_highlightGrid() {
		const mode = SETTINGS.get(TemplateTargeting.#TARGETING_MODE_PREF);
		const shouldAutoSelect = mode === 'always' || (mode === 'toggle' && SETTINGS.get(TemplateTargeting.#TARGETING_TOGGLE_PREF));
		const isOwner = this.document.author.id === game.userId;
		// Release all previously targeted tokens
		if (isOwner && shouldAutoSelect && canvas.tokens.objects) {
			for (const t of game.user.targets) {
				t.setTarget(false, { releaseOthers: false, groupSelection: true });
			}
		}
		TemplateTargeting.#_handleTouchTemplate.bind(this)(isOwner, shouldAutoSelect);
	}

	/** @this {MeasuredTemplate}*/
	static #_calculateGridTestArea() {
		/** @type { {radius?:number,points?:number[],x?:number,y?:number,width?:number,height?:number} } */
		const shape = this.shape;
		/**@type {number[]}*/
		const points = shape.points ? shape.points :
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
		const snappedTopLeft = canvas.grid.getSnappedPoint({ x: shapeBounds.left, y: shapeBounds.top }, { mode: 0, resolution: 1 });
		const snappedBottomRight = canvas.grid.getSnappedPoint({ x: shapeBounds.right, y: shapeBounds.bottom }, { mode: 0, resolution: 1 });
		[shapeBounds.left, shapeBounds.top] = [snappedTopLeft.x, snappedTopLeft.y];
		[shapeBounds.right, shapeBounds.bottom] = [snappedBottomRight.x, snappedBottomRight.y];
		return shapeBounds;
	}

	/**
	 * @this {MeasuredTemplate}
	 * @param {boolean} isOwner
	 * @param {boolean} shouldAutoSelect
	 */
	static #_handleTouchTemplate(isOwner, shouldAutoSelect) {
		// Clear the existing highlight layer
		canvas.interface.grid.clearHighlightLayer(this.highlightId);
		// Highlight colors
		const border = this.document.borderColor;
		const color = this.document.fillColor;
		/**@type {GridLayer}*/
		const grid = canvas.interface.grid;
		const d = canvas.dimensions;
		const DEBUG = SETTINGS.get('template-debug');

		// Only highlight for objects which have a defined shape
		if (!this.shape) return;

		// If we are in gridless mode, highlight the shape directly
		if (canvas.grid.type === foundry.CONST.GRID_TYPES.GRIDLESS) {
			const shape = this._getGridHighlightShape();
			canvas.interface.grid.highlightPosition(this.highlightId, { border, color, shape });
			TemplateTargeting.#_selectTokensByPointContainment.bind(this)(isOwner, shouldAutoSelect, this, this.shape, true);
			return;
		}

		// Extract and prepare data
		let { direction, distance, angle, width } = this.document;
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
				this.document.x,
				this.document.y,
				this.document.x + (Math.cos(direction - (angle / 2)) * rayLength),
				this.document.y + (Math.sin(direction - (angle / 2)) * rayLength)
			];
			[ax2, ay2, bx2, by2] = [
				this.document.x,
				this.document.y,
				this.document.x + (Math.cos(direction + (angle / 2)) * rayLength),
				this.document.y + (Math.sin(direction + (angle / 2)) * rayLength)
			];
		};
		const generateRayData = () => {
			if (coneInitialized) return;
			[ax1, ay1] = [
				this.document.x + (Math.cos(direction - (Math.PI / 2)) * (width / 2)),
				this.document.y + (Math.sin(direction - (Math.PI / 2)) * (width / 2))
			];
			[bx1, by1] = [
				ax1 + (Math.cos(direction) * distance),
				ay1 + (Math.sin(direction) * distance)
			];
			[ax2, ay2] = [
				this.document.x + (Math.cos(direction + (Math.PI / 2)) * (width / 2)),
				this.document.y + (Math.sin(direction + (Math.PI / 2)) * (width / 2))
			];
			[bx2, by2] = [
				ax2 + (Math.cos(direction) * distance),
				ay2 + (Math.sin(direction) * distance)
			];
		};

		const shapeBounds = this.shape.getBounds();
		const { x: ox, y: oy } = this.document;
		shapeBounds.x += ox;
		shapeBounds.y += oy;
		shapeBounds.fit(canvas.dimensions.rect);
		// shapeBounds.pad(canvas.grid.size);
		const [i0, j0, i1, j1] = canvas.grid.getOffsetRange(shapeBounds);
		// Identify grid coordinates covered by the template Graphics
		//? Start on -1 to account for padding ring of cells around test area
		for (let i = i0; i < i1; i++) {
			//? Start on -1 to account for padding ring of cells around test area
			for (let j = j0; j < j1; j++) {
				const offset = canvas.grid.getTopLeftPoint({ i, j });
				let { x: testX, y: testY } = canvas.grid.getCenterPoint(offset);
				const testRect = new PIXI.Rectangle(offset.x, offset.y, canvas.grid.sizeX, canvas.grid.sizeY).normalize();
				// We want to shrink the box by 1/10 of a pixel to prevent rounding errors
				testRect.pad(-0.1);
				let contains = false;
				switch (this.document.t) {
					case "circle": {
						contains = this.shape.contains(testX - this.document.x, testY - this.document.y);
						if (contains || TemplateConfig.config.circle === HighlightMode.CENTER) break;

						const sqrDistance = distance * distance;
						let [vx, vy] = [0, 0];
						const testPoint = (/**@type {number}*/x,/**@type {number}*/y) => {
							[vx, vy] = [x - this.document.x, y - this.document.y];
							return (vx * vx + vy * vy) < sqrDistance;
						};

						contains = testPoint(testRect.left, testRect.top)
							|| testPoint(testRect.right, testRect.top)
							|| testPoint(testRect.left, testRect.bottom)
							|| testPoint(testRect.right, testRect.bottom);
						break;
					}
					case "rect": {
						const rect = MeasuredTemplate.getRectShape(this.document.distance, this.document.direction, true);
						if (rect instanceof PIXI.Polygon) {
							contains = this.shape.contains(testX - this.document.x, testY - this.document.y);
							if (contains || TemplateConfig.config.rect === HighlightMode.CENTER) break;
							/* Rectangle vertex data order
								A1───▶B1
								▲      │
								│      ▼
								A2◀───B2
							*/
							// Translate points to the position of the MeasuredTemplate and map the points to the dataset
							[ax1, ay1, bx1, by1, bx2, by2, ax2, ay2] = rect.points.map((e, i) => e + (i % 2 ? this.document.y : this.document.x));
							// check the top line
							contains = LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax1, ay1, bx1, by1, testRect)
								// check the right line
								|| LineToBoxCollision.cohenSutherlandLineClipAndDraw(bx1, by1, bx2, by2, testRect)
								// check the bottom line
								|| LineToBoxCollision.cohenSutherlandLineClipAndDraw(bx2, by2, ax2, ay2, testRect)
								// check the left line
								|| LineToBoxCollision.cohenSutherlandLineClipAndDraw(ax2, ay2, ax1, ay1, testRect);
						} else {
							rect.x += this.document.x;
							rect.y += this.document.y;
							// Standard 2D Box Collision detection
							contains = !(rect.left >= testRect.right || rect.right <= testRect.left
								|| rect.top >= testRect.bottom || rect.bottom <= testRect.top);
						}
						break;
					}
					case "cone": {
						contains = this.shape.contains(testX - this.document.x, testY - this.document.y);
						if (contains || TemplateConfig.config.cone === HighlightMode.CENTER) break;

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
							const testPoint = (/**@type {number}*/x,/**@type {number}*/y) => {
								[vx, vy] = [x - this.document.x, y - this.document.y];
								return (vx * vx + vy * vy) < sqrDistance;
							};
							const testAngle = () => {
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
									return vecAngle < maxAngle || vecAngle > ((Math.PI * 2) + minAngle);
								else if (maxAngle > Math.PI * 2)
									return vecAngle < (maxAngle - (Math.PI * 2)) || vecAngle > minAngle;
								else return vecAngle < maxAngle && vecAngle > minAngle;
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
						contains = this.shape.contains(testX - this.document.x, testY - this.document.y);
						if (contains || TemplateConfig.config.ray === HighlightMode.CENTER) break;
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
				try {
					grid.highlightPosition(this.highlightId, { x: offset.x, y: offset.y, border, color: DEBUG ? (contains ? 0x00FF00 : 0xFF0000) : color });
				}
				catch (error) {
					// Catches a specific "highlight" error that will randomly occur inside of `grid.canvas.grid.highlightGridPosition()`
					if (!(error instanceof Error) || !error.message.includes("'highlight'")) throw error;
				}
				if (!contains) continue;

				// Ignore changing the target selection if we don't own the template, or `shouldAutoSelect` is false
				if (!isOwner || !shouldAutoSelect) continue;

				// If we are using Point based targetting for this template
				if (TemplateConfig.config[this.document.t] === HighlightMode.POINTS) {
					TemplateTargeting.#_selectTokensByPointContainment.bind(this)(isOwner, shouldAutoSelect, this.document, this.shape, true);
					continue;
				}
				// Iterate over all existing tokens and target the ones within the template area
				for (const token of canvas.tokens.placeables) {
					const tokenRect = new PIXI.Rectangle(token.x, token.y, token.w, token.h).normalize();
					if (testRect.left >= tokenRect.right || testRect.right <= tokenRect.left
						|| testRect.top >= tokenRect.bottom || testRect.bottom <= tokenRect.top) continue;
					token.setTarget(true, { user: game.user, releaseOthers: false, groupSelection: true });
				}
			}
		}
	}

	/**
	 * @this MeasuredTemplate
	 * @param {boolean} isOwner
	 * @param {boolean} shouldAutoSelect
	 * @param { { x: number, y: number } } data
	 * @param {PIXI.Polygon} shape
	 * @param {boolean} useMultiPointTest
	 * @returns 
	 */
	static #_selectTokensByPointContainment(isOwner, shouldAutoSelect, data, shape, useMultiPointTest = false) {
		//* THIS CODE WAS ORIGINALLY COPIED FROM `MeasuredTemplate.prototype.highlightGrid`
		// Ignore changing the target selection if we don't own the template, or `shouldAutoSelect` is false
		if (!isOwner || !shouldAutoSelect) return;

		const DebugMode = SETTINGS.get('template-debug');
		TemplateTargeting.#PointGraphContainer.clear();
		TemplateTargeting.#PointGraphContainer.removeChildren();
		/**@type {PIXI.Graphics}*/
		let pointGraphics;
		if (DebugMode) {
			pointGraphics = new PIXI.Graphics();
			TemplateTargeting.#PointGraphContainer.addChild(pointGraphics);
		}
		// If we are multi-point grab the gridless resolution, otherwise we test for each grid square center
		const pointResolution = useMultiPointTest ? SETTINGS.get(TemplateTargeting.#GRIDLESS_RESOLUTION_PREF) : 1;
		// Iterate over all existing tokens and target the ones within the template area
		for (const token of canvas.tokens.placeables) {
			// Get the center offset of the token
			const hx = token.w / 2;
			const hy = token.h / 2;
			// Adjust the token position to be relative to the template
			const [tokenX, tokenY] = [token.x - data.x, token.y - data.y];
			// Calculate how many points there should be along the X and Y axes
			let horPoints = pointResolution > 1 ? (token.w / canvas.grid.sizeX).toNearest(1) * (pointResolution - 1) + 1 : Math.ceil(token.w / canvas.grid.sizeX);
			let verPoints = pointResolution > 1 ? (token.h / canvas.grid.sizeY).toNearest(1) * (pointResolution - 1) + 1 : Math.ceil(token.h / canvas.grid.sizeY);
			// Make a small adjustment for tokens smaller than 1x1
			if (token.w / canvas.grid.sizeX < 1) horPoints = Math.floor(horPoints);
			if (token.h / canvas.grid.sizeY < 1) verPoints = Math.floor(verPoints);
			// Calculate the distance between each point on the vertical and horizontal
			const horStep = horPoints > 1 ? token.w / (horPoints - 1) : token.w;
			const verStep = verPoints > 1 ? token.h / (verPoints - 1) : token.h;
			// Generate the points relative to the token position
			let x = 0;
			let y = 0;
			let pointFound = false;
			const percentage = SETTINGS.get(TemplateTargeting.#GRIDLESS_PERCENTAGE_PREF) / 100;
			const pointCount = verPoints * horPoints;
			let hitCount = 0;
			for (let row = 0; !pointFound && row < verPoints; row++) {
				for (let col = 0; col < horPoints; col++) {
					if (pointResolution > 1) {
						x = horPoints > 1 ? tokenX + (horStep * col) : tokenX + hx;
						y = verPoints > 1 ? tokenY + (verStep * row) : tokenY + hy;
					}
					else {
						x = horPoints > 1 ? tokenX + (canvas.grid.sizeX * col) + (canvas.grid.sizeX / 2) : tokenX + hx;
						y = verPoints > 1 ? tokenY + (canvas.grid.sizeY * row) + (canvas.grid.sizeY / 2) : tokenY + hy;
					}
					// If the point is not contained in the shape, ignore it
					if (!shape.contains(x, y)) {
						if (DebugMode) {
							pointGraphics.beginFill(0xFF0000);
							pointGraphics.drawCircle(x + data.x, y + data.y, 3);
							pointGraphics.endFill();
						}
						continue;
					}
					if (DebugMode) {
						pointGraphics.beginFill(0x00FF00);
						pointGraphics.drawCircle(x + data.x, y + data.y, 3);
						pointGraphics.endFill();
					}
					// Increment our hit count for percentage based targetting
					hitCount++;
					// If we target on touch or hit our required percentage
					if (percentage === 0 || (hitCount / pointCount).toNearest(0.1) >= percentage) {
						// Mark the token as selected
						token.setTarget(true, { user: game.user, releaseOthers: false, groupSelection: true });
						if (!DebugMode) {
							pointFound = true;
							break;
						}
					}
				}
			}
		}
	}
}
