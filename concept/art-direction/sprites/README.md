# Sprites

Whether the board should be drawn in pixels instead of vectors, and the switch
that lets the question be answered by looking rather than by arguing.

**This is in the game, and it is what the game opens in.** `game/index.html`
starts in the first sprite set that registers; *the terms* → **how it is drawn**
switches between three modes on one board. Switching does not restart, does not
touch the engine, and does not move a single stone — the whole point is that the
only thing that changes between two looks is the look.

`svg` is still the baseline the comparison rests on, and still what a missing
sprite falls through to. It is simply no longer what a player meets first,
because the sprite board is now the one being made rather than the one being
tried out.

| File | What it is |
|---|---|
| `build.py` | Cuts and draws the sprites, emits `game/sprites-a.js` and `game/sprites-b.js`. Run by hand. |
| `shoot.js` | Plays a fixed seed to a fixed year through the build's own click handlers and dumps the board once per mode. |
| `board-svg.svg`, `board-fine.svg`, `board-coarse.svg` | Year 27, seed 6, against cities. The same game, three ways. |
| `three-modes.png` | The middle of that board in all three, stacked. Still, so it undersells all three. |

The boards are not mocked up. Same discipline as the rest of
`concept/art-direction/`: `node shoot.js 27 6` plays it, and if a board looks
odd the game produced it. `node shoot.js 27 6 --peaks` raises three ranges
through the wonder first, because mountains are never generated onto a map —
they exist only where *raise mountains* has put them, so a plain shot of any
seed has none in it.

---

## Where the art comes from

| Source | Used for |
|---|---|
| `design/Artwork/Landscape elements/Mountains/` | Four cut peaks, used at random per tile. Real art. |
| `design/Artwork/Landscape elements/Furrows/` | Three cut field patches, used at random, mirrored for the second seat. Real art. |
| `design/Artwork/Landscape elements/Forests/` | Five tree clumps, used at random. One clump a tile, not three conifers. Real art. |
| `design/Artwork/Landscape elements/Rolling hills/` | Seven hills of eleven — four green for blessed ground, three dry for wild. Real art. |
| `design/Artwork/Landscape elements/Settlements/` | The settlement ladder: 8 + 8 + 8 hamlets, villages and towns, and 5 full-hex cities. Real art. |
| `.../Forests\|Furrows\|Mountains/*tile*.png` | Four ground textures — grass, second grass, stubble, dry rock. Real art, cut to 128px. |
| `concept/Artwork-inspiration/` | The two powers — the arms-raised figure and the antlered Cernunnos. Real art, tinted onto the faction ramp. |
| `build.py` itself | Everything else, drawn procedurally. Placeholders. |

Drop more PNGs into a folder under `design/Artwork/` and point `fit()` at it;
it trims each one to its alpha bounding box, contain-fits it to a box in game
units, and downsamples to whatever resolution the set is being built at. It
does **not** stretch — the four mountains run from a squat 2.29:1 ridge to a
near-square massif, and forcing them into one box would turn the ridge into a
dome. Each keeps its own aspect, which is why the manifest stores `w` and `h`
per sprite and not per mark.

---

## Variants

A mark may hold several cut pieces — `mount.0`, `mount.1`, … — so a range of
mountains is a range and not one peak stamped nine times. `FGART.variantKey`
counts what a set holds and falls back to the unnumbered key, so a set may ship
one mountain or four without any caller caring.

**Which one a tile gets comes off the tile's own seed, and that is not a
detail.** The land layer is a cache that rebuilds whenever anything on the board
changes. A variant picked from a counter or from `Math.random` would reshuffle
the entire range every time somebody blessed a tile on the far side of the map —
which looks like a rendering fault, cannot be screenshotted twice, and is the
kind of bug that survives review because nobody renders the same board twice on
purpose. `sim/smoke.js` renders it twice on purpose: it raises a range, forces a
full land rebuild by switching art modes out and back, and asserts the markup
comes back identical. Swapping the seed for `Math.random` makes that check fail,
which is the only reason to trust it.

Measured over 7,560 real tiles, the four peaks come out 25.5 / 25.3 / 23.5 /
25.7 per cent — even enough that no peak reads as the default one.

### Ground is varied a different way

Cut marks are varied by *choosing* between pieces. Ground cannot be — there is
one grass texture, and 126 hexes.

So the texture is not stamped per hex at all. It is a `<pattern>` in
**`userSpaceOnUse`**, which means board coordinates: one continuous field that
the hexes cut windows into. Neighbouring tiles of the same terrain therefore
show different parts of it without anything being randomised, and — the part
that matters — there is no seam at the hex edge for the eye to catch. Jittering
a per-hex crop would give the same variety and put a discontinuity on every
border, which is a worse artefact than the repetition it was fixing.

One repeat is 128 game units, about three hexes. `sim/smoke.js` asserts the
pattern is still `userSpaceOnUse`, because switching it to
`objectBoundingBox` would still draw, would still look like ground, and would
quietly stamp the identical crop on all 126 tiles.

### Hills carry the distinction the fills carry worst

The rolling hills arrive in two batches, lush green and dry tawny, and they are
sorted onto the two states a hill can be in: **green for blessed ground, dry for
wild.**

That is not decoration. Blessed against wild is the one distinction
`concept.md` calls load-bearing, and on hills it is the weakest pair on the
board — 1.31 by luminance as built, 1.23 once the ground texture is over it,
against 1.65 on plain. The art-direction README one directory up already flags
1.35 as close enough to read as the same ground at speed. Two obviously
different hills do what those two tans cannot, and they do it by hue and
silhouette at once rather than by a difference in lightness the eye has to hunt
for. It is the clearest example so far of art paying back a rule rather than
merely sitting on one.

**Sorted by the art, not by filename.** `lush()` takes the mean green-to-red
ratio over the opaque pixels: the two batches come out at 1.44–1.57 and
0.82–0.95 with nothing in between, so the threshold sits in a gap wide enough
that it is a classification rather than a guess. More hills can be dropped into
the folder and land in the right pile without touching the build. If either pile
ever comes out empty the build stops rather than quietly falling back to the
procedural hump for that state — which would leave blessed and wild looking
identical again, and looking deliberate.

**Four of eleven are left out**, and `HILL_SKIP` says why for each: one has a
bright track over it that reads as a road, and roads are not drawn on this
board; one is orange cliff more than hill, and classifies between the two groups
besides; two are craggy twin peaks that read as mountains.

That last one is the constraint worth keeping. **Hills spread, mountains rise** —
34 × 16 units against 36 × 24. A mountain is impassable and a hill is not, so
the two silhouettes must never converge. `sim/smoke.js` asserts a hill is more
than twice as wide as it is tall and a mountain is not.

### The settlement ladder, and a band index that did not line up

The folder holds four natural size tiers and the game has four bands, which was
too good to waste: a *band* is a few huts, a *village* more, a *town* more again,
and a **city fills its whole hex** — that art is a walled hill-fort drawn as a
complete pointy-top hexagon, the same shape the board is made of.

Checked before trusting it rather than after: the silhouette is two pixels wide
at top and bottom, full width from a quarter to three-quarters down, and the
taper between matches a regular hexagon to the pixel. Same orientation as the
board, so the edges line up.

A city is drawn at **93% of the tile**, not 100%. The last few per cent are
where the tile's own fill and the owner's raised border show as a rim, and a
city that covered its own border would take away the only thing saying whose
country it stands in.

**The bug this turned up.** `FG.band()` returns 1..4. The temple sprites were
keyed 0..3, to match the branches inside the drawing code. So `temple.0` was cut
and never asked for, and `temple.4` was asked for and never cut — every city on
every board fell through to the vector renderer, which draws a city and a town
identically. Nothing threw and nothing looked broken; the top of the settlement
ladder had simply stopped existing. The banners had the same slip, keyed 2 and 3
against a scale starting at 1, so a city flew no flag either — on the one tile
where the border is the only other thing left to say whose it is.

Everything now speaks the engine's numbering, and `sim/smoke.js` asks `FG.band`
for the range rather than writing it out, so it stays true if the bands are ever
renumbered.

**Deduplicate before counting.** The folder ships fourteen byte-identical
duplicates under different timestamps. Without a content hash the ladder would
have been weighted towards whichever pieces happened to get exported twice —
47 unique of 61 files.

**Variety is bought in proportion to how often a thing appears.** Cutting all
sixteen cities cost 284 KB of a 592 KB set to draw pictures a player will rarely
see two of at once; five is past the point where repetition shows. Eight each
for the three lower bands, which are common. 592 KB down to 357.

### Furrows carry something the mountains do not

The direction the rows run says whose field it is. `ui.js` turns its vector
strips by −32° for the left hand and +30° for the right, and that is a real
signal on a board where ownership is otherwise carried only by the border
colour.

**They are mirrored, not rotated, and the first attempt got this wrong.** It
baked the two sets at those two angles — which was a reasonable thing to do to
the *vector* strips, because those are drawn flat and take their whole angle
from the rotation. The cut art is not flat: it is a lozenge with the rows
already running on a diagonal. Turning it again fought the drawing instead of
orienting it, and the fields came out looking tilted rather than ploughed.

A horizontal mirror is the right operation. It reverses the direction of the
rows, which is exactly the signal wanted, and unlike a rotation it is *exact* on
a pixel sprite — every pixel lands on a pixel. So it is safe to do at runtime,
needs no second set, and halves what the furrows cost.

The general rule, worth keeping: **mirror at runtime, bake anything else.**
Flips are lossless; rotations and scales are not, and a nearest-neighbour
rotation of pixel art shreds every diagonal it touches.

Two ways this breaks quietly, so `sim/smoke.js` checks both — one set used
unmirrored for both seats, which leaves every farm looking equally owned; and a
mirror taken about the origin instead of the tile, which slides the patch off
the ground it belongs to.

A furrow is also a **mark on reckoned ground, not a replacement for it** — it is
sized to the footprint the vector strips already occupy, about 22 units across
the middle, so the gold `P.reck` fill stays visible around it and goes on doing
the job the fill rule gives it.

**And a settlement's tile shows the settlement.** Where a set carries field art,
the ground under a temple is left as bare fill: the patch competes with the
building standing on it and reads as clutter rather than as farmland. The fill
is still `P.reck`, so the tile has not stopped saying what it is — only the mark
is dropped, which is again the fill rule doing the work.

One further trap, and it is not about art at all. The four `r()` calls that pick
strip colours sit immediately before the calls that place the field hands, in
one stream. Skipping the strips in sprite mode would therefore move every worker
on every farm, and the modes would no longer be the same board wearing different
clothes. `tileArt` now draws the stream whether or not it uses it: consume, then
decide.

---

## What a set may say besides pictures

Two set-level fields, because some choices are not sprites.

**`omit: ['person', 'stooped', 'kudurru']`** — marks this set draws *nothing*
for.

This is the one place the fallback rule is deliberately reversed. Everywhere
else a missing sprite falls through to the vector mark, which is what makes a
half-finished set usable. But a set with no people cut yet does not want vector
figures standing in its furrows — it wants an empty field until the art exists.
"I have no art here" and "draw nothing here" are opposite instructions, so
omission has to be said out loud rather than inferred from an absent key.

The kudurru is omitted for a different reason: one *was* cut, procedurally, and
a procedural marker standing in a field of drawn art is precisely the mismatch a
placeholder is supposed to be honest about. Whose farmland a tile is is already
carried by the border and by the direction its rows run, so nothing is lost by
leaving it out until it is drawn.

**`sparks: 'points'`** — how the marks that stay drawn-in-code should look.

Blessing sparkle is four large four-pointed stars in a pale wash. Against flat
vector ground that reads; against textured ground it reads as clip art sitting
on top of the board. In a sprite set it becomes seventeen small points in **the
owner's colour**, which also says *whose* blessing it is — something the pale
stars never did.

Radius is `u(0.3)`–`u(0.8)`. The first pass went up to `u(1.7)` and the result
was confetti: past about `u(0.8)` a point stops being a point and becomes a
bead. Depth comes from varying `fill-opacity` rather than size — and it has to
be `fill-opacity`, because the twinkle keyframes drive `opacity` and would
override anything set there.

**They gather at the rim.** Four in five sit between 68% and 96% of the way out
to the hex's own edge; the rest scatter inside so the middle is not
conspicuously empty. The middle of a tile is its busiest part — the mountain,
the wood, the temple, the power itself all stand there — so evenly scattered
points landed on top of whatever the tile was about and read as speckle over the
art. Gathered at the periphery they read as something arriving *over* the tile
rather than sprinkled on it, and the mark underneath stays legible.

The sampling is polar against the hexagon rather than uniform in a box, because
the distance to the boundary is not the same in every direction — which is
exactly what makes a hex look like a hex. Fold the angle into one 60° wedge, and
the apothem over the cosine gives the edge distance along it. Checked over
200,000 samples: none escape the hex, and the furthest reach is 90% of the
circumradius, which keeps them clear of the seam.

**The cost, and it is worth watching.** Four bold stars were a much louder
"this ground is blessed" than seventeen faint points are, and blessing is the
ratchet the whole game runs on. In a sprite set the signal now leans harder on
the fill — which is *also* the thing texture takes contrast away from. If
blessed ground stops being obvious at a glance, raise the point count before
raising `TEXA`, and reach for point *size* last.

---

## How big may an asset be

Three ceilings, and they give different numbers. A hex is **41.6 × 48 game
units** — the 24px-hex space `u()` is authored against.

| Limit | Game units | Why |
|---|---|---|
| Hex bounding box | 41.6 × 48 | Absolute. A mark this size *is* the tile. |
| Full-width band | 41.6 × 24 | A pointy-top hex is only full width for \|y\| ≤ 12; past that it tapers to a point. |
| No collision with the row above | any × **36** | Rows sit 36 units apart but hexes are 48 tall — they interleave. |
| Largest in use | 32 × 25 | `temple.3`, and the powers. |

**36 units tall is the working ceiling, not 48.**

At a 1272px-wide board one game unit is 2.08 screen pixels, so two source pixels
to a unit is native on a standard display and four is native at 2× DPI. Above
four you are downscaling, which for pixel art is worse than useless — it
destroys the hard edges that were the point.

**So commission at four source pixels to a game unit** and let `build.py`
downsample; it already does exactly that, and it is why one delivery can feed
every set. In pixels:

| Asset | at res 4 |
|---|---|
| Absolute max (full hex) | 166 × 192 |
| Practical max (h ≤ 36) | 166 × 144 |
| Mountain | 144 × 96 |
| Furrow patch | 136 × 96 |
| Forest clump | 136 × 92 |
| Temple, band 3 | 128 × 96 |
| A power | 64 × 100 |
| Megalith group | 96 × 80 |
| Conifer | 36 × 48 |
| A person | 16 × 28 |

The cut terrain as delivered is 128 px on its long side — a little under res 4
for marks this size, so it is used near natively in `fine` and downsampled for
`coarse`. Terrain marks were enlarged once the art was in: mountains now fit a
36 × 24 box, furrows 34 × 24, forest clumps 34 × 23, all still inside the
41.6-wide, 36-tall working ceiling.

**Ground textures are the exception to all of the above**, because they are
fills and not marks: 128px square at `fine`, 64 at `coarse`, one repeat to 128
game units — half the resolution of the marks beside them, for the reason given
above. They are saved as **paletted PNGs with no alpha**, which is not a detail:
they are opaque by construction, and the first version encoded them RGBA and
spent a byte per pixel storing the number 255 four times over. That alone was
511 KB, against 43 KB now. Ground texture is noise, and noise is the worst case
for PNG's filters, so bit depth and pixel count are the only levers that do
anything.

**On weight.** Everything inlines into the page as base64, so file size is real.
Flat colour with a small palette costs 0.5–2 KB an asset; the four mountains
added 15 KB across both sets. A full-bleed 32-colour painterly asset at res 4 is
96 KB base64, and sixty of those would be 5.7 MB. The discipline the
art-direction README asks for is also the difference between a 200 KB page and a
6 MB one.

---

## The three modes

**`svg` — as built.** The renderer unchanged, and still the default. Every mark
drawn from state, filled from `COL`, scaling to any hex size with no
resampling step.

**`fine`** and **`coarse`** are the *same sprites at two resolutions* — two
source pixels to a game unit, and one. That is the only difference between
them, and it is deliberate.

The first version had `coarse` drawn from scratch in a different style, and it
was a worse experiment: it came out looking poor because the procedural god was
a bad drawing, not because low resolution is bad, and a comparison that
confounds those two answers nothing. The README one directory up makes a
specific claim — *detail that survives a ninth of the area is the only detail
worth drawing* — and that claim is only testable if the detail is otherwise
identical.

So: `svg` against `fine` asks **vectors or bitmaps**. `fine` against `coarse`
asks **how coarse**. Two questions, two comparisons, one variable each.

---

## What is sprited, and what is not

The **marks**: hills, mountains, forest clumps, furrows, megaliths, temples, the
two powers, people, field hands, kudurrus, herds, kurgans. Plus four **ground
textures**, which are a different kind of thing and are treated as one.

The **fill is still the fill.** `concept.md`'s one load-bearing visual rule —
*fill is the land, border is who holds it* — is the reason the flat state colour
is drawn first and still decides what colour a tile is. The texture goes *over*
it at `TEXA`, as grain. Replacing the fill with a texture would make blessed
forest and wild forest the same picture, and would throw away numbers that were
measured rather than felt.

It is not free even so. Any alpha composite pulls both states toward the same
colour, so texture costs contrast:

| texture α | plain | forest | hill |
|---|---|---|---|
| 0.00 — as built | **1.65** | 1.54 | 1.31 |
| 0.25 — shipped | 1.46 | 1.38 | 1.23 |
| 0.40 | 1.36 | 1.29 | 1.18 |
| 0.55 | 1.26 | 1.21 | 1.15 |

Blessed against wild, WCAG contrast, the same metric the README one directory up
uses. That README scores the old renderer's 1.00 as a failure and calls 1.35
close enough to read as the same ground at speed — which is what sets the
ceiling. 0.25 ships.

**The grain was too faint, and opacity was the wrong knob.** The first version
cut the textures at the same resolution as the marks — two source pixels to a
game unit in `fine` — which put a texture pixel at about one screen pixel, and
noise that fine laid at a quarter opacity averages back out to a flat wash.

Raising `TEXA` would have bought grain by spending the blessed-vs-wild contrast
the fill rule runs on. **Halving the texture resolution instead doubles the size
of the grain and costs that contrast nothing**, because it changes how big the
noise is rather than how strongly it is laid on — and it is a quarter of the
bytes. The four textures went from 141 KB to 43 KB, and set A from 224 KB to
126 KB, while becoming *more* visible.

So the textures are deliberately half the resolution of the marks in the same
set: one source pixel to a game unit in `fine`, one to two in `coarse`. The
repeat stays at 128 units, about three hexes, because a longer repeat is what
hides the tiling.

The general shape of it, worth keeping: **size before strength.** Where an
effect is too weak, change how big it is before you change how hard it is
pushed — the first is usually free and the second usually costs something the
board needs.

Nothing that **carries a number** is sprited — the marching column's strength,
the herd's count, the settlement's population. Nothing that **animates** is:
water, sparkle, banners. A still flag on a board where everything else moves is
worse than no flag.

Nothing derived from an **unbounded count** is sprited either. Stone courses and
cairn steps are drawn from a number that runs 0..n with no ceiling; making them
sprites would cap a rule at whatever the art happened to hold, which is a rule
change wearing an art hat.

---

## What sprites cost

**Faction colour has to be baked in.** This is the real one. `ui.js` fills its
figures with `COL[own]` and gets the two powers apart for free; a PNG is
whatever colour it was drawn in. So every mark that belongs to somebody is a
separate sprite per seat — which is why thirty sprites cover eleven kinds — and
cut art has to be pushed onto a faction ramp before it goes on the board. Both
pieces of concept art are gold. Two gold gods is not a readable board.

Budget for a real set on this basis: **eleven kinds, doubled for the seats
where ownership matters, times four for the settlement ladder** — call it forty
to sixty pieces, not eleven.

**Pixel snapping.** The board is `width:100%` over a fixed viewBox, so its
scale is whatever the window gives it and almost never a whole number. One
source pixel then covers 2.37 screen pixels, `image-rendering:pixelated` rounds
each one independently, and you get a grid where some pixels are three across
and their neighbours are two. Still, that reads as sloppy; moving, it crawls.

**snap the board to whole pixels** in the same panel trades a little width for
a whole-number scale. Off by default, and it should stay off by default: on a
narrow window the snapped width is a large step down, and a slightly soft board
that fills the screen is the better trade there.

**A screenshot understates this more than usual.** The `board-*.svg` files here
render through cairosvg, which ignores `image-rendering`, so the coarse board
looks smoothly interpolated in a still and hard-edged in a browser. Judge it
running — the same warning `game/README.md` already gives for the vectors, for
a different reason.

---

## What is not settled

Nothing. No direction has been chosen and the sprites here are placeholders —
procedural, drawn by a script, and good enough to answer *does this approach
work* and not good enough to answer *is this prettier*. The two gods are the
only real art in either set.

The first thing a still comparison suggests is that `svg` is still the most
legible of the three, which is not the same as the most attractive, and is
exactly the kind of claim that should be checked in motion before it is
believed.

---

## Adding a set

Three steps, and the third is the one people forget.

1. Emit a file that calls `FGART.set(id, {label, note, res, s})`. Every sprite
   is `{w, h, by, src}` in **game units** — the 24px-hex space `u()` is
   authored against — never in screen pixels. `by` is where the baseline sits
   relative to the y the mark was called with: a tree is called on its base, a
   temple near its middle and stands nine units lower.
2. Add a `<script src>` for it in `game/index.html`, after `art.js`. The load
   order is real: the generated files call `FGART.set` at parse time.
3. Nothing else. The switch builds itself from `FGART.modes()`, the mode is
   already in the land-layer cache key, and `sim/smoke.js` reads the script
   list off the page rather than keeping its own copy.

A set may be partial. `FGART.sprite` returns `null` for a key it does not hold,
every call site in `ui.js` is written `ART.sprite(...) || theVectorMark(...)`,
and a missing sprite is a vector mark rather than a hole in the board. Start
with the two powers and the temple ladder; that is where the vectors read
weakest and where a new set will show whether it is worth finishing.
