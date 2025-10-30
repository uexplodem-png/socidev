# Icon Files

Place your application icons in this directory:

- **icon.icns** - macOS icon (1024x1024, .icns format)
- **icon.ico** - Windows icon (256x256, .ico format)  
- **icon.png** - Linux icon (512x512, .png format)

## Icon Requirements

### macOS (.icns)
- Sizes: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
- Format: ICNS
- Recommended: Use Image2Icon or iconutil

### Windows (.ico)
- Sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- Format: ICO
- Recommended: Use PNG2ICO or ImageMagick

### Linux (.png)
- Size: 512x512 or 1024x1024
- Format: PNG with transparency
- Recommended: High-quality PNG with transparent background

## Quick Generate

From a single 1024x1024 PNG source:

```bash
# macOS
png2icns icon.icns icon.png

# Windows (with ImageMagick)
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# Linux
cp icon.png icon-512.png
```

## Online Tools

- https://cloudconvert.com/png-to-icns
- https://cloudconvert.com/png-to-ico
- https://www.icoconverter.com/
