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
node sim/matrix.js 40 40 order     # turn-order sensitivity — see OP-17
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

## order.js

Answers OP-17: does the seat you sit in decide the game? Mirror matches, same
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
(OP-17):

| Value | Meaning |
|---|---|
| `"p0"` | The build's own order — you act, then the rival. Default. |
| `"p1"` | The rival acts first. |
| `"alternate"` | Splits the seeds: half each way. The fairer measure of a doctrine. |
| `"years"` | Flips the order from one year to the next *within* a game. This is the third candidate fix for OP-17 and wants a few hundred games before its effect is distinguishable from noise. |

Rule toggles are set directly on `FG` and are not reset between games, so set
them before a run and put them back afterwards:

```js
FG.CONTEST = true;           // OP-17 candidate — contested ground goes to neither
FG.BLESS_WILD_ONLY = true;   // OP-17 candidate — bless never takes their ground
FG.SOFT = true;              // walls cost 3 rather than blocking
```
