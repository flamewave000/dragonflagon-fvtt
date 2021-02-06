# Dragon Flagon Manual Rolls

Allows you to manually enter the individual dice results when making any kind of roll. This can be great for both testing your game (where you want to roll a specific number) or if you want to use real dice! and let Foundry figure out the math.

Given the limitations of Foundry around Rolling (namely that rolls are not Asynchronous) it is difficult to really do any kind of overhaul of the roll system. But I've found a way using good ol' fashioned prompts!

![Manual Rolls Demo](../.assets/df-manual-rolls-demo.webp)

## Limitations

❌ **It will NOT work inside the Foundry Desktop App. The module will only work inside a Browser.**

Unfortunately, Electron (what the Foundry app is built on) does not completely support all web standards. In this case they have not implemented the `prompt` dialog (even though they have the `alert` and `confirm` dialogs implemented 🤷‍♂️). So as long as you are playing in any regular browser (Brave, Edge, Firefox, Chrome, etc.) the module will be fine.

## Potential Conflicts

There is always a potential conflict with any other module that modifies rolls. As of right now, the following popular modules have been tested and do not appear to have any issues. But if any do, please let me know via Discord or log an issue on GitHub.

**Known Dice Modules (✅ Works, ❌ Conflicts) **

- ✅ Better Rolls
- ✅ Midi Quality of Life Improvements
- ✅ Dice So Nice!
- ✅ Dice Tray
- ✅ Let Me Roll That For You

---

##### [![become a patron](../.assets/patreon-image.png)](https://www.patreon.com/bePatron?u=46113583) If you want to support me or just help me buy doggy treats! Also, you can keep up to date on what I'm working on. I will be announcing any new modules or pre-releases there for anyone wanting to help me test things out!
