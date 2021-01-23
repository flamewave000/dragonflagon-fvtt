# DF Curvy Walls 

## Release 1.1.0 (2021-01-22)

### General

- Added keyboard capture of the "Enter", "Delete", and "Backspace" keys. The "Enter" key will now apply the current wall curve (just like clicking the green checkmark). The "Delete" and "Backspace" keys will clear the current tool (just like clicking the red X button).
- Added French translations.
- Bug Fix: Right-Click cancelling of the current point drag will now return to its original position as expected instead of clearing the tool.

### Ellipse Tool
- Added button for toggling on/off closing thhe ellipse when slicing. This can be useful for making a circle with a flattened side.
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