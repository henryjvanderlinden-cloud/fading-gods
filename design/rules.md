# Rules — as currently implemented

This describes `game/index.html` exactly. Where a number appears here it is a
tuned value, not a principle; nearly all of them are exposed as sliders in the
build so they can be argued with. Where a rule is a *principle* rather than a
number, it is marked **[load-bearing]**.

> **This document is now behind the game, and by a whole rule set. Read this box
> before you trust anything below it.**
>
> `FG.R2` in `engine/constants.js` holds the August 2026 batch — OP-19 and
> OP-20 and everything settled alongside them — and **as of 25 August 2026 every
> built rule in it is on by default. There are eighteen of them.** Rick played
> the batch across several games and reported it a clear improvement, which is
> the evidence class this project ranks above the matrix for anything about
> choices. So the batch stopped being a candidate and became the game, and the
> numbered sections below stopped describing it.
>
> **`built` and `on` are the same set again**, which they had not been since
> 1.12 and 1.19 shipped switched off. `FG.R2reset()`, `FG.R2built(true)` and the
> *Everything, as it ships* button in the terms panel now all mean the same
> thing. The only flag that is off is `pathFrac`, and that is because nothing in
> `engine/` reads it.
>
> What is still exactly true: `FG.R2all(false)` plays what is written here, and
> the A/B is asserted in `sim/smoke.js`. What is no longer true, section by
> section — §4's population thresholds and growth (now logistic, and capped by
> teaching), §5's wonder trigger (now teaching, not 150), §2's impassable
> farmland (now walkable at a toll), and §6, which has gained the teachings and
> the two rules in §11 below. **§10's balance table is the old game's.** The
> current one is in §17, which is the only place it now lives.
>
> A-16 is the reason this note exists and the reason it is this blunt: a
> document that quietly stops matching the game does not announce it, and the
> last time that happened the balance numbers were measured against rules from
> months earlier. Rewriting the sections below around the batch is now the
> outstanding debt on this file. Until that is done, **`engine/constants.js` is
> the authority and this document is the history.**

---

## 1. The board

A hex map, 14 × 9, roughly 126 tiles, of which about a hundred are land. Pointy-top
hexes in odd-r offset.

Map size is deliberately small. **[load-bearing]** At 18 × 11 the two players
never actually interact — measured interference was 0%, meaning your score was
identical whether the opponent played optimally or did nothing at all. Crowding
is what makes it a game rather than two solitaires.

### Terrain

| Type | Passable | Fertility | Notes |
|---|---|---|---|
| Plain | yes | 1.00 | |
| Forest | yes | 0.75 | |
| Hill | yes | 0.55 | |
| Water | no | — | Generated, or created by *Drown the ground* |
| Mountain | no | — | Only created by *Raise mountains* |

### Land states

Every land tile is in exactly one state, and may be owned by one player.

- **Wild** — unowned. The default.
- **Blessed** — owned. Worth 3. Created by the Bless act, by stones, by *Quicken*.
- **Reckoned** — owned. Worth 2. Created by settlements growing, or by *Clearance*.
- **Settlement** — owned. Worth 3.

Blessed ground adjacent to any reckoned tile reverts to wild at end of year.
**[load-bearing]** This is the one-way ratchet that drives the whole arc:
farmland does not merely out-score blessing, it *erases* it.

---

## 2. The player

You are a single token on the map. You have three movement points a year.

Movement cost is 1 through wild ground and through your own blessing.
**Reckoned ground of either side, and the other side's blessing, are impassable.**
**[load-bearing]** Not expensive — impassable. Your own farmland walls you out
exactly as theirs does.

A "walls are slow going, not impassable" toggle exists for comparison; it costs 3
instead of blocking.

Each year you take **one act** and **one intervention**. They are separate.
**[load-bearing]** With a single combined slot, every non-scoring action is a
losing move, because blessing is worth roughly 21 points a year and nothing else
comes close. This was measured, repeatedly, before the slot was split.

---

## 3. Acts

**Bless** — the tile you stand on and its six neighbours become blessed, taking
wild ground and overwriting the other side's blessing.

**Raise a stone** — on blessed ground with at least 8 connected blessed tiles
beneath it, and under your stone cap (4). See §5.

**Found** — place a settlement of 30. Requires:
- the tile is blessed by you, and
- at least **85%** of the country within two tiles is blessed by you, and
- no settlement adjacent, no stone on the tile, and
- no enemy blessing within two tiles.

**[load-bearing]** The blessing requirement is what couples the two economies.
All expansion begins with blessing. You bless the ground, settle it, and the
settlement then reckons the ground and destroys the blessing that made it
possible. It is also what made hybrid strategies viable for the first time.

**Split** — a settlement of 60+ sends half its people to an adjacent legal site.
This is how a magical player keeps settlements under the thresholds.

**Do nothing.**

---

## 4. Settlements

Population grows each year by `growth × fertility × (0.55 + 0.45 × landFraction)`,
with growth at 22% and a hard cap of 2600.

### Bands

| Size | Name | What changes |
|---|---|---|
| < 77 | band | The Seventy-Seven. Nothing is lost. |
| 77–149 | village | The regret zone: past magic, not yet useful. |
| 150–799 | town | Begins reckoning ground. Counts 1 toward strength, and costs one wonder. |
| 800+ | city | Reckons at radius 2. Counts 2 toward strength. |

The Seventy-Seven should read in-fiction as a custom the people keep themselves,
not a rule imposed from outside. They split before they cross it because they know
what happens when they don't.

### Reckoning

A settlement past 150 converts up to 3 tiles a year within radius 1 (radius 2 past
800) to reckoned ground, **up to a lifetime budget of 30 tiles**, after which it
stops permanently and is marked *spent*.

The year's allowance is now clamped to what remains of the budget as well as to
the yearly rate. Until the harness asserted it, a settlement sitting on 28 or 29
spent tiles would take a full three more and overshoot its lifetime limit — a
small bug in a rule A-14 calls load-bearing, and invisible without a test.

**[load-bearing]** The budget exists because without it a settlement's output is
quadratic in time — the reckoning radius grows with population — while blessing is
linear. Over 20 turns that gap is survivable. Over 40 it is decisive, and no other
tuning could rescue it.

---

## 5. Sacred stones

Raised on blessed ground with 8+ connected blessed tiles. Maximum 4.

A stone's **power** is the size of the connected blessed region containing it.
**[load-bearing]** Connected, not total — so severing your blessed ground halves
your stones, and defensive geometry matters.

- Power ≥ 6: the stone is *working*. It blesses one wild tile within reach each
  year, without costing you an action, and it **holds back one wonder** (see §6).
- Reach = `1 + floor(power / 10)`, capped at 3. Divine interventions may target
  anything within reach of a working stone, or adjacent to you.
- Power < 6: the stone still stands, and does nothing. It is only a stone now.

Stones were originally designed as weapons. Measured, that version made the
magical player *lose* — the action cost exceeded the damage. As passive engines
they work, because they are the only compounding thing the magical side owns.

**A stone's ground can be taken.** Bless and Quicken overwrite the other side's
blessing and neither excludes a tile with a stone standing on it, so a rival can
bless the ground out from under your stone and silence it. Undocumented until
now, and rare: 1% of stones end that way.

**What actually kills stones is farmland.** Of 194 stones raised over 60 games,
178 — **92%** — end under reckoned ground, and that is permanent, because
reckoned ground is impassable and so cannot be blessed back. Clearance can also
be aimed at a stone's tile deliberately, which nothing in this document says and
nobody decided. See OP-16.

---

## 6. Interventions

One a year, from either list.

### Wonders — you begin with all six and lose them

You lose the **greatest remaining** wonder for every settlement of yours past 150,
less one for each working stone.

`lost = max(0, settlements≥150 − workingStones)`

In order of loss:

1. **Raise mountains** — the target tile and the two above and below become
   mountain, permanently impassable. Requires 70% blessed country within two tiles,
   so it can only be done deep inside your own territory. A wall, not a weapon.
2. **Drown the ground** — one tile becomes water, permanently.
3. **Blight** — a hostile settlement loses half its people.
4. **Bad omen** — three quarters of one of *your own* towns walks out and travels
   to your nearest settlement, one tile a year.
5. **Wither the furrows** — reckoned ground around a tile reverts to wild.
6. **Quicken** — blessing spreads over a tile and its neighbours.

The order matters emotionally as much as mechanically: world-shaping goes first,
small tending gestures last. Late game you can still bless a hedgerow and can no
longer move a hill.

### Works — you begin with none and gain them

`strength = settlements≥150 + settlements≥800`

| Work | Needs | Effect | Cost |
|---|---|---|---|
| Clearance | strength 5 | Reckon 3 tiles at once within 2 of a town | 10% of the town |
| Send a colony | strength 7 | Found a settlement 3 tiles out, on any ground, ignoring the blessing requirement | 35% |
| Raise a levy | strength 9 | An army forms and marches | 45% |

The colony cost is 35%, not the 33% recorded here previously — the code has
always multiplied by 0.65. Corrected against the source rather than the other way
round, since 35% is what every measurement in §10 was taken with.

The costs are not decoration. Without them Cities won 82–90% of games.

---

## 7. Marching

**Armies** move one tile a year toward their target, pathing around water and
mountain but freely across blessed and reckoned ground — they are mortals, and
the player's movement rules do not apply to them.

- On arrival, the target settlement changes hands at 40% of its population plus a
  quarter of the army.
- If the target is no longer hostile, the levy goes home.
- If no road exists at all, the levy disbands where it stands. This is the payoff
  for spending *Drown* or *Raise mountains* defensively.

**Refugee columns** (created by *Bad omen*) move the same way toward the nearest
friendly settlement and add their number on arrival.

The emergent consequence, which was not designed: evacuating saves the town but
the arrivals push another settlement past a threshold, costing you a wonder
elsewhere. Saving a place deafens you somewhere else.

---

## 8. Scoring

Blessed 3, reckoned 2, settlement 3. Highest total at year 40 wins. No other
scoring, no victory categories, no legacy metrics.

A "largest unbroken region only" variant was implemented and tested. It shifts
roughly 15 points toward the magical side because blessing forms one blob while
settlements scatter. Shelved, not rejected.

---

## 9. The rival

One opponent, running a fixed doctrine chosen from a dropdown:

- **Cities** — founds constantly, never splits, lets settlements grow.
- **Bands** — splits at sixty, blesses constantly, raises stones.
- **Mixed** — some of each.
- **Passive** — does nothing at all.

**Passive is a diagnostic, not an opponent.** Play a game against Cities and the
same seat against Passive. If your score barely differs, the two of you were never
playing each other, and no amount of number-tuning fixes that.

**Or a second person.** The other seat may be held by someone sitting next to you,
in which case a year is: the left hand acts, hands over, the right hand acts, and
only then does the world move. Nothing in the rules changes — the engine's only
structural assumption about who was human was one line, and it is gone. OP-21.

Note what the dropdown becomes when both seats are people: nothing. A doctrine is
a theology (`concept/lore.md`), and two players simply hold theirs. Whether either
of them ever *declines* to teach is the one observation this project cannot
currently make any other way, and it is why OP-21 outranks OP-01.

---

## 10. Current balance

**These numbers replace the previous table, which was measured against a
simulator that is no longer in the repository and was never this game.** See
`architecture/architecture.md`. Everything below comes from `sim/matrix.js`,
which imports the same engine files `game/index.html` loads. Reproduce with
`node sim/matrix.js 40 40`.

40 games per matchup, 40 turns, seeds 0–39.

### Against the Cities doctrine

| Playing | Wins | Previously claimed |
|---|---|---|
| Cities (mirror) | 57% | ~53–61% |
| Mixed | 43% | ~47–50% |
| Haunt (pure blessing) | 13% | ~42–56% |
| Bands | 8% | ~33% |

### Every matchup, mean win rate

| Playing | Mean |
|---|---|
| Cities | 78% |
| Mixed | 49% |
| Haunt | 40% |
| Bands | 24% |

**The spread between strongest and weakest doctrine is 54 points, not 30.** No
strategy dominant is not true: Cities wins every matchup it plays except its own
mirror. Mixed is genuinely middling, which is the one part of the old table that
survived. The magical extremes are not viable, and OP-06 — *does an ascetic
strategy ever win?* — now has a much sharper answer than it had.

The old caveat still stands and matters more than before: all of this is a greedy
one-ply AI playing both seats (OP-01).

### Turn order

Unmeasured until now, and large. **Bless overwrites the other side's blessing**,
so when both powers bless contested ground in the same year, whoever acts second
keeps it. In the build, you always act first.

Mirror matches, same doctrine in both seats, win rate for the first seat:

| Doctrine | Acting first | Acting second | Swing |
|---|---|---|---|
| Cities | 57% | 53% | 5 |
| Mixed | 55% | 38% | 18 |
| Bands | 35% | 68% | 33 |
| Haunt | 28% | 68% | 40 |

A blessing doctrine gains by acting second and the human seat never does — but
the effect was measured properly and **the order is staying as it is**. See A-17
for why, and for the three fixes that were built and rejected.

What changed instead is how doctrine strength is reported. Measured with the
seeds split evenly between both orders, so the seat advantage cancels: Cities
50%, Haunt 22%, Mixed 37%, Bands 8%. Turn order was worth about half of Haunt's
deficit and nothing at all to Bands.

### Interference

The A-05 diagnostic — score against a live Cities rival versus against Passive on
the same seeds:

| Playing | Live | Alone | Interference |
|---|---|---|---|
| Cities | 84.2 | 181.4 | 54% |
| Mixed | 74.4 | 178.3 | 58% |
| Haunt | 63.5 | 172.1 | 63% |
| Bands | 54.0 | 174.3 | 69% |

Comfortably above the 31–39% previously recorded at this map size. Whatever else
is wrong, the two powers are unambiguously playing each other, which A-05 called
the single most important measured result in the project.

---

## 11. Saying it, rather than doing it

**Added August 2026 as `dreamTeach` and `dreamWorks`, both on by default.** The
fifth answer to OP-19's *where does teaching happen*, and the four the register
had before it were all compromises on presence. This one keeps presence and
prices the alternative.

### The rule

| | Where it may be aimed | What it costs you |
|---|---|---|
| **Teaching** — till, kill | Beside you, **or anywhere a working stone reaches** | Nothing in person. **10% of your manifestation, permanently**, at range. |
| **A work** — clearance, colony, levy | Anywhere, as before | Nothing inside your hearing. **10% of your manifestation, permanently**, beyond it. |
| **A wonder** | Unchanged — within reach of a working stone, or beside you | Unchanged — nothing |

*Your hearing* is `divineReach`: the country your working stones cover, plus the
tile you stand on and its ring. *In person* is the narrower test — the tile you
stand on and its ring, and nothing else. The two are deliberately different, and
`FG.tolled(id, k, who)` is the single place that knows which applies.

### Why teaching may travel at all

**[load-bearing]** OP-16 already drew the line the game needed and drew it in the
right place: **creation at a distance, unmaking only in person.** Blessing
spreads through the stone network; taking someone else's sacred ground requires a
body standing on it. Teaching is creation, so it belongs on the travelling side,
and `concept/lore.md` needed no amendment to allow it — a dream goes down the
same channel the voice already goes down. What the old rule had was not a
principle but an accident of which functions existed.

### The second price, which nobody had to write

Teaching them to till makes them plough. Ploughing eats blessed ground. A stone
whose connected blessed region falls under `MINREG` stops working. And a working
stone is what carried the dream.

**So teaching at range destroys the channel that carried it**, and the more you
do it the less far you can do it. That falls out of rules that were all already
here. It is the thesis in one loop and it needs no cap, no counter and no timer —
which is what keeps it clear of A-10.

### Why the price is paid in the body and not in people

There is one stock called *what is left of you*. OP-14's trespass toll spends it
at 10%, and this spends it at 10%, so there is one number to reason about rather
than a tariff. It is permanent, it is never refunded, and **nothing in the game
puts any of it back.** A wonder you lose is gone; a piece of you goes the same
way.

A year holds one intervention, so the ceiling from this is 10% a year, and
another 10% for ending the year in their furrows. Ten years of ruling entirely at
range and there is nothing left of you.

**And that is the point of it beyond the balance.** OP-14 asks what should happen
at zero — whether you lose the body and keep playing as a network with no
location, which would make the administrative-interface ambition in `concept/`
literal. Until now nothing in the game spent the stock fast enough for anyone to
arrive at the question. Now the settled doctrines arrive at about half of
themselves by year forty. See §11's numbers below and OP-14.

### What it costs the settled side, measured

40 games a cell, seeds split between both orders, against Cities.

| Doctrine | Teachings by dream / game | Works out of hearing / game | Body left at year 40 |
|---|---|---|---|
| Cities | 0.63 | 0.50 | **0.54** |
| Mixed | 1.70 | 1.35 | **0.49** |
| Haunt | 0.00 | 0.00 | 0.94 |
| Bands | 0.00 | 0.00 | 0.89 |

**The refusers never pay it**, because they never teach and never build works.
This is the first rule in the game that charges the settled doctrine in *you*
rather than in people, and it is the arc stated as a cost: early you point at the
ground, late you issue orders, and the orders use you up.

### Note that `dreamWorks` grants nothing — it only charges

Worth being loud about, because it does not look that way. Clearance, colony and
levy have **always** reached anywhere on the board for free: `targets()` builds
them from the settlement outward and has never consulted where the player is
standing. So this is not a new range. It is a price on the range they already
had, when it exceeds the country you can be heard in.

### The measurement, and what it cannot see

30 games a cell, seeds split. Win rates against Cities:

| | Cities | Mixed | Haunt | Bands |
|---|---|---|---|---|
| the batch + both rules | 43% | 47% | 77% | 67% |
| without `dreamWorks` | 37% | 47% | 77% | 67% |
| without `dreamTeach` | 43% | 53% | 77% | 63% |
| the batch alone | 40% | 53% | 77% | 67% |
| the old game | 53% | 40% | 17% | 10% |

**Every difference in the top four rows is inside the noise at this sample size**,
and the batch row reproduces OP-19's leave-one-out table exactly, which is the
check that matters: these two rules did not disturb anything.

That the win rates do not move is the expected result and not a disappointing
one. Both rules are about *when to spend a piece of yourself to save a journey* —
the same class as `taughtLoss` and `audible77`, which OP-19 recorded measuring at
exactly zero, and for the same reason. **A one-ply greedy chooser does not value
its own body.** It takes the free target when `free()` offers one and pays the
toll without noticing when it does not. See OP-01.

What the harness *can* see is the drain, and the drain is real and lands only on
the doctrines that teach. Whether the drain is a decision or a punishment is a
question for a person at the board — OP-21.

---

## 12. What opens a work

**Changed August 2026 as `taughtGates`, on by default.** The works open on
**settlements you have taught to till**: one for clearance, two for the colony,
three for the levy. The three numbers are sliders in the build and read in
teachings.

### What it replaced, and why it had to go

The old ladder was `strength = settlements past 150, plus one more for each past
800`, against 5 / 7 / 9. It was priced when a settlement could reach the old 2600
clamp. `logistic` moved both distributions underneath it and nothing announced
that: an untaught settlement is asymptotic to 150 and never counts at all, and a
taught one now tops out between 600 and 1000, so the 800 rung is nearly
unreachable.

Measured, 40 games a doctrine, with the batch on and the old ladder in place:

| Playing | Games where any work ever opened | First one at |
|---|---|---|
| Cities | 28% | year 33 |
| Mixed | 13% | year 33 |
| Haunt | never | — |
| Bands | never | — |

**The mean Cities game ended at strength 3.1 against a first gate of 5** — below
the bottom rung of a three-rung ladder — and the levy fired once in forty games.
§6's *you begin with none and gain them* had stopped being true.

### Why teachings and not something else

**[load-bearing]** `lostCount` already counts taught settlements. So this puts the
whole arc on one number running in both directions: **every teaching costs you a
wonder and buys you a work.** The row of chips empties from the left and fills
from the right on the same counter, and that counter is already printed on the
stat bar, so the gate is legible without anything being added to say it.

The alternative on the table — `landGates`, reading the unlock off tilled ground
— measured no better and cost a per-settlement unlock model. `registers/rejected.md`.

### What it did to the balance, 80 games a cell

| | Cities | Mixed | Haunt | Bands |
|---|---|---|---|---|
| the old game | 55% | 38% | 11% | 10% |
| the batch, old 5/7/9 ladder | 53% | 46% | 79% | 63% |
| **the batch, taught 1/2/3** | 50% | 34% | 55% | 34% |

Works open in 85% of Cities games and 91% of Mixed, first one about year 23, and
all three open in roughly two thirds of Cities games.

**Haunt 79 → 55 and Bands 63 → 34**, from restoring the settled side's late game
rather than from touching blessing. This is the largest single tuning lever found
so far and none of OP-19's stated knobs — `r`, the taught caps, the reckoning
budget — has been moved yet.

### What is deliberately unchanged

- **The per-settlement minimums.** `targets()` still requires 150 / 200 / 300
  people in the settlement that orders the work. One gate was moved at a time.
- **The costs in people**, 10% / 35% / 45%. A-13 priced them against a ladder that
  has now been replaced, and against works that in practice never opened.
- **A refusing doctrine still never opens a work**, at any threshold. Intended:
  the works are what the settled do. It does mean three of the nine chips are
  permanently dead for Haunt and Bands.

### The baseline is frozen, not scaled

`TUNE.t1/t2/t3` now read in teachings, so the pre-batch path in `civicOpen()`
uses its own fixed 5 / 7 / 9 rather than borrowing the sliders. `FG.R2all(false)`
therefore still plays exactly what §6 describes. A baseline that moves with a
slider is not a baseline — A-16, in miniature.


---

## 13. Splitting

**Current.** Built August 2026 as `FG.R2.split2`, and it is the first time this
act has done anything at all — see A-20.

Standing on a settlement of yours of **sixty people or more**, you may split it.
Half go over the rise and found a new place. The splinter is **born untaught**,
always: a split is the opposite gesture from a colony, which is born tilling.

**Where they may go.** Any tile **you have blessed**, at **path distance 2** from
the parent, that passes every founding test except the 85% one:

- not rock, water, a settlement, or a stone;
- **not beside any settlement** — which is what makes the answer exactly two, since
  distance 1 fails this by construction;
- no rival blessing within two tiles.

Path distance rather than ring distance (A-18): rock and water block, so a place
ringed by water has nowhere to send anyone, and a split can never leapfrog terrain.

**The price nobody wrote.** A settlement stands on wild ground, so founding the
splinter **spends that tile's blessing**. Splitting costs you a tile of your own
quiet country, permanently.

In the build, Split arms and waits for the tile, the way an intervention does.
It used to fire on the button and pick at random out of the one place it could
go — which was, in practice, nowhere.

## 14. Taking their ground

**Current.** Built August 2026 as `FG.R2.unmake`. See A-22.

**Wild country comes over to you. Country the other power has blessed goes back to
wild.** You unmake before you make: two visits for one tile.

Which of the two happens is decided by **presence**, not by which power you used:

| | in person | at range |
|---|---|---|
| **Bless** — under your feet | takes wild, unmakes theirs | — |
| **Quicken** — within arm's reach | takes wild, unmakes theirs | takes wild only |

*Creation at a distance, unmaking only in person.* A stone deep inside its own
blessed region is therefore genuinely hard to silence: the attacker has to walk
in, one ring a year, in the open.

Note the consequence for turn order. A-17's swing exists because Bless overwrote;
with the overwrite gone, the swing nearly disappears for Bands and halves for
Haunt — and grows for Cities. It has been redistributed, not removed.

## 15. Encirclement, and what is forbidden

**Current.** Built August 2026 as `FG.R2.encircle`. See OP-20 and A-23.

A settlement whose every neighbour **that is not rock or water** is blessed ground
of one single power that does not own it is **ringed**. Hold the ring for **two
years** and the place changes hands.

Rock and water count as part of the ring and need no blessing, so a coastal place
with three land neighbours is closed in by three tiles. Drown-then-encircle is a
conquest for a wonder and two acts, and that is deliberate.

**A ringed settlement does not go out to the fields.** It stops reckoning for as
long as the ring holds. Without this a taught place ploughed its besiegers into
farmland in one season, and blessing cannot be laid on farmland, so no siege of a
taught settlement could ever have succeeded.

**On capture the place is forbidden.** Both teachings, for good: it cannot be
taught to till or to kill again, by anybody. There is no choice offered — a
captured ringed-in place is always forbidden.

**What follows needs no further rule:**

- Its ceiling falls to Dunbar the moment it is untaught, so it **empties**, at up
  to 28% a year, from whatever it had grown to.
- The ones who leave become **refugee columns**, and they walk back to the country
  of the power that **lost** them — they are leaving over the plough, so they go
  where ploughing is still allowed. Forbidding a loud place makes the rival's next
  town bigger. **You cannot forbid your way to silence.**
- Nothing is credited for forbidding. `lostCount` counts taught settlements *you
  currently own*, so the wonder goes back to whoever lost the loud place — the
  same thing that already happens when a taught city is taken by levy.

**The counters.** Break the ring — one tile of your own blessing beside the place,
a Wither, or a Clearance ordered from another of your settlements onto a besieging
tile — and the fields resume the same year and the clock resets to zero. A mature
city cannot be ringed at all until its existing farmland has been Withered away,
which makes taking one a three-stage project across several years.

## 16. The third leg — herds, and what they leave behind

**Built August 2026 as `FG.R2.herds`. It shipped off for one day and is now ON**
— see OP-12, and see §17, which is the commit that turned it on along with
everything else. It was off because nobody had played it; it is on because Rick
asked for every rule to be running by default, which is a different and better
reason than a measurement, and the measurement was a flat null anyway.

`FG.R2.barren3` was half-built alongside it and is **also on now**. Barren ground
exists in the engine and grazing writes it whatever this flag says; the flag
governs only whether *Wither* writes it too, and it does.

### Teaching them to herd

A third entry in `FG.TEACH` beside *till* and *kill*, and it inherits everything
§11 and §12 built: taught per settlement, in person or down the stone network at
the same 10% toll, one thing only about how a people live.

It is refused to a settlement that has already been shown the plough, refused to a
forbidden place, and **it is not on offer at all until somebody, somewhere on the
board, has broken ground.** That is a condition and not a clock — `rejected.md` cut
the reverse tech tree because a timer is weather. It is also the right history:
herding is a secondary product of farming and not a stage before it.

**It costs no wonder, and it earns no points.** That pairing is the whole safety of
the rule and neither half works without the other. `lostCount` counts settlements
taught to till, and a herd is not a settlement at all, so nothing is taken from
you: they were never shown the plough, they still hear you, nothing about you has
gone quieter. And nothing is given either — a herd holds no ground and `score()`
never sees it. **They deny; they do not accumulate.**

What it does cost is the three points the place was worth, everything it would
have grown into, and most of the people. A herd's ceiling is `kHerd` = **77**, the
Seventy-Seven, and a village that has been standing a while is above it, so the
surplus walks away over the following years. Going nomadic costs you most of a
town, and nothing had to be written for that.

### How they move

Neither of the two movement rules the game already had.

§7 says the player's movement rules do not apply to mortals, and that is still
true of levies and refugee columns: they cross anything but rock and water. A herd
moves **the way you do, minus your own country**. Rock and water block. A
settlement blocks — you cannot graze a town. And **the other power's blessing
blocks**, because a people who were never shown the plough can still hear, and
what a people can hear they can be shut out of. Their own god's blessing never
blocks them, which is what keeps §2's self-walling problem out of it.

Farmland is wide open. That is the point of the entire mechanic.

One tile a year, toward a standing order. **Steering costs nothing** — not the
act, not the intervention, no toll, at any range. A herd is the one thing in the
game you never lose touch with, and that is the compensation for their counting
nothing.

|  | beats | how |
|---|---|---|
| Farmland | blessing | §1's ratchet — furrows erase the quiet beside them |
| Herds | farmland | they overrun it and graze it back to thorn |
| Blessing | herds | a rival power's blessing is closed country to them |

### Grazing, and barren ground

Each year, the tile a herd is standing on — and only that one, because a ring
would be locusts and this is a people. If it is farmland it goes back to **wild**,
not over to you. They are undoing the plough, not performing your miracle: somebody
still has to walk out there afterwards and bless it. The herd unmakes and the god
makes, which is §14's line running through mortals.

And it will not take a furrow again for **three years**. Nothing may reckon barren
ground: not a settlement's year-end spread, not a Clearance. Without that the
settled side re-ploughs next season and grazing is one year of tempo. With it, and
with the thirty-tile lifetime budget of §4, **grazed ground is lost twice** — once
when the furrows go, and again when re-ploughing spends a tile of a settlement's
thirty that it had already spent. The second cost is invisible and permanent.

A tile refused for barrenness is not charged to the budget, so a settlement whose
ring is grazed bare keeps its remaining tiles and spends them again later.

### Stopping

A herd stops when you tell it to — an act, done standing on it, because every
founding in this game happens under your feet — or automatically when it has no
road anywhere and the ground allows it. It comes back as an ordinary settlement,
**untaught**, with what the grass was carrying.

Everything §3 asks of a founding is still asked except the blessing, which is
waived exactly as a colony waives it: the people are already there, and what they
need is somewhere to stop, not a country.

**This is the answer to the one way this rule goes wrong.** If herding let a
player expand without ever teaching the plough, the trade the whole game is built
on could simply be declined. It cannot. Herding is not a door out of the dilemma,
it is a **detour**: you may walk around the fork for twenty years and you arrive
at the same fork, with fewer people and nothing scored in between.

A camp blocks a founding, a colony, a splinter, a Drown and a Raise mountains, in
the same way a settlement does. The herd itself is the single exception, when it
is the one stopping.

### Kurgans

A herd standing on farmland over a stone **of its own god** that has already
stopped working may raise a mound. It costs a fifth of them and the year.

The ground stays reckoned and stays whosever it was. That is load-bearing: if
raising a mound cleared its own tile, herding would be a permanent tile-conversion
engine with a monument bolted on, and the rule would be about score rather than
about memory. **A mound in a field** is the whole image.

What changes is that the stone counts as *standing*. It never works, never
blesses, nothing targets through it, and it never feeds the wonder brake. One
grave to a stone.

OP-16 measured that 92% of stones end under farmland and that it is irreversible,
because reckoned ground cannot be walked to and so cannot be blessed back. This
does not reverse it. It makes it mean something, which is the better answer:
**working stones carry presence, dead stones carry orders, buried stones carry
memory.** A refuser cannot have their shrines back as engines and can have them
back as graves.

`moundCount` is tracked and shown and gates nothing. It is there for OP-15's
*Forgotten*, which is the ending this rule is for and which does not exist yet.
**If that ending never gets written, this half of the rule is decoration and
should be cut.**

### What the harness can say about it, which is very little

Eighty games a cell against Cities, the build's own turn order:

| | cities | mixed | haunt | bands | storm |
|---|---|---|---|---|---|
| the game as it ships | 34% | 36% | 54% | 29% | 63% |
| + herds | 34% | 36% | 54% | 29% | 61% |
| + barren3 (Wither only) | 39% | 44% | 50% | 26% | 66% |
| + both | 39% | 44% | 50% | 26% | 66% |

The first row reproduces §10's table exactly. The second row is the finding:
**turning the rule on moves nothing at all.** The four standing doctrines are
identical to the digit, and `storm` — the herding doctrine — wins 63% without the
rule and 61% with it.

That is the expected result and not a disappointment. Over 300 games across every
doctrine pairing the greedy chooser taught herding 1.65 times a game, grazed 2.3
tiles, spent **more than half of every herd-year standing still**, settled a herd
again once, and raised **zero** kurgans. A one-ply chooser cannot decide that a
place is worth more walking than standing, will not drive a people four years
across the board to reach a city's fields, and never rings anything on purpose.
OP-19 recorded `taughtLoss` and `audible77` measuring at exactly zero for the same
reason. OP-21 is the instrument for this, and it exists.

`barren3` is a different matter — it moves four numbers and it is not this rule.
It is off, unmeasured beyond that row, and it is its own question.

---

## 17. Stones that grow, orders that carry, and the bottom of the stock

**Built 25 August 2026, four rules in one commit, and all four ship on** — as does
everything else in `FG.R2` that is built. This is the section that describes the
game as it currently is; §§1–10 are the pre-batch rules and §§11–16 are the
batches before this one.

### 17.1 A stone grows while it is heard — `stonesGrow`, 1.20

A stone gains a **course** — one a year, three at most — while an untaught
settlement under seventy-seven, or a herd, stands within its reach. The same
people §11's *audible* rule reads, through one predicate, because two copies of
*few enough and untaught enough* is how these come apart.

**What a course buys is the working threshold, not reach.** A stone needs six
connected blessed tiles to still answer; each course takes one off that, down to
three. An old stone remembers a larger country than it now stands in, so severing
a blessed region hurts an ancient stone less than a new one.

Three consequences, and they are why it is this shape rather than another:

- **Teach that band to till and the stone stops.** Nothing enforces it. A taught
  people are counting the fields, not listening, so the stone is arrested where it
  stood and stays visibly unfinished for the rest of the game. The thesis fits
  inside one object you can see from across the board.
- **Farmland still wins.** A stone under the plough stands in no blessed ground, so
  its region is zero and three courses do not save it. OP-16's 92% is untouched,
  which is correct: the shrine ploughed under is the thesis.
- **It may not feed the wonder brake, and does not.** `lostCount` reads
  `workingStrict` — the plain six — while every other caller reads the augmented
  test. The two functions sit next to each other in `rules.js` with the reason
  written between them. **[load-bearing]**

The courses are drawn: a stepped plinth under the stone, one slab a course, and
the stone rides up on what has been built to it.

### 17.2 A stone that has gone quiet still carries orders — `deadOrders`, 1.21

**Working stones carry presence, dead stones carry orders.** A stone of yours below
the working threshold used to do nothing at all. A **work** — clearance, colony,
levy — aimed within **two tiles** of one now arrives free of §11's toll.

It is a change to one predicate and nothing else. It does **not** extend the reach
of the works themselves; `targets()` still builds those from the settlement
outward. It extends the country an *order* arrives in. Creation still travels
through living stones alone: a dead stone relays no wonder and teaches nobody.
**[load-bearing]** — that sentence is the rule, and widening it to teaching would
make the whole of §11 free.

A **kurgan is not a relay.** Raising a mound over a dead stone closes the order
network for good, which is the only cost a mound has ever had.

The reason to want it is what severance now does. Cutting a blessed region used
only to subtract. It now *converts* you, from a god into an administration.

### 17.3 The wild folk found the place — `wildFolk`, 1.22

A founding is **20 to 40 people**, by how much of the eighteen tiles two rings out
is blessed ground of yours. Rock, water and the edge of the map count in the
denominator and never in the numerator, so a coastal founding starts smaller than
one in the middle of a country.

**Found only.** A colony keeps its forty, a splinter is half its parent, and a herd
that stops is whatever the grass left of it. Those are people who came from
somewhere; this rule is about the ones who were always here.

There is **no pool and nothing to spend.** The number is read once, at the moment
they stop moving, and never again — which is what keeps `concept/concept.md`'s *no
economy to manage* true. §3's 85% requirement stops being an arbitrary gate and
becomes the statement that the people were already there.

### 17.4 Spent to nothing, you may only watch — `zeroSpent`, 1.23

**There is no floor.** At nothing left of your manifestation you cannot move, act,
teach, order or intervene. The year still turns, the score still accrues, the
stones still bless, and your people still plough and march and graze. **The game
does not end. Your part in it does.** **[load-bearing]**

§11's slope is unchanged above that: three tiles at full, two at two thirds, one
at a third. What has gone is the floor of one, which was the punishment reading.

**Both powers thin toward transparency** as their manifestation falls, wherever
`fade` is on. At a tenth you are a phantom standing in a field, and so is the other
one. That drawing is half the rule — a percentage in the corner of a bar is not a
thing anybody feels.

It is a decision because it is visible before it is spent, and because nothing puts
any of it back: **you can time the sacrifice of yourself.**

### 17.5 One change to the chooser, recorded rather than slipped in

`free()` in `ai.js` now **declines** a tolled target near the bottom of the stock
rather than falling back to it, keeping two tolls in reserve.

Before it, seat 1 spent itself to nothing in **27 games out of 100** and stood
paralysed for the rest of them, which moved every number in the table below for a
reason that has nothing to do with any rule in this batch. Like the fallback it
extends, it is deliberately not an improvement in judgement: it does not weigh the
last tenth of a body against the work it would buy, which is exactly the decision
17.4 exists to hand a player. See OP-01, which this does nothing to fix.

### 17.6 Measured

Five doctrines against Cities, 80 games a cell, the build's own turn order.

| | cities | mixed | haunt | bands | storm |
|---|---|---|---|---|---|
| **the game as it ships** | **39%** | **45%** | **55%** | **41%** | **68%** |
| less 1.20 stones grow | 39% | 43% | 54% | 43% | 66% |
| less 1.21 dead orders | 38% | 36% | 59% | 40% | 74% |
| less 1.22 wild folk | 38% | 43% | 54% | 30% | 64% |
| less 1.23 zero spent | 38% | 43% | 55% | 39% | 69% |
| less 1.19 herds | 39% | 45% | 55% | 41% | 68% |
| less 1.12 barren3 | 38% | 45% | 53% | 43% | 69% |
| the batch before this one | 40% | 38% | 55% | 28% | 69% |
| the pre-batch game | 55% | 38% | 11% | 10% | 55% |

**Read the bottom two rows first.** Bands has gone from **10%** in the game
`design/rules.md` §§1–10 describes, to 28% after the August batch, to **41%** now.
OP-06 asked for *a magical victory should be possible, and hard*, and 41% against
the strongest settled doctrine is that sentence.

Two rules do the work and neither is the one that was expected to:

- **`wildFolk` is worth eleven points to Bands** and four to Storm. It was proposed
  as *mainly cosmetic*. It is A-09's *make blessing worth more*, arriving in a
  thematic form rather than as a tuned constant.
- **`deadOrders` is worth nine points to Mixed** and costs Haunt four. It is a
  settled-side rule landing precisely on the settled side, which is the first time
  anything in this project has managed that on purpose.

**`stonesGrow` and `zeroSpent` measure at nothing, and both nulls have the same
cause.** Both are about a decision a one-ply chooser cannot make — severing a
region on purpose, and choosing when to spend the last of yourself. `taughtLoss`
and `audible77` measured at exactly zero for the same reason and shipped anyway.
OP-01 is why; OP-21 is the instrument.

Supporting measurements, over 60 games across five doctrines: **225 foundings, min
24, median 31, max 40, mean 31.1** — the mean founding is what the flat constant
always was, so nothing has been handed out, and *where* now decides how it starts.
**242 stones raised, mean 1.35 courses, three reached.** A power spends itself to
nothing in **17 of 60 games, at a mean of year 33, never before year 24** — a
last-quarter event and not a mid-game collapse.

`sim/smoke.js` at **11,924 checks**, all passing, including a constructed-board
block for all four rules and both A/B fingerprints re-frozen. `sim/sweep.js` is
new and produces the table above.
