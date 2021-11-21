/**
 * Tool Configuration for tools that appear on the secondary bar when their
 * parent group is active.
 */
export interface Tool {
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
	button?: boolean | false;
	/**
	 * (default: false) If true, the tool will act as a toggle button.
	 * Must implement {@link onClick}
	 */
	toggle?: boolean | false;
	/**
	 * (default: undefined) If {@link toggle} is true, this holds the toggle
	 * button's state
	 */
	active?: boolean | undefined;
	/**
	 * (default: true) Sets the visibility of the tool. Can be a function or a
	 * boolean value
	 */
	visible?: () => boolean | boolean | true;
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
	onClick?: (active?: boolean) => void | null | undefined;
}
/**
 * A collection of Tools that appear on the main bar
 */
export interface ToolGroup extends Tool {
	/** {@link Tool} collection */
	tools?: Tool[];
	/**
	 * {@link Tool.name} of tool to be active. Defaults to the first tool in
	 * the {@link tools} list.
	 */
	activeTool?: string;
}