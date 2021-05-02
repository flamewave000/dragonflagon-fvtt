
import { CurvyWallsTools } from './CurvyWallsTools.js';
import { CurvyWallToolManager, Mode } from './CurvyWallToolManager.js';

const curvyWallApp = new CurvyWallsTools();

Hooks.on('renderSceneControls', async (controls: SceneControls) => {
	if (!game.modules.get('lib-wrapper')?.active) return;
	if (!game.user.isGM) return;
	if (controls.activeControl !== 'walls') {
		await curvyWallApp.close();
		return;
	}
	curvyWallApp.render(true);
	if (CurvyWallToolManager.instance.mode != Mode.None)
		CurvyWallToolManager.instance.render();
});
Hooks.on("ready", function () {
	if (!game.modules.get('lib-wrapper')?.active) {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error(game.i18n.localize('df-curvy-walls.errorLibWrapperMissing'));
		return;
	}
	(<Canvas>canvas).walls.bezier = CurvyWallToolManager.instance;
	CurvyWallToolManager.instance.patchWallsLayer();
});
