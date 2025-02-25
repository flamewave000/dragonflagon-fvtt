import SETTINGS from "./Settings.mjs";

/**
 * @typedef {(...args: any) => unknown} Wrapper
 * @typedef {(wrapped: Wrapper, ...args: any) => unknown} Handler
 */

class Registration {
	nextId = 0;
	/**@type {Map<number, Handler>}*/
	wrappers = new Map();

	/**
	 * @param {any} context
	 * @param {Wrapper} wrapped
	 * @param  {...any} args
	 * @returns {Promise<unknown> | unknown}
	 */
	handler(context, wrapped, ...args) {
		let current = wrapped;
		for (const wrapper of this.wrappers.values()) {
			const next = current;
			current = (...args) => wrapper.call(context, next, ...args);
		}
		return current.call(context, ...args);
	}
}

export default class libWrapperShared {
	/**@type {Map<string, Registration>}*/
	static #registrations = new Map();

	/**
	 * @param {string} target
	 * @param {Handler} handler
	 * @returns {number}
	 */
	static register(target, handler) {
		/**@type {Registration}*/
		let registration = this.#registrations.get(target);
		if (registration === undefined) {
			registration = new Registration();
			libWrapper.register(SETTINGS.MOD_NAME, target,
				/**
				 * @this {any}
				 * @param {Wrapper} wrapped
				 * @param {...any} args
				 * @returns {Promise<unknown> | unknown}
				 */
				function (wrapped, ...args) { return registration.handler(this, wrapped, ...args); }, 'WRAPPER');
			this.#registrations.set(target, registration);
		}
		const id = registration.nextId++;
		registration.wrappers.set(id, handler);
		return id;
	}

	/**
	 * @param {string} target
	 * @param {number} id
	 * @returns {boolean}
	 */
	static unregister(target, id) {
		const registration = this.#registrations.get(target);
		if (!registration) return false;
		registration.wrappers.delete(id);
		if (registration.wrappers.size === 0) {
			libWrapper.unregister(SETTINGS.MOD_NAME, target, false);
			this.#registrations.delete(target);
		}
		return true;
	}
}