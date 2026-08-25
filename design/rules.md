# Rules — as currently implemented

This describes `game/index.html` exactly. Where a number appears here it is a
tuned value, not a principle; nearly all of them are exposed as sliders in the
build so they can be argued with. Where a rule is a *principle* rather than a
number, it is marked **[load-bearing]**.

> **This document is now behind the game, and by a whole rule set. Read this box
> before you trust anything below it.**
>
> `FG.R2` in `engine/constants.js` holds the August 2026 batch — OP-19 and
> OP-20 — and **as of the 1.16 commit the eight built rules in it are on by
> default.** Rick played the batch across several games and reported it a clear
> improvement, which is the evidence class this project ranks above the matrix
> for anything about choices. So the batch stopped being a candidate and became
> the game, and the numbered sections below stopped describing it.
>
> What is still exactly true: `FG.R2all(false)` plays what is written here, and
> the A/B is asserted in `sim/smoke.js`. What is no longer true, section by
> section — §4's population thresholds and growth (now logistic, and capped by
> teaching), §5's wonder trigger (now teaching, not 150), §2's impassable
> farmland (now walkable at a toll), and §6, which has gained the teachings and
> the two rules in §11 below. **§10's balance table is the old game's.** The
> current one is in OP-19.
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
