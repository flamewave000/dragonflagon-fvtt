import {} from '../../common/global';
import { CurvyWallsToolBar } from './CurvyWallsToolBar';
import { CurvyWallToolManager, Mode } from './CurvyWallToolManager';
import SETTINGS from "../../common/Settings";

const curvyWallApp = new CurvyWallsToolBar();
SETTINGS.init('df-curvy-walls');

Hooks.once('init', function() {
	SETTINGS.register(CurvyWallsToolBar.PREF_PRESERVE, {
		scope: 'world',
		type: Boolean,
		config: true,
		default: true,
		name: 'df-curvy-walls.SettingPreserve_Name',
		hint: 'df-curvy-walls.SettingPreserve_Hint',
	});
	SETTINGS.register(CurvyWallToolManager.PREF_DROP_KEY, {
		name: 'df-curvy-walls.SettingDropKey_Name',
		hint: 'df-curvy-walls.SettingDropKey_Hint',
		config: true,
		scope: 'world',
		choices: {
			alt: 'df-curvy-walls.SettingDropKey_OptionAlt',
			ctrl: 'df-curvy-walls.SettingDropKey_OptionCtrl'
		},
		default: 'alt',
		type: String
	});
});

Hooks.once("ready", function () {
	if (!game.modules.get('lib-wrapper')?.active) {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error(game.i18n.localize('df-curvy-walls.errorLibWrapperMissing'));
		return;
	}
	// @ts-ignore
	canvas.walls.bezier = CurvyWallToolManager.instance;
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
