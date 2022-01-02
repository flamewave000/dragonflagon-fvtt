# DragonFlagon Active Lights

![Forge Installs](https://img.shields.io/badge/dynamic/json?color=red&label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fdf-active-lights) ![Latest Version](https://img.shields.io/badge/dynamic/json?label=Latest%20Release&prefix=v&query=package.versions%5B0%5D&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fdf-active-lights) [![Foundry Hub Endorsements](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fdf-active-lights%2Fshield%2Fendorsements)](https://www.foundryvtt-hub.com/package/df-active-lights/)

This module provides a way to animate all the various configurations of a light. This animation will be synchronized with the server so that all players should see the same animation states. A simple example for this would be for creating a simple Light House where the light's direction would animate all the way around a 180° rotation. The configuration window for Active Lights can be opened from the Light Animation tab in any Ambient Light config window.

![Light House](../.assets/df-active-lights/df-active-lights.gif)
![Energy Dome](../.assets/df-active-lights/df-active-lights2.gif)
![Laser Light](../.assets/df-active-lights/df-active-lights3.gif)
![Police Car](../.assets/df-active-lights/df-active-lights4.gif)


## Animation Functions

The way animations work is that at time T, the position along the transition is at a deterministic position along a mathematical curve. This is some really fancy talk for basically making a dot follow a line.

Take this animation for example:
- Key Frame: 0 Seconds
	- Bright Radius: 0 feet
- Key Frame: 2 Seconds
	- Bright Radius: 40 feet

Given a Linear animation, the following are the results over time:
|0s|0.25s|0.5s|0.75s|1s|
|:-:|:-:|:-:|:-:|:-:|
|0 ft|10 ft|20 ft|30 ft|40 ft|

The same key frames but with an Elliptic Animation would have these results:
|0s|0.25s|0.5s|0.75s|1s|
|:-:|:-:|:-:|:-:|:-:|
|0 ft|15.31 ft|28.28 ft|36.96 ft|40 ft|

Here are all of the animation functions that are available, along with a graph for each.

| Name | Graph | Name | Graph | Name | Graph |
| -: | - | -: | - | -: | - |
| Linear           | ![df-active-lights-graph-linear](../.assets/df-active-lights/df-active-lights-graph-linear.png)           | Quadratic&nbsp;In   | ![df-active-lights-graph-quad-in](../.assets/df-active-lights/df-active-lights-graph-quad-in.png)     | Elliptical&nbsp;In   | ![df-active-lights-graph-ellipse-in](../.assets/df-active-lights/df-active-lights-graph-ellipse-in.png)     |
| Linear&nbsp;Loop | ![df-active-lights-graph-linear-loop](../.assets/df-active-lights/df-active-lights-graph-linear-loop.png) | Quadratic&nbsp;Out  | ![df-active-lights-graph-quad-out](../.assets/df-active-lights/df-active-lights-graph-quad-out.png)   | Elliptical&nbsp;Out  | ![df-active-lights-graph-ellipse-out](../.assets/df-active-lights/df-active-lights-graph-ellipse-out.png)   |
| Fixed&nbsp;Start | ![df-active-lights-graph-fixed-start](../.assets/df-active-lights/df-active-lights-graph-fixed-start.png) | Quadratic&nbsp;Full | ![df-active-lights-graph-quad-full](../.assets/df-active-lights/df-active-lights-graph-quad-full.png) | Elliptical&nbsp;Full | ![df-active-lights-graph-ellipse-full](../.assets/df-active-lights/df-active-lights-graph-ellipse-full.png) |
| Fixed&nbsp;End   | ![df-active-lights-graph-fixed-end](../.assets/df-active-lights/df-active-lights-graph-fixed-end.png)     | Quadratic&nbsp;Loop | ![df-active-lights-graph-quad-loop](../.assets/df-active-lights/df-active-lights-graph-quad-loop.png) | Elliptical&nbsp;Loop | ![df-active-lights-graph-ellipse-loop](../.assets/df-active-lights/df-active-lights-graph-ellipse-loop.png) |

**[![become a patron](../.assets/patreon-image.png)](https://www.patreon.com/bePatron?u=46113583) If you want to support me or just help me buy doggy treats! Also, you can keep up to date on what I'm working on. I will be announcing any new modules or pre-releases there for anyone wanting to help me test things out!**

## Changelog

You can find all the latest updates [in the CHANGELOG](./CHANGELOG.md)