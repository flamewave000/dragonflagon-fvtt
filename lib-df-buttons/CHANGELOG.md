# DragonFlagon Module Buttons Library

## Release 2.0.3 (2025-02-24)
- **FIX #459:** Greatly improved module button positioning in the UI system.

## Release 2.0.2 (2025-02-24)
- **FIX:** Small fix for issue that popped up during development of DF Curvy Walls

## Release 2.0.1 (2025-02-23)
- **FIX:** Disabled test code accidentally left in.

## Release 2.0.0 (2025-02-23)
- **UPDATE:** Migrated to v12.
- **UPDATE:** Downgraded TS -> JS (such sad).

## Release 1.4.2 (2022-11-23)
- **FIX:** Buttons were disappearing when only one group was available.

## Release 1.4.1 (2022-11-23)
- **UPDATE #391:** You can now declare your button/group as being displayable when there is no canvas. Just add the `"noCanvas": true` to your Tool and ToolGroup declarations.
- **FIX:** The buttons will now automatically refresh when ever the sacene layer changes. This way modules that are trying to display buttons for only certain layers will not need to manually tell the buttons to refresh.
- **NEW:** I've added a new Hook for more easily refreshing the Module Buttons UI called `refreshModuleButtons`.

## Release 1.4.0 (2022-10-15)
- **UPDATE:** Manifest for FoundryVTT v10.
- **FIX:** Alignment issue when buttons are on the bottom of the screen.

## Release 1.3.2 (2022-05-28)
- **FIX #361:** Buttons container was erroneously absorbing mouse events. It will now ignore all events.
- **UPDATE:** The Magnet button will now only appear when you mouse over its occupied region of the screen.

## Release 1.3.1 (2022-05-19)
- **FIX:** Rendering issue when only a single button or toggle is added to the tool groups.

## Release 1.3.0 (2022-04-10)
- **FIX:** Small error that sometimes appeared in the console when loading.
- **NEW #351:** A magnet button will now appear on hover for quickly changing the position of the tool bar.
- **NEW:** You can now provide your own custom CSS class for each control group/tool you register.

## Release 1.2.1 (2022-04-05)
- **FIX:** Small rendering issues.
- **NEW:** Exposed the functions used for calculating the top and left offsets.

## Release 1.2.0 (2022-04-05)
- **UPDATE:** _(BREAKING CHANGE)_ Refactored control activation system. `active` has been renamed as `isActive` and will have new behaviour. If the Tool/ToolGroup has `toggle` set to `true`, this field can be a boolean or a predicate. Otherwise the field is overridden by the system to reflect the current active state. The field is completely unused if `button` is set to `true`. IMPORTANT: The old `active` field is deprecated but will be respected for now and converted to the new `isActive` field.
- **UPDATE:** If `reloadModuleButtons()` is invoked, the previously selected group/tool will be notified of being deselected.
- **NEW:** When `reloadModuleButtons()` is invoked, the first thing it will do is broadcast a new Hook call of `moduleButtonsReloading`.
- **NEW:** Will now enforce that `toggle` and `button` are mutually exclusive and cannot both be `true`.
- **NEW:** There is now a `refresh()` function on the `ControlManager` class that allows for easy UI refreshing. Unlike `reloadModuleButtons()`, it does NOT rebuild the Tool/ToolGroup data, but instead simply refreshes the UI with the current state.

## Release 1.1.0 (2022-04-05)
- Fixed a LOT of rendering issues.

## Release 1.0.3 (2022-04-05)
- Fixed up some definitions.
- `activateToolByName()` now has the `activateGroup` parameter default to `true` instead of `false`.

## Release 1.0.2 (2021-11-09)
- **FIX:** Tool activation.

## Release 1.0.1 (2021-11-07)
- **FIX:** Correct some behaviour with the group/tool activation.
- **NEW:** Added a couple hooks calls that occur when a Tool or Group is activated.
- **NEW:** Added Pre/Post hooks to the ToolGroup builder to allow devs to tie into before/after the general group builder hook.

## Release 1.0.0 (2021-11-07)
- Initial Release