"""Bake the annotated reference into terrain data; only developers need Python."""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import binary_closing, binary_fill_holes, distance_transform_edt

root = Path(__file__).resolve().parent.parent
reference = np.asarray(Image.open(root / 'tools/reference-hitbox.png').convert('RGB')).astype(np.int16)
background = np.asarray(Image.open(root / 'assets/battlefield.png').convert('RGB')).astype(np.int16)
changed = np.max(np.abs(reference - background), axis=2) > 35
r, g, b = (reference[:, :, i] for i in range(3))
outlines = {
    '#': changed & (b > 160) & (g > 105) & (r < 90) & (b > g + 35),
    'g': changed & (g > 110) & (g > r + 45) & (g > b + 30),
    'x': changed & (r > 140) & (np.abs(r - g) < 16) & (np.abs(g - b) < 16),
}

def filled(outline):
    # Close tiny gaps left by antialiasing, including contours ending at the map edge.
    sealed = binary_closing(outline, iterations=3, border_value=1)
    return binary_fill_holes(sealed | outline)

water = filled(outlines['#'])
# Open water channels at the image edges do not form closed polygons. Their
# painted blue interior still belongs to the blue annotation on either bank.
br, bg, bb = (background[:, :, i] for i in range(3))
painted_water = (bb > br * 1.16) & (bb > bg * 1.07) & (bg > br * 1.14) & (bb > 54)
water |= painted_water & (distance_transform_edt(~outlines['#']) < 65)
rock = filled(outlines['x'])
forest = filled(outlines['g'])
# The blue and gray outlines override a forest wherever they overlap.
classes = np.zeros(water.shape, dtype=np.uint8)
classes[forest] = 1
classes[rock] = 2
classes[water] = 3
cols, rows = 145, 109
grid = []
for row in range(rows):
    line = []
    for col in range(cols):
        x0, x1 = round(col * classes.shape[1] / cols), round((col + 1) * classes.shape[1] / cols)
        y0, y1 = round(row * classes.shape[0] / rows), round((row + 1) * classes.shape[0] / rows)
        pixels = classes[y0:y1, x0:x1].reshape(-1)
        values = np.bincount(pixels, minlength=4)
        # Majority preserves narrow intentional clearances at the two main bridges.
        line.append('.gX#'[np.argmax(values)])
    grid.append(''.join(line))

header = ('// Baked collision data from the annotated map. . normal, g forest, X rock, # water.\n'
          '// The illustration is separate and this file runs offline without Python.\n')
body = 'export const TERRAIN_ROWS=[\n' + ''.join(f' {line!r},\n' for line in grid) + '];\n'
body += f'export const TERRAIN_COLS={cols},TERRAIN_HEIGHT={rows};\n'
body += '''export function terrainAt(x,y,width,height){
 const col=Math.floor(x/width*TERRAIN_COLS),row=Math.floor(y/height*TERRAIN_HEIGHT);
 return col<0||row<0||col>=TERRAIN_COLS||row>=TERRAIN_HEIGHT?'#':TERRAIN_ROWS[row][col];
}
export function terrainBlocked(x,y,width,height){return '#X'.includes(terrainAt(x,y,width,height));}
export function terrainSpeed(x,y,width,height){return terrainAt(x,y,width,height)==='g'?.5:1;}
export function terrainBuildable(x,y,width,height){return terrainAt(x,y,width,height)==='.';}
'''
(root / 'js/terrain.js').write_text(header + body, encoding='utf8')
palette=np.array([[0,0,0],[30,190,65],[195,195,195],[0,165,235]],dtype=np.uint8)
preview=Image.fromarray(palette[classes]).resize((724,543))
preview.save(root.parent / 'hitbox-preview.png')
print('terrain cells:', {c: ''.join(grid).count(c) for c in '.gX#'})
