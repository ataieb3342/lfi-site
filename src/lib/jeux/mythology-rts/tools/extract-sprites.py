"""Build transparent, compact RTS atlases from the supplied concept sheets.

Run with python3 tools/extract-sprites.py while preparing a release. The game
only needs the generated PNGs; Python is not required to play it.
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/sprite-sources'
RED = SOURCE / 'red.png'
OUTPUT = ROOT / 'assets/sprites'
OUTPUT.mkdir(parents=True, exist_ok=True)
BLUE = {kind: f'blue-{kind}.png' for kind in
        ('worker', 'soldier', 'spearman', 'archer', 'cavalry')}


def remove_spots(image, minimum=18):
    pixels = np.asarray(image.convert('RGBA')).copy()
    labels, count = ndimage.label(pixels[:, :, 3] > 20)
    sizes = np.bincount(labels.ravel())
    small = (labels > 0) & (sizes[labels] < minimum)
    pixels[small, 3] = 0
    return Image.fromarray(pixels, 'RGBA')


def cut(image, box, team):
    image = image.crop(tuple(map(int, box))).convert('RGBA')
    pixels = np.asarray(image).copy()
    rgb = pixels[:, :, :3].astype(np.int16)
    low, high = rgb.min(axis=2), rgb.max(axis=2)
    # The blue concept sheets have an ivory background. The red concept
    # sheet has a baked-in pale checkerboard (it is not an alpha channel).
    background = (low > (180 if team == 'blue' else 178)) & (
        high - low < (34 if team == 'blue' else 24))
    seed = np.zeros(background.shape, bool)
    seed[0] = background[0]
    seed[-1] = background[-1]
    seed[:, 0] = background[:, 0]
    seed[:, -1] = background[:, -1]
    exterior = ndimage.binary_propagation(seed, mask=background)
    # Soften the original raster edge by about one pixel while retaining
    # interior whites (clothing, horse) enclosed by their dark contours.
    distance = ndimage.distance_transform_edt(~exterior)
    pixels[:, :, 3] = np.minimum(pixels[:, :, 3],
                                  np.uint8(np.clip((distance - .15) * 255, 0, 255)))
    bounds = Image.fromarray(pixels[:, :, 3], 'L').getbbox()
    return remove_spots(Image.fromarray(pixels, 'RGBA').crop(bounds),
                        110 if team == 'red' else 18) if bounds else Image.new('RGBA', (1, 1))


def atlas(name, rows, cell=(128, 144)):
    result = Image.new('RGBA', (cell[0] * 4, cell[1] * len(rows)))
    for row, frames in enumerate(rows):
        for col, figure in enumerate(frames):
            scale = min((cell[0]-8)/figure.width, (cell[1]-6)/figure.height)
            figure = figure.resize((max(1,round(figure.width*scale)),
                                    max(1,round(figure.height*scale))), Image.Resampling.LANCZOS)
            x = col * cell[0] + (cell[0] - figure.width) // 2
            y = row * cell[1] + cell[1] - figure.height - 3
            result.alpha_composite(figure, (x, y))
    result.save(OUTPUT / f'{name}.png', optimize=True)


def transparent_frame(image, col, row):
    width, height = image.size
    frame = image.crop((round(col*width/4), round(row*height/4),
                        round((col+1)*width/4), round((row+1)*height/4)))
    pixels = np.asarray(frame.convert('RGBA')).copy()
    alpha = pixels[:, :, 3]
    labels, count = ndimage.label(alpha > 85, structure=np.ones((3, 3)))
    if count:
        sizes = np.bincount(labels.ravel())
        sizes[0] = 0
        subject = labels == np.argmax(sizes)
        # Keep the natural antialiasing around the main silhouette, but drop
        # the disconnected color fringes in the generated transparent sheet.
        keep = ndimage.binary_dilation(subject, iterations=3) & (alpha > 18)
        pixels[~keep, 3] = 0
    figure = Image.fromarray(pixels, 'RGBA')
    bounds = figure.getchannel('A').getbbox()
    return figure.crop(bounds) if bounds else Image.new('RGBA', (1, 1))


for team in ('blue', 'red'):
    for kind in BLUE:
        source = Image.open(SOURCE / f'{team}-{kind}.png')
        rows = [[transparent_frame(source, col, row) for col in range(4)]
                for row in range(4)]
        atlas(f'{team}-{kind}', rows)

red = Image.open(RED)  # The original composite still supplies enemy buildings.

blue_buildings = Image.open(SOURCE / 'blue-buildings.png')
building_boxes = {
    'blue': {'town': (5, 0, 310, 229), 'house': (2, 227, 255, 378),
             'barracks': (1, 380, 274, 541), 'workshop': (1, 827, 275, 1024)},
    'red': {'town': (8, 581, 304, 783), 'house': (313, 584, 446, 730),
            'barracks': (585, 583, 733, 735), 'workshop': (876, 583, 1139, 755)},
}
for team, sheet in [('blue', blue_buildings), ('red', red)]:
    for kind, box in building_boxes[team].items():
        figure = cut(sheet, box, team) if team == 'red' else sheet.crop(box)
        figure = remove_spots(figure, 110)
        bounds = figure.getchannel('A').getbbox()
        figure = figure.crop(bounds) if bounds else figure
        figure.thumbnail((250, 200), Image.Resampling.LANCZOS)
        figure.save(OUTPUT / f'{team}-{kind}.png', optimize=True)
print('Generated ten transparent unit atlases and eight building sprites')
