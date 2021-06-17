# DF Manual Rolls

## Release 2.1.1 (2021-06-17)
- Fixed Total Roll distribution algorithm. It was distributing the roll poorly for large dice counts and would end up with the wrong total.

## Release 2.1.0 (2021-06-14)
- Added `MRT` distinction for when a roll group is given a total instead of individual results.
- Updated settings to provide more granular control of manual rolls for both GM and PC users.
- Added a toggleable option that adds a toggle button to the scene controls to toggle Manual Rolls on or off.
- Fixed issue where closing a roll request was not resolving the request with RNG.
- Patched FoundryVTT's Combat Initiative system to use the new Async Rolling.
- Fixed issue where empty dialogs were shown for rolls that had no "dice" in them.

## Release 2.0.0 (2021-06-13)
- Completely rebuilt the manual roll system for FoundryVTT 0.8.6

## Release 1.2.1 (2021-03-06)
- Conflict: Quick Rolls on DnD5e systems. Work around has been made available.
- Work Around: Disable roll prompt flavour text (new setting added for this).

## Release 1.2.0 (2021-03-04)
- Fix: Minimum roll requests are now properly returned without prompting the user for a roll.
- Fix: "Manual Roll" Chat flags will now no longer appear on chat cards that contain **only** RNG rolls.
- New: "MR" and "RN" will now appear as flavour text on the individual Dice Terms. This shows exactly which numbers were manually entered, and which were randomly generated.

## Release 1.1.0 (2021-03-04)

- Added support to display Roll Flavour Text in the prompt when it displays. ***DnD5e Only*** Support for other systems will depend on demand.
- Note: Not all flavour texts will display when using something like BetterRolls.

## Release 1.0.0 (2021-02-05)

- Official Release

## Pre-Release 0.1.0 (2021-02-05)

- Fixed conflict issues with Midi QoL and BetterRolls

## Pre-Release 0.0.2/3 (2021-02-04)

- Implemented new release system for all Dragon Flagon modules.

## Pre-Release 0.0.1 (2021-02-03)

- Initial Pre-Release

