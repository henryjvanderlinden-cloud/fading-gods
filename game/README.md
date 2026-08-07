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

Three things in `ui.js` are worth knowing before changing it:

- **Some of the board moves, and none of it has to.** Sparkle on blessed ground,
  flying banners, travelling water. Ownership is on the boundary, settlement
  stage is in the silhouette, land state is in the fill — motion always adds to a
  reading that already works without it. `prefers-reduced-motion` is honoured and
  the board stays fully legible under it. Keep that true.
- **A still screenshot understates the build.** Judge it running.
- **The map is three layers and the land is cached.** See `architecture.md`.
  Anything drawn from state that `tileArt` or `boundaries` reads must be included
  in the cache key in `render()`, or it will not redraw.

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
