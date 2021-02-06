# DF Scene Enhancement Changes

## Release 3.2.1/2 (2021-02-04)
- Implemented new release system for all Dragon Flagon modules.

## Release 3.2.0 (2021-1-28)
- Added many new features for Scene Dimensions (Feature suggestion by @Damocles#7837)
	- Apply scaler value against current dimensions.
	- Changing dimensions will update scale based on the original values when sheet was opened.
	- Lock dimension ratio, will automatically change one dimension when you change the other, maintaining the current aspect ratio to the nearest whole number.
	- Set a custom ratio and apply it to the current dimensions. (Will preserve one of the dimensions, and just change the other to adhere to the new ratio).
	- Clearing a dimension field will reveal the current image's original size for that dimension as placeholder/hint text.

## Release 3.1.2 (2021-1-17)
- Added Spanish corrections courtesy of [José E. Lozano (Viriato139ac#0342)](https://github.com/lozalojo)

## Release 3.1.1 (2021-1-15)
- Added Spanish localization, courtesy of [José E. Lozano (Viriato139ac#0342)](https://github.com/lozalojo)

## Version 3.1 (2021-1-11)
- Fix issues with Scene Link navigation when a Journal Entry has been bound to a Scene.
- Add third option for viewing the associated Journal Entry if one is bound to the Scene.
- Will only display buttons for options that the user has permission to use.
- If only one option is available, the user can have it immediately execute that option without displaying a dialog.

## Version 3.0 (2021-1-11)
- Added new feature for navigating to scenes directly from Journals via Scene Entity links.

## Version 2.4 (2020-11-22)
- Updated FoundryVTT version support.

## Version 2.3 (2020-10-28)
- Fixed issue where Thumbnail Overrides were using incorrect dimensions when being generated. This resulted in thumbnails being misaligned in the Scene card in the Scenes Directory.

## Version 2.2 (2020-10-26)
- Removed `Navigate` scene menu option as it is now a part of core. (see "View Scene" feature in 0.7.5+)

## Version 2.1 (2020-10-25)
- Added localization for Brazil Portuguese, courtesy of [Renato Innocenti](https://github.com/rinnocenti).

## Version 2.0 (2020-10-22)
- Fixed breaking issues with the latest 0.7.4+ builds of FoundryVTT
- Fixed Thumbnail Overrides.
- Fixed Player Scene Tab features.

## Version 1.3 (2020-09-20)
- Fixed a breaking issue with scene directories

## Version 1.2 (2020-09-18)
- Corrected the scenes tab for Players to only show the Navigation Name of a Scene and not the actual Scene name (when available).

## Version 1.1 (2020-09-12)
- Added localization for French
