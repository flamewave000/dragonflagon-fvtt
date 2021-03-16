# DragonFlagon Hotkeys Library

## Release 1.0.1-1.0.2 (2021-03-16)
- Added parameter validation to the `registerHotkey` and `registerGroup` functions. This way a developer can catch a problem early.
- 0-Day Bug Fix: Saving hotkey configurations was failing due to using `expandObject`.
- Moved key labels into Locale file so they can be potentially translated.

## Release 1.0.0 (2021-03-15)
- Initial release with full features.