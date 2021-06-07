
interface Document<T> {
	id: string;
	object: T;
	layer: PlaceablesLayer;
}

declare class WallDocument extends Document<Wall> {
	constructor(data: Wall.Data, options = {})
}

declare class Sidebar extends Application {
	constructor(options?: Partial<Application.Options>);

	/**
	 * Sidebar application instances
	 * @defaultValue `[]`
	 */
	apps: Application[];

	tabs: { [name: string]: Application };

	/**
	 * Track whether the sidebar container is currently collapsed
	 * @defaultValue `false`
	 */
	protected _collapsed: boolean;

	/**
	 * @override
	 */
	static get defaultOptions(): Sidebar.Options;

	/**
	 * Return the name of the active Sidebar tab
	 */
	get activeTab(): string;

	/**
	 * Return an Array of pop-out sidebar tab Application instances
	 */
	get popouts(): Application[];

	/**
	 * @param options - (unused)
	 * @override
	 */
	getData(options?: Application.RenderOptions): Sidebar.Data;

	/**
	 * @override
	 */
	protected _render(force?: boolean, options?: Application.RenderOptions): Promise<void>;

	/**
	 * Activate a Sidebar tab by it's name
	 * @param tabName - The tab name corresponding to it's "data-tab" attribute
	 */
	activateTab(tabName: string): void;

	/**
	 * Expand the Sidebar container from a collapsed state.
	 * Take no action if the sidebar is already expanded.
	 */
	expand(): void;

	/**
	 * Collapse the sidebar to a minimized state.
	 * Take no action if the sidebar is already collapsed.
	 */
	collapse(): void;

	/**
	 * @override
	 */
	activateListeners(html: JQuery): void;

	/**
	 * @param event - (unused)
	 * @param tabs - (unused)
	 * @override
	 */
	protected _onChangeTab(event: MouseEvent | null, tabs: Tabs, active: string): void;

	/**
	 * Handle right-click events on tab controls to trigger pop-out containers for each tab
	 * @param event - The originating contextmenu event
	 */
	protected _onRightClickTab(event: MouseEvent): void;

	/**
	 * Handle toggling of the Sidebar container's collapsed or expanded state
	 */
	protected _onToggleCollapse(event: MouseEvent): void;
}