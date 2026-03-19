from PIL import Image, ImageDraw, ImageFont
import os

img = Image.new("RGB", (128, 128), color="#FFE500")
draw = ImageDraw.Draw(img)

# Draw a thick black border
draw.rectangle([0, 0, 127, 127], outline="#000000", width=6)

# Draw "TL;" on line 1, "DR" on line 2 in bold black
# Use a large font size — use default PIL font if no system font available
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
except:
    font = ImageFont.load_default()

draw.text((14, 18), "TL;", fill="#000000", font=font)
draw.text((14, 62), "DR", fill="#000000", font=font)

# Draw a small filled black rectangle accent in bottom-right corner
draw.rectangle([88, 90, 118, 118], fill="#000000")

img.save("../extension/favicon.png")
