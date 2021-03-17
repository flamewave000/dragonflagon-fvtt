# DragonFlagon Hotkeys Library

## Release 1.1.0 (2021-03-17)
- Added `onKeyDown` and `onKeyUp` to listen for both explicit actions.
- Added `repeat` boolean option. This will allow the `onKeyDown` handler to be called for repeated key down events that occur from the user holding the key down.
- Deprecated: `handle` field is now deprecated in leu of using `onKeyDown`

## Release 1.0.1-1.0.2 (2021-03-16)
- Added parameter validation to the `registerHotkey` and `registerGroup` functions. This way a developer can catch a problem early.
- 0-Day Bug Fix: Saving hotkey configurations was failing due to using `expandObject`.
- Moved key labels into Locale file so they can be potentially translated.

## Release 1.0.0 (2021-03-15)
- Initial release with full features.