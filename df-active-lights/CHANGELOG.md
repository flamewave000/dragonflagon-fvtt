# DragonFlagon Active Lights

## Release 1.1.1 (2021-07-16)
- Fixed an issue with 0 Radius light animations. If you animate both the Dim and Bright radius to 0, the light would get removed from the lighting system. This has been corrected so that lights can be 0-radius while they are being animated.
- Small optimizations in the light animation cycle.

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