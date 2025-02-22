# DragonFlagon Flag Editor

## Release 2.0.1 (2025-02-22)
- **UPDATE:** Now using built in `fromUuid` and `fromUuidSync` helper functions to more reliably lookup documents and better support embedded documents which previously had issues.

## Release 2.0.0 (2025-02-13)
- **UPDATE:** Migrated to v12.
- **UPDATE:** Downgraded TS -> JS (such sad).

## Release 1.2.0 (2022-10-17)
- **UPDATE:** Migrated to v10.
- **UPDATE:** Improved flag deletion. You can now properly delete root flags, and if a root has no properties or is null, it will be automatically deleted to keep the flags clean.

## Release 1.1.2 (2021-12-30)
- **FIX #244:** Modifying values would delete everything instead of properly updating them.
- **UPDATE:** Updated FoundryVTT support to V9.

## Release 1.1.1 (2021-11-15)
- **FIX:** Forgot to remove a debug flag.

## Release 1.1.0 (2021-11-11)
- **NEW #200:** All config and document sheet windows will now have an "Edit Flags" button in the header. This will open the window's document in the Flags Editor for quick access.
- **FIX #199:** Flag Editor not opening if Ace Library wasn't enabled.
- **FIX:** Fixed key deletion. Also added notice about scopes not being deletable.

## Release 1.0.0 (2021-09-29)
- Initial release