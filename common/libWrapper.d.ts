
declare class libWrapper {
	// Properties
	static get version(): string
	static get versions(): string[]
	static get is_fallback(): Boolean

	static get debug(): Boolean
	static set debug(value: Boolean): void

	// Errors
	static get LibWrapperError(): string
	static get Error(): string
	static get LibWrapperInternalError(): string
	static get InternalError(): string

	static get LibWrapperModuleError(): string
	static get ModuleError(): string

	static get LibWrapperAlreadyOverriddenError(): string
	static get AlreadyOverriddenError(): string

	static get LibWrapperInvalidWrapperChainError(): string
	static get InvalidWrapperChainError(): string
	// Variables
	static wrappers = WRAPPERS;
	// Public interface
	/**
	 * Register a new wrapper.
	 * Important: If called before the 'init' hook, this method will fail.
	 *
	 * In addition to wrapping class methods, there is also support for wrapping methods on specific object instances, as well as class methods inherited from parent classes.
	 * However, it is recommended to wrap methods directly in the class that defines them whenever possible, as inheritance/instance wrapping is less thoroughly tested and will incur a performance penalty.
	 *
	 * @param {string} module  The module identifier, i.e. the 'name' field in your module's manifest.
	 * @param {string} target  A string containing the path to the function you wish to add the wrapper to, starting at global scope, for example 'SightLayer.prototype.updateToken'.
	 *                         This works for both normal methods, as well as properties with getters. To wrap a property's setter, append '#set' to the name, for example 'SightLayer.prototype.blurDistance#set'.
	 * @param {function} fn    Wrapper function. The first argument will be the next function in the chain, except for 'OVERRIDE' wrappers.
	 *                         The remaining arguments will correspond to the parameters passed to the wrapped method.
	 * @param {string} type    [Optional] The type of the wrapper. Default is 'MIXED'. The possible types are:
	 *
	 *   'WRAPPER':
	 *     Use if your wrapper will *always* call the next function in the chain.
	 *     This type has priority over every other type. It should be used whenever possible as it massively reduces the likelihood of conflicts.
	 *     Note that the library will auto-detect if you use this type but do not call the original function, and automatically unregister your wrapper.
	 *
	 *   'MIXED':
	 *     Default type. Your wrapper will be allowed to decide whether it should call the next function in the chain or not.
	 *     These will always come after 'WRAPPER'-type wrappers. Order is not guaranteed, but conflicts will be auto-detected.
	 *
	 *   'OVERRIDE':
	 *     Use if your wrapper will *never* call the next function in the chain. This type has the lowest priority, and will always be called last.
	 *     If another module already has an 'OVERRIDE' wrapper registered to the same method, using this type will throw a <libWrapper.LibWrapperAlreadyOverriddenError> exception.
	 *     Catching this exception should allow you to fail gracefully, and for example warn the user of the conflict.
	 *     Note that if the GM has explicitly given your module priority over the existing one, no exception will be thrown and your wrapper will take over.
	 *
	 *
	 */
	static register(module: string, target: string, fn: Function, type?: string = 'MIXED'): void;

	/**
	 * Unregister an existing wrapper.
	 *
	 * @param {string} module    The module identifier, i.e. the 'name' field in your module's manifest.
	 * @param {string} target    A string containing the path to the function you wish to remove the wrapper from, starting at global scope. For example: 'SightLayer.prototype.updateToken'
	 * @param {function} fail    [Optional] If true, this method will throw an exception if it fails to find the method to unwrap. Default is 'true'.
	 */
	static unregister(module: string, target: string, fail?: Boolean = true): void;

	/**
	 * Clear all wrappers created by a given module.
	 *
	 * @param {string} module    The module identifier, i.e. the 'name' field in your module's manifest.
	 */
	static clear_module(module: string): void;
}