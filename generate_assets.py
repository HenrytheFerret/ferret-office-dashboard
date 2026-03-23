#!/usr/bin/env python3
"""
Generate pixel art assets for the Ferret Office Dashboard.
Creates sprite sheets for agents and tileset for office environment.
"""

from PIL import Image, ImageDraw
import os

# Output directory
ASSETS_DIR = "/data/.openclaw/workspace/ferret-dashboard/frontend/src/assets"
SPRITES_DIR = f"{ASSETS_DIR}/sprites"
TILEMAPS_DIR = f"{ASSETS_DIR}/tilemaps"

os.makedirs(SPRITES_DIR, exist_ok=True)
os.makedirs(TILEMAPS_DIR, exist_ok=True)

# Color palette
COLORS = {
    "bg": (240, 240, 240),
    "transparent": (255, 0, 255),  # Magenta for transparency
    "white": (255, 255, 255),
    "black": (20, 20, 20),
    "gray": (100, 100, 100),
    "dark_gray": (60, 60, 60),
    "light_gray": (180, 180, 180),
    "red": (220, 60, 60),
    "blue": (60, 120, 200),
    "green": (80, 180, 80),
    "yellow": (200, 180, 60),
    "orange": (200, 120, 40),
    "brown": (120, 80, 40),
    "wood": (140, 100, 60),
    "wall": (100, 120, 140),
}

def draw_ferret(draw, x, y, size=16, color_base="blue", animation_frame=0):
    """Draw a simple ferret sprite (32x32 by default with 16px padding)."""
    # Body (rounded rectangle shape)
    body_x = x + 4
    body_y = y + 6
    draw.ellipse([body_x, body_y, body_x + 8, body_y + 12], fill=color_base, outline=COLORS["black"])
    
    # Head
    head_x = x + 6
    head_y = y + 2
    draw.ellipse([head_x, head_y, head_x + 6, head_y + 6], fill=color_base, outline=COLORS["black"])
    
    # Eyes
    eye_x = head_x + 1
    eye_y = head_y + 1
    draw.rectangle([eye_x, eye_y, eye_x + 1, eye_y + 1], fill=COLORS["black"])
    draw.rectangle([eye_x + 3, eye_y, eye_x + 4, eye_y + 1], fill=COLORS["black"])
    
    # Ears
    draw.ellipse([head_x - 1, head_y - 2, head_x + 1, head_y], fill=color_base, outline=COLORS["black"])
    draw.ellipse([head_x + 4, head_y - 2, head_x + 6, head_y], fill=color_base, outline=COLORS["black"])
    
    # Tail based on animation frame
    tail_x = x + 13
    tail_y = y + 8
    if animation_frame % 3 == 0:
        draw.arc([tail_x, tail_y - 2, tail_x + 8, tail_y + 4], 0, 180, fill=color_base, width=2)
    elif animation_frame % 3 == 1:
        draw.arc([tail_x, tail_y - 4, tail_x + 8, tail_y + 2], 0, 180, fill=color_base, width=2)
    else:
        draw.arc([tail_x, tail_y, tail_x + 8, tail_y + 6], 0, 180, fill=color_base, width=2)

def create_sprite_sheet(filename, agent_name, agent_color, num_frames=17):
    """Create a sprite sheet for an agent with multiple animation frames."""
    # 32x32 per frame, 6 frames wide = 192px, 3 rows = 192px
    sheet = Image.new("RGBA", (192, 192), COLORS["transparent"])
    draw = ImageDraw.Draw(sheet)
    
    frame_idx = 0
    for row in range(3):
        for col in range(6):
            if frame_idx >= num_frames:
                break
            x = col * 32
            y = row * 32
            # Draw frame background
            draw.rectangle([x, y, x + 32, y + 32], fill=COLORS["bg"], outline=COLORS["light_gray"])
            # Draw ferret
            draw_ferret(draw, x + 2, y + 2, color_base=agent_color, animation_frame=frame_idx)
            # Frame label
            draw.text((x + 20, y + 26), str(frame_idx), fill=COLORS["black"])
            frame_idx += 1
    
    sheet.save(filename)
    print(f"✓ Created {filename}")

def create_tileset():
    """Create a tileset image for office elements."""
    tileset = Image.new("RGBA", (256, 16), COLORS["transparent"])
    draw = ImageDraw.Draw(tileset)
    
    tiles = [
        ("wall", COLORS["wall"]),      # 0: wall
        ("floor", COLORS["light_gray"]),  # 1: floor
        ("desk_1", COLORS["wood"]),    # 2: desk
        ("desk_2", COLORS["brown"]),   # 3: desk variant
        ("desk_3", COLORS["wood"]),    # 4: desk variant
        ("chair_1", COLORS["gray"]),   # 5: chair
        ("chair_2", COLORS["dark_gray"]),  # 6: chair variant
        ("kitchen", COLORS["white"]),  # 7: kitchen counter
        ("kitchen_2", COLORS["orange"]),  # 8: kitchen stove
        ("meeting", COLORS["green"]),  # 9: meeting table
        ("meeting_2", COLORS["yellow"]),  # 10: meeting table variant
        ("storage", COLORS["brown"]),  # 11: storage
        ("door", COLORS["red"]),       # 12: door
        ("plant", COLORS["green"]),    # 13: plant
        ("plant_2", COLORS["yellow"]), # 14: plant variant
        ("light", COLORS["yellow"]),   # 15: light
        ("empty", COLORS["light_gray"]),  # 16: empty floor
    ]
    
    for idx, (name, color) in enumerate(tiles):
        x = idx * 16
        y = 0
        draw.rectangle([x, y, x + 16, y + 16], fill=color, outline=COLORS["black"])
        # Small detail
        if "desk" in name:
            draw.line([x + 2, y + 8, x + 14, y + 8], fill=COLORS["black"], width=1)
        elif "kitchen" in name:
            draw.rectangle([x + 3, y + 3, x + 13, y + 13], fill=COLORS["dark_gray"])
        elif "chair" in name:
            draw.circle([x + 8, y + 8], 3, fill=COLORS["black"])
    
    tileset.save(f"{TILEMAPS_DIR}/office_tileset.png")
    print(f"✓ Created office_tileset.png")

# Generate sprite sheets
print("Generating pixel art assets...\n")
create_sprite_sheet(f"{SPRITES_DIR}/kevin-sprite.png", "Kevin", COLORS["blue"])
create_sprite_sheet(f"{SPRITES_DIR}/alex-sprite.png", "Alex", COLORS["orange"])

# Generate tileset
create_tileset()

print("\n✓ All assets generated successfully!")
print(f"  Sprites: {SPRITES_DIR}/")
print(f"  Tilemaps: {TILEMAPS_DIR}/")
