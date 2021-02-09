# DragonFlagon Curvy Walls

![Curvy Walls Banner](../.assets/df-curvy-walls-banner.png)

Adds Bezier Curves and Ellipse tools to the walls layer. This gives you the ability to generate wall segments along a curve quickly and easily. You can also increase or decrease the number of wall segments used along the curve.

| Cubic Bezier Curve | Quadratic Bezier Curve | Ellipse With Slicing |
| :-: | :-: | :-: |
| [![Quadratic Curve](../.assets/df-curvy-walls-cubic.gif)](https://github.com/flamewave000/dragonflagon-fvtt/issues/18) | [![Quadratic Curve](../.assets/df-curvy-walls-quadratic.gif)](https://github.com/flamewave000/dragonflagon-fvtt/issues/19) | [![Quadratic Curve](../.assets/df-curvy-walls-ellipse.gif)](https://github.com/flamewave000/dragonflagon-fvtt/issues/20) |

##### [![become a patron](../.assets/patreon-image.png)](https://www.patreon.com/bePatron?u=46113583) If you want to support me or just help me buy doggy treats! Also, you can keep up to date on what I'm working on. I will be announcing any new modules or pre-releases there for anyone wanting to help me test things out!

## Bezier Curves

Supports both a Quadratic and Cubic curve to give differing forms of curve generation. The Quadratic curve may be of very niche use but gives a very fast way to create a simple curve. The Cubic curve is very powerful though, and provides a great to create "just the right" curve.

## Ellipse Curve

Generates a simple ellipse that can be squished and stretched. You can cut a "slice" out of the ellipse to create an opening, and you can specify the arc offset of the walls so the segments are position at the right point along the curve.

## Uses the Current Wall Type Selection

![Wall Type Selection](../.assets/df-curvy-walls-types.webp)

## Community Libraries Used

- BezierJS by Pomax [[Project](https://pomax.github.io/bezierjs)] [[Repositiory](https://github.com/Pomax/bezierjs)]

## Contributors

- [José E. Lozano (Viriato139ac#0342)](https://github.com/lozalojo): Spanish localization
- Touge: Japanese localization

## Changelog

You can find all the latest updates [in the CHANGELOG](./CHANGELOG.md)

---
---

## Building the module
This module requires NPM in order to be compiled as it uses TypeScript and Gulp.
- Make sure you have NPM installed: [Get NPM](https://www.npmjs.com/get-npm)
- Open a terminal in the module directory `/path/to/repo/dragonflagon-fvtt/df-curvy-walls/`
- Run the following `npm install`
- After that finishes you can simply run `npx gulp`
- You will find the compiled module in the now available `dist/` folder.

### Auto-deploy to local FoundryVTT
If you want to have the compiled module output to the FoundryVTT installation instead of to the `dist/` folder, you can do the following:
- Open the `package.json` file.
- Change the `"devDir": "..."` value to your own installation of Foundry's module folder.
- Run the following command `npx gulp dev` to build the project and have the result copied to your Foundry Modules folder.
