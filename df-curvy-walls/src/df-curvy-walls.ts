import { CurvyWallsToolBar } from './CurvyWallsToolBar';
import { CurvyWallToolManager, Mode } from './CurvyWallToolManager';
import SETTINGS from "../../common/Settings";
import { BezierTool } from './tools/BezierTool';

const curvyWallApp = new CurvyWallsToolBar();
SETTINGS.init('df-curvy-walls');

Hooks.once('init', function () {
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
	SETTINGS.register(BezierTool.PREF_SMALL_HANDLES, {
		name: 'df-curvy-walls.SettingSmallHandlesName',
		hint: 'df-curvy-walls.SettingSmallHandlesHint',
		config: true,
		scope: 'world',
		type: Boolean,
		default: false,
	});
	// Exit if we do not have a canvas
	if (game.settings.get('core', 'noCanvas')) return;

	game.keybindings.register(SETTINGS.MOD_NAME, 'applyTool', {
		name: 'df-curvy-walls.apply',
		editable: [{ key: "Enter" }],
		onDown: () => { CurvyWallToolManager.instance.apply(); }
	});
	game.keybindings.register(SETTINGS.MOD_NAME, 'cancelTool', {
		name: 'df-curvy-walls.cancel',
		editable: [{ key: 'Delete' }],
		onDown: () => CurvyWallToolManager.instance.clearTool()
	});
	game.keybindings.register(SETTINGS.MOD_NAME, 'incrementSegments', {
		name: 'df-curvy-walls.increment',
		editable: [{ key: 'Equal' }],
		repeat: true,
		onDown: () => { CurvyWallToolManager.instance.segments++; }
	});
	game.keybindings.register(SETTINGS.MOD_NAME, 'decrementSegments', {
		name: 'df-curvy-walls.decrement',
		editable: [{ key: 'Minus' }],
		repeat: true,
		onDown: () => { CurvyWallToolManager.instance.segments--; }
	});
});

Hooks.once("ready", function () {
	// Exit if we do not have a canvas
	if (game.settings.get('core', 'noCanvas')) return;
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
	// Exit if we do not have a canvas
	if (game.settings.get('core', 'noCanvas')) return;
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
