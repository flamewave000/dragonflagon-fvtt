import BezierControl from './BezierControl.js';

Hooks.on("ready", function () {
	canvas.walls.bezier = BezierControl.instance;
	BezierControl.instance.patchWallsLayer();
})

Hooks.on("getSceneControlButtons", (controls) => {
	if (!game.user.isGM) return;

	BezierControl.instance.injectControls(controls);

	// BezierControl.
});
