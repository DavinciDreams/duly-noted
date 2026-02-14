#!/usr/bin/env python3
# Simple script to create minimal PNG icons

import struct
import zlib

def create_png(width, height, color_rgb):
    """Create a simple solid color PNG"""
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    png += struct.pack('>I', 13) + b'IHDR' + ihdr + struct.pack('>I', zlib.crc32(b'IHDR' + ihdr) & 0xffffffff)
    
    # IDAT chunk (image data)
    raw_data = b''
    r, g, b = color_rgb
    for y in range(height):
        raw_data += b'\x00'  # Filter type
        for x in range(width):
            raw_data += bytes([r, g, b])
    
    compressed = zlib.compress(raw_data, 9)
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xffffffff)
    
    # IEND chunk
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff)
    
    return png

# Create blue icons (RGB: 37, 99, 235 = #2563eb)
blue = (37, 99, 235)

for size in [16, 48, 128]:
    png_data = create_png(size, size, blue)
    with open(f'icon-{size}.png', 'wb') as f:
        f.write(png_data)
    print(f'Created icon-{size}.png ({size}x{size})')

print('All icons created!')
