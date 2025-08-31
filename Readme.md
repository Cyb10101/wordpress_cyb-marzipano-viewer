# Cyb Marzipano Viewer
Tested up to: 6.8
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Embed interactive 360° panoramas in WordPress Gutenberg using Marzipano for virtual tours or exhibitions.

## Description

A plugin for the WordPress Gutenberg block editor.

Easily embed interactive 360° panorama images converted into multi-resolution tiles using [Marzipano](https://www.marzipano.net/).

Perfect for virtual tours, exhibitions or immersive media content.

## Links

* [Plugin on WordPress](https://wordpress.org/plugins/cyb-marzipano-viewer)
* [Source Code](https://github.com/Cyb10101/wordpress_cyb-marzipano-viewer)

## Note

The goal of the project was to implement a panorama in a relatively simple way.
The basic configuration is done via JSON. Everything else is features.
So there is more magic here than planned.

Marzipano is displayed in the backend, but is almost impossible to use there.

## Usage

1. Generate panorama with the [Marzipano Tool](https://www.marzipano.net/tool/)
2. Download the archive and extract the files
3. Copy `app-files/tiles/*` to `/panorama/marzipano/project/` (for example)
4. Copy `app-files/data.js` to `/panorama/marzipano/project/`
5. Rename `data.js` to `config.json`, then edit it:
   1. Remove at begin `var APP_DATA = `
   2. Remove at end `;`
6. Add the **Marzipano Viewer** WordPress block in the Gutenberg editor
7. Embed `/panorama/marzipano/project/config.json`

## Credits

This plugin uses [Marzipano (Apache License 2.0)](https://www.marzipano.net) for displaying panoramic images.

Portions of the configuration logic and structure were adapted from Marzipano’s example viewer
(index.html, index.js, style.css), modified to integrate with WordPress Gutenberg blocks.

Includes files Marzipano project (Apache 2.0 License):

* vendor/images/*.png
* vendor/DeviceOrientationControlMethod.js
* vendor/marzipano.js

All third-party components retain their original licenses.
