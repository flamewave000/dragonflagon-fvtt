# DragonFlagon Active Lights

## Release 1.3.0 (2022-10-15)
- **UPDATE:** Migrated to v10.
- **FIX:** Colour transitions work again.

## Release 1.2.1 (2022-04-05)
- **NEW:** Added toggle button to lighting layer controls for pausing active light animations.
- **FIX #278:** Fixed the light animation issues for v9. Active Lights should all be fully functional again.

## Release 1.2.0 (2021-12-30)
- **UPDATE:** Migrated to FoundryVTT V9.
- **FIX #267:** Active Lights are now animating again.
- **FIX #268:** Active Light Config can now be opened from the "Light Animation" tab in the Ambient Light Config.

## Release 1.1.3 (2021-10-15)
- **FIX:** Wrong word in a label.

## Release 1.1.2 (2021-08-09)
- Migrated license from GPLv3 to BSD 3-Clause

## Release 1.1.1 (2021-07-16)
- **FIX:** an issue with 0 Radius light animations. If you animate both the Dim and Bright radius to 0, the light would get removed from the lighting system. This has been corrected so that lights can be 0-radius while they are being animated.
- **FIX:** Small optimizations in the light animation cycle.

## Release 1.1.0 (2021-02-12)
- Revised animation functions
	- Quadratic Loop renamed to Quadratic Full
	- Elliptic Loop renamed to Elliptic Full
- Added additional functions
	- Linear Loop, performs a linear loop from 0 to 1 to 0 again.
	- Quadratic Loop, an actual loop from 0 to 1 to 0 again.
	- Elliptic Loop, an actual loop from 0 to 1 to 0 again.
	- Fixed Start, no easing, uses the full Start value until the very end where it will immediately switch to the full End value.
	- Fixed End, no easing, uses the full Start value at the very beginning but immediately switches to the full End value.
- Updated README to contain documentation and graphs for the animation functions.
- Localized the module.

## Release 1.0.0 (2021-02-11)
- First Release