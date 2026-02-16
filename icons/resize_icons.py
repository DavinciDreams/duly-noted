#!/usr/bin/env python3
"""
Resize logo images to proper Chrome extension icon sizes
"""
from PIL import Image
import os

# Define icon sizes needed for Chrome extension
SIZES = [16, 48, 128]

# Source logo file (transparent background for better visibility)
source_logo = os.path.join('..', 'assets', 'newnewwhite.png')

# Open and process the source image
try:
    img = Image.open(source_logo)
    print(f"Source image: {source_logo}")
    print(f"Original size: {img.size}")
    print(f"Mode: {img.mode}")

    # Generate icons at each size
    for size in SIZES:
        # Create a copy and resize with high-quality resampling
        icon = img.copy()
        icon = icon.resize((size, size), Image.Resampling.LANCZOS)

        # Ensure RGBA mode for transparency
        if icon.mode != 'RGBA':
            icon = icon.convert('RGBA')

        # Save the icon
        output_path = f'icon-{size}.png'
        icon.save(output_path, 'PNG', optimize=True)
        print(f"Created: {output_path} ({size}x{size})")

    print("\n✅ All icons generated successfully!")

except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)
