# Icons

This directory should contain the extension icons in three sizes:

- `icon-16.png` - 16x16 pixels (browser toolbar)
- `icon-48.png` - 48x48 pixels (extension management page)
- `icon-128.png` - 128x128 pixels (Chrome Web Store)

## Temporary Solution

For development, you can:

1. Create simple colored squares using any image editor
2. Or use this online tool: https://www.favicon-generator.org/
3. Upload a simple image (like a microphone emoji screenshot)
4. Download the generated icons

## Icon Design Guidelines

- Use a microphone 🎤 or voice wave symbol
- Primary color: #2563eb (blue)
- Background: white or transparent
- Keep it simple and recognizable at small sizes

## Quick Creation (if you have ImageMagick installed)

```bash
# Create a simple blue square as placeholder
convert -size 16x16 xc:#2563eb icon-16.png
convert -size 48x48 xc:#2563eb icon-48.png
convert -size 128x128 xc:#2563eb icon-128.png
```

For now, the extension will work without icons, but Chrome will show a default placeholder.
