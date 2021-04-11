# DF Curvy Walls

## Release 2.1.1 (2021-03-23)
- Updated Hotkeys shim and added hard dependency for the library.
- Japanese Locale update courtesy of Touge, Brother Sharp.

## Release 2.1.0 (2021-03-18)
- Added soft-dependency on Library: DF Hotkeys using its new Shim.
- Spanish localization update courtesy of [José E. Lozano (Viriato139ac#0342)](https://github.com/lozalojo)

## Release 2.0.0 (2021-03-17)
- Fixed Memory Issues! I was not managing my PIXI graphics properly, but now it is much more efficient and no longer causes memory leaks.
- NEW! Rectangle Tool. You can now draw rectangles that allow you to increment/decrement the number of segments on each side.
- Fixed rounding error issue with Ellipse causing it to be missing a wall when using certain numbers of wall segments.

## Release 1.3.4 (2021-02-15)
- Potential fix for a randomly occurring error.
- Fixed the url for the Manifest+ Media Cover (was missing the image).

## Release 1.3.2/3 (2021-02-04)
- Implemented new release system for all Dragon Flagon modules.

## Release 1.3.1 (2021-02-03)
- Added Japanese translations, courtesy of Touge

## Release 1.3.0 (2021-01-28)
- Fixed issue plaguing some users where the buttons don't do anything. This was caused by some users having an older version of the Foundry Installation (even though they updated to 0.7.9). Unfortunately Electron did not always update correctly during Foundry updates, and was causing problems. The issue has been corrected to accommodate those users.
- Added Keyboard mapping of the `+` and `-` keys for incrementing and decrementing the number of wall segments.

## Release 1.2.1 (2021-01-24)
- Added Spanish localization, courtesy of [José E. Lozano (Viriato139ac#0342)](https://github.com/lozalojo)
- Fixed module manifest not allowing people to update to the latest version properly.

## Release 1.2.0 (2021-01-23)
- Added label to display the current angle snap of the Ellipse Tool.
- Added label to display the current number of line segments.
- Bug Fix: Extended Tool menu was not opening properly when switching tools. Would only work for which ever tool was first opened.

## Release 1.1.1 (2021-01-23)
- HOT FIX: Corrected issue with keyboard input getting messed up. Users had issues with Pause/Unpause of the game and other keyboard related issues.

## Release 1.1.0 (2021-01-22)

### General

- Added keyboard capture of the "Enter", "Delete", and "Backspace" keys. The "Enter" key will now apply the current wall curve (just like clicking the green checkmark). The "Delete" and "Backspace" keys will clear the current tool (just like clicking the red X button).
- Added French translations.
- Bug Fix: Right-Click cancelling of the current point drag will now return to its original position as expected instead of clearing the tool.

### Ellipse Tool
- Added button for toggling on/off closing the ellipse when slicing. This can be useful for making a circle with a flattened side.
- Added button for toggling off the small partial wall that is generated when the current slice does not line up with the end of a wall segment. This can be useful if you don't want the little bit of extra wall but the slicer handle snapping doesn't quite line up.
- Added 2 buttons, one for increasing the snapping subdivisions, and the other to decrease it. This will provide the following angle snap sizes:
```
	   45°	(8 steps around the circle)
	   30°	(12 steps around the circle)
	   15°	(24 steps around the circle) ⇐ DEFAULT
	  7.5°	(48 steps around the circle)
	 3.75°	(96 steps around the circle)
```

### Cubic Bezier

- Added button for decoupling the line ends from the control handles. You can toggle it off and move the line end without the curve handle following.

---
---

## Release 1.0.0 (2021-01-22)
- Initial project release with core features and more to come.