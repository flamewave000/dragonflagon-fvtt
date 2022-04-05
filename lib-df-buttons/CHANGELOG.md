# DragonFlagon Module Buttons Library

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