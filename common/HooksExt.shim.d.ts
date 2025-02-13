
declare namespace Hooks {
	function on(hook: string, fn: (...args: any) => any): number;
	function off(hook: string, fn: ((...args: any) => any) | number);
	function onRE(hook: RegExp, fn: (...args: any) => any): number;
	function offRE(hook: RegExp, fn: ((...args: any) => any) | number);
	function call(hook: string, ...args: any);
	function callAll(hook: string, ...args: any);
	function once(hook: string, fn: (...args: any) => any): number;
}
