# DragonFlagon Enhancement Suite for Foundry VTT

## How to install

- Download the extension for Chrome or Firefox
- **Chrome:**
  - Open Browser Settings Menu
  - Select Extensions
  - Toggle "Developer mode" on
  - Either click and drag the `df-fvtt-es_2.0.zip` file onto the extensions page, OR use the "Load unpacked" button to load it from file.
  - Enjoy!
- **Firefox:**
  - Open Browser Settings Menu
  - Select "Add-ons"
  - Either click and drag the `df-fvtt-es_2.0.xpi` file onto the add-ons page, OR click the gear button and select "Install add-on from file".

## FVTT Setup Package Sorting
Alphabetical sorts the modules/packages on the server setup screens. The default sort is by "most recently updated", and can be difficult to navigate. This extension re-sorts the packages alphabetically.

## Login Screen Animated Background Extension
This will allow you to place an animated background on the login screen.

### **Important: Requires all players to have this extension installed to see it.**

### How to use (GM only)
![Setup](../.assets/df-bganim-update.png)
- In the regular background image field of the World settings, simply enter in the URL for the video.
- Click "Update World", launch your world and enjoy the view.
- File must have one of these supported extensions: `'mp4', 'm4v', 'ogg', 'webm'`

#### With Background Image Backup
- Upload your video into the same directory as your normal background image.
- Give it an identical name (except for the extension)
  `path/to/my-loginscreen.jpg`
  `path/to/my-loginscreen.mp4`
- In the World Config, select your image file and save.

The script will see the image URL and attempt to load a video of the same path and name but with the extension as .mp4 or .m4v

### Adjust Video Scaling/Fit

You can add flags at the end of the URL that allows for selecting a different option for scaling the video as well as muting the video. This is in the format:  
`path/video.mp4?OPTIONS` or `path/image.jpg?OPTIONS`  
For Example:  
`path/to/my-video.mp4?fill`  
`path/to/my-image.jpg?fill&mute`

The script will extract that flags from the URL and apply it to the video player. The available options are as follows:
- **`mute`:** Mutes the video and does not display the volume control.
- **`cover` (default scaling):** The video is sized to maintain its aspect ratio while filling the screen's entire area. The object will be clipped to fit.
- **`fill`:** The video is sized to fill the screen's entire area. If necessary, the object will be stretched or squished to fit.
- **`contain`:** The video is scaled to maintain its aspect ratio while fitting within the screen's area.
- **`scale-down`:** The video is sized as if `none` or `contain` were specified (would result in a smaller video size).
- **`none`:** The video is not resized.
