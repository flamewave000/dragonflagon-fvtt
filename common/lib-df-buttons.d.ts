
/** Standard single parameter handler */
declare type Handler<T> = (value?: T) => (Promise<void> | void);

/** Standard boolean logic predicate */
declare type Predicate = () => (Promise<boolean> | boolean);
/**
 * Tool Configuration for tools that appear on the secondary bar when their
 * parent group is active.
 */
declare interface Tool {
	/** Unique name ID of the Tool */
	name: string;
	/** Plain Text or a Localization Key */
	title: string;
	/** HTMLElement to be used as an icon */
	icon: string;
	/**
	 * (default: false) If true, the tool will act as a simple button.
	 * Must implement {@link onClick}
	 */
	button?: boolean | null;
	/**
	 * (default: false) If true, the tool will act as a toggle button.
	 * Must implement {@link onClick}
	 */
	toggle?: boolean | null;
	/**
	 * (default: null) Used to add your own custom class name to the generated
	 * control.
	 */
	class?: string | null;
	/**
	 * (default: false) If {@link toggle} is true, this holds the toggle
	 * button's state. If {@link toggle} and {@link button} are false, this
	 * holds the activation state of the control and will be overridden by the
	 * {@link ControlManager}.
	 */
	isActive?: Predicate | boolean | null;
	/**
	 * (default: true) Sets the visibility of the tool. Can be a function or a
	 * boolean value
	 */
	visible?: Predicate | boolean | null;
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
/**
 * A collection of Tools that appear on the main bar
 */
declare interface ToolGroup extends Tool {
	/** {@link Tool} collection */
	tools?: Tool[];
	/**
	 * {@link Tool.name} of tool to be active. Defaults to the first tool in
	 * the {@link tools} list.
	 */
	activeTool?: string;
}

/** Manages the button UI, Hooks, and User Interactions. */
declare interface ControlManager {
	/** Complete list of {@link ToolGroup} objects. */
	get groups(): ToolGroup[];
	/** Name of currently active {@link ToolGroup}. */
	get activeGroupName(): string;
	/** Name of the currently active {@link Tool}. */
	get activeToolName(): string;
	/** The currently active {@link ToolGroup} object. */
	get activeGroup(): ToolGroup;
	/** The currently active {@link Tool} object. */
	get activeTool(): Tool;
	/**
	 * Activates a {@link ToolGroup} by its unique name.
	 * @param groupName Name of the group to be activated.
	 */
	activateGroupByName(groupName: string): Promise<void>;
	/**
	 * Activates a {@link Tool} inside the given {@link ToolGroup} via their unique names.
	 * @param groupName Name of group that contains the {@link Tool}.
	 * @param toolName Name of the {@link Tool} to be activated.
	 * @param activateGroup (Default true) Also activate the {@link ToolGroup}.
	 */
	activateToolByName(groupName: string, toolName: string, activateGroup?: boolean): Promise<void>;
	/** Reload the module buttons bar by rebuilding the {@link ToolGroup}s and rerendering. */
	reloadModuleButtons(): void;
	/** Refresh the button UI to reflect any external changes made */
	refresh(): void;
}