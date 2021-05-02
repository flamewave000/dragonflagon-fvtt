
import { CurvyWallsTools } from './CurvyWallsTools.js';
import { CurvyWallToolManager, Mode } from './CurvyWallToolManager.js';
import SETTINGS from './lib/Settings.js';

const curvyWallApp = new CurvyWallsTools();
SETTINGS.init('df-curvy-walls');

Hooks.once('init', function() {
	SETTINGS.register(CurvyWallsTools.PREF_PRESERVE, {
		scope: 'world',
		type: Boolean,
		config: true,
		default: true,
		name: 'df-curvy-walls.SettingPreserve_Name',
		hint: 'df-curvy-walls.SettingPreserve_Hint',
	});
});

Hooks.once("ready", function () {
	if (!game.modules.get('lib-wrapper')?.active) {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error(game.i18n.localize('df-curvy-walls.errorLibWrapperMissing'));
		return;
	}
	(<Canvas>canvas).walls.bezier = CurvyWallToolManager.instance;
	CurvyWallToolManager.instance.patchWallsLayer();
});

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
