/**
 * HooksExt is a general extension of the FoundryVTT Hooks class.
 * @name HooksExt
 * @version 1.0.0
 * @author flamewave000
 * @license BSD-3-Clause
 * @see https://github.com/flamewave000/dragonflagon-fvtt
 * @see https://github.com/flamewave000/dragonflagon-fvtt/blob/master/LICENSE
 * * HooksExt.shim.ts, HooksExt.shim.js, HooksExt.shim.min.js, HooksExt.shim.js.map
 */

/* eslint-disable no-prototype-builtins */
// @ts-nocheck

if (!(<any>globalThis).HooksExt) {
	/**
	 * A simple event framework used throughout Foundry Virtual Tabletop.
	 * When key actions or events occur, a "hook" is defined where user-defined callback functions can execute.
	 * This class manages the registration and execution of hooked callback functions.
	 */
	class _HooksExt {
		/** Registry of RegExp based hooks */
		static readonly _regex = new Map<string, { regex: RegExp, fns: { fn: any, id: number }[] }>();
		/** Repository of all hooks ever invoked. This is only ever used when `CONFIG.debug.hooks` is `true` */
		static readonly _hookRepo = new Set<string>();

		/**
		 * Register a callback handler which should be triggered when a hook is triggered.
		 *
		 * @param {RegExp} hook	The unique name of the hooked event
		 * @param {Function} fn				The callback function which should be triggered when the hook event occurs
		 * @return {number}					An ID number of the hooked function which can be used to turn off the hook later
		 */
		static onRE(hook: RegExp, fn: (...args: any) => any): number {
			const pattern = hook.toString();
			let regex = this._regex.get(pattern);
			if (!regex) {
				regex = { regex: hook, fns: [] };
				this._regex.set(pattern, regex);
			}
			const id = Hooks.on(hook, fn);
			regex.fns.push({ fn, id });
			return id;
		}

		/**
		 * Unregister a callback handler for a particular hook event
		 *
		 * @param {RegExp} hook	The unique name of the hooked event
		 * @param {Function|number} fn		The function, or ID number for the function, that should be turned off
		 */
		static offRE(hook: RegExp, fn: ((...args: any) => any) | number) {
			const pattern = hook.toString();
			Hooks.off(pattern, fn);
			const regex = this._regex.get(pattern);
			if (regex) {
				if (typeof (fn) === 'number')
					regex.fns = regex.fns.filter(x => x.id === fn);
				else
					regex.fns = regex.fns.filter(x => x.fn === fn);
				if (regex.fns.length === 0)
					this._regex.delete(pattern);
			}
		}

		/**
		 * Call all hook listeners in the order in which they were registered
		 * Hooks called this way can not be handled by returning false and will always trigger every hook callback.
		 *
		 * @param {string} hook   The hook being triggered
		 * @param {...*} args     Arguments passed to the hook callback functions
		 * @returns {boolean}     Were all hooks called without execution being prevented?
		 */
		static callAll(hook: string, ...args: any) {
			if (CONFIG.debug.hooks) { //											─┐
				console.log(`DEBUG | Calling ${hook} hook with args:`); //			 ├─ FoundryVTT Original
				console.log(args); //												─┘
				this._hookRepo.add(hook); //										─── HooksExt Customized
			} //																	─── FoundryVTT Original
			for (const regex of this._regex) { //									─┐
				if (!regex[1].regex.test(hook)) //									 │
					continue; //													 │
				for (const entry of regex[1].fns) //								 ├─ HooksExt Customized
					this.#call(hook, entry.fn, args); //							 │
			} //																	─┘
			if (!(hook in Hooks.events)) return true; //							─┐
			for (const entry of Array.from(Hooks.events[hook])) { //				 │
				this.#call(entry, args); //											 ├─ FoundryVTT Original
			} //																	 │
			return true; //															─┘
		}

		/**
		 * Call hook listeners in the order in which they were registered.
		 * Continue calling hooks until either all have been called or one returns false.
		 *
		 * Hook listeners which return false denote that the original event has been adequately handled and no further
		 * hooks should be called.
		 *
		 * @param {string} hook   The hook being triggered
		 * @param {...*} args     Arguments passed to the hook callback functions
		 * @returns {boolean}     Were all hooks called without execution being prevented?
		 */
		static call(hook: string, ...args: any) {
			if (CONFIG.debug.hooks) { //											─┐
				console.log(`DEBUG | Calling ${hook} hook with args:`); //			 ├─ FoundryVTT Original
				console.log(args); //												─┘
				this._hookRepo.add(hook); //										─── HooksExt Customized
			} //																	─┬─ FoundryVTT Original
			let fns = []; //														─┐
			for (const regex of this._regex) { //									 │
				if (regex[1].regex.test(hook)) //									 │
					fns = fns.concat(regex[1].fns); //								 │
			} //																	 ├─ HooksExt Customized
			const hooksExist = Hooks.events.hasOwnProperty(hook); //				 │
			if (!hooksExist && fns.length == 0) //									 │
				return true; //														 │
			if (hooksExist) //														 │
				fns = fns.concat(Array.from(Hooks.events[hook])); //				─┘
			for (const entry of fns) { //											─┐
				const callAdditional = this.#call(entry, args); //					 ├─ FoundryVTT Original
				if (callAdditional === false) return false; //						 │
			} //																	 │
			return true; //															─┘
		}

		private static #call(entry, args) {
			const { hook, id, fn, once } = entry;
			if (once) Hooks.off(hook, id);
			try {
				return entry.fn(...args);
			} catch (err) {
				const msg = `Error thrown in hooked function '${fn?.name}' for hook '${hook}'`;
				console.warn(`${vtt} | ${msg}`);
				if (hook !== "error") Hooks.onError("Hooks.#call", err, { msg, hook, fn, log: "error" });
			}
		}

		/**
		 * Retrieves all of the hook calls that have been made so far. This list will always be empty
		 * unless `CONFIG.debug.hooks` is set to `true`.
		 * @returns String array of all calls made so far.
		 */
		static allUniqueHooks(): string[] { return [...this._hookRepo.values()]; }
	}

	// If a HookExt has already been bound, do not execute the following
	(<any>globalThis).HooksExt = _HooksExt;
	Hooks.onRE = <any>_HooksExt.onRE.bind(_HooksExt);
	Hooks.offRE = <any>_HooksExt.offRE.bind(_HooksExt);
	Hooks.callAll = <any>_HooksExt.callAll.bind(_HooksExt);
	Hooks.call = <any>_HooksExt.call.bind(_HooksExt);
}

declare namespace Hooks {
	function on(hook: string, fn: (...args: any) => any): number;
	function off(hook: string, fn: ((...args: any) => any) | number);
	function onRE(hook: RegExp, fn: (...args: any) => any): number;
	function offRE(hook: RegExp, fn: ((...args: any) => any) | number);
	function call(hook: string, ...args: any);
	function callAll(hook: string, ...args: any);
	function once(hook: string, fn: (...args: any) => any): number;
}