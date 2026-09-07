#!/usr/bin/env python3
"""
Builds the sprite sets that game/art.js switches between.

Two sets, and they are deliberately *the same art at two resolutions* rather
than two different drawings:

  A - "fine"    two source pixels to a game unit. Roughly native size on a
                full-width board, so it looks like a painted mark.
  B - "coarse"  one source pixel to a game unit, so the same art is drawn at a
                hard 2x. Chunky, and every silhouette has to carry itself.

The first version of this had B drawn from scratch instead, and that was a
worse experiment: B came out looking poor because the procedural god was a bad
drawing, not because low resolution is bad, and a comparison that confounds
those two tells you nothing. One variable. The art-direction README's whole
claim about low resolution - "detail that survives a ninth of the area is the
only detail worth drawing" - is only testable if the detail is otherwise the
same.

Everything is emitted as base64 PNG inside a classic script, for the same
reason engine/ is classic scripts: game/index.html has to keep working when
it is double-clicked, and loose PNGs beside an inline <image> are one more
thing that can fail over file://.

    python3 build.py

Writes game/sprites-a.js and game/sprites-b.js. Nothing else reads this file;
it is run by hand when the art changes.
"""

import base64, hashlib, io, os, math
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
ART  = os.path.join(ROOT, "concept", "Artwork-inspiration")
LAND = os.path.join(ROOT, "design", "Artwork", "Landscape elements")
GAME = os.path.join(ROOT, "game")

# The faction colours, from ui.js. Kept in sync by hand; if they drift the
# sprites go on being drawn in the old ones, which is visible immediately.
COL   = ["#7CF04A", "#A96BF0"]
STONE = "#DCD2B4"
INK   = "#1A1508"


# ------------------------------------------------------------------ helpers

def hx(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def shift(c, f):
    """ui.js's shift(), so procedural sprites tint the way the vectors do."""
    if isinstance(c, str):
        c = hx(c)
    def m(v):
        return max(0, min(255, v + (255 - v) * f if f > 0 else v * (1 + f)))
    return tuple(int(round(m(v))) for v in c)


def mix(a, b, t):
    if isinstance(a, str):
        a = hx(a)
    if isinstance(b, str):
        b = hx(b)
    return tuple(int(round(x + (y - x) * t)) for x, y in zip(a, b))


def canvas(w, h):
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def png_uri(im):
    b = io.BytesIO()
    im.save(b, format="PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()


def harden(im, thresh=128):
    """Binary alpha. A pixel sprite with a soft edge is not a pixel sprite,
    and `image-rendering:pixelated` will not hide it - it magnifies it."""
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 255 if a >= thresh else 0)
    return im


def flatten_palette(im, n=20):
    """Posterise to a small palette, keeping alpha. Cheap way to get the
    low-colour discipline the art-direction README asks for out of source
    art that has hundreds of colours in it."""
    a = im.getchannel("A")
    rgb = im.convert("RGB").quantize(colors=n, method=Image.MEDIANCUT).convert("RGB")
    out = rgb.convert("RGBA")
    out.putalpha(a)
    return out


def tint(im, col, amount=.85):
    """Push a sprite onto a faction ramp, keeping its own light and shade.

    This is the one thing sprites cost you that vectors did not. In ui.js the
    figures are filled with COL[own] directly, so a power is its colour; a PNG
    is whatever colour it was drawn in, and the concept art is gold for both
    of them. Two gold gods on one board is not a readable board.

    So: map each pixel's luminance onto a ramp from the faction colour dark to
    the faction colour light, then blend most of the way there. `amount` short
    of 1.0 keeps a little of the original hue, which is what stops the result
    looking like a silhouette that has been painted in."""
    lo, hi = shift(col, -.42), shift(col, .52)
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            L = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
            t = tuple(int(round(lo[i] + (hi[i] - lo[i]) * L)) for i in range(3))
            px[x, y] = tuple(int(round(c + (t[i] - c) * amount))
                             for i, c in enumerate((r, g, b))) + (a,)
    return im


def outline(im, col=INK):
    """One-pixel dark keyline round the silhouette. This is the single thing
    that makes a small sprite read against a saturated tile, and the reason
    every mark in ui.js already has a stroke on it."""
    c = hx(col) + (255,)
    w, h = im.size
    big = Image.new("RGBA", (w + 2, h + 2), (0, 0, 0, 0))
    big.paste(im, (1, 1))
    src = big.load()
    edge = []
    for y in range(big.height):
        for x in range(big.width):
            if src[x, y][3]:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < big.width and 0 <= ny < big.height and src[nx, ny][3]:
                    edge.append((x, y))
                    break
    for p in edge:
        src[p] = c
    return big


def shadow(d, cx, by, rx, ry=None):
    """The ground shadow every mark in ui.js draws. Kept because losing it is
    the fastest way to make a sprite look pasted on rather than standing on
    the tile."""
    ry = ry or max(1, rx // 3)
    d.ellipse([cx - rx, by - ry, cx + rx, by + ry], fill=(0, 0, 0, 70))


# ------------------------------------------------------- cutting real art

def cut(name, w, h, flip=False):
    """Alpha-autocrop a piece of concept art and bring it down to sprite size.

    BOX downsampling rather than LANCZOS on purpose: LANCZOS rings, and a ring
    on a 24px-tall figure is a halo. BOX is an area average, which is what a
    downscaled pixel sprite wants."""
    src = Image.open(os.path.join(ART, name)).convert("RGBA")
    bb = src.getchannel("A").getbbox()
    src = src.crop(bb)
    # letterbox to the sprite's aspect so nothing is stretched
    sw, sh = src.size
    ar, want = sw / sh, w / h
    if ar > want:
        pad = int(sw / want) - sh
        box = Image.new("RGBA", (sw, sh + pad), (0, 0, 0, 0))
        box.paste(src, (0, pad))          # sit it on the bottom, feet on the line
        src = box
    else:
        pad = int(sh * want) - sw
        box = Image.new("RGBA", (sw + pad, sh), (0, 0, 0, 0))
        box.paste(src, (pad // 2, 0))
        src = box
    out = src.resize((w, h), Image.BOX)
    out = harden(flatten_palette(out, 24), 110)
    if flip:
        out = out.transpose(Image.FLIP_LEFT_RIGHT)
    return out


def fit(folder, w_units, h_units, res, n=24, angle=0):
    """Cut every PNG in a folder to a common box, keeping each one's own shape.

    Returns [(image, w_units, h_units)] — note the per-variant size. A *contain*
    fit, not a stretch: these four mountains run from a squat wide ridge (2.29:1)
    to a near-square massif (1.25:1), and forcing them all into one box would
    turn the ridge into a dome and the massif into a wall. So each keeps its
    aspect and gets the size that fits inside the box, which is why `manifest`
    stores w and h per sprite rather than per mark.

    `angle` bakes a rotation in. Baked, never applied at runtime: rotating an
    <image> in the SVG would be a nearest-neighbour rotation of a pixel sprite,
    which shreds every diagonal it touches. Here the source is turned at its
    full authored size with a resampling filter and only then brought down, so
    the rotation is absorbed by the downsample instead of being magnified by
    it. This is why the furrows ship two sets — the angle says whose field it
    is, and that is a signal the board cannot afford to lose.

    Sorted by filename so variant 0 is variant 0 on every machine — the tile
    seed picks an index, and an index that means a different peak depending on
    how the directory happened to enumerate is not deterministic at all."""
    # "tile" in a filename means one of the 256px opaque ground textures, which
    # are fills rather than marks and are cut by `ground` instead. They live in
    # the same folders as the cutouts, so this is where they get separated.
    return [fit_one(os.path.join(folder, name), w_units, h_units, res, n, angle)
            for name in sorted(os.listdir(folder))
            if name.lower().endswith(".png") and "tile" not in name.lower()]


def fit_one(path, w_units, h_units, res, n=24, angle=0):
    """One cutout, trimmed to its alpha and contain-fitted. See `fit`."""
    src = Image.open(path).convert("RGBA")
    if angle:
        src = src.rotate(angle, resample=Image.BICUBIC, expand=True)
    bb = src.getchannel("A").getbbox()              # trim the authored padding
    if bb:
        src = src.crop(bb)
    sw, sh = src.size
    k = min(w_units / sw, h_units / sh)             # contain
    uw, uh = sw * k, sh * k
    px_w, px_h = max(1, round(uw * res)), max(1, round(uh * res))
    im = harden(flatten_palette(src.resize((px_w, px_h), Image.BOX), n), 110)
    return im, round(uw, 1), round(uh, 1)


# Hills left out of the set, and why. Everything else in the folder is used, so
# adding art needs no code — but leaving a piece out is a judgement and judgements
# get written down.
HILL_SKIP = {
    "23_22_18 (3)":  "a bright track runs over it; reads as a road, and roads "
                     "are not drawn on this board",
    "23_22_19 (4)":  "orange cliff faces — reads as rock rather than hill, and "
                     "sits between the two colour groups besides",
    "23_24_23 (2)":  "twin craggy peaks; too near the mountain silhouette",
    "23_24_24 (4)":  "tall and craggy; same problem",
}


def lush(im, cut=1.25):
    """Is this hill green, or is it dry?

    Told by the art itself rather than by its filename. The two batches come out
    at g/r 1.44-1.57 and 0.82-0.95 with nothing in between, so the threshold sits
    in a gap wide enough that it is a classification and not a guess. Doing it
    this way means more hills can be dropped into the folder and land in the
    right pile without touching this file."""
    px = im.convert("RGBA").load()
    r = g = n = 0
    for y in range(im.height):
        for x in range(im.width):
            R, G, B, A = px[x, y]
            if A > 128:
                r += R; g += G; n += 1
    return n and (g / max(1, r)) > cut


def hills(res):
    """The rolling hills, sorted into the two states a hill can be in.

    Green for blessed ground, dry for wild — which is not decoration. Blessed
    against wild is the distinction `concept.md` calls load-bearing, and on hills
    it is the *weakest* pair on the board: 1.31 by luminance as built, 1.23 once
    the ground texture is over it, against 1.65 on plain. The fills alone barely
    separate them. Two obviously different hills do what the fills cannot, and
    they do it by silhouette and hue at once rather than by lightness alone.

    Wide and low, 34 x 16 units against the mountains' 36 x 24. That difference
    is doing work: a mountain is impassable and a hill is not, so the two must
    never be mistaken for each other at a glance. Hills spread, mountains rise."""
    d = os.path.join(LAND, "Rolling hills")
    out = {"hill": [], "hill.bless": []}
    if not os.path.isdir(d):
        return out
    for name in sorted(os.listdir(d)):
        if not name.lower().endswith(".png"):
            continue
        if any(k in name for k in HILL_SKIP):
            continue
        im, uw, uh = fit_one(os.path.join(d, name), 34, 16, res)
        out["hill.bless" if lush(im) else "hill"].append((im, uw, uh))
    return out


# The hex the board draws, in game units. A pointy-top hexagon of circumradius
# 24: 41.6 across the flats, 48 point to point.
HEX_W, HEX_H = 41.569, 48.0


def settlements(res):
    """The settlement ladder, cut from `Settlements/` and sorted by size.

    The folder holds four natural tiers and the game has four bands, which is
    not a coincidence worth wasting: a *band* is a few huts, a *village* more, a
    *town* more again, and a **city fills its whole hex** — the art for those is
    a walled hill-fort drawn as a complete pointy-top hexagon, which is exactly
    the shape the board is made of. Checked before trusting it: the silhouette
    is two pixels wide at top and bottom, full width from a quarter to
    three-quarters down, and the taper between matches a regular hexagon to the
    pixel. Same orientation as the board, so the edges line up.

    Keyed by the band index the *engine* uses, which runs 1..4 — see the note in
    `manifest` about the off-by-one this replaces.

    Deduplicated by pixel content first: the folder ships fourteen exact
    duplicates under different timestamps, and without this the ladder would be
    weighted towards whichever pieces happened to be exported twice."""
    d = os.path.join(LAND, "Settlements")
    out = {1: [], 2: [], 3: [], 4: []}
    if not os.path.isdir(d):
        return out
    seen, flat, hexes = set(), [], []
    for name in sorted(os.listdir(d)):
        if not name.lower().endswith(".png"):
            continue
        im = Image.open(os.path.join(d, name)).convert("RGBA")
        h = hashlib.md5(im.tobytes()).hexdigest()
        if h in seen:
            continue
        seen.add(h)
        (hexes if im.height / im.width > 1.0 else flat).append((name, im.height))

    # The three smaller bands: sorted by height and cut into thirds, so the
    # ladder is the art's own progression rather than an arbitrary assignment.
    flat.sort(key=lambda t: t[1])
    third = max(1, len(flat) // 3)
    boxes = {1: (26, 14), 2: (31, 17), 3: (36, 20)}
    for i, (name, _) in enumerate(flat):
        b = 1 if i < third else 2 if i < 2 * third else 3
        if len(out[b]) >= 8:            # eight is already past visible repetition
            continue
        out[b].append(fit_one(os.path.join(d, name), *boxes[b], res))

    # And the city, stretched to the tile rather than fitted inside it — these
    # are hexagons and the point of them is that their edges are the tile's
    # edges. 93% of full, so the tile's own fill and the owner's raised border
    # still show as a rim: a city sits *in* somebody's country, and covering the
    # border would take away the only thing that says whose.
    #
    # Capped at five. Variety is worth paying for in proportion to how often a
    # mark appears, and a city is the rarest thing on the board — it takes a
    # population of eight hundred, and most games end with a handful. Cutting all
    # sixteen cost 284 KB of a 592 KB set to draw pictures a player will almost
    # never see two of at once; five is past the point where repetition shows.
    k = 0.93
    cw, ch = HEX_W * k, HEX_H * k
    for name, _ in sorted(hexes)[:5]:
        im = Image.open(os.path.join(d, name)).convert("RGBA")
        im = harden(flatten_palette(
            im.resize((max(1, round(cw * res)), max(1, round(ch * res))), Image.BOX), 28), 110)
        out[4].append((im, round(cw, 1), round(ch, 1)))
    return out


def ground(name, res, span=128, n=16):
    """Cut one of the 256px opaque ground tiles into a repeating texture.

    Unlike every other entry these have no silhouette and no baseline — they
    are a fill, not a mark. `span` is how many game units one repeat covers,
    fixed at 128 so the source resolution tracks the set the same way sprites
    do: 2 source pixels to a unit in `fine`, 1 in `coarse`.

    128 units is about three hexes across, chosen deliberately. The texture is
    laid down in *board* coordinates rather than per hex, so neighbouring hexes
    of the same ground show different parts of one continuous field — which is
    the answer to patterning, and a better answer than jittering a per-hex crop
    because it leaves no seam at the hex edge to give the trick away.

    Saved as a *paletted* PNG with no alpha channel, which is most of why these
    are affordable. They are fully opaque by construction, so an RGBA encoding
    spends a whole byte per pixel storing the number 255 four times over; the
    first version of this did exactly that and the four textures came to 511 KB
    against 58 KB for every sprite in the set combined. Ground texture is noise,
    and noise is the worst case for PNG's filters — so the only lever that
    matters is bit depth, not cleverness.

    Sixteen colours, not thirty-two. The texture is laid under a state colour at
    about a third opacity, so it contributes grain and not hue; at that strength
    the two are indistinguishable and it is 60 KB cheaper across the four.

    **Half the resolution of the sprites in the same set, deliberately.** The
    first version matched them — two source pixels to a game unit in `fine` —
    which put a texture pixel at roughly one screen pixel, and noise that fine
    laid at a quarter opacity averages out to a flat wash. Raising the opacity
    was the wrong answer: it buys grain by spending the blessed-vs-wild contrast
    the fill rule runs on. Halving the resolution doubles the size of the grain
    and costs that contrast *nothing*, because it changes how big the noise is
    and not how strongly it is laid on. It is also a quarter of the bytes.

    So: one source pixel to a game unit in `fine`, one to two in `coarse`, each
    half of what that set's marks are cut at."""
    src = Image.open(os.path.join(LAND, name)).convert("RGB")
    px = max(16, int(span * res / 2))
    im = src.resize((px, px), Image.BOX).quantize(colors=n, method=Image.MEDIANCUT)
    return im, span


# ------------------------------------------------- procedural pixel marks
#
# Every one of these is drawn at the sprite's own resolution, never drawn big
# and shrunk. Shrinking is how you get the soft edges `pixelated` then
# magnifies. ImageDraw does not antialias, which is exactly what is wanted.

def s_conifer(w, h, col, dark):
    im, d = canvas(w, h)
    shadow(d, w // 2, h - 1, w // 2 - 1)
    cx, base = w // 2, h - 2
    tiers = 3
    for i in range(tiers):
        top = 1 + (base - 1) * i // (tiers + 1)
        bot = 1 + (base - 1) * (i + 2) // (tiers + 1)
        half = int((w / 2 - 1) * (i + 1.4) / (tiers + 0.4))
        d.polygon([(cx, top), (cx + half, bot), (cx - half, bot)], fill=col + (255,))
        d.polygon([(cx, top), (cx, bot), (cx - half, bot)], fill=dark + (255,))
    d.rectangle([cx - 1, base - 1, cx, h - 1], fill=hx("#3A2C1C") + (255,))
    return outline(im)


def s_hill(w, h, col):
    """Two low humps at the foot of the tile, not a dome filling it.

    The first version filled the hex, because the ui.js path was read as if
    its quadratic control point were the apex. It is not - a quadratic peaks
    at half the control offset, so the vector hump is about five units tall
    where the control sits eleven above the base. A hill twice its proper
    height stops being a mark on a tile and becomes the tile, which is
    exactly the failure the art-direction README warns about when it says the
    fill is the most legible thing on the board."""
    im, d = canvas(w, h)
    lit, dk = shift(col, .20), shift(col, -.30)
    base = h - 1
    dome(d, 0, w * 3 // 5, base, h - 1, col)
    dome(d, w * 2 // 5, w - 1, base, h - 2, lit)
    return outline(im)


def s_mount(w, h, col):
    im, d = canvas(w, h)
    lit, dk, cap = shift(col, .18), shift(col, -.32), hx("#E8ECF0")
    d.polygon([(1, h - 1), (w // 3, 2), (w // 2 + 1, h // 2),
               (int(w * .66), h // 4), (w - 2, h - 1)], fill=col + (255,))
    d.polygon([(w // 3, 2), (w // 2 + 2, h // 2 + 1), (w // 3 - 5, h // 2 + 2)], fill=lit + (255,))
    d.polygon([(w // 3, 2), (1, h - 1), (w // 3 + 1, h - 1)], fill=dk + (255,))
    d.polygon([(w // 3, 2), (w // 3 + 3, 6), (w // 3 - 3, 6)], fill=cap + (255,))
    return outline(im)


def s_menhir(d, cx, base, hh, ww, fill, lean=0, crack=False):
    """One tapered slab. The whole megalith language in ui.js is this shape
    repeated, so the sprites use it too rather than inventing a second one."""
    tw = max(1, int(ww * .6))
    lx = int(lean * hh)
    d.polygon([(cx - ww // 2, base), (cx - ww // 2, base - hh // 3),
               (cx - tw // 2 + lx, base - hh), (cx + tw // 2 + lx, base - hh),
               (cx + ww // 2, base - hh // 3), (cx + ww // 2, base)],
              fill=fill + (255,))
    d.polygon([(cx - ww // 2, base), (cx - ww // 2, base - hh // 3),
               (cx - tw // 2 + lx, base - hh), (cx + lx, base - hh), (cx, base)],
              fill=shift(fill, .24) + (255,))
    if crack:
        d.line([(cx - 1, base - int(hh * .6)), (cx + 1, base - int(hh * .4))],
               fill=shift(fill, -.45) + (255,))


def s_stone(w, h, kind, base):
    im, d = canvas(w, h)
    by = h - 2
    shadow(d, w // 2, by, w // 2 - 2)
    small = shift(base, -.30)
    for i, dx in enumerate((-int(w * .32), 0, int(w * .32))):
        s_menhir(d, w // 2 + dx, by, int(h * (.22 if i == 1 else .18)),
                 max(2, w // 8), small)
    if kind == "big":                                   # a trilithon
        s_menhir(d, int(w * .28), by, int(h * .62), max(3, w // 6), base)
        s_menhir(d, int(w * .72), by, int(h * .62), max(3, w // 6), base)
        d.polygon([(int(w * .16), by - int(h * .62)), (int(w * .84), by - int(h * .66)),
                   (int(w * .84), by - int(h * .52)), (int(w * .16), by - int(h * .48))],
                  fill=shift(base, .12) + (255,))
    elif kind == "dead":
        s_menhir(d, w // 2, by, int(h * .52), max(4, w // 5), base, lean=.22, crack=True)
    else:
        s_menhir(d, w // 2, by, int(h * .68), max(4, w // 5), base)
    return outline(im)


def s_temple(w, h, band, col):
    """Four stages, and the stage is the silhouette. Same ladder as ui.js:
    nothing, a shrine, a colonnade, a complex."""
    im, d = canvas(w, h)
    stone = mix(STONE, hx(col), .30)
    lit, dk, deep = shift(stone, .22), shift(stone, -.36), hx("#2A2114")
    trim = shift(hx(col), -.10)
    by = h - 2
    shadow(d, w // 2, by, w // 2 - 1)

    def slab(x0, x1, yT, yB):
        d.rectangle([w // 2 + x0, by + yT, w // 2 + x1, by + yB], fill=stone + (255,))
        d.rectangle([w // 2 + x0, by + yT, w // 2 + x1, by + yT], fill=lit + (255,))
        d.rectangle([w // 2 + x0, by + yB, w // 2 + x1, by + yB], fill=dk + (255,))

    def roof(half, yT, yB):
        d.polygon([(w // 2 - half, by + yB), (w // 2, by + yT), (w // 2 + half, by + yB)],
                  fill=trim + (255,))

    def door(hw, yT, yB):
        d.rectangle([w // 2 - hw, by + yT, w // 2 + hw, by + yB], fill=deep + (255,))

    def cols(x0, x1, yT, yB, n):
        for i in range(n):
            cx = w // 2 + x0 + (x1 - x0) * (2 * i + 1) // (2 * n)
            d.rectangle([cx, by + yT, cx, by + yB], fill=lit + (255,))

    H = h - 3
    if band == 0:                                   # the Seventy-Seven: no temple
        for dx in (-int(w * .26), 0, int(w * .26)):
            hh = int(H * (.62 if dx == 0 else .48))
            d.polygon([(w // 2 + dx, by - hh), (w // 2 + dx + hh // 2, by),
                       (w // 2 + dx - hh // 2, by)], fill=stone + (255,))
            d.polygon([(w // 2 + dx, by - hh), (w // 2 + dx, by),
                       (w // 2 + dx - hh // 2, by)], fill=dk + (255,))
    elif band == 1:
        slab(-w // 2 + 1, w // 2 - 1, -H // 5, 0)
        slab(-w // 3, w // 3, -H * 3 // 5, -H // 5)
        door(max(1, w // 10), -H * 2 // 5, -H // 5)
        roof(w // 3, -H, -H * 3 // 5)
    elif band == 2:
        slab(-w // 2 + 1, w // 2 - 1, -H // 6, 0)
        slab(-w * 2 // 5, w * 2 // 5, -H * 2 // 5, -H // 6)
        cols(-w * 2 // 5 + 1, w * 2 // 5 - 1, -H * 2 // 5 + 1, -H // 6 - 1, 4)
        slab(-w // 4, w // 4, -H * 7 // 10, -H * 2 // 5)
        door(max(1, w // 12), -H * 3 // 5, -H * 2 // 5)
        roof(w // 4, -H, -H * 7 // 10)
    else:
        slab(-w // 2 + 1, w // 2 - 1, -H // 8, 0)
        slab(-w * 5 // 12, w * 5 // 12, -H // 3, -H // 8)
        cols(-w * 5 // 12 + 1, w * 5 // 12 - 1, -H // 3 + 1, -H // 8 - 1, 6)
        slab(-w // 4, w // 4, -H * 3 // 5, -H // 3)
        cols(-w // 4 + 1, w // 4 - 1, -H * 3 // 5 + 1, -H // 3 - 1, 4)
        slab(-w // 7, w // 7, -H * 4 // 5, -H * 3 // 5)
        door(max(1, w // 14), -H * 3 // 4, -H * 3 // 5)
        roof(w // 6, -H, -H * 4 // 5)
    return outline(im)




def s_kudurru(w, h, col):
    """A kudurru - squared, upright, inscribed. Everything the menhirs are not,
    which is the whole point of it being the mark for reckoned ground."""
    im, d = canvas(w, h)
    c = hx(col)
    st = mix("#CFC4A6", c, .46)
    by = h - 2
    shadow(d, w // 2, by, w // 3, 1)
    d.rectangle([1, by - h * 3 // 5, w - 2, by], fill=st + (255,))
    d.chord([1, by - h + 1, w - 2, by - h // 3], 180, 360, fill=st + (255,))
    d.chord([1, by - h + 1, w - 2, by - h // 3], 180, 360, fill=c + (255,))
    for i in range(3):
        d.line([(2, by - h // 3 + 1 + i * 2), (w - 3, by - h // 3 + 1 + i * 2)],
               fill=shift(c, -.42) + (255,))
    return outline(im)


def dome(d, x0, x1, base, rise, fill):
    """A wide low hump, drawn as a polygon rather than a chord.

    ImageDraw.chord clips to its bounding box, so a chord taller than the
    canvas silently flattens into a bar - which is exactly what the first
    version of the herd and the kurgan did. A polygon cannot do that."""
    n = max(6, (x1 - x0) // 2)
    pts = [(x0, base)]
    for i in range(n + 1):
        t = i / n
        pts.append((int(x0 + (x1 - x0) * t), int(base - rise * math.sin(math.pi * t))))
    pts.append((x1, base))
    d.polygon(pts, fill=fill + (255,))


def s_herd(w, h, col):
    """Beasts, not a column. A bright hump with horns - deliberately a
    different silhouette from the kurgan's earth hump, because the note in
    ui.js is right that three humps on one board is one hump."""
    im, d = canvas(w, h)
    c, dk = shift(col, .10), shift(col, -.30)
    by = h - 3
    shadow(d, w // 2, h - 1, w // 2 - 2, 2)
    dome(d, 3, w - 4, by, h * .62, c)
    d.rectangle([3, by - 2, w - 4, by], fill=c + (255,))
    for x0, x1 in ((5, w // 2 - 2), (w // 2 + 1, w - 6)):   # legs
        d.rectangle([x0, by, x0 + 1, h - 2], fill=dk + (255,))
        d.rectangle([x1, by, x1 + 1, h - 2], fill=dk + (255,))
    for s, x in ((-1, 4), (1, w - 5)):                      # horns
        d.line([(x, by - int(h * .40)), (x + s * max(1, w // 10), by - int(h * .74))],
               fill=hx("#F0E6CE") + (255,))
    return outline(im)


def s_kurgan(w, h, col):
    """Wide, low, in earth rather than in a power's colour, kerb stones round
    the foot, and the owner reduced to a line over the crest. Same reasoning
    as the ui.js version, which says why at length."""
    im, d = canvas(w, h)
    earth = hx("#4A3E30")
    by = h - 2
    shadow(d, w // 2, h - 1, w // 2 - 1, 2)
    dome(d, 1, w - 2, by, h * .78, earth)
    dome(d, 4, w - 5, by - 1, h * .62, hx(col))            # the crest line
    dome(d, 5, w - 6, by - 1, h * .58, shift(earth, .10))
    for dx in (1, w // 4, w * 3 // 4 - 1, w - 3):           # kerb stones
        d.rectangle([dx, by - 1, dx + 1, by], fill=hx("#2A2420") + (255,))
    return outline(im)


# ------------------------------------------------------------ the manifest
#
# w/h/by are in *game units* - the 24px-hex space every mark in ui.js is
# authored against - and never in screen pixels, so a sprite keeps its place
# when SZ changes. `by` is where the baseline sits relative to the y the mark
# function was called with, which is the only thing that differs between marks:
# a tree is called on its base, a temple on its middle.
#
# `res` is source pixels per game unit. It is the whole difference between the
# two sets and the reason they are worth comparing.

def manifest(res):
    P = lambda n: int(round(n * res))
    S = {}

    def put(key, im, w, h, by):
        S[key] = dict(w=w, h=h, by=by, src=png_uri(im))

    tree, treeb = hx("#24421C"), hx("#2C5420")
    put("conifer",       s_conifer(P(9), P(12), shift(tree, .30), tree),      9, 12, 1)
    put("conifer.bless", s_conifer(P(9), P(12), shift(treeb, .34), treeb),    9, 12, 1)

    # Ground textures. Keyed by terrain; `ui.js` lays hill on the plain texture
    # rather than carrying a fifth copy of the same grass.
    for key, src in (("forest", "Forests/Forest tile 01.png"),
                     ("plain",  "Forests/Forest tile 02.png"),
                     ("reck",   "Furrows/Furrows tile.png"),
                     ("mount",  "Mountains/Mountain Tile.png")):
        p = os.path.join(LAND, src)
        if os.path.isfile(p):
            im, span = ground(src, res)
            S["tex." + key] = dict(tex=True, span=span, src=png_uri(im))

    # Forest, as clumps rather than three separate conifers. The cut art is a
    # stand of trees with its own internal arrangement, so scattering three of
    # them per tile would be scattering three woods.
    gdir = os.path.join(LAND, "Forests")
    if os.path.isdir(gdir):
        for i, (im, uw, uh) in enumerate(fit(gdir, 34, 23, res)):
            put(f"forest.{i}", im, uw, uh, 10)
    # The procedural humps stay as the unnumbered fallback — `variantKey` drops
    # back to them if the cut hills are ever missing. Darkened the way ui.js
    # darkens them: a hill is drawn *against* its own tile fill, so a hump in
    # the tile's own colour is not a hump at all.
    put("hill",          s_hill(P(22), P(7), shift("#8A7A4C", -.34)),        22,  7, 8)
    put("hill.bless",    s_hill(P(22), P(7), shift("#A08E58", -.40)),        22,  7, 8)
    # Cut settlements, keyed by the engine's band index. A city carries its
    # baseline at the tile's middle rather than at the usual ground line,
    # because it is not a thing standing on the tile — it is the tile.
    for b, cuts in settlements(res).items():
        for i, (im, uw, uh) in enumerate(cuts):
            put(f"settle.{b}.{i}", im, uw, uh, 9 if b < 4 else round(2 + uh / 2, 1))

    cut_hills = hills(res)
    for key, cuts in cut_hills.items():
        # Loudly, because a silently empty pile is the failure that matters: the
        # build would fall back to the procedural hump for that one state and
        # blessed would quietly stop looking different from wild.
        if os.path.isdir(os.path.join(LAND, "Rolling hills")) and not cuts:
            raise SystemExit(f"no hills classified as {key!r} — check lush()'s "
                             f"threshold against the art in Rolling hills/")
        for i, (im, uw, uh) in enumerate(cuts):
            put(f"{key}.{i}", im, uw, uh, 8)
    # Mountains: four cut peaks from design/Artwork, used at random per tile.
    # The box is 30 wide rather than the vector mark's 26 to make room for the
    # low wide ridge among them; 30 still leaves ~6 units of margin either side
    # of a 41.6-unit hex. The procedural peak stays as `mount` unnumbered, so a
    # set built without the folder present still draws mountains.
    peaks = fit(os.path.join(LAND, "Mountains"), 36, 24, res) if os.path.isdir(
        os.path.join(LAND, "Mountains")) else []
    for i, (im, uw, uh) in enumerate(peaks):
        put(f"mount.{i}", im, uw, uh, 8)
    put("mount",         s_mount(P(26), P(18), hx("#7A7166")),               26, 18, 8)

    # Sizes are measured off the vector marks they stand in for, not chosen.
    # A sprite that is taller than the mark it replaces does not read as
    # "nicer art", it reads as a different board - the settlement ladder and
    # the stone silhouettes are both *size* language, and inflating them by
    # four units quietly rewrites what the player is being told.
    for who, base in ((0, hx("#E4DCC0")), (1, hx("#DCD4C0"))):
        for kind in ("live", "big"):
            put(f"stone.{kind}.{who}", s_stone(P(24), P(20), kind, base), 24, 20, 9)
    put("stone.dead", s_stone(P(24), P(20), "dead", hx("#7E8079")), 24, 20, 9)

    for own in (0, 1):
        # Keyed 1..4, because that is what `FG.band()` returns and what `ui.js`
        # passes down. The first version keyed these 0..3 to match the branches
        # inside `s_temple`, which meant `temple.0` was cut and never asked for
        # while `temple.4` was asked for and never cut — so every city on every
        # board silently fell through to the vector renderer, which draws a city
        # and a town identically. Nothing failed; the top of the settlement
        # ladder just quietly stopped existing. Speak the engine's numbering.
        for b, (tw, th) in enumerate(((20, 11), (17, 15), (25, 19), (32, 24))):
            put(f"temple.{b + 1}.{own}", s_temple(P(tw), P(th), b, COL[own]), tw, th, 9)
        put(f"herd.{own}",    s_herd(P(18), P(14), COL[own]),              18, 14, 3)
        put(f"kurgan.{own}",  s_kurgan(P(30), P(9), COL[own]),             30,  9, 6)

        pass  # furrows are not per-seat - see after this loop

    # Furrows: three cut field patches, one set, no rotation.
    #
    # The first version turned them to the two angles ui.js rotates its vector
    # strips by, -32 and +30. That was wrong, and wrong in a way worth writing
    # down: the art *already has an angle in it*. These are lozenges with the
    # rows running along a diagonal, so turning them again fought the drawing
    # instead of orienting it, and the result read as tilted rather than as
    # ploughed.
    #
    # The seats are told apart by mirroring instead, at the point of use. A
    # horizontal flip reverses the direction the rows run - which is the signal
    # that was wanted - and unlike a rotation it is exact: every pixel lands on
    # a pixel, so it costs nothing to do at runtime and needs no second set.
    #
    # Sized to the footprint the vector strips already occupy, about 22 units
    # across the middle, rather than to the hex. A field patch is a mark on
    # reckoned ground and not a replacement for it: the gold `P.reck` fill stays
    # visible around it, which is what keeps the fill doing its job.
    fdir = os.path.join(LAND, "Furrows")
    if os.path.isdir(fdir):
        for i, (im, uw, uh) in enumerate(fit(fdir, 34, 24, res)):
            put(f"furrow.{i}", im, uw, uh, round(uh / 2 + 1.5, 1))

    # The two powers, cut from the concept art in both sets - the arms-raised
    # epiphany figure and the antlered Cernunnos type, which is what ui.js
    # already draws and what concept/Player-character-inspiration asks for.
    #
    # Tinted, and the tint is not optional. Both pieces of source art are gold;
    # the board needs the two powers to differ at a glance, and in this game
    # that difference is carried by COL and by nothing else.
    put("figure.0", tint(cut("CHATGPT-_God_Snake-godess.png", P(15), P(25)),
                         COL[0]), 15, 25, 9)
    put("figure.1", tint(cut("CHATGPT_GOD_CERNUNNOS_0462c574-ba42-4295-a626-6779567e98f9.png",
                             P(16), P(25)), COL[1]), 16, 25, 9)
    return S


def emit(path, ident, label, note, res, S):
    lines = [
        "// GENERATED by concept/art-direction/sprites/build.py - do not hand-edit.",
        "// Re-run that script instead; it is the only thing that knows how these",
        "// were cut and at what resolution.",
        '"use strict";',
        f"FGART.set({ident!r}, {{",
        f"  label: {label!r},",
        f"  note: {note!r},",
        f"  res: {res},",
        # Marks this set deliberately shows *nothing* for. Not the same as
        # having no art: a missing key falls through to the vector mark, which
        # is what makes a half-finished set usable, so leaving something out has
        # to be said out loud. There are no people cut yet and a sprite board
        # wants an empty field rather than vector figures standing on it.
        # The kudurru goes too. It was drawn here as a placeholder and it is a
        # procedural marker standing in a field of cut art, which is exactly the
        # mismatch a placeholder is supposed to be honest about. Whose farmland
        # a tile is is already carried by the border and by the furrows' own
        # direction, so nothing is lost by leaving it out until it is drawn.
        "  omit: ['person', 'stooped', 'kudurru'],",
        # How the marks that stay drawn-in-code should look. Blessing sparkle
        # reads as four literal stars against flat vector ground; against
        # textured ground it wants to be many small points in the owner's
        # colour, which also says whose blessing it is.
        "  sparks: 'points',",
        "  s: {",
    ]
    for k in sorted(S):
        v = S[k]
        if v.get("tex"):
            # A ground texture: a fill, so it carries a repeat span instead of
            # a silhouette's size and baseline.
            lines.append(f"    {k!r}: {{tex:true,span:{v['span']},"
                         f"src:{v['src']!r}}},")
        else:
            lines.append(f"    {k!r}: {{w:{v['w']},h:{v['h']},by:{v['by']},"
                         f"src:{v['src']!r}}},")
    lines += ["  }", "});", ""]
    open(path, "w", encoding="utf-8").write("\n".join(lines))
    kb = os.path.getsize(path) / 1024
    print(f"{os.path.relpath(path, ROOT)}  {len(S)} sprites  {kb:.0f} KB")


if __name__ == "__main__":
    # The source art is deliberately not in the repository — it is ~105 MB of
    # PNGs, and what the game needs is the cut sets in game/sprites-*.js, which
    # are. So a fresh clone can run the game but cannot rebuild it, and this
    # says so rather than letting it happen quietly.
    #
    # Quietly is the real risk: every folder below is read through an
    # `isdir` guard, so without this a build on a clone would succeed, print
    # its usual two lines, and emit a set with no mountains, no forests, no
    # furrows and no settlements. Nothing would fail. The board would just
    # lose half its art, and the file that did it would look fine.
    if not os.path.isdir(LAND):
        raise SystemExit(
            f"no source art at {LAND}\n"
            "It is excluded from the repository on purpose (~105 MB). Restore\n"
            "'design/Artwork/Landscape elements/' from wherever it is kept and\n"
            "run this again. Until then game/sprites-*.js are the built sets and\n"
            "are committed — the game does not need this script to run.")

    emit(os.path.join(GAME, "sprites-a.js"), "fine", "sprites — fine",
         "Two source pixels to a game unit, so a full-width board draws them at "
         "roughly native size. The powers are cut from concept/Artwork-"
         "inspiration and tinted onto the faction ramp; the rest is drawn here. "
         "Detail survives, and so does a little of the softness a downscale "
         "leaves behind.",
         2, manifest(2))

    emit(os.path.join(GAME, "sprites-b.js"), "coarse", "sprites — coarse",
         "The same art at one source pixel to a game unit, so a full-width "
         "board draws it at a hard 2x. This is what the art-direction README "
         "argues for: detail that survives a ninth of the area is the only "
         "detail worth drawing. Compare it against fine, not against svg — the "
         "only thing that differs between the two sprite sets is resolution.",
         1, manifest(1))
