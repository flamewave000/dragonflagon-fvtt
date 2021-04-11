
/** Filter for a given hotkey group */
export default interface GroupFilter {
	/** Name of the group to be filtered */
	group: string | RegExp;
	/**
	 * hotkeys to filter on. If the array is empty, it will allow all hotkeys
	 * in the group
	 */
	hotkeys: (string | RegExp)[];
}