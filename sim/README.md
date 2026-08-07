# Simulation

Everything here imports `engine/load.js`, which loads the same eight files
`game/index.html` loads as script tags. There is no second implementation of the
rules, and there must never be one again — see A-16.

```
node sim/matrix.js [games] [turns] [section]
node sim/smoke.js
```

## matrix.js

Sections are `full`, `cities`, `order`, `interference`, or `all`. Running one at
a time is useful because the whole thing takes about a minute.

```
node sim/matrix.js 40 40 cities    # the headline table, ~20s
node sim/matrix.js 40 40 order     # turn-order sensitivity — see A-17
node sim/matrix.js 12 20 all       # quick look while tuning
```

Seeds are fixed at 0..n-1, so two runs of the same command agree exactly. This
is what makes an A/B honest: change a rule, re-run, and the difference is the
rule rather than the dice.

**interference** is A-05's diagnostic, and the first thing to check after any
change to map size or movement. It plays the same seeds against a live rival and
against Passive. If the two scores are close, the powers are not playing each
other and no amount of number-tuning will fix it.

## smoke.js

Two halves.

The first runs 30 seeded games and asserts invariants every year: the reckoning
budget holds, blessing beside farmland is always erased, land state and ownership
agree, the stone cap holds, nothing marches through rock or water, the wonder
ladder stays in range. It also reports the stone-capture measurement behind
OP-16, which is a count rather than an assertion because nobody has decided yet
whether it is a bug.

The second loads `game/index.html` in jsdom, hands it the engine files in the
same order a browser would, and plays a full forty-year game by clicking the
actual buttons. This is the only check that catches the renderer and the engine
disagreeing. It needs `npm i jsdom` and skips cleanly without it.

It then plays a **two-seat game** through the same buttons — OP-21. Almost all of
that mode lives in the interface and the engine barely knows about it, so the
interface is where it has to be checked. The assertion that matters is that
handing over does *not* move the world: the year turns only once both seats have
acted.

## handicap.js

What the compensating tile is actually worth — OP-07, and the toggle OP-21 added.

```
node sim/handicap.js [games] [doctrine ...]
```

Mirror matches with the seeds split between both orders, so the A-17 seat
advantage cancels and what is left is the map. The statistic is the mean score
margin with a standard error, as in `order.js`, and zero is fair.

**It does not currently say what it was built expecting to say.** The tile is not
worth a flat 3 points and may not point the same way for every doctrine. Nothing
is resolved at 160–400 games a cell; OP-07's own figure took 1,160. Read OP-07
before quoting anything from it.

## order.js

Answered A-17: does the seat you sit in decide the game? Mirror matches, same
doctrine in both seats, so the only differences are the starting positions and
who acts first.

```
node sim/order.js <doctrine> <regime> <games> [turns] [seed0]
node sim/order.js report
```

Regimes are `p0`, `p1`, `years`. Results accumulate in `/tmp/fg-order.json`
across runs, so a long measurement can be taken in chunks; `report` prints the
table. Set `FG_ORDER_OUT` to keep several experiments apart.

The statistic is the **mean score margin, p0 minus p1**, with a standard error —
not the win rate. A win rate discards the size of every result and needs
thousands of games to resolve a ten-point effect; the margin uses all of it. Zero
is fair.

## harness.js

`playGame`, `match`, `interference`. Import it directly for one-off questions
rather than adding sections to `matrix.js`:

```js
const {FG, match} = require("./sim/harness.js");
const m = match("bands", "cities", 60, {tune: {bval: 4}, first: "alternate"});
console.log(m.win, m.bless, m.reck);
```

`opts.tune` takes any key from `FG.TUNE` — the same knobs as the sliders in the
build.

`opts.first` decides who acts first each year, which matters more than it sounds
(A-17):

| Value | Meaning |
|---|---|
| `"p0"` | The build's own order — you act, then the rival. Default. |
| `"p1"` | The rival acts first. |
| `"alternate"` | Splits the seeds: half each way. The fairer measure of a doctrine. |
| `"years"` | Flips the order from one year to the next *within* a game. Measured fair and **rejected anyway** — because the world resolves at each year end, flipping the order means somebody acts, the world ticks, then that same power acts again. A double move at every changeover. See A-17. |

Rule toggles are set directly on `FG` and are not reset between games, so set
them before a run and put them back afterwards:

```js
FG.CONTEST = true;           // rejected A-17 candidate — contested ground goes to neither
FG.BLESS_WILD_ONLY = true;   // rejected A-17 candidate — bless never takes their ground
FG.SOFT = true;              // walls cost 3 rather than blocking
```

## FG.R2 — the August 2026 batch

Twelve rules from OP-19 and OP-20, each individually toggleable, **all off by
default**. With all of them off this engine plays exactly the game
`design/rules.md` describes, which is what makes it the A/B baseline — and it is
worth keeping true, so check `sim/smoke.js` still reports 11,732 passing before
trusting a comparison.

```js
FG.R2all(true);              // the whole batch
FG.R2all(false);             // the game as shipped
FG.R2.logistic = true;       // or one rule at a time
```

| Flag | Rule |
|---|---|
| `logistic` | logistic growth; the ceiling carries terrain and teaching, not the rate |
| `teaching` | tilling and killing, taught per settlement, in person |
| `taughtLoss` | the wonder goes on teaching rather than at population 150 |
| `audible77` | settlements under seventy-seven bless the ground round them |
| `split2` | split targets your blessing at path distance 2 |
| `fade` | reckoned ground walkable; 10% of manifestation to end a year in it |
| `unmake` | taking their blessing returns it to wild |
| `encircle` | a ring of blessing takes a settlement; the taboo |
| `landGates` | works unlock on tilled land, not on population |
| `pathFrac` | `blessFrac` counts path distance |
| `barren3` | withered ground stays barren three years |
| `exitLane` | the fields close slowly, and never seal a place in |

Numbers live in `FG.R2TUNE` — growth rate, the three carrying capacities, the
toll, and the rest. Not in `FG.TUNE`, because that is the slider panel and these
are not sliders yet.

**Turn them on one at a time when measuring.** The first run of this batch
produced a 35-point swing that looked like a rule and was a bug in the chooser;
a single master switch could not have told the two apart. See OP-19.

Stage 1 — `logistic`, `teaching`, `taughtLoss`, `audible77`, plus `exitLane` and
`fade` — is built. The rest are declared and not yet implemented.
