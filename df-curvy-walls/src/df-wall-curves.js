import { BezierControl, Mode } from './BezierControl.js';
import { BezierToolBar } from './BezierToolBar.js';

Hooks.on("ready", function () {
	canvas.walls.bezier = BezierControl.instance;
	BezierControl.instance.patchWallsLayer();
})

Hooks.on("getSceneControlButtons", (controls) => {
	if (!game.user.isGM) return;
	BezierControl.instance.injectControls(controls);
});

var toolbar = null;
var prevMode = Mode.None;
Hooks.on('renderSceneControls', async controls => {
	if (!game.user.isGM) return;
	if (controls.activeControl === 'walls' && BezierControl.instance.mode != Mode.None) {
		if (prevMode == BezierControl.instance.mode) {
			BezierControl.instance.render();
			return;
		}
		if (toolbar != null) {
			await toolbar.close({ force: true });
			(toolbar = new BezierToolBar()).render(true);
			BezierControl.instance.clearTool();
		} else {
			(toolbar = new BezierToolBar()).render(true);
			BezierControl.instance.render();
		}
		prevMode = BezierControl.instance.mode;
	}
	else {
		if (!toolbar) return;
		const promise = toolbar.close();
		toolbar = null;
		await promise;
	}
});

function setToolBarPosition() {
	const tools = $(toolbar.form).parent();
	if (!tools) return;
	const curveTools = $('li[data-tool=beziercube]').offset();
	tools.css({ top: `${curveTools.top}px`, left: `${curveTools.left + 44}px` });
}

Hooks.on('renderBezierToolBar', setToolBarPosition);