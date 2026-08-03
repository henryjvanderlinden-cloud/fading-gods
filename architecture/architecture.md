# Architecture

## Where the code is now

**One engine, imported by both the game and the simulator.** Steps 1 and 2 of the
migration below are done.

```
engine/          the rules. No DOM, no rendering, no input.
  constants.js   tunables, intervention lists, seeded randomness
  hex.js         pointy-top odd-r geometry, neighbour table
  map.js         terrain generation
  state.js       createGame, tile access, the chronicle
  rules.js       movement, legality, targeting, scoring — queries only
  actions.js     the act and the intervention — the only mutators
  tick.js        end-of-year resolution
  ai.js          doctrine weights and the one-ply chooser
  load.js        Node entry point; the browser uses <script> tags instead
game/
  index.html     markup, CSS, and nine script tags
  ui.js          renderer and input. Owns no rules.
sim/
  harness.js     playGame / match / interference
  matrix.js      the balance matrix
  smoke.js       engine invariants, plus the real build played in a headless DOM
```

Still no build step, no dependencies, and it still opens by double-clicking.
These are **classic scripts, not ES modules**, and deliberately so: modules will
not load over `file://`, which would have cost the thing that makes playtesting
cheap. The price is that the engine files share a global `FG` namespace and load
order matters. That price gets paid back at the TypeScript step, where a build
step is unavoidable anyway and the conversion is mechanical.

`sim/smoke.js` optionally uses jsdom to load `game/index.html` and play a whole
game through the actual buttons. It is the only thing that can catch the
renderer and the engine disagreeing, and it is worth keeping installed.

### What the unification found

The Python re-implementation has been deleted. It is worth recording what it
actually was, because the honest version of OP-02 is worse than "they drifted":

`balance-sim-reference.py` was an **18 × 11 map** with *haunted* and *cultured*
ground, blessing worth 1, 20 turns, growth 0.17, and no stones, no wonders, no
works, no armies, no refugee columns, no reckoning budget and no blessing
requirement for founding. Every one of those is a decision the design has since
made and recorded in the archive — A-05, A-09, A-12, A-14. It was not a drifted
copy of the game. It was the game from several months earlier.

So the balance table in `design/rules.md` §10 could not have come from it. It
reports a *Haunt* doctrine, which the JavaScript build has never contained
either. Those numbers came from a simulator that no longer exists in this
repository, and they have now been replaced with numbers measured against the
game itself.

---

## Should this move off the web?

Short answer: **no, and probably not ever.**

The reasoning, because "it's a game so it needs a game engine" is a strong and
wrong instinct here:

- The game is a turn-based board game on 126 hexes. Peak computational load is a
  breadth-first search over a hundred tiles, once per turn. There is no real-time
  loop, no physics, no asset streaming, no frame budget. Performance will never be
  the constraint.
- The renderer is SVG paths and text. A browser is genuinely good at that.
- Distribution is the strongest argument *for* the web: a URL is the lowest-friction
  playtest mechanism in existence, and this project needs playtesting more than it
  needs anything else. It also puts it on a tablet, which is where the board game
  that inspired it was played.
- If a desktop build is ever wanted, **Tauri** or Electron wraps the same code with
  no rewrite. Steam distribution does not require leaving the web stack.

Godot, Unity, or Rust would each be a substantial rewrite in exchange for solving
problems this game does not have. The only scenario that would justify one is a
decision to make the game real-time or 3D, which would be a different game.

**What will actually force a change is not the language but the file.** A single
HTML file stops being workable somewhere around 2,000–3,000 lines, and the current
one is a third of the way there.

---

## Recommended target

Stay in the browser. Add a build step, TypeScript, and — the important part —
a hard separation between the rules and everything else.

```
packages/
  engine/          pure TypeScript, zero DOM, zero randomness except an injected seed
    state.ts       the shape of a game
    rules.ts       legality checks — canFound, canBless, canStone, targets
    actions.ts     state -> action -> state, and nothing else
    tick.ts        end-of-year resolution: growth, reckoning, erasure, marching
    score.ts
    map.ts         terrain generation, seeded
  ui/              SVG renderer + input, imports engine, owns no rules
  ai/              doctrines, imports engine, plays a legal game
  sim/             headless harness: runs N games, prints the balance matrix
apps/
  play/            the thing you open in a browser
```

### The one principle that matters

**One rules engine, imported by both the game and the balance simulator.**

Everything else in this document is preference. This is not. The whole working
method — argue, simulate, then build — depends on the simulation being the same
game as the game. Right now it isn't, and every number in the design doc carries an
asterisk because of it.

Concretely, this means the engine must:

- be **pure**: `(state, action) → state`, no DOM, no globals, no `Math.random()`
- take its randomness from an **injected seeded generator**, so any game can be
  replayed exactly
- be **serialisable**: the whole game state as JSON, which gives save/load,
  undo, replay, and bug reports containing a reproducible state, all for free

### Why TypeScript specifically

The state here is a graph of tagged unions — tiles with terrain and state and
optional owners, settlements, stones, armies, refugee columns, interventions with
different targeting rules. That is precisely the shape where untyped JavaScript
starts producing silent wrong answers instead of errors, and it is precisely the
shape that a refactor of a growing rules engine has to move around safely.

No framework needed. The renderer is a function from state to SVG; React would be
fighting it.

---

## Migration

1. ~~Lift the rules functions out of `index.html` into `engine/` unchanged, still
   JavaScript. Get the existing UI importing them and confirm the game still plays
   identically.~~ **Done.** Verified by `sim/smoke.js`, which plays a full game
   through the build's own click handlers in a headless DOM.
2. ~~Point the simulation harness at the same functions. Delete the Python. Re-run
   the balance matrix — **expect the numbers to move**, and treat the new ones as
   the real ones.~~ **Done.** They moved a very long way. See §10 of
   `design/rules.md`.
3. Add TypeScript and a seeded RNG. *The seeded RNG was pulled forward into step
   1 — the harness is worthless without reproducible games — so this step is now
   only TypeScript, and the build step that comes with it.*
4. Split the renderer properly. `game/ui.js` is one long function plus wiring; it
   wants breaking into a state-to-SVG function and an input layer. *Partly forced
   by OP-17.* The map is now three layers — land, scrim, tokens — and the land is
   cached against a fingerprint of everything it reads, because at hex 50 it is
   ~3,400 SVG nodes and re-parsing them on every click was the single most
   expensive thing the build did. Moving your token or arming an intervention now
   touches only the cheap two layers. The cache key is pure state, so the
   renderer still owns no rules.

   Measured in jsdom on a year-40 board, which is the worst case: 450kB of
   markup, 3,442 nodes, ~298 animated. A full render went 272ms → 159ms and a
   redraw with the board unchanged is 135ms. **A browser will be several times
   faster than jsdom at all of these**, and the remaining cost is mostly the side
   panels and the engine queries behind them — nine `targets()` calls per render
   — rather than the map. That is the next thing to look at if it ever matters.

---

## Things worth building next

- ~~**Seeded replay**~~ — done. `FG.createGame({seed})` reproduces a game
  exactly, and the matrix uses fixed seeds so two runs agree.
- ~~**A test suite over rule legality**~~ — started. `sim/smoke.js` asserts the
  reckoning budget, the erasure ratchet, the stone cap, land-state consistency,
  and that nothing marches through rock. `canFound`'s eight conditions still
  want tests of their own.
- **A balance CI job** — `node sim/matrix.js 40 40 cities` in about twenty
  seconds. Fail the build if a doctrine leaves its band. Nothing stops this now.
- **Headless self-play** for better AI, which is OP-01 and, now that the numbers
  are honest, visibly the largest uncertainty in the project.
