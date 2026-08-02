# Rules — as currently implemented

This describes `game/index.html` exactly. Where a number appears here it is a
tuned value, not a principle; nearly all of them are exposed as sliders in the
build so they can be argued with. Where a rule is a *principle* rather than a
number, it is marked **[load-bearing]**.

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
| Send a colony | strength 7 | Found a settlement 3 tiles out, on any ground, ignoring the blessing requirement | 33% |
| Raise a levy | strength 9 | An army forms and marches | 45% |

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

---

## 10. Current balance

Measured over ~40 games per matchup at 40 turns, against the Cities doctrine:

| Playing | Wins |
|---|---|
| Bands | ~33% |
| Haunt (pure blessing) | ~42–56% |
| Mixed | ~47–50% |
| Cities (mirror) | ~53–61% |

Everything within roughly 30 points, with no strategy dominant and hybrids viable.
This is the healthiest the design has been. It is also produced by a greedy
one-ply AI, which is the largest caveat attached to any of these numbers.
