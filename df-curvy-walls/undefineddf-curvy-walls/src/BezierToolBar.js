var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	return new (P || (P = Promise))(function (resolve, reject) {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
import { BezierControl } from "./BezierControl.js";
export class BezierToolBar extends FormApplication {
	constructor() {
		super(...arguments);
		this.renderHookId = 0;
	}
	static get defaultOptions() {
		const options = {
			classes: ['form'],
			left: 98,
			popOut: false,
			template: 'modules/df-curvy-walls/templates/segment-controls.html',
			id: 'bezier-config',
			title: game.i18n.localize('Curvy Walls Options'),
			editable: game.user.isGM,
			closeOnSubmit: false,
			submitOnChange: true,
			submitOnClose: true
		};
		return mergeObject(super.defaultOptions, options);
	}
	/** @override */
	activateListeners(html) {
		super.activateListeners(html);
		this.renderHookId = Hooks.on('renderBezierToolBar', this.htmlRendered);
	}
	/** @override */
	close(options) {
		return __awaiter(this, void 0, void 0, function* () {
			Hooks.off('renderBezierToolBar', this.renderHookId);
		});
	}
	htmlRendered(_app, html, data) {
		data.coreTools.forEach(elem => {
			html.find('#' + elem.name).on('click', function () { elem.onClick($(this)); });
		});
		data.extraTools.forEach(elem => {
			html.find('#' + elem.name).on('click', function () { elem.onClick($(this)); });
		});
	}
	getData(options) {
		const tools = [{
				name: "bezierinc",
				title: "df-curvy-walls.increment",
				icon: "fas fa-plus",
				onClick: () => { BezierControl.instance.segments++; }
			}, {
				name: "bezierdec",
				title: "df-curvy-walls.decrement",
				icon: "fas fa-minus",
				onClick: () => { BezierControl.instance.segments--; }
			}, {
				name: "bezierapply",
				title: "df-curvy-walls.apply",
				icon: "fas fa-check",
				style: "display:none",
				onClick: () => { BezierControl.instance.apply(); },
				class: "apply"
			}, {
				name: "beziercancel",
				title: "df-curvy-walls.cancel",
				icon: "fas fa-times",
				style: "display:none",
				onClick: () => { BezierControl.instance.clearTool(); },
				class: "cancel"
			}];
		return { coreTools: tools, extraTools: BezierControl.instance.activeTool.getTools() };
	}
	/**
	* This method is called upon form submission after form data is validated
	* @param event {Event}       The initial triggering submission event
	* @private
	*/
	_updateObject(event) {
		return __awaiter(this, void 0, void 0, function* () {
			// 	if (!event.submitter) return;
			// 	const data = this.getData();
			// 	const coreTools = ((data as any).coreTools as Array<ToolUI>);
			// 	const extraTools = ((data as any).extraTools as Array<ToolUI>);
			// 	coreTools.concat(...extraTools)
			// 		.find(e => e.name === event.submitter.dataset.tool)
			// 		.onClick($(event.submitter));
		});
	}
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2RmLWN1cnZ5LXdhbGxzL3NyYy9CZXppZXJUb29sQmFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLE9BQU8sRUFBRSxhQUFhLEVBQVEsTUFBTSxvQkFBb0IsQ0FBQztBQVl6RCxNQUFNLE9BQU8sYUFBYyxTQUFRLGVBQWU7SUFBbEQ7O1FBaUJTLGlCQUFZLEdBQVcsQ0FBQyxDQUFDO0lBZ0VsQyxDQUFDO0lBaEZBLE1BQU0sS0FBSyxjQUFjO1FBQ3hCLE1BQU0sT0FBTyxHQUFxQztZQUNqRCxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUM7WUFDakIsSUFBSSxFQUFFLEVBQUU7WUFDUixNQUFNLEVBQUUsS0FBSztZQUNiLFFBQVEsRUFBRSx3REFBd0Q7WUFDbEUsRUFBRSxFQUFFLGVBQWU7WUFDbkIsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDO1lBQ2hELFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUk7WUFDeEIsYUFBYSxFQUFFLEtBQUs7WUFDcEIsY0FBYyxFQUFFLElBQUk7WUFDcEIsYUFBYSxFQUFFLElBQUk7U0FDbkIsQ0FBQztRQUNGLE9BQU8sV0FBVyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsT0FBa0MsQ0FBQyxDQUFDO0lBQzlFLENBQUM7SUFJRCxnQkFBZ0I7SUFDaEIsaUJBQWlCLENBQUMsSUFBeUI7UUFDMUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlCLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUVELGdCQUFnQjtJQUNWLEtBQUssQ0FBQyxPQUFzQzs7WUFDakQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDckQsQ0FBQztLQUFBO0lBRU8sWUFBWSxDQUFDLElBQW1CLEVBQUUsSUFBNEIsRUFBRSxJQUFtRDtRQUMxSCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxjQUFjLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBOEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0csQ0FBQyxDQUFDLENBQUE7UUFDRixJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM5QixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxjQUFjLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBOEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0csQ0FBQyxDQUFDLENBQUE7SUFDSCxDQUFDO0lBRUQsT0FBTyxDQUFDLE9BQWE7UUFDcEIsTUFBTSxLQUFLLEdBQWEsQ0FBQztnQkFDeEIsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLEtBQUssRUFBRSwwQkFBMEI7Z0JBQ2pDLElBQUksRUFBRSxhQUFhO2dCQUNuQixPQUFPLEVBQUUsR0FBRyxFQUFFLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQSxDQUFDLENBQUM7YUFDcEQsRUFBRTtnQkFDRixJQUFJLEVBQUUsV0FBVztnQkFDakIsS0FBSyxFQUFFLDBCQUEwQjtnQkFDakMsSUFBSSxFQUFFLGNBQWM7Z0JBQ3BCLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxhQUFhLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFBLENBQUMsQ0FBQzthQUNwRCxFQUFFO2dCQUNGLElBQUksRUFBRSxhQUFhO2dCQUNuQixLQUFLLEVBQUUsc0JBQXNCO2dCQUM3QixJQUFJLEVBQUUsY0FBYztnQkFDcEIsS0FBSyxFQUFFLGNBQWM7Z0JBQ3JCLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxhQUFhLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFBLENBQUMsQ0FBQztnQkFDakQsS0FBSyxFQUFFLE9BQU87YUFDZCxFQUFFO2dCQUNGLElBQUksRUFBRSxjQUFjO2dCQUNwQixLQUFLLEVBQUUsdUJBQXVCO2dCQUM5QixJQUFJLEVBQUUsY0FBYztnQkFDcEIsS0FBSyxFQUFFLGNBQWM7Z0JBQ3JCLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxhQUFhLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFBLENBQUMsQ0FBQztnQkFDckQsS0FBSyxFQUFFLFFBQVE7YUFDZixDQUFDLENBQUM7UUFDSCxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsYUFBYSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEVBQXNDLENBQUM7SUFDM0gsQ0FBQztJQUNEOzs7O09BSUc7SUFDRyxhQUFhLENBQUMsS0FBVTs7WUFDN0IsaUNBQWlDO1lBQ2pDLGdDQUFnQztZQUNoQyxpRUFBaUU7WUFDakUsbUVBQW1FO1lBQ25FLG1DQUFtQztZQUNuQyx3REFBd0Q7WUFDeEQsa0NBQWtDO1FBQ25DLENBQUM7S0FBQTtDQUNEIiwiZmlsZSI6IkJlemllclRvb2xCYXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCZXppZXJDb250cm9sLCBNb2RlIH0gZnJvbSBcIi4vQmV6aWVyQ29udHJvbC5qc1wiO1xuaW1wb3J0IHsgVG9vbE1vZGUgfSBmcm9tIFwiLi90b29scy9CZXppZXJUb29sLmpzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVG9vbFVJIHtcblx0bmFtZTogU3RyaW5nXG5cdHRpdGxlOiBTdHJpbmdcblx0aWNvbjogU3RyaW5nXG5cdHN0eWxlPzogU3RyaW5nXG5cdG9uQ2xpY2s/OiAoY29udHJvbDogSlF1ZXJ5PEhUTUxCdXR0b25FbGVtZW50PikgPT4gdm9pZFxuXHRjbGFzcz86IFN0cmluZ1xuXHRodG1sPzogU3RyaW5nXG59XG5leHBvcnQgY2xhc3MgQmV6aWVyVG9vbEJhciBleHRlbmRzIEZvcm1BcHBsaWNhdGlvbiB7XG5cdHN0YXRpYyBnZXQgZGVmYXVsdE9wdGlvbnMoKTogRm9ybUFwcGxpY2F0aW9uLk9wdGlvbnMge1xuXHRcdGNvbnN0IG9wdGlvbnM6IFBhcnRpYWw8Rm9ybUFwcGxpY2F0aW9uLk9wdGlvbnM+ID0ge1xuXHRcdFx0Y2xhc3NlczogWydmb3JtJ10sXG5cdFx0XHRsZWZ0OiA5OCxcblx0XHRcdHBvcE91dDogZmFsc2UsXG5cdFx0XHR0ZW1wbGF0ZTogJ21vZHVsZXMvZGYtY3Vydnktd2FsbHMvdGVtcGxhdGVzL3NlZ21lbnQtY29udHJvbHMuaHRtbCcsXG5cdFx0XHRpZDogJ2Jlemllci1jb25maWcnLFxuXHRcdFx0dGl0bGU6IGdhbWUuaTE4bi5sb2NhbGl6ZSgnQ3VydnkgV2FsbHMgT3B0aW9ucycpLFxuXHRcdFx0ZWRpdGFibGU6IGdhbWUudXNlci5pc0dNLFxuXHRcdFx0Y2xvc2VPblN1Ym1pdDogZmFsc2UsXG5cdFx0XHRzdWJtaXRPbkNoYW5nZTogdHJ1ZSxcblx0XHRcdHN1Ym1pdE9uQ2xvc2U6IHRydWVcblx0XHR9O1xuXHRcdHJldHVybiBtZXJnZU9iamVjdChzdXBlci5kZWZhdWx0T3B0aW9ucywgb3B0aW9ucyBhcyBGb3JtQXBwbGljYXRpb24uT3B0aW9ucyk7XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckhvb2tJZDogbnVtYmVyID0gMDtcblxuXHQvKiogQG92ZXJyaWRlICovXG5cdGFjdGl2YXRlTGlzdGVuZXJzKGh0bWw6IEpRdWVyeTxIVE1MRWxlbWVudD4pIHtcblx0XHRzdXBlci5hY3RpdmF0ZUxpc3RlbmVycyhodG1sKTtcblx0XHR0aGlzLnJlbmRlckhvb2tJZCA9IEhvb2tzLm9uKCdyZW5kZXJCZXppZXJUb29sQmFyJywgdGhpcy5odG1sUmVuZGVyZWQpO1xuXHR9XG5cblx0LyoqIEBvdmVycmlkZSAqL1xuXHRhc3luYyBjbG9zZShvcHRpb25zPzogRm9ybUFwcGxpY2F0aW9uLkNsb3NlT3B0aW9ucyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdEhvb2tzLm9mZigncmVuZGVyQmV6aWVyVG9vbEJhcicsIHRoaXMucmVuZGVySG9va0lkKTtcblx0fVxuXG5cdHByaXZhdGUgaHRtbFJlbmRlcmVkKF9hcHA6IEJlemllclRvb2xCYXIsIGh0bWw6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD4sIGRhdGE6IHsgY29yZVRvb2xzOiBUb29sVUlbXSwgZXh0cmFUb29sczogVG9vbFVJW10gfSkge1xuXHRcdGRhdGEuY29yZVRvb2xzLmZvckVhY2goZWxlbSA9PiB7XG5cdFx0XHRodG1sLmZpbmQoJyMnICsgZWxlbS5uYW1lKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7IGVsZW0ub25DbGljaygkKHRoaXMpIGFzIEpRdWVyeTxIVE1MQnV0dG9uRWxlbWVudD4pOyB9KTtcblx0XHR9KVxuXHRcdGRhdGEuZXh0cmFUb29scy5mb3JFYWNoKGVsZW0gPT4ge1xuXHRcdFx0aHRtbC5maW5kKCcjJyArIGVsZW0ubmFtZSkub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkgeyBlbGVtLm9uQ2xpY2soJCh0aGlzKSBhcyBKUXVlcnk8SFRNTEJ1dHRvbkVsZW1lbnQ+KTsgfSk7XG5cdFx0fSlcblx0fVxuXG5cdGdldERhdGEob3B0aW9ucz86IGFueSk6IEZvcm1BcHBsaWNhdGlvbi5EYXRhPGFueT4ge1xuXHRcdGNvbnN0IHRvb2xzOiBUb29sVUlbXSA9IFt7XG5cdFx0XHRuYW1lOiBcImJlemllcmluY1wiLFxuXHRcdFx0dGl0bGU6IFwiZGYtY3Vydnktd2FsbHMuaW5jcmVtZW50XCIsXG5cdFx0XHRpY29uOiBcImZhcyBmYS1wbHVzXCIsXG5cdFx0XHRvbkNsaWNrOiAoKSA9PiB7IEJlemllckNvbnRyb2wuaW5zdGFuY2Uuc2VnbWVudHMrKyB9XG5cdFx0fSwge1xuXHRcdFx0bmFtZTogXCJiZXppZXJkZWNcIixcblx0XHRcdHRpdGxlOiBcImRmLWN1cnZ5LXdhbGxzLmRlY3JlbWVudFwiLFxuXHRcdFx0aWNvbjogXCJmYXMgZmEtbWludXNcIixcblx0XHRcdG9uQ2xpY2s6ICgpID0+IHsgQmV6aWVyQ29udHJvbC5pbnN0YW5jZS5zZWdtZW50cy0tIH1cblx0XHR9LCB7XG5cdFx0XHRuYW1lOiBcImJlemllcmFwcGx5XCIsXG5cdFx0XHR0aXRsZTogXCJkZi1jdXJ2eS13YWxscy5hcHBseVwiLFxuXHRcdFx0aWNvbjogXCJmYXMgZmEtY2hlY2tcIixcblx0XHRcdHN0eWxlOiBcImRpc3BsYXk6bm9uZVwiLFxuXHRcdFx0b25DbGljazogKCkgPT4geyBCZXppZXJDb250cm9sLmluc3RhbmNlLmFwcGx5KCkgfSxcblx0XHRcdGNsYXNzOiBcImFwcGx5XCJcblx0XHR9LCB7XG5cdFx0XHRuYW1lOiBcImJlemllcmNhbmNlbFwiLFxuXHRcdFx0dGl0bGU6IFwiZGYtY3Vydnktd2FsbHMuY2FuY2VsXCIsXG5cdFx0XHRpY29uOiBcImZhcyBmYS10aW1lc1wiLFxuXHRcdFx0c3R5bGU6IFwiZGlzcGxheTpub25lXCIsXG5cdFx0XHRvbkNsaWNrOiAoKSA9PiB7IEJlemllckNvbnRyb2wuaW5zdGFuY2UuY2xlYXJUb29sKCkgfSxcblx0XHRcdGNsYXNzOiBcImNhbmNlbFwiXG5cdFx0fV07XG5cdFx0cmV0dXJuIHsgY29yZVRvb2xzOiB0b29scywgZXh0cmFUb29sczogQmV6aWVyQ29udHJvbC5pbnN0YW5jZS5hY3RpdmVUb29sLmdldFRvb2xzKCkgfSBhcyBhbnkgYXMgRm9ybUFwcGxpY2F0aW9uLkRhdGE8YW55Pjtcblx0fVxuXHQvKipcblx0ICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIHVwb24gZm9ybSBzdWJtaXNzaW9uIGFmdGVyIGZvcm0gZGF0YSBpcyB2YWxpZGF0ZWRcblx0ICogQHBhcmFtIGV2ZW50IHtFdmVudH0gICAgICAgVGhlIGluaXRpYWwgdHJpZ2dlcmluZyBzdWJtaXNzaW9uIGV2ZW50XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRhc3luYyBfdXBkYXRlT2JqZWN0KGV2ZW50OiBhbnkpIHtcblx0XHQvLyBcdGlmICghZXZlbnQuc3VibWl0dGVyKSByZXR1cm47XG5cdFx0Ly8gXHRjb25zdCBkYXRhID0gdGhpcy5nZXREYXRhKCk7XG5cdFx0Ly8gXHRjb25zdCBjb3JlVG9vbHMgPSAoKGRhdGEgYXMgYW55KS5jb3JlVG9vbHMgYXMgQXJyYXk8VG9vbFVJPik7XG5cdFx0Ly8gXHRjb25zdCBleHRyYVRvb2xzID0gKChkYXRhIGFzIGFueSkuZXh0cmFUb29scyBhcyBBcnJheTxUb29sVUk+KTtcblx0XHQvLyBcdGNvcmVUb29scy5jb25jYXQoLi4uZXh0cmFUb29scylcblx0XHQvLyBcdFx0LmZpbmQoZSA9PiBlLm5hbWUgPT09IGV2ZW50LnN1Ym1pdHRlci5kYXRhc2V0LnRvb2wpXG5cdFx0Ly8gXHRcdC5vbkNsaWNrKCQoZXZlbnQuc3VibWl0dGVyKSk7XG5cdH1cbn0iXX0=
