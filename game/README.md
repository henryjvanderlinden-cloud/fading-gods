# Builds

`index.html` is the current game — open it in a browser, no build step.

It holds markup, CSS and nine script tags. The rules live in `engine/`, one
directory up, and are shared with `sim/`. `ui.js` is the renderer and the input
handling, and owns no rules: if a rule appears in it, the simulator cannot see it
and the balance numbers stop meaning anything.

## Which rules you are playing

The build ships with `FG.R2` — the August 2026 batch, OP-19 and OP-20 — entirely
**off**, so opening `index.html` plays the game `design/rules.md` describes. The
**which rules** panel in the right-hand column switches between the two, and
changing anything in it restarts year one **on the same map**, so the two rule sets
can be compared on the same ground rather than on two different draws.

Six of the twelve rules are built: logistic growth, the two teachings, the wonder
trigger, the audible Seventy-Seven, walking the fields at a price, and the exit
lane. The other six are listed, disabled, and marked *not built* — a switch that
does nothing is less confusing than a rule nobody can find.

Two things only appear with the batch on: **the teachings**, at the top of the
intervention column, which are done in person rather than called from anywhere; and
**manifestation**, in the tally line, which is what is left of you after walking in
somebody's fields.

## Two people at one board

Pick **a second person, at this board** in *the other seat*, at the top right of the
page. That restarts, because it changes the shape of a year rather than the strength
of an opponent.

It is in the header rather than the sidebar for a reason worth keeping: it was in the
sidebar first, below *your stones*, and the first person to open the build could not
find it. A control that changes what a year *is* should not be below the fold.

A year is then: the left hand acts, hands over, the right hand acts, and only then
does the world move. The button says which. Whose year it is runs in that seat's own
colour across the whole width of the board and around the map — on a shared screen
that banner is the only thing standing between one player and somebody else's year,
so it is not a label in a side panel.

**No curtain between turns, because there is nothing to hide.** No fog, and the
wonder count is derivable from the board, so both players can watch each other
decide. For OP-21's purpose that is a feature rather than a concession: the whole
reason the mode exists is to hear somebody reason out loud about whether to teach.

Two toggles sit under the dropdown, and both apply to a single-player game too.

**Hand over as soon as nothing further is possible** — off by default. The condition
is deliberately *nothing further is possible* and not *everything is used*: waiting
for movement, act and intervention all to be spent hangs forever whenever a player
has no legal intervention. Movement does not gate it.

**Even the map** — off by default, and **not validated**. It blesses one tile for the
right-hand seat against OP-07's measured +4.0 point left-seat advantage. Measured
with `node sim/handicap.js`, it is not worth the flat 3 points the argument assumed
and may not point the same way for every doctrine. Read OP-07 before trusting it.

The chronicle is written from the left-hand seat and says *you* about it. In a
two-player game it is folded shut and labelled accordingly, which is honest and
costs nothing; two properly addressed logs is a separate pass. See OP-21.

An untaught settlement is drawn as blessed country with people in it — blessed
fill, sparkle, no furrows. It only becomes farmland-ochre the year you teach it.
That is the decision the batch is about, and the fill is the most legible thing on
the board.

### Why `previous/` cannot hold a snapshot of this one

The four prototypes in `previous/` are self-contained: their rules are inside the
HTML, which is what makes them frozen. This build loads `../engine/*.js`, so a copy
of it would go on following the live engine and would stop being a record of
anything — the A-16 failure mode, arrived at from a different direction.

The R2 panel is what replaces that pattern. One build, both games, switchable, and
the old rules stay reachable by construction rather than by copying.

## What it looks like, and why

The art direction is `concept/art-direction/`, and the reasoning is in the README
there. In short: warm painted earth, flat hexes at 50px, a raised border around
each contiguous stretch of one power's ground rather than around every tile,
Bronze Age temple complexes that grow through four stages, and the two powers
drawn as figures rather than tokens.

**And it is now on a switch.** *The terms* → **how it is drawn** offers the
vector renderer and two sprite sets, and unlike everything else in that dialog
it does not restart: the board, the year and the stones stay where they are, so
the only thing that changes between two looks is the look. Nothing about the
land is sprited — the fill and the boundaries carry the one load-bearing visual
rule and have measured contrast numbers behind them — and nothing carrying a
number, animating, or drawn from an unbounded count is either. The argument,
the costs, and how to add a set are in `concept/art-direction/sprites/README.md`.

**The board is limited by height, not width.** Its aspect is 1.775 — `BW/BH` in
`ui.js` — and a laptop window is nearer 2.0, so what binds is always the vertical
space left after the chrome. This is the single most useful fact about the
layout, and it is counter-intuitive: deleting the 330px sidebar bought the map
nothing on its own. **Every row removed from above or below the board is worth
1.775 pixels of width; a column removed beside it is worth none.** That is why
the tallies moved into the header, why the marching / stones / settlements
panels went (the board already draws all three), and why the graph and the
legend sit beside the control rows — in space the board's aspect cannot use.

So the four control groups are now four **columns flanking the board**, two a
side, and the sides carry the argument: on the left what a year *is* — the act
you take, and the wonder you spend yourself to work — and on the right what it
buys, the teaching and the works. The ratchet the game runs on reads left to
right across the page, which no arrangement of rows ever said. The legend sits
under the left pair because it explains the fills the acts above it change; the
graph sits under the right pair, being the one thing the board cannot say for
itself.

The palette columns are capped at 112px, and that number is measured against the
*other* constraint rather than against the labels: the height allowance leaves
room for a board about 1460px wide, so every pixel the four columns take beyond
that comes off the board. At 112 they total about 508px and the board lands near
1376 — just inside what height would have allowed, so neither constraint is
wasted. The longest labels wrap to two lines, which is the intended trade.

Measured on a 1920 × 1080 screen: the board was 1083px wide with the sidebar,
1269 with the numbers moved into the header, and about 1376 now — hexes at 54px
against the 50px the art was cut for.

Five things in `ui.js` are worth knowing before changing it:

- **Some of the board moves, and none of it has to.** Sparkle on blessed ground,
  flying banners, travelling water. Ownership is on the boundary, settlement
  stage is in the silhouette, land state is in the fill — motion always adds to a
  reading that already works without it. `prefers-reduced-motion` is honoured and
  the board stays fully legible under it. Keep that true.
- **A still screenshot understates the build.** Judge it running.
- **The map is three layers and the land is cached.** See `architecture.md`.
  Anything drawn from state that `tileArt` or `boundaries` reads must be included
  in the cache key in `render()`, or it will not redraw. The art mode is in that
  key for exactly this reason: leave it out and the switch appears to do nothing
  until the board next changes on its own, which reads as a broken control
  rather than as a stale cache.
- **Every mark opens by asking `art.js` for a sprite.** `FGART.sprite` returns
  `null` in vector mode and for any key a set has not filled in, so each call
  site is `ART.sprite(...) || theVectorMark(...)` and the vector is still the
  default rather than a fallback. A half-finished sprite set shows vectors
  through the gaps instead of holes.

Wild folk on blessed ground and field hands on farmland are **presentation over
`t.st`, not a mechanic** — no rule puts anyone anywhere. OP-18 is the version
that would.

The script tags are classic scripts rather than ES modules on purpose. Modules
will not load over `file://`, and double-clicking has to keep working. Load order
matters.

`previous/` holds earlier prototypes. They are kept because each one tests a
different question and several contain mechanics not in the current build.

| File | Tests | Notable |
|---|---|---|
| `works-and-wonders.html` | The wonder/work ladder without marching armies | Simpler; useful for isolating the ladder |
| `the-walls-close.html` | Hard movement walls at 40 turns, before spells | The "can walk to" gauge originates here |
| `blessed-ground.html` | Sacred stones as passive engines, 20 turns | The shortest playable version |
| `the-founding.html` | Whether watching a seeded settlement run 200 years is compelling | Contains the writing-distortion mechanic, which exists nowhere else and is worth reviving |
