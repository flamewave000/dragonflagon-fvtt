# DragonFlagon Template Enhancements

## Release 1.2.1 (2022-04-05)
- **FIX #350:** Error when opening config while on a language other than English.

## Release 1.2.0 (2022-04-04)
- **NEW #332:** Each template type can now be independently configured.
- **NEW #330:** Experimental Percentage based Token Auto-Target. This uses the Point Grid settings and targets tokens based on the percentage of points within the template.
- **FIX #333:** Added Width/Height fields to the rectangle template shape which Sequencer is expecting.

## Release 1.1.1 (2022-03-09)
- **FIX:** Intersection snapping will no longer occur on gridless scenes.
- **FIX #331:** DnD5e option no longer overrides the disabled Preview Template option.
- **IMPROVED:** Grid highlighting will now be much more efficient as the grid test area has been reduced by ~70% compared to Core FoundryVTT.

## Release 1.1.0 (2022-03-08)
- **NEW #327:** Square Templates do not keep their shape when rotating. This will correct the rotation so that a square template maintains its shape while rotating around the template's origin point.

## Release 1.0.1 (2022-03-07)
- **FIX #325:** Token targeting will no longer be affected by token image scale.
- **FIX #323:** Intersection snapping will no longer bypass setting when placing a spell template in D&D5e.
- **FIX #322:** Grid highlighting was erroneously exiting early after highlighting the first square when Auto-Target was turned off.

## Release 1.0.0 (2022-03-06)

> This is the initial release of this module. It contains all the features previously available in DF Quality of Life but with the following fixes and upgrades.

- **FIX #311:** Rotating spell template will no longer create a circular highlight when rotated CCW.
- **FIX #301:** Fixed template targetting for D&D 5e so that tokens larger than 1x1 are targetted accurately.
- **FIX #234 & #238:** Fixed template deletion that sometimes conflicted with other modules.

- **NEW #291:** Auto-Targetting now supports Gridless scenes! Foundry Core will select a token whose center is within the template shape, while D&D5e mode will target a token if any part of it is inside of the template shape. IMPORTANT: In order to simplify the targetting and not have bad performance, the test is done using a grid of points that fill the token. This may not always be perfectly accurate, but the grid point resolution is configurable in settings.
- **NEW #226:** Added a new feature that if enabled will snap templates to Grid Intersections. This is a rule for D&D 5e that spells always originate from grid intersections. This allows you to easily enforce that during game time.
- **NEW #229:** You can now customize the Snap Angles for template rotation. This allows a GM to reduce the number of angles a template can be snapped to and help speed up combat.
