# Triage — gameplay batch, August 2026

**Temporary working file.** Not one of the four registers. Everything here is
settled in *argument* and unsettled in *measurement* — nothing below has been
simulated. When the rows have been folded into `open-points.md`, `design/rules.md`
and `ideas.md`, delete this file.

The batch turned out to be one change wearing fifteen hats. §1 states it as a
single design; §2 records the row-by-row disposition it came from; §3 lists what
is still open; §4 says where each piece goes.

---

## 1. The design that came out of it

### 1.1 The intent

- **A magical victory should be possible, and hard.** Not viable-in-principle —
  actually winnable a reasonable share of the time. OP-06 restated as a goal
  rather than a measurement.
- **Going agricultural is a conscious, per-settlement choice**, not a threshold
  the player drifts across.
- **150 is the Dunbar number.** Untaught, that is where a settlement stops.
- **~1000 is the ceiling** for a taught one — early Bronze Age maximum.
- The AI opponents are **gods with theologies**. A refuser simply never teaches,
  and the dropdown in §9 stops being a mechanical label.

### 1.2 Growth becomes logistic

Replace `pop × (1 + growth × fertility × landFraction)` and the 2600 clamp with

```
pop × (1 + r × (1 − pop/K))
```

`r` rises to roughly **0.30–0.35** to compensate for logistic slowing the early
years. The shape is a fast start and a long plateau, which is both the Bronze Age
and what the mid-game sag needs.

**`K` is where terrain now lives, and it splits in two:**

| | Cap | Why |
|---|---|---|
| **Untaught** | **150, flat, every terrain** | Dunbar is a cognitive and social limit. Crop yield has nothing to do with it. |
| **Taught** | **plain 1000 · forest ~800 · hill ~600** | Crop yield. Defensible, and it makes the teaching decision read the map — you teach the plains and leave the hills wild. |

Because these are ceilings rather than compounding rates, the numbers can be far
apart without the runaway D5 was complaining about. Fertility comes off the growth
rate entirely.

This one formula absorbs **D1** (late growth flattens), **D2** (the oscillation at
Dunbar falls out with no special case), **D5**, and the 2600 clamp.

### 1.3 Teaching

Two teachings, each an **intervention**, each requiring **physical presence** at
the settlement, each a per-settlement conscious choice.

**Teach tilling the land.** Raises `K` from 150 to the terrain figure. Only a
taught settlement reckons ground. **Teaching is what costs you a wonder** — see
1.4.

**Teach killing.** Gates the levy, and nothing else. Optional in practice: a
refuser never teaches it and never levies, so it is not a chore. Wanted chiefly for
the chronicle, where it must read as something **you** caused.

**Inheritance:** a **colony inherits** its parent's teachings — it is a work of the
settled and is born tilling. A **splinter does not** — a split is the opposite
gesture, and is how you un-teach.

### 1.4 The wonder trigger moves from population to teaching

Today: `lost = max(0, settlements≥150 − workingStones)`.

Now: **you lose your greatest remaining wonder the year you teach a settlement to
till.** Population stops being a threshold anywhere in the rules.

Two reasons this is the keystone rather than a tidy-up:

- Under 1.2, untaught settlements sit at 150. Against a population trigger they
  would flicker across it every year and the wonder ladder would jitter.
- The fiction improves. You are not deafened because there are a lot of them. You
  are deafened because you taught them to count the fields, and you did it with a
  click.

### 1.5 The Seventy-Seven gets teeth

§4 currently calls 77–149 *"the regret zone: past magic, not yet useful"* and it
means nothing mechanically — band and village differ by a label.

**A settlement under 77 passively blesses adjacent ground each year**, like a
living stone.

Without this the whole model has a hole in it: an untaught settlement scores 3,
exactly what the blessed tile it replaced scored; founding sets `st = "wild"`,
which **severs your blessed region**, and `region()` is what stone power reads, so
every settlement halves the stones near it; it does not reckon; and it can be
encircled and taken. A purely magical player should therefore found *zero*
settlements, which makes Bands strictly worse than Haunt and makes the teaching
decision moot, because you would never have anything to teach.

With it, the untaught band is the magical side's compounding engine, it does not
touch the stone cap, and `concept/lore.md` is stated mechanically: they hear you
because they are few and the country is quiet.

### 1.6 Split becomes the magical expansion move

Its old job — keeping settlements under the 150 wonder threshold — is deleted by
1.4. Its new job is **keeping them under 77 so they keep blessing**, and logistic
growth toward K=150 means a settlement drifts past 77 unless you act. A recurring
decision every few decades, never quite the same. This is *fission as the central
choice*, listed in `ideas.md` as designed-but-never-built.

**Split now behaves like a colony:** it may target any tile you have blessed
within **path distance 2** — two tiles, and a road to get there — without the 85%
founding requirement. The splinter is untaught.

Path distance rather than ring distance, consistent with 1.11: water and mountains
constrain your own fission exactly as they constrain founding, so a drowned channel
walls off your expansion as well as their levy. Split cannot leapfrog terrain.

### 1.7 Movement

One model rather than two rules:

| Ground | Cost |
|---|---|
| Your own blessing | 3 tiles a year |
| Wild | 1 tile a year |
| Reckoned, either side | Enterable at **10% of your corporeal being per turn**, permanently |

The third row is **OP-14**, already in the register with its sub-questions worked
out — cliff or slope, and what happens at zero. Adopt OP-14; do not restate it.

### 1.8 Blessing and Quicken

**Taking the other power's blessing returns it to wild, not to you.** Two visits to
take a tile. No fractional state, and it reads right — you unmake before you make.

This is OP-16's adopted-but-unbuilt decision, and it may make the Quicken reach
change unnecessary: if unmaking requires presence, Quicken at range can only take
**wild** ground, which is the principle OP-16 already states — *creation at a
distance, destruction only in person*. Cutting the reach as well is, net, a nerf to
the magical player, since Quicken is the last wonder lost and the player who
teaches fewest settlements keeps it longest. Measure before cutting.

### 1.9 Encirclement as a second path to conquest

A settlement completely ringed by one power's blessing changes hands after about
two turns.

Deliberately cheap, and deliberately cheaper on a coast: a settlement with three
land neighbours needs three blessed tiles, not six, so Drown-then-encircle is a
conquest for a wonder and two acts. **Accepted** — the opponent got the settlement
cheaply too, and this is the magical path to conquest the design lacked.

### 1.9a Conquest by a god, and conquest by people

The two routes to taking a settlement now differ in *what they can change*, not
only in how they are paid for:

| Route | What transfers |
|---|---|
| **Levy** — people take it | Ownership only. It keeps what it knows. |
| **Encirclement** — you take it | Ownership, **and a decision.** |

On encirclement the player is asked, once, whether tilling and killing remain
permitted in this place or become **taboo**. Nothing else in the game asks a
question this way; it is a consequence rather than an act, and should not cost the
year's intervention.

**The line underneath it: people move ownership, gods move knowledge.** It is the
same asymmetry as 1.8 — creation at a distance, unmaking only in person — extended
from ground to what the ground knows.

Three consequences, none of them decoration:

- **This is the only un-teaching in the game**, other than a splinter being born
  untaught. The god acquires a verb it did not have: *forbid*.
- **Forbidding returns the wonder that teaching cost.** See 1.9b.
- **`K` falls from the terrain figure back to 150, and the town empties down to
  it** — the people leave as refugee columns. See 1.9c.
- **The taboo is permanent.** Once a place is forbidden it stays forbidden, and
  neither power can teach it again. Not a contested state that flips; a thing that
  was decided about a place, once, by a god. If a later iteration wants it
  reversible, that is a change to make deliberately.

### 1.9b Forbidding returns the wonder

Teaching costs the greatest remaining wonder (1.4). **Forbidding gives one back.**

This is what makes taboo a real option rather than a curiosity — without it you
would be trading a city for a hamlet and getting only the hamlet. With it,
encircle-and-forbid is the arc played backwards: you take a loud place, you make it
quiet, and you can hear again. It is the additive late-game move OP-03 has been
asking for, and it is `ideas.md`'s *a wonder that restores a lost wonder, once, at
enormous cost* — except the cost is a siege rather than a number, which is better,
and the permanence of the taboo is what stops it being repeatable.

**This forces the `lostCount` refactor, and forces it first.** Today it is
`max(0, settlements≥150 − workingStones)`, recomputed from board state on every
call. Teaching is an *event* and forbidding is an event running the other way, so
the count becomes a stored quantity on the player. It is required by 1.4
regardless; 1.9b only makes it non-monotonic as well.

Two details that follow:

- **Which wonder comes back?** `divineLeft` slices from the front of a fixed order,
  so returning one restores the *most recently lost* — the smallest gesture first,
  Quicken before Wither before Bad omen. Raising mountains is the last thing you
  get back, having been the first thing you lost. That is the right order and it
  costs nothing to implement.
- **Working stones already offset the count.** A god at full wonders who forbids a
  place should not go above six. The counter clamps at zero.

### 1.9c The forbidden city empties

`K` drops from the terrain figure to 150 and the population falls toward it. The
raw logistic multiplier goes badly negative — a city of 800 against `K` = 150 at
`r` = 0.32 gives `1 + 0.32 × (1 − 5.33)` ≈ **−0.39**, which is not a population.

**The people who leave become refugee columns**, using the machinery §7 already has
for *Bad omen*: they walk one tile a year toward the nearest friendly settlement and
add their number on arrival. A forbidden city empties over several years rather than
vanishing in one, and the emptying is visible on the board as people on the road.

The decline wants a floor of roughly 25–30% a year, so a city of 800 takes six or
seven years to fall to Dunbar. Number to be measured, not decided here.

The second-order consequence is the good one, and it is already documented in §7 as
the best emergent interaction in the build: **the arrivals push another settlement
past a threshold.** Forbidding one place makes another one loud. You cannot forbid
your way to silence.

### 1.10 Unlocks

The double gate goes. Today a work needs both a per-settlement population
(150/200/300) **and** a board-wide ladder `strength = settlements≥150 +
settlements≥800` at 5/7/9. That is not fun and it is not legible.

| Work | Now unlocked by |
|---|---|
| Clearance | the settlement's radius-1 ring is tilled |
| Send a colony | radius-1 ring + 2 further tiles |
| Raise a levy | killing has been taught |

**A-13 needs re-checking**, because the works' population costs were priced against
the ladder that is being removed.

### 1.11 `blessFrac` counts path distance

Not ring distance, and no special case for mountains. Mountain shields fall out for
free, and so does the Drown interaction — cutting the map now shrinks founding
requirements on the far side. Note it gates two things: founding at 85% **and**
Raise mountains at 70%.

### 1.12 Withered ground stays barren three turns

The immediate effect is currently unnoticeable — reckoning resumes the next
`worldTick`. Three turns minimum. The permanent cost already in the code stays:
re-reckoning re-spends the settlement's 30-tile lifetime budget.

### 1.13 Stones

- They do not break. **Already true** — a dormant stone stays in `FG.G.stones`
  forever. Rendering only: keep the glow in blessed land.
- Under agriculture a stone is **repurposed** — a thatched roof, like Roman ruins
  in the Middle Ages. Purely visual, and the common case: 92% of stones end under
  farmland.
- Reawakening a repurposed stone: **passed for now.** Blocked on OP-14 regardless.
- "Look at the function of stones" stands as a reminder. Three jobs today: blessing
  engine, wonder brake, targeting network. → OP-13.

### 1.14 A settlement's tile colour follows its teaching

Today `game/ui.js:254` reads `if (t.set) fill = P.reck;` — *"a settlement stands in
its own fields"* — so every settlement is farmland-ochre from the year it is
founded, including one that has never tilled anything.

**A settlement tile takes the blessed colour until it is taught, and the reckoned
colour afterwards.** The single most legible thing on the board becomes the
decision the whole game is about.

Three sites in `ui.js`, not one:

| Line | Today | Wants |
|---|---|---|
| 254 | `if (t.set) fill = P.reck` | blessed fill unless taught |
| 279 | `if (t.st === "reck" \|\| t.set)` — draws furrows | furrows only if taught |
| 297 | `if (blessed && !t.set)` — excludes settlements from sparkle | untaught settlements sparkle |

Consistent with §"Fill is the land. Border is who holds it." — the fill says what
kind of place it is, and an untaught settlement is not a farm.

---

## 2. Row-by-row disposition

| # | Point | Outcome |
|---|---|---|
| A1 | Movement 3 inside blessing, 1 outside | **Keep** → 1.7 |
| A2 | Presence required to teach | **Keep**; reckoned ground enterable at 10%/turn → 1.7, **OP-14** |
| B1 | Quicken's reach is too long | **Probably unnecessary under B2** → 1.8. Not much of an issue in any case; early game only |
| B2 | Quicken must not convert enemy blessing | **Agreed — enemy blessing returns to wild** → 1.8, **OP-16** |
| B3 | The "half" variant | Subsumed by B2 |
| C1 | Encirclement flips a settlement | **Keep, and keep it cheap** → 1.9 |
| C1a | What a conquered settlement keeps | **Levy: keeps everything. Encirclement: the god chooses whether tilling and killing become taboo** → 1.9a |
| C1b | What forbidding is worth | **Returns the wonder teaching cost. The people leave as refugee columns. The taboo is permanent** → 1.9b, 1.9c |
| C2 | Mountains as shields | **Settled — path-distance `blessFrac`.** Archive → 1.11 |
| D1 | Settlements grow too fast | **Holds** → 1.2 |
| D2 | Agriculture must be taught | **Per-settlement conscious choice**, colonies excepted → 1.3 |
| D3 | Killing must be taught | **Necessary, and better gameplay.** Levy gated on it → 1.3, 1.10 |
| D4 | Mid-game 20–30 is dead | **Double gate removed** → 1.10 |
| D5 | Tile type matters too much | **Off the rate, onto the ceiling** → 1.2 |
| D6 | Farmland returns too fast | **Three turns barren**; permanent cost stays → 1.12 |
| E1 | Stones shouldn't break | **Agreed, already true.** Rendering → 1.13 |
| E2 | Repurposed stones | **Visual, and worth doing** → 1.13 |
| E3 | Reawakening | **Passed** |
| E4 | The function of stones | Still a reminder → OP-13 |
| F1 | Settlement tile colour | **New this pass** → 1.14 |
| — | Wonder trigger | **Moved from population to teaching** → 1.4 |
| — | The Seventy-Seven | **Given a mechanic** → 1.5 |
| — | Split | **Kept, rebuilt as the magical expansion move** → 1.6 |

---

## 3. Still open

### 3.1 Whether split kills Found

**Radius settled — path distance 2, see 1.6.** What that does not settle: with no
85% requirement, split is better than Found in almost every case where it is legal
at all, and Found survives mainly as the move that creates your *first* settlement
in a region. That may be the correct shape — Found expensive and deliberate, split
ordinary — but it should be chosen rather than discovered.

Also worth counting: a magical player splitting repeatedly seeds under-77 blessing
engines across the map, each blessing every year for free. That is a strong
compounding engine and the whole point of 1.5, but nobody has measured it.

### 3.2 How strong is encircle-and-forbid?

**All three questions settled — see 1.9a, 1.9b, 1.9c.** The wonder comes back, the
people leave as refugee columns, the taboo is permanent.

What is not settled is whether it is *too good*. A magical player who can take a
loud city and recover a wonder has an engine the design has never had, and the
permanence of the taboo is the only thing limiting it — you can forbid a given
place exactly once, but there is no limit on the number of places.

Watch for: a late game spent entirely on encirclement, a wonder count that never
falls, and whether the refugee arithmetic in 1.9c actually bites. Measure before
adding a cap; the mechanic may limit itself on the cost of the siege alone.

### 3.2b Does forbidding un-reckon the ground?

Probably not — that is what Wither is for, and free reversal would make the taboo
strictly better than a wonder. The settlement simply stops reckoning, and what it
already ploughed stays ploughed. But it is not obvious, and the visual in 1.14 has
to say which way it went.

### 3.3 Does the under-77 blessing need a rate limit?

A stone blesses one tile a year. A band presumably should too, rather than its
whole ring. Undecided.

### 3.4 Your own bands are the encircleable ones

An untaught settlement never reckons, so it never breaks its own ring — and under
1.6 you will have many of them. The saving grace is that a rival must physically
walk around one, through your blessing, which is impassable to them. Probably fine.
Worth measuring rather than assuming.

### 3.5 Every number above is unmeasured

`r`, the three taught caps, the encirclement delay, the barren delay, split's
radius, and the three unlock conditions. The working method in the README says the
simulation comes before the UI, and none of this has been simulated.

---

## 4. Where it goes

| Destination | Rows |
|---|---|
| **`design/rules.md`** — once measured | 1.2, 1.3, 1.4, 1.5, 1.6, 1.10, 1.11, 1.12 |
| **OP-14** — adopt, do not restate | 1.7 |
| **OP-16** — adopted and unbuilt; this is a build order | 1.8 |
| **OP-17** | 1.13, 1.14 |
| **OP-13** | 1.13's last line |
| **New open point** — encirclement, and the taboo | 1.9, 1.9a, 1.9b, 1.9c, 3.2, 3.2b, 3.4 |
| **New open point** — the settlement model as a whole | 1.2–1.6, 3.1, 3.3 |
| **Archive** | C2 → 1.11 |
| **`ideas.md`** — mark as now built | *fission as the central choice* |
| **Re-check** | **A-13**, priced against the ladder 1.10 removes |

## 5. What this does for OP-06

More than any tuning has. Teaching-as-explicit-choice makes a doctrine a theology
expressed as a decision the player can watch someone decline: a refuser AI never
teaches, and its settlements sit at Dunbar forever, blessing the country around
them. That is `concept/lore.md`'s disagreement made mechanical for the cost of one
boolean per settlement, and it is the first version of the dropdown where the
labels mean what they say.
