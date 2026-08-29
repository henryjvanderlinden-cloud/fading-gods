# Fading Gods
A turn-based area-control game about an old power that is fading, and about the
people whose success is the thing that fades it.

> **You can only be remembered by the thing that deafens you.**

You walk the valley. Where you have walked, the ground is *blessed*. Where a
settlement has counted and ploughed it, the ground is *reckoned*, and you cannot
set foot on it again. Every settlement of yours that passes a hundred and fifty
souls takes away the greatest wonder you have left — and opens, in its place, a
work of the settled: clearance, colonies, and finally a levy.

You end the game holding everything you can build, and nothing you can call.

---

## Play it

Open `game/index.html` in a browser. No build step, no dependencies, no server.
The game itself installs nothing and imports nothing — the engine files are
classic scripts rather than ES modules precisely so they load over `file://`.

## Measure it

```
node sim/matrix.js          # the balance matrix, ~40s
node sim/smoke.js           # engine invariants, and the real build in a headless DOM
```

Nothing to install. `sim/smoke.js` will use `jsdom` for the interface checks if
it is present and skip them if it is not.

## Repository layout

| Path | What's in it |
|---|---|
| `engine/` | The rules. No DOM, no rendering. Loaded by the game and the simulator alike. |
| `game/` | The playable build — markup, and a renderer that owns no rules. |
| `game/previous/` | Earlier prototypes, kept because they test different questions. |
| `sim/` | Headless harness, balance matrix, and checks. |
| `design/` | The rules in full, and the reasoning behind them. **History, not authority** — `engine/constants.js` is what is actually running. See the note at the top of `design/rules.md`. |
| `concept/` | What the game is about, and what it should look and feel like. `art-direction/` holds the live comparison. |
| `registers/` | Live working documents — open points, archive, ideas, rejected. |
| `architecture/` | Where the code is now and where it should go. |

## Working method

The pattern that has produced everything useful so far:

1. Argue about a mechanic in prose until it's concrete enough to write down.
2. Implement it in a headless simulation and run a few thousand games.
3. Only build the UI once the numbers say the mechanic isn't broken.

Step 2 is not optional. Several ideas that were obviously good in conversation
turned out to be strictly losing moves when measured — see
`registers/rejected.md`. The measurement is cheap and the argument is not.

There is now a fourth rule, learned the hard way in A-16: **the simulation has to
be the game.** For a while it was not, and the balance numbers in the design doc
were measured against a version of the rules from months earlier. A second
implementation does not drift visibly — it stops being updated and goes on
producing plausible numbers. One engine, imported by both.

## Status

Prototype. The rules are stable enough to be worth writing down and unstable
enough that all of them are still up for revision. See
`registers/open-points.md` for what is actually unresolved.
