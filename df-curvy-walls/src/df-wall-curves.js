import { BezierControl, Mode } from './BezierControl.js';
import { BezierToolBar } from './BezierToolBar.js';

Hooks.on("ready", function () {
	if (!game.modules.get('lib-wrapper')?.active) {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error(game.i18n.localize('df-curvy-walls.errorLibWrapperMissing'));
		return;
	}
	canvas.walls.bezier = BezierControl.instance;
	BezierControl.instance.patchWallsLayer();
})

Hooks.on("getSceneControlButtons", (controls) => {
	if (!game.modules.get('lib-wrapper')?.active) return;
	if (!game.user.isGM) return;
	BezierControl.instance.injectControls(controls);
});

var toolbar = null;
var prevMode = Mode.None;
Hooks.on('renderSceneControls', async controls => {
	if (!game.modules.get('lib-wrapper')?.active) return;
	if (!game.user.isGM) return;
	if (controls.activeControl === 'walls' && BezierControl.instance.mode != Mode.None) {
		if (prevMode == BezierControl.instance.mode) {
			BezierControl.instance.render();
			return;
		}
		if (toolbar != null) {
			const promise = toolbar.close({ force: true });
			toolbar = null;
			await promise;
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
		const promise = toolbar.close({ force: true });
		toolbar = null;
		prevMode = Mode.None;
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