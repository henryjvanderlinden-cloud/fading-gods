# Art direction

A working register, opened because art direction had never been one. The palette
recorded in `concept/concept.md` — *"cold, dark, northern"*, *"no gradients, no
shadows, no glow"* — was written in a session that was describing the renderer
that existed rather than a direction anyone had chosen. It is not a constraint.
It is a description, and it is now up for revision like everything else.

| File | What it is |
|---|---|
| `warm-workshop.html` | The direction with every open decision on a switch — for trying things before touching `ui.js`. |
| `board-year-27.png` | Where it stands. Still, so it undersells itself. |
| `temples-and-figures.png` | The four settlement stages and the two powers, large. |
| `field-marks.png` | The four candidate farmland marks at year 40, when it matters most. |
| `board-comparison.html` | How the direction was chosen. Three candidates, same board. |
| `nine-boards.png` | Contact sheet: three directions × three years. |
| `the-arc.png` | The rejected cool-blessing proposal, at years 9, 27 and 40. |
| `outline-modes.png`, `faction-colours.png` | Superseded, kept as the record of two decisions. |

**Direction B — warm throughout — is chosen.** The measurements below argued for C
and were overruled, which is the right way round: the numbers said B separates
blessed from wild badly, not that B is wrong. Several decisions taken since have
closed most of that gap by other means, and they are recorded under *Where it
landed*.

The boards are not mocked up. They are `seed 6`, mixed against cities, played
headlessly through `engine/` and dumped at years 9, 27 and 40 — the same
discipline as `sim/`. If a state looks odd, the game produced it.

---

## What we are actually taking from Fantasy Empires

Worth separating, because the surface and the substance point different ways.

**Take:** the painted, saturated, earthy land; borders raised *into* the terrain
rather than drawn on top of it; the ornate frame; the sense that you are looking
at a place rather than a control map. Above all the low-resolution discipline —
every element a distinct silhouette, because the hardware forbade subtlety and
that turned out to be a legibility feature.

**Do not take:** isometric anything. Fantasy Empires was a flat top-down
provincial map, and flatness is not incidental — a flat hex has an edge you can
emboss an owner colour into. A raised block spends that edge on its own 3D side,
and `concept.md`'s one genuinely load-bearing visual rule (*fill is the land,
border is who holds it*) has nowhere left to live.

The ChatGPT tiles are also ~380px illustrations. The board is 24px hexes. Detail
that survives a ninth of the area is the only detail worth drawing.

---

## The three directions

**A — as built.** The current renderer, unchanged, as the honest baseline.

**B — Fantasy Empires, warm throughout.** The aesthetic taken straight: painted
earth, embossed provincial borders, bronze frame. Land is the hero and everything
shares one temperature.

**C — warm land, cold god.** Identical land to B. Only blessing changes: it
becomes the single cool, lit thing on a warm board.

### Why C

Two arguments, one of them measurable.

**It performs the thesis.** Blessing is the only cool colour on the map. As
settlements reckon the ground, cool is replaced by warm, and across forty years
the board warms and dulls on its own. See `the-arc.png`: year 9 is a valley of
moonlit silver, year 40 is entirely ochre with four grey stones in it. Nothing
narrates this. It is the same move `concept.md` already wanted from the
interface — *the player should never be told this is happening* — done in
paint rather than in UI chrome.

**It is the only one where blessed and wild are actually distinguishable.**
Luminance contrast between the two states, which is what survives a bad panel,
a projector, and red-green colour blindness:

| Direction | blessed plain vs wild plain | separated by |
|---|---|---|
| A — as built | **1.00** | nothing but hue, and barely that |
| B — warm throughout | 1.65 | lightness only, same hue family |
| C — warm land, cold god | 1.99 | lightness *and* temperature |

A scores 1.00. The current renderer draws the game's single most important
distinction — the one the whole one-way ratchet in `design/rules.md` §1 runs on —
at zero luminance contrast. B's failure is subtler and worse in play: blessed
hill against farmland is 1.35, so at speed the two read as the same ground.

**A side benefit.** Gold-against-red separates at 3.14; the current
gold-against-teal at 1.44. The warm palette's owner pair is the more accessible
one, because it differs in lightness rather than only in hue.

---

## Settled by this

- **Flat hexes.** Not a style preference — the border rule requires the edge.
- **Borders embossed, not drawn.** Light on the upper-left three edges, shadow
  on the lower-right, owner colour in the middle. The ridge reads as terrain.
- **Chunky solid marks, no gradients.** Kept from the old note, for the reason
  the old note did not give: at 24px a gradient is noise.
- **Megaliths, not architecture.** Irregular tapered slabs, jittered from the
  tile seed so no two are alike, no straight edges. Satellite stones at the base.
  A strong stone (power ≥ 12) gets a trilithon. Reference is Stonehenge, the
  Carnac alignments, the Sardinian nuraghi — *ancient and weathered*, not
  ornate, and emphatically not thorned. The thorns in the ChatGPT set were a
  misread and are gone.
- **A dead stone leans and is cracked.** Silhouette, not colour, carries the
  most important state a stone has.

---

## Where it landed

Warm throughout, with the blessed/wild problem attacked on channels other than fill.

**Hex 50, board 1272 × 717.** The board's aspect is fixed at about 1.77 : 1, so
1400 × 700 exactly is not reachable — hex 50 gives 1272 × 717 and hex 56 gives
1425 × 803. Either is close enough. A tile goes from 42 × 48 to 87 × 100px, which
is **4.3× the drawing area**, and that is the sprite budget.

**This is more pixels, not more tiles.** The map stays 14 × 9.
`design/rules.md` §1 marks the size **[load-bearing]**: at 18 × 11 measured
interference was 0%, meaning the two powers were not playing each other at all.
Enlarging the hex is free. Enlarging the grid invalidates every number in §10.

**Sparkle carries what colour could not.** Faction-coloured, cycling through three
tints, staggered so the field twinkles rather than pulsing in unison. Motion is a
perceptual channel independent of both hue and luminance, and it is doing the
separation the warm palette cannot do on fill alone. Two consequences worth
holding on to:

- A still screenshot of this game is *less legible than the running game*. Do not
  judge the palette from an image, including the images in this folder.
- ~380 animated nodes at 126 tiles. Only `opacity` and `fill` are animated, no
  transforms, which should hold up — but the tablet is the target
  (`architecture/architecture.md`) and the tablet is where this gets checked.

**Boundaries drawn per contiguous group, by owner.** Enormous reduction in noise;
the board becomes a place rather than a control map.

Grouping by owner alone was argued against and then adopted, and the reversal is
worth recording because it was caused by two other decisions rather than by anyone
changing their mind. The objection was that merging your blessing with your
farmland erases the boundary between them, which is where the ratchet in §1
happens. That objection dies once (a) a settlement takes the farmland fill and (b)
blessing carries a bright faction-coloured sparkle: the boundary is then held by
the fill, and does not need a line drawn on it as well.

What is lost is real but small. Grouping by owner **and** state had a side effect
nobody designed: the outline around your blessed ground *is* the connected region
a stone's power is measured over (§5), so a severing attack could be seen coming.
If that turns out to matter in play, it should come back as a thin secondary line
rather than as the primary boundary.

**Settlements are temple complexes, and the stage is read from the complex.**
Four stages, matching the bands in §4:

| Band | Complex |
|---|---|
| under 77 | A cluster of tents. **No temple at all** — which is the point of the Seventy-Seven, now visible. |
| village | A single shrine on a low platform. |
| town | A two-tier temple with a colonnade, one banner. |
| city | A stepped complex with a forecourt and two banners. |

Stone is limestone mixed 30% toward the faction colour, so the complex is
faction-readable without being a neon building. Banners are pure faction colour
and animate.

**A settlement takes the farmland fill, not its own.** It sits in worked ground
and the crop strips run under it. The complex is what says a settlement is there —
not a change of hue. This also removed the last place where a fourth land colour
was competing for attention.

**The powers walk the board as figures**, not as a dot: an arms-raised figure and
a horned figure, taken from the Minoan and Cernunnos entries in
`concept/Player-character-inspiration/`. Either faction can take either; the
workshop has a swap.

**Water moves.** Real curves rather than three dashes, phase animated so the crest
travels, stroke cycling through the blues into white.

---

## What says a field is owned

The last gap left by outlining per group. Four candidates were built and put on a
switch; see `field-marks.png`, which shows all four at year 40, when the board is
almost entirely farmland and the problem is at its worst.

| | |
|---|---|
| **Boundary stone** | **Adopted.** |
| Flag | Rejected — see below. |
| Ploughman | Deferred to `registers/ideas.md`. |
| Nothing | The gap, for comparison. |

**The boundary stone wins on the thing the others cannot touch: it is about
reckoning, not about ownership.** The Mesopotamian *kudurru* was a carved,
inscribed stone set at a field edge recording who the land had been granted to —
an object whose entire purpose is that the land has been *written down*. The
game's own word for the state is **reckoned**, and the chronicle line is *"It has
been surveyed."*

It also rhymes with the thing it destroys. Your menhirs are irregular, uncarved,
no straight lines. Theirs are squared, upright and covered in writing. Same object
class, opposite meaning: one is a place where you are heard, the other is where
the land was counted. That is the whole thesis in two props, and §5 says 92% of
your stones end under farmland — so on a great many tiles both objects will have
stood on the same hex.

It has a use in the register too. **OP-16** asks for a distinction that currently
cannot be drawn: a settlement reckoning a stone *by accident* versus a work aimed
at the stone's tile *deliberately*. With boundary stones on the board, the second
case has a picture — your menhir goes down and their kudurru goes up on the same
hex — where before it existed only as an identical log line.

**Flags were rejected on tone, not legibility.** They are the *most* legible
option, which is why they are worth naming: a flag says military control, and
conquest is precisely what farmland is not. The threat in this game is people
getting on with things.

**Two ranges, two marks.** The stone reads at tile scale, on inspection. It cannot
tell you whose a whole region is at a glance. So **furrows are also angled by
faction** — about 30° each way, two peoples with two ways of laying out a field.
It costs no token on any tile, reads at region scale, and is entirely diegetic.
The first pass at ±22° was too subtle to see; ±31° reads.

The stone also needed more faction colour than it first had. At a 22% tint it was
tasteful and useless — the flags beat it easily. At 46%, with a coloured capstone,
it holds its own without shouting.

### Third mark: the people themselves

`concept/lore.md` puts wild folk on blessed ground, and they are drawn. Field
hands are drawn on farmland as well — more of them than there are wild folk, per
the note in the same file.

**The distinction is posture, not headcount.** On blessed ground: few, upright,
scattered, facing nothing in particular — you see *people*. On farmland: more of
them, bent, aligned to the rows and rotating with the furrows — you see *work*.
Same species, different relationship to the ground, and the whole transformation
reads as a change in what a body is doing rather than as a change in a number.

Year 40 is the payoff and it needs no drawing of its own: no blessed ground is
left, so there is nobody standing upright in open country anywhere on the board
except you. Everyone else is bent to a row. That falls out of the state.

**Watch the density.** A farmland tile now carries crop strips, a boundary stone,
two to four field hands and a population number. That is the busiest the board
ever gets, and year 40 is exactly where **OP-03** lives — *does being walled in
feel like an ending or like confiscation?* The noise may be right, since the world
is supposed to have got loud. If it has to be thinned, thin the hands and keep the
stone: the hands are decoration, the stone is the argument.

**Farmland in mixed strips.** Four bands per tile, crop colour picked per strip
from a seeded palette that includes two greens and a fallow brown. Farmland should
look like prosperity, not damage — if reckoned ground ever reads as blight the
whole design collapses into a straightforward tragedy.

## Open, and wanted


- **The motion budget.** Roughly 250–400 animated nodes depending on the year —
  sparkle, water, banners. Only `opacity`, `fill` and small path morphs; no
  transforms, no filters. Two rules that came out of building it:
  - **Nothing may be carried by motion alone.** Ownership is on the outline,
    settlement stage is in the silhouette, land state is in the fill. Motion
    always adds to a reading that already works without it.
  - `prefers-reduced-motion` is honoured, and the *stilled* toggle in the workshop
    renders exactly what that reader gets. Check it after any change.
- **Neon versus violet.** Measured: the pair separates at 2.38, and neon against
  blessed plain at 1.94 — so neon green on green land is fine, which was the
  worry. Violet against blessed plain is 1.23, weaker, but violet is the more
  legible of the two in practice because nothing else on the board is violet.
  Still to decide whether "neon" is too electric for a painted VGA world, which
  is a taste question and not a measurable one.
- **Where sprites come from.** The binding problem, and it is not technical. A
  tile is terrain × state × owner × settlement band; the set has to be tonally
  consistent, and generative tools drift in light angle and hue across a batch —
  visibly so in the ChatGPT sheets that started this. Decide the source before
  the pipeline.
- **The one rule sprites must obey:** a sprite may replace a mark, but it may not
  overflow the hex. Overflow means occlusion, occlusion means depth sorting, and
  depth sorting means the renderer stops being a function from state to SVG.
- **Year 40 is nearly monochrome.** Correct thematically; possibly unreadable in
  practice. This is exactly where OP-03 — *does being walled in feel like an
  ending or like confiscation?* — becomes a visual question as well as a
  mechanical one.
- **Raster sprites eventually.** Nothing here forecloses that. The rule that
  should survive the switch: a sprite may replace a mark, but it may not
  overflow the hex, because occlusion means depth sorting and depth sorting
  means the renderer stops being a function from state to SVG. See
  `architecture/architecture.md`.
- **The frame.** Drawn, but plain. It wants proper corner work, and it wants to
  hold the year, the score and the chronicle rather than sitting outside them.

---

## What has not been tested

Everything about how this feels in motion. These are still frames. The mid-game
sag in OP-05 and the walled-in feeling in OP-03 are both partly art problems and
neither can be settled from a contact sheet.
