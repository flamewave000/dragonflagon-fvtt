import SETTINGS from "../../common/Settings";

export default class SquareTemplate {
	static readonly FIX_ROTATION_PREF = 'fix-square-rotation';

	static init() {
		SETTINGS.register(SquareTemplate.FIX_ROTATION_PREF, {
			config: true,
			scope: 'world',
			name: 'DF_TEMPLATES.SquareRotateName',
			hint: 'DF_TEMPLATES.SquareRotateHint',
			type: Boolean,
			default: true,
			onChange: (toggled) => toggled ? SquareTemplate.patch() : SquareTemplate.unpatch()
		});
		if (SETTINGS.get(SquareTemplate.FIX_ROTATION_PREF))
			SquareTemplate.patch();
	}

	private static patch() {
		libWrapper.register(SETTINGS.MOD_NAME, 'MeasuredTemplate.getRectShape', SquareTemplate.MeasuredTemplate_getRectShape, 'OVERRIDE');
		libWrapper.register(SETTINGS.MOD_NAME, 'MeasuredTemplate.prototype._refreshRulerText', SquareTemplate.MeasuredTemplate_refreshRulerText, 'WRAPPER');
	}
	private static unpatch() {
		libWrapper.unregister(SETTINGS.MOD_NAME, 'MeasuredTemplate.getRectShape', false);
		libWrapper.unregister(SETTINGS.MOD_NAME, 'MeasuredTemplate.prototype._refreshRulerText', false);
	}

	static MeasuredTemplate_getRectShape(this: MeasuredTemplate, distance: number, direction: number, adjustForRoundingError = false, directionInRadians = false, distanceAdjusted = false): PIXI.Polygon {
		// This is a quick fix. In Foundry v12 the distance is provided a tenth, of what was provided in v10.
		// Need to do more testing to find out why.
		if(!distanceAdjusted)
			distance *= 10;

		// This is a quick fix. In Foundry v12 the direction is provided in radians, in v10 this was provided in degrees.
		if(!directionInRadians)
			direction = Math.toRadians(direction);

		// Generate a rotation matrix to apply the rect against. The base rotation must be rotated
		// CCW by 45° before applying the real direction rotation.
		const matrix = PIXI.Matrix.IDENTITY.rotate((-45 * (Math.PI / 180)) + direction);
		// If the shape will be used for collision, shrink the rectangle by a fixed EPSILON amount to account for rounding errors
		const EPSILON = adjustForRoundingError ? 0.0001 : 0;
		// Use simple Pythagoras to calculate the square's size from the diagonal "distance".
		const size = Math.sqrt((distance * distance) / 2) - EPSILON;
		// Create the square's 4 corners with origin being the Top-Left corner and apply the
		// rotation matrix against each.
		const topLeft = matrix.apply(new PIXI.Point(EPSILON, EPSILON));
		const topRight = matrix.apply(new PIXI.Point(size, EPSILON));
		const botLeft = matrix.apply(new PIXI.Point(EPSILON, size));
		const botRight = matrix.apply(new PIXI.Point(size, size));
		// Inject the vector data into a Polygon object to create a closed shape.
		const shape = <any>new PIXI.Polygon([topLeft.x, topLeft.y, topRight.x, topRight.y, botRight.x, botRight.y, botLeft.x, botLeft.y, topLeft.x, topLeft.y]);
		// Add these fields so that the Sequencer mod doesn't have a stroke lol
		shape.x = topLeft.x;
		shape.y = topLeft.y;
		shape.width = size;
		shape.height = size;
		return <PIXI.Polygon>shape;
	}

	private static MeasuredTemplate_refreshRulerText(this: MeasuredTemplate, wrapped: () => void): void {
		wrapped();
		// Overwrite the text for the "rect" type
		if (this.document.t === "rect") {
			// Use simple Pythagoras to calculate the square's size from the diagonal "distance".
			const size = Math.sqrt((this.document.distance * this.document.distance) / 2).toFixed(1);
			const text = `${size}${canvas.scene.grid.units}`;
			(<any>this).ruler.text = text;
		}
	}
}
