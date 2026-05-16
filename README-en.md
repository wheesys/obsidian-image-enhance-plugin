[中文文档](readme-zh.md)

# Obsidian Image Enhance Plugin

This is a tool that supports uploading images to image beds using PicGo, PicList, and PicGo-Core.
**Remember to restart Obsidian after updating the plugin.**

**Not tested on Mac**

# Start

1. Install the PicGo tool and configure it, refer to the [official website](https://github.com/Molunerfinn/PicGo)
2. Enable PicGo's Server service and remember the port number
3. Install the plugin
4. Open the plugin settings and set it to `http://127.0.0.1:{{port set in PicGo}}/upload` (e.g., `http://127.0.0.1:36677/upload`)
5. Try to see if the upload is successful

## Set picbed and configName

If you are using PicList (version >= 2.5.3), you can set the picbed and configName through URL parameters.
Example: `http://127.0.0.1:36677/upload?picbed=smms&configName=piclist`
This will upload the image to the `smms` picbed and use the piclist configName.
Using this feature, you can upload images to different picbeds in different Obsidian vaults.

# Commands

The plugin provides the following commands (press `Ctrl+P` / `Cmd+P` to open the command palette and search):

| Command ID | Command Name | Description |
|------------|--------------|-------------|
| `Upload all images` | Upload all images | Upload all images in the current file to image bed |
| `Upload all images in vault` | Upload all images in vault | Scan the entire vault and upload all images from Markdown files |
| `Download all images` | Download all images | Download all network images in the current file to local storage |
| `Clean unused images` | Clean unused images | Scan and delete unused image files in the vault (move to trash) |
| `Delete broken image links` | Delete broken image links | Delete all links pointing to non-existent images in notes |

# Features

## Upload when paste image

When you paste an image to Obsidian, this plugin will automatically upload your image.

You can set `image-enhance: false` in `frontmatter` to control one file.

Supports ".png", ".jpg", ".jpeg", ".bmp", ".gif", ".svg", ".tiff", ".webp", ".avif"

Due to the [bug](https://github.com/wheesys/obsidian-image-enhance-plugin/issues/2) in PicGo 2.3.0-beta7, you cannot use this feature. Please install another version of PicGo.

```yaml
---
image-enhance: true
---
```

## Upload all local images file by command

press `ctrl+P` and input `upload all images`，enter, then will auto upload all local images

## download all internet to local

press `ctrl+P` and input `download all images`，enter, then will auto download all internet images to loacl, only test in win10

## Upload image by contextMenu

Now you can upload image by contextMenu in edit mode.

## Support drag-and-drop

Only work for picgo or picList app.

## server mode

You can deploy [PicList](https://github.com/Kuingsmile/PicList/releases) or [PicList-Core](https://github.com/Kuingsmile/PicList-Core) in your server and upload to it.

Support [PicList](https://github.com/Kuingsmile/PicList/releases) 2.6.3 later or [PicList-Core](https://github.com/Kuingsmile/PicList-Core)1.3.0 later

You can not upload network in this mode.
If you upload fail when you paste img, you can alse try to enable the mode.

## Support picgo-core

You can install picgo-core with npm. Reference to [doc](https://picgo.github.io/PicGo-Core-Doc/)

# TODO

- [x] upload all local images file by command
- [x] support yaml to config if upload image
- [x] support picgo-core
- [x] support upload image from system copy selected image
- [x] support network image

# Thanks

[obsidian-imgur-plugin](https://github.com/gavvvr/obsidian-imgur-plugin)
