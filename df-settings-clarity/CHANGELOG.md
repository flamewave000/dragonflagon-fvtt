# DF Settings Clarity

## Release 3.3.0 (2022-10-15)
- **UPDATE:** Migrated to v10.

## Release 3.2.0 (2021-06-18)
- Fixed height issues in 0.8.x where the save button was being pushed off the screen.
- Corrected the styling to match TidyUI when it is enabled.
- Added dependency for libWrapper to add better core foundry patching.
- Settings labelling will now respect the configured Settings Permissions. So if you have an appropriate roll for changing world settings, you will now get labels.

## Release 3.1.0 (2021-03-22)
- Added a coloured indicator to the left of results that show how strong the match is compared to the others. Green is the best match, Red is the worst, colours inbetween green and red lay somewhere inbetween best and worst.
- Adjusted search strictness. Now it goes from strict to lax as you add text. Fewer letters require a more perfect match, while a lot of text requires a much more relaxed match.

## Release 3.0.0 (2021-03-21)
- New Fuzzy Search for module settings!

## Release 2.1.4 (2021-02-22)
- If a setting/menu does not have the `scope` or `restriction` flag set, it will now default to `client`.

## Release 2.1.3 (2021-02-18)
- Fixed scope indicator on Menus.
- Added Manifest+ cover image to manifest.
- Added Bug Reporter support to manifest.

## Release 2.1.1/2 (2021-02-04)
- Implemented new release system for all Dragon Flagon modules.

## Release 2.1.0 (2021-01-26)
- Moved the text label into a tooltip and now only add the emoticon to the settings label. Much more minimal and unobtrusive.

## Release 2.0.3 (2021-01-25)
- Added emoticons to the labels to make them more visually distinct.

## Release 2.0.2
- Added Spanish localization, courtesy of [José E. Lozano (Viriato139ac#0342)](https://github.com/lozalojo)

## Release 2.0.1
- Updated FoundryVTT version support.

## Release 2.0
- Removed labels from non-GM users since they can only ever see Per Client settings.
- Updated FoundryVTT version support.

## Release 1.0
- Initial Release