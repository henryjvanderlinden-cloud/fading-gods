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

## Repository layout

| Path | What's in it |
|---|---|
| `game/` | The current playable build. `index.html` is the latest. |
| `game/previous/` | Earlier prototypes, kept because they test different questions. |
| `design/` | The rules as they currently stand, in full. The source of truth. |
| `concept/` | What the game is about, and what it should look and feel like. |
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

## Status

Prototype. The rules are stable enough to be worth writing down and unstable
enough that all of them are still up for revision. See
`registers/open-points.md` for what is actually unresolved.
