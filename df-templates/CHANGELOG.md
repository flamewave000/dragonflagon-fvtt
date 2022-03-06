# DragonFlagon Template Enhancements

## Release 1.0.0 (2022-03-06)

> This is the initial release of this module. It contains all the features previously available in DF Quality of Life but with the following fixes and upgrades.

- FIX #311: Rotating spell template will no longer create a circular highlight when rotated CCW.
- FIX #301: Fixed template targetting for D&D 5e so that tokens larger than 1x1 are targetted accurately.
- FIX #234 & #238: Fixed template deletion that sometimes conflicted with other modules.

- NEW #291: Auto-Targetting now supports Gridless scenes! Foundry Core will select a token whose center is within the template shape, while D&D5e mode will target a token if any part of it is inside of the template shape. IMPORTANT: In order to simplify the targetting and not have bad performance, the test is done using a grid of points that fill the token. This may not always be perfectly accurate, but the grid point resolution is configurable in settings.
- NEW #226: Added a new feature that if enabled will snap templates to Grid Intersections. This is a rule for D&D 5e that spells always originate from grid intersections. This allows you to easily enforce that during game time.
