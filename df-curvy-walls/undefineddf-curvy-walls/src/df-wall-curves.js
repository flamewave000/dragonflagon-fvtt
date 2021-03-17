var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	return new (P || (P = Promise))(function (resolve, reject) {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
import { BezierControl, Mode } from './BezierControl.js';
import { BezierToolBar } from './BezierToolBar.js';
Hooks.on("ready", function () {
	canvas.walls.bezier = BezierControl.instance;
	BezierControl.instance.patchWallsLayer();
});
Hooks.on("getSceneControlButtons", (controls) => {
	if (!game.user.isGM)
		return;
	BezierControl.instance.injectControls(controls);
});
var toolbar = null;
var prevMode = Mode.None;
Hooks.on('renderSceneControls', (controls) => __awaiter(void 0, void 0, void 0, function* () {
	if (!game.user.isGM)
		return;
	if (controls.activeControl === 'walls' && BezierControl.instance.mode != Mode.None) {
		if (prevMode == BezierControl.instance.mode) {
			BezierControl.instance.render();
			return;
		}
		if (toolbar != null) {
			yield toolbar.close({ force: true });
			(toolbar = new BezierToolBar()).render(true);
			BezierControl.instance.clearTool();
		}
		else {
			(toolbar = new BezierToolBar()).render(true);
			BezierControl.instance.render();
		}
		prevMode = BezierControl.instance.mode;
	}
	else {
		if (!toolbar)
			return;
		const promise = toolbar.close();
		toolbar = null;
		yield promise;
	}
}));
function setToolBarPosition() {
	const tools = $(toolbar.form).parent();
	if (!tools)
		return;
	const curveTools = $('li[data-tool=beziercube]').offset();
	tools.css({ top: `${curveTools.top}px`, left: `${curveTools.left + 44}px` });
}
Hooks.on('renderBezierToolBar', setToolBarPosition);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2RmLWN1cnZ5LXdhbGxzL3NyYy9kZi13YWxsLWN1cnZlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxPQUFPLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ3pELE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUVuRCxLQUFLLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRTtJQUNqQixNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxhQUFhLENBQUMsUUFBUSxDQUFDO0lBQzdDLGFBQWEsQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDMUMsQ0FBQyxDQUFDLENBQUE7QUFFRixLQUFLLENBQUMsRUFBRSxDQUFDLHdCQUF3QixFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUU7SUFDL0MsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSTtRQUFFLE9BQU87SUFDNUIsYUFBYSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakQsQ0FBQyxDQUFDLENBQUM7QUFFSCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDbkIsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztBQUN6QixLQUFLLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLENBQU0sUUFBUSxFQUFDLEVBQUU7SUFDaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSTtRQUFFLE9BQU87SUFDNUIsSUFBSSxRQUFRLENBQUMsYUFBYSxLQUFLLE9BQU8sSUFBSSxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO1FBQ25GLElBQUksUUFBUSxJQUFJLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFO1lBQzVDLGFBQWEsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDaEMsT0FBTztTQUNQO1FBQ0QsSUFBSSxPQUFPLElBQUksSUFBSSxFQUFFO1lBQ3BCLE1BQU0sT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3JDLENBQUMsT0FBTyxHQUFHLElBQUksYUFBYSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0MsYUFBYSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztTQUNuQzthQUFNO1lBQ04sQ0FBQyxPQUFPLEdBQUcsSUFBSSxhQUFhLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxhQUFhLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ2hDO1FBQ0QsUUFBUSxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO0tBQ3ZDO1NBQ0k7UUFDSixJQUFJLENBQUMsT0FBTztZQUFFLE9BQU87UUFDckIsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDZixNQUFNLE9BQU8sQ0FBQztLQUNkO0FBQ0YsQ0FBQyxDQUFBLENBQUMsQ0FBQztBQUVILFNBQVMsa0JBQWtCO0lBQzFCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDdkMsSUFBSSxDQUFDLEtBQUs7UUFBRSxPQUFPO0lBQ25CLE1BQU0sVUFBVSxHQUFHLENBQUMsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzFELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxVQUFVLENBQUMsR0FBRyxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsVUFBVSxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7QUFDOUUsQ0FBQztBQUVELEtBQUssQ0FBQyxFQUFFLENBQUMscUJBQXFCLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyIsImZpbGUiOiJkZi13YWxsLWN1cnZlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJlemllckNvbnRyb2wsIE1vZGUgfSBmcm9tICcuL0JlemllckNvbnRyb2wuanMnO1xuaW1wb3J0IHsgQmV6aWVyVG9vbEJhciB9IGZyb20gJy4vQmV6aWVyVG9vbEJhci5qcyc7XG5cbkhvb2tzLm9uKFwicmVhZHlcIiwgZnVuY3Rpb24gKCkge1xuXHRjYW52YXMud2FsbHMuYmV6aWVyID0gQmV6aWVyQ29udHJvbC5pbnN0YW5jZTtcblx0QmV6aWVyQ29udHJvbC5pbnN0YW5jZS5wYXRjaFdhbGxzTGF5ZXIoKTtcbn0pXG5cbkhvb2tzLm9uKFwiZ2V0U2NlbmVDb250cm9sQnV0dG9uc1wiLCAoY29udHJvbHMpID0+IHtcblx0aWYgKCFnYW1lLnVzZXIuaXNHTSkgcmV0dXJuO1xuXHRCZXppZXJDb250cm9sLmluc3RhbmNlLmluamVjdENvbnRyb2xzKGNvbnRyb2xzKTtcbn0pO1xuXG52YXIgdG9vbGJhciA9IG51bGw7XG52YXIgcHJldk1vZGUgPSBNb2RlLk5vbmU7XG5Ib29rcy5vbigncmVuZGVyU2NlbmVDb250cm9scycsIGFzeW5jIGNvbnRyb2xzID0+IHtcblx0aWYgKCFnYW1lLnVzZXIuaXNHTSkgcmV0dXJuO1xuXHRpZiAoY29udHJvbHMuYWN0aXZlQ29udHJvbCA9PT0gJ3dhbGxzJyAmJiBCZXppZXJDb250cm9sLmluc3RhbmNlLm1vZGUgIT0gTW9kZS5Ob25lKSB7XG5cdFx0aWYgKHByZXZNb2RlID09IEJlemllckNvbnRyb2wuaW5zdGFuY2UubW9kZSkge1xuXHRcdFx0QmV6aWVyQ29udHJvbC5pbnN0YW5jZS5yZW5kZXIoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aWYgKHRvb2xiYXIgIT0gbnVsbCkge1xuXHRcdFx0YXdhaXQgdG9vbGJhci5jbG9zZSh7IGZvcmNlOiB0cnVlIH0pO1xuXHRcdFx0KHRvb2xiYXIgPSBuZXcgQmV6aWVyVG9vbEJhcigpKS5yZW5kZXIodHJ1ZSk7XG5cdFx0XHRCZXppZXJDb250cm9sLmluc3RhbmNlLmNsZWFyVG9vbCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQodG9vbGJhciA9IG5ldyBCZXppZXJUb29sQmFyKCkpLnJlbmRlcih0cnVlKTtcblx0XHRcdEJlemllckNvbnRyb2wuaW5zdGFuY2UucmVuZGVyKCk7XG5cdFx0fVxuXHRcdHByZXZNb2RlID0gQmV6aWVyQ29udHJvbC5pbnN0YW5jZS5tb2RlO1xuXHR9XG5cdGVsc2Uge1xuXHRcdGlmICghdG9vbGJhcikgcmV0dXJuO1xuXHRcdGNvbnN0IHByb21pc2UgPSB0b29sYmFyLmNsb3NlKCk7XG5cdFx0dG9vbGJhciA9IG51bGw7XG5cdFx0YXdhaXQgcHJvbWlzZTtcblx0fVxufSk7XG5cbmZ1bmN0aW9uIHNldFRvb2xCYXJQb3NpdGlvbigpIHtcblx0Y29uc3QgdG9vbHMgPSAkKHRvb2xiYXIuZm9ybSkucGFyZW50KCk7XG5cdGlmICghdG9vbHMpIHJldHVybjtcblx0Y29uc3QgY3VydmVUb29scyA9ICQoJ2xpW2RhdGEtdG9vbD1iZXppZXJjdWJlXScpLm9mZnNldCgpO1xuXHR0b29scy5jc3MoeyB0b3A6IGAke2N1cnZlVG9vbHMudG9wfXB4YCwgbGVmdDogYCR7Y3VydmVUb29scy5sZWZ0ICsgNDR9cHhgIH0pO1xufVxuXG5Ib29rcy5vbigncmVuZGVyQmV6aWVyVG9vbEJhcicsIHNldFRvb2xCYXJQb3NpdGlvbik7Il19
