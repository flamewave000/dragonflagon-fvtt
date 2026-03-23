/****************************************************************************************************/
/*********** CODE CLONED AND MODIFIED FROM 'foundry.mjs' TO ACCESS INTERNAL FUNCTIONALITY ***********/
/****************************************************************************************************/

/**
 * The Scene Controls tools provide several different types of prototypical Walls to choose from
 * This method helps to translate each tool into a default wall data configuration for that type
 * @type {()=>import("./types").WallData}
 * @this {WallsLayer}
 */
const getWallDataFromActiveTool = (function () {
	const tool = game.activeTool
	// Using the clone tool
	if (tool === "clone" && this._cloneType) return this._cloneType;
	// Default wall data
	const wallData = {
		light: CONST.WALL_SENSE_TYPES.NORMAL,
		sight: CONST.WALL_SENSE_TYPES.NORMAL,
		sound: CONST.WALL_SENSE_TYPES.NORMAL,
		move: CONST.WALL_SENSE_TYPES.NORMAL
	};
	// Tool-based wall restriction types
	switch (tool) {
		case "invisible":
			wallData.sight = wallData.light = wallData.sound = CONST.WALL_SENSE_TYPES.NONE; break;
		case "terrain":
			wallData.sight = wallData.light = wallData.sound = CONST.WALL_SENSE_TYPES.LIMITED; break;
		case "ethereal":
			wallData.move = wallData.sound = CONST.WALL_SENSE_TYPES.NONE; break;
		case "doors":
			wallData.door = CONST.WALL_DOOR_TYPES.DOOR; break;
		case "secret":
			wallData.door = CONST.WALL_DOOR_TYPES.SECRET; break;
		case "window": {
			const d = canvas.dimensions.distance;
			wallData.sight = wallData.light = CONST.WALL_SENSE_TYPES.PROXIMITY;
			wallData.threshold = { light: 2 * d, sight: 2 * d, attenuation: true };
			break;
		}
	}
	return wallData;
}).bind(foundry.canvas.layers.WallsLayer);

export {
	getWallDataFromActiveTool,
};