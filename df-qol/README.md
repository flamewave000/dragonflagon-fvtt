# DragonFlagon Quality of Life
![Forge Installs](https://img.shields.io/badge/dynamic/json?color=red&label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fdf-qol) ![Latest Version](https://img.shields.io/badge/dynamic/json?label=Latest%20Release&prefix=v&query=package.versions%5B0%5D&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fdf-qol) [![Foundry Hub Endorsements](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fdf-qol%2Fshield%2Fendorsements)](https://www.foundryvtt-hub.com/package/df-qol/)

Adds various Quality of Life improvements. These are all small, light-weight, adjustments that didn't fit in my other larger modules that help work out some of the kinks in Core FoundryVTT.

Each feature is not only self-contained, but when disabled will completely and cleanly remove itself from Foundry. This is so that if any one feature happens to conflict with another module, disabling it guarantees the conflict will be resolved. There are currently no reported conflicts though, so have fun!

##### [![become a patron](../.assets/patreon-image.png)](https://www.patreon.com/bePatron?u=46113583) If you want to support me or just help me buy doggy treats! Also, you can keep up to date on what I'm working on. I will be announcing any new modules or pre-releases there for anyone wanting to help me test things out!

## Token Locking

If enabled, you will now be able to lock individual tokens. This works the same way as locking Tiles or Drawings. Perfect making sure players cannot move a token without having to pause the game. Or maybe you just want to place some tokens on a landing page and don't want players to accidentally move them around.

By default, GM users are still able to move locked tokens around the scene. This can be disabled in the Module's configuration. Great to help keep yourself from shifting tokens by accident as well.

 You can also Lock or Unlock a selected group of tokens.

![Token Lock](../.assets/df-qol/token-lock.png)

## Quick Table Rolling

This is a very feature that adds a "Roll on the table" option to the context menu of RollTable entities. This allows you to roll the table without opening the Roll Table sheet and clicking the Roll button there.

![Quick Roll Option](../.assets/df-qol/roll-table.png)

## ~~Auto-Focus Text Box When Creating Entities~~ (Autofocus is now part of Core FoundryVTT)

~~When creating an Entity (Actors, Items, Tables, Scenes, Folders, etc.) this will auto-select the Name text box so you don't have to click it. Just open the dialog and start typing! This will also affect any generic dialog that contains a Text box in it.~~

## Custom Folder Text Colours

Folders for the various entities can have custom background colours, but sometimes that colour does not contrast well with the unchanging text colour. This feature allows you to customize the text colour as well.

![Folder Config](../.assets/df-qol/folder-config.png)

## Vehicle Cargo Capacity Unit

In the core D&D5e vehicle sheet, the cargo capacity is rigidly defined as a 2000 lb. Short Ton. This feature does away with that and gives you an option in the Vehicle Actor's sheet config to change that unit of measurement to either Long Tons (2240 lbs.), Short Tons (2000 lbs.), or Regular Pounds. I've made this one because of myt own frustrations. Tons is perfectly fine for a ship or vessel, but in most games, players are just using simple carts, wagons, and carriages. Those don't carry more than 1-2 S.Tons, so why have such a huge unit of measure?

This feature will also offer to conveniently convert the current cargo capacity to the new unit of measure. It also adds a simple label to the right of the Cargo Capacity to say which unit of measure is being used.

![Configure Unit for Weight](../.assets/df-qol/vehicle-unit-config.png)
![Convert to new Unit](../.assets/df-qol/vehicle-unit-convert.png)
![Unit Labels on the Sheet](../.assets/df-qol/vehicle-unit-labels.png)

## Day/Night Transition Progress and Duration

Will now display a progress bar when you perform the animated transition between Day and Night. This is only shown to the GM and is useful to know when the animation has finished.

![Day/Night Progress Bar](../.assets/df-qol/day-night-progress.png)

You can also now change the duration of the Day/Night transition. The FoundryVTT default is 10 seconds, but now you can adjust it between 1 and 60 seconds!

![Day/Night Duration](../.assets/df-qol/day-night-duration.png)


## Better Toggle Styling

The toggle buttons in the scene controls have the same look for both Hovering over with the mouse as when they are toggled on. This is frustrating as you cannot tell if the button is on or off while the mouse is hovering over it. Also, the difference between active and inactive is too subtle and is not easy to discern at a glance. This feature adds a distinct deeper purple colouring to the toggle when it is toggled on.

![Folder Config](../.assets/df-qol/better-toggle.gif)

## (D&D 5e Only) Better Attack Button Highlighting

When using automation like DAE or Midi QoL, the styling for the Advantage and Disadvantage buttons will be adjusted so they have a brighter border when they are set to the default option. This should help to avoid clicking the wrong button.

## Contributors

- Touge & [BrotherSharper](https://github.com/BrotherSharper): Japanese Localization
- [MagelaCE](https://github.com/MagelaCE): Português (Brasil) Localization

## Changelog

You can find all the latest updates [in the CHANGELOG](./CHANGELOG.md)
