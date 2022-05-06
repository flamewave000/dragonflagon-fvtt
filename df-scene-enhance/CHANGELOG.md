# DF Scene Enhancement Changes

## Release 3.5.1 (2022-04-04)
- **NEW:** Hovering a Scene Nav Button will display the "Real" scene name in a tooltip if you are a GM.
- **NEW #176:** New option to display the real scene name on the nav buttons for GMs (will display the Nav Name in the tooltip when hovered).
- **NEW #149:** New options in the nav button context menu for the currently viewed scene.
	- **Set Initial View:** Set the initial view of the scene to the current view.
	- **Configure Grid:** Launch the Grid Configuration tool to quickly begin adjusting the current scene's grid alignment.
- **FIX #297:** Player scenes tab now renders properly in V9.

## Release 3.5.0 (2022-01-02)
- **UPDATED:** Migrated to FoundryVTT V9.
- **UPDATED #274:** Japanese Localization: Courtesy of touge and [BrotherSharper](https://github.com/BrotherSharper).
- **FIX #264:** libWrapper errors.
- **FIX #263:** Scenes Context menu now works correctly.
- **FIX #242:** Sidebar no longer shifted left.
- **FIX #266:** Thumbnail overrides now generate properly.
- **FIX #265:** Scene links in journals will properly stop the scene config from opening alongside the regular prompt.

## Release 3.4.1 (2021-07-02)
- Fixed some issues with the scenes directory.
	- Fixed issue where the Create Scene/Folder buttons are missing when there are no scenes in the world yet.
	- Fixed issue with PCs not being able to see the Scenes Directory correctly.

## Release 3.4.0 (2021-06-06)
- Migrated to FoundryVTT 0.8.6
- Added libWrapper integration and dependency.

## Release 3.3.3 (2021-03-30)
- Fixed a permissions issue with Journal entity links.

## Release 3.3.2 (2021-02-17)
- Fixed reported conflict with the module "Calendar/Weather"

## Release 3.3.1 (2021-02-15)
- Fixed conflict with the Laptop Form Fix module.
- Fixed fields not injecting when returning from the Grid Config window.

## Release 3.3.0 (2021-02-06)
- Fixed major issue with Player Scenes tab. They were able to access the Configure and Import/Export actions. This has been fixed and they will now only see the "View Scene" option. Thank you [Doresain](https://github.com/Doresain) for reporting this issue.

## Release 3.2.3 (2021-02-06)
- Added Spanish localization for new features, courtesy of [José E. Lozano (Viriato139ac#0342)](https://github.com/lozalojo)

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
