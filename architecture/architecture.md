# Architecture

## Where the code is now

One HTML file, about 900 lines, containing markup, CSS, and all game logic in a
single script block with module-scope mutable state (`G`). No build step, no
dependencies, opens by double-clicking.

This is the correct thing to have built. It got from idea to measurable in a day,
repeatedly. It is also close to the end of its useful life: the state object is
global, the rules and the renderer are interleaved, and there is no way to run the
game without a browser.

Separately there is a Python re-implementation of the same rules, used to run a few
thousand games and produce every balance number in `design/rules.md`. That file is
here as `balance-sim-reference.py`.

**These two implementations have already drifted.** That is the actual architectural
problem, and it is worse than it sounds, because it means the tuning was done
against something that is only *approximately* the game.

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

## Migration, if and when

Not urgent. The current file still works and still teaches. When it stops:

1. Lift the rules functions out of `index.html` into `engine/` unchanged, still
   JavaScript. Get the existing UI importing them and confirm the game still plays
   identically.
2. Point the simulation harness at the same functions. Delete the Python. Re-run
   the balance matrix — **expect the numbers to move**, and treat the new ones as
   the real ones.
3. Add TypeScript and a seeded RNG.
4. Split the renderer properly.

Step 2 is where the value is. Steps 1, 3, and 4 are housekeeping.

---

## Things worth building once there is an engine

- **Seeded replay** — same map, different strategy. Makes A/B honest.
- **A test suite over rule legality** — `canFound` has eight conditions and they
  interact; it will break silently.
- **A balance CI job** — run 500 games on every commit and fail if any doctrine
  moves outside a band. Tuning regressions are otherwise invisible.
- **Headless self-play** for better AI, which is OP-01 and probably the largest
  outstanding uncertainty in the whole project.
