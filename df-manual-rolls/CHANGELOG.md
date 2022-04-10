# DF Manual Rolls

## Release 2.3.1 (2022-04-10)
- **FIX #307:** Fixed conflict with Monk's Little Details where round messages do not have a `user` bound.
- **FIX #302:** Custom Roll implementations courtesy of [JustNoon](https://github.com/JustNoon).
- **NEW #340:** You can now override the manual roll setting for each player.

## Release 2.3.0 (2021-12-30)
- **UPDATE:** Compatibility with FoundryVTT V9.
- **REMOVED #271:** Async initiative roll patch for FVTT 0.8.x.

## Release 2.2.4 (2021-10-15)
- **NEW:** Polish Localisation courtesy of [MichalGolaszewski](https://github.com/MichalGolaszewski).
- **FIX:** Conflict with D&amp;D Beyond Importer module

## Release 2.2.3 (2021-10-14)
- **FIX:** Tab Indexing in the prompt is corrected. First field will be focused and fields will focus in the correct order.
- **FIX:** Issue with Pathfinder 1 system that caused unnecessary prompting due to unused background rolls in character sheets.

## Release 2.2.2 (2021-08-09)
- Migrated license from GPLv3 to BSD 3-Clause.

## Release 2.2.1 (2021-06-29)
- **FIX:** console error for non-roll chat messages. Was not properly ignoring messages that were not rolls.

## Release 2.2.0 (2021-06-28)
- **NEW:** Legacy support for non-async rolls. This presents the kind of prompt in the old version for 0.7.x. One improvement is the handling of grouped rolls. If there are no modifiers (ie. kh/kl), it prompt for the total for the roll instead of asking for each die roll. This is possible with Foundry 0.8.x's rolling system improvements.

## Release 2.1.1 (2021-06-17)
- **FIX:** Total Roll distribution algorithm. It was distributing the roll poorly for large dice counts and would end up with the wrong total.

## Release 2.1.0 (2021-06-14)
- **NEW:** `MRT` distinction for when a roll group is given a total instead of individual results.
- **NEW:** Updated settings to provide more granular control of manual rolls for both GM and PC users.
- **NEW:** a toggleable option that adds a toggle button to the scene controls to toggle Manual Rolls on or off.
- **NEW:** Patched FoundryVTT's Combat Initiative system to use the new Async Rolling.
- **FIX:** issue where closing a roll request was not resolving the request with RNG.
- **FIX:** issue where empty dialogs were shown for rolls that had no "dice" in them.

## Release 2.0.0 (2021-06-13)
- Completely rebuilt the manual roll system for FoundryVTT 0.8.6

## Release 1.2.1 (2021-03-06)
- Conflict: Quick Rolls on DnD5e systems. Work around has been made available.
- Work Around: Disable roll prompt flavour text (new setting added for this).

## Release 1.2.0 (2021-03-04)
- **FIX:** Minimum roll requests are now properly returned without prompting the user for a roll.
- **FIX:** "Manual Roll" Chat flags will now no longer appear on chat cards that contain **only** RNG rolls.
- **NEW:** "MR" and "RN" will now appear as flavour text on the individual Dice Terms. This shows exactly which numbers were manually entered, and which were randomly generated.

## Release 1.1.0 (2021-03-04)

- **NEW:** support to display Roll Flavour Text in the prompt when it displays. ***DnD5e Only*** Support for other systems will depend on demand.
- Note: Not all flavour texts will display when using something like BetterRolls.

## Release 1.0.0 (2021-02-05)

- Official Release

## Pre-Release 0.1.0 (2021-02-05)

- **FIX:** Conflict issues with Midi QoL and BetterRolls

## Pre-Release 0.0.2/3 (2021-02-04)

- **NEW:** Implemented new release system for all Dragon Flagon modules.

## Pre-Release 0.0.1 (2021-02-03)

- Initial Pre-Release

