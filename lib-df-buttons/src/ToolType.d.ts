
/** Standard single parameter handler */
declare type Handler<T> = (value?: T) => (Promise<void> | void);

/** Standard boolean logic predicate */
declare type Predicate = () => (Promise<boolean> | boolean);
/**
 * Tool Configuration for tools that appear on the secondary bar when their
 * parent group is active.
 */
declare interface Tool {
	/** Plain Text or a Localization Key */
	title: string;
	/** HTMLElement to be used as an icon */
	icon: string;
	/**
	 * (default: 'radial') The type of tool can be a button, toggle, or radial.
	 * 
	 * |    Type    |  `onClick` |   `tools`  |
	 * |------------|------------|------------|
	 * | `'button'` | `required` |  `ignored` |
	 * | `'toggle'` | `required` |  `ignored` |
	 * | `'radial'` | `optional` | `optional` |
	 */
	type: 'button' | 'toggle' | 'radial';
	/**
	 * (default: null) Used to add your own custom class name to the generated
	 * button HTML.
	 */
	class?: string | null;
	/**
	 * (default: false) Indicates your button or {@link ToolGroup} should be
	 * allowed to render when there is no game board canvas.
	 */
	noCanvas?: boolean;
	/**
	 * (default: false) If {@link toggle} is true, this holds the toggle
	 * button's state. If {@link toggle} and {@link button} are false, this
	 * holds the activation state of the control and will be overridden by the
	 * {@link ControlManager}.
	 */
	isActive?: Predicate | boolean | null;
	/**
	 * (default: true) If true, the tool will be visible and interactive. If
	 * false, the tool will be hidden, and will not be interactive.
	 */
	enabled?: Predicate | boolean | null;
	/**
	 * A collection of tools that represents a sub-menu of this tool that
	 * will display to the right if this tool is selected.
	 * 
	 * > **Radial tools only, will otherwise be ignored for buttons and toggles.**
	 */
	tools?: Record<string, Tool>;
	/**
	 * A special field that allows the control to be interacted with
	 * programmatically, but not drawn in the menu UI.
	 */
	hidden?: true;
	/**
	 * A click handler that is invoked when ever the tool is pressed. This
	 * function is given an `active` state when either the default Radial or set
	 * as a toggle button.
	 * 
	 * If the Handler is unbound, it will be bound to the {@link Tool} instance it belongs to.
	 * 
	 * - Radial Button (default): Invoked with `active:false` when deactivated, or `active:true` when activated.
	 * - Toggle Button: Invoked with the new toggled state (true|false).
	 * - Button: Invoked with no parameters.
	 */
	onClick?: Handler<boolean> | null;
}

/** Manages the button UI, Hooks, and User Interactions. */
declare interface ControlManager {
	/** The primary tool set. */
	get tools(): Record<string, Tool>;
	/**
	 * Activates a {@link Tool} at some level within the Tool stack via their unique names.
	 * @param path A string containing a path to the sub-menu of the tool using
	 *             the unique names provided for each tool. ie: "my-tool-group.my-sub-tool".
	 * @param activateParents (Default true) Also activate the parent {@link Tool}s in the path.
	 */
	activateToolByPath(path: string, activateParents?: boolean): Promise<void>;
	/** Reload the module buttons bar by rebuilding the {@link ToolGroup}s and rerendering. */
	reloadModuleButtons(): void;
	/** Refresh the button UI to reflect any external changes made */
	refresh(): void;
}

declare type ToolSet = Record<string, Tool>;