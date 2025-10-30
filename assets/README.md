# Application Icons

This directory contains application icons for different platforms.

## Required Icons

### For Mac (macOS)
- `icon.icns` - Mac application icon
  - Create using: `iconutil -c icns icon.iconset`
  - Or use online tools like CloudConvert

### For Windows
- `icon.ico` - Windows application icon
  - Should include multiple sizes: 16x16, 32x32, 48x48, 256x256
  - Create using tools like GIMP or online converters

### For Linux
- `icon.png` - PNG format icon
  - Recommended size: 512x512 or 1024x1024

## How to Generate Icons

1. Create a base PNG image (1024x1024 recommended)
2. Use electron-icon-builder or similar tools:
   ```
   npm install -g electron-icon-builder
   electron-icon-builder --input=./base-icon.png --output=./assets
   ```

3. Or use online tools:
   - https://cloudconvert.com/ (for .icns conversion)
   - https://icoconvert.com/ (for .ico conversion)

## Temporary Solution

If no icons are provided, Electron will use default icons. The application will still work normally.
