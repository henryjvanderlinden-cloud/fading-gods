# Open points

Live register. Things genuinely unresolved. When one is settled, move it to
`open-points-archive.md` with the answer and the evidence.

Format: `OP-nn` · severity · the question · why it matters · how it would be settled.

---

## OP-01 · high · The rival AI is one-ply greedy

Every balance number in `design/rules.md` was produced against an opponent that
picks the highest-scoring immediate action with a little noise. It never plans, never
defends, never keeps a wonder in reserve. A better AI could invalidate all of it.

Now larger than it was. Since OP-02 was settled the same one-ply chooser plays
*both* seats in the matrix, so every number in §10 is one greedy AI against
another. It is the only remaining reason to doubt those numbers, and there is no
longer anything else to blame.

**Settled by:** writing a two- or three-ply search, or a scripted "expert" line per
doctrine, and re-running the matrix. Expect the numbers to move.

## OP-03 · high · Does being walled in feel like an ending or like confiscation?

At forty turns with hard walls, late-game reachable area falls to single digits and
13% of turns leave four tiles or fewer. Simulation says you are almost never fully
stuck. But "not stuck" as a number and "not stuck" as a feeling are different
things, and this is the emotional payload of the whole design.

**Settled by:** three full games, paying attention to the last ten turns
specifically. If it feels like the game taking your toys away, the fix is probably
that the *works* need to open faster so there is more to do late.

Two candidate fixes now exist that leave the ladder alone: **OP-13**, which makes
works reachable rather than earlier, and **OP-14**, which makes the walls passable
at a permanent price. Both are better answers than opening the works faster,
because neither disturbs the costs settled in A-13.

**Two answers arrived together in the August 2026 batch, and one of them is not a
fix to this question but a reversal of it.** OP-14 is adopted — reckoned ground
becomes enterable at 10% of your manifestation a year — so the walls are priced
rather than absolute. And OP-20 gives the late game something **additive**: taking
a loud city by encirclement and forbidding the plough returns a wonder you had
already lost. If the last ten turns are a decade spent getting one thing back, this
question answers itself. If they are a decade spent watching a counter, it does
not. See OP-19 and OP-20.

## OP-04 · medium · Is the wonder → work trade actually felt?

The intended moment is: *I would rather have had Drown back than the levy I used
instead.* If that thought never occurs, the ladder is just a power curve wearing a
costume.

**Settled by:** playing and noticing. If it doesn't land, candidate fixes are
fewer works, or works that are situationally weaker than wonders rather than
strictly later.

## OP-05 · medium · Mid-game sag

Identified as a risk long before the current design and never actually tested.
Early game is direct and legible, late game has armies and works. Years 12–25 may
be flat.

**Settled by:** noting which turns you act on instantly. A turn with no hesitation
is a turn with no decision in it. Map where they cluster.

**Diagnosed, August 2026, and it was worse than a sag.** The works are
**double-gated** — `targets()` checks a per-settlement population of 150 / 200 /
300, and `civicOpen()` *also* checks a board-wide ladder
`strength = settlements≥150 + settlements≥800` at 5 / 7 / 9. Two gates that both
count population, neither of which the player can read off the board.

**OP-19 removes both**, and pegs the unlocks to land and teaching instead:
clearance when a settlement's radius-1 ring is tilled, colony at that ring plus two
further tiles, levy the year killing is taught. Population becomes a growth story
rather than a gate, and every unlock becomes something you can see.

**This puts A-13 back on the table.** The works' population costs — 10% / 35% /
45% — were priced against the ladder that is being removed. Re-measure them.

## OP-06 · high · Does an ascetic strategy ever win?

**Raised from medium.** Re-measured against the game itself, Bands wins 8% against
Cities and 24% across all matchups; Haunt, the pure-blessing line, wins 13% and
40%. The old figures of 33% and 42–56% came from a simulator that was not this
game. Cities wins 78% of everything it plays.

### What this question actually is

Reframed by `concept/lore.md`, and larger than it looked. The powers disagree
about whether settling should ever have been allowed — refusers against convinced
— and a doctrine is that disagreement expressed as a strategy rather than a
mechanical label.

Which makes the table in §10 **the game's own verdict on its central argument**,
delivered in a dropdown labelled with the disputants' names. At 78% against 24%,
the current build says the convinced were right and the refusers were fools.

That is not a tuning imbalance. It is the design answering by fiat a question the
fiction requires to stay open, and it is the reason this is the highest-value open
point in the register. A refuser should be able to keep a few hundred wild folk
who hear it, build almost nothing, and win a reasonable share of the time.

The central dilemma is currently decorative. Two things confounded it. One is now
resolved, and it turned out to matter for only one of the two magical doctrines.

**Turn order is dealt with** — see A-17. Measured with the seeds split evenly
between both orders, so the seat advantage cancels:

| Playing, against Cities | As built | Seeds split |
|---|---|---|
| Cities | 60% | 50% |
| Bands | 8% | **8%** |
| Mixed | 38% | 37% |
| Haunt | 10% | 22% |

Turn order was worth about half of Haunt's deficit. It was worth **nothing** to
Bands, which sits at 8% either way. So the two magical doctrines fail for
different reasons, and only one of them had an excuse.

**The one-ply AI (OP-01) is what remains.** Greedy tile-count maximisation is
close to correct for Cities and visibly wrong for Bands, which has to split at
the right moment rather than the most immediately profitable one — and splitting
is exactly the decision a one-ply chooser cannot see the point of, since it costs
score now for score later. Bands may be an artefact of its own AI.

**Settled by:** OP-01 first, then re-running the matrix with split seeds, and only
then tuning. Tuning now would be tuning against the AI's blind spots. If Bands is
still at 8% with an opponent that can plan two moves, the honest options are to
accept that the viable magical line is *few settlements and many stones* and
rename the doctrine, or to make blessing worth more, which A-09 shows is the lever
that actually moves this.

## OP-19 · high · The settlement model: does teaching make the magical line real?

**Raised August 2026. This is OP-06's proposed answer, and it is large enough that
it must be measured before it is believed.** Nothing below has been simulated.

Today a settlement drifts across population thresholds and the player watches. The
proposal is that **going agricultural becomes a conscious, per-settlement
decision**, and that everything currently pegged to population moves onto it.

### The five pieces

**1. Growth becomes logistic.** `pop × (1 + r × (1 − pop/K))`, retiring the
exponential and the 2600 clamp. `r` rises to roughly 0.30–0.35 to compensate for
logistic slowing the early years; the shape is a fast start and a long plateau.

**2. `K` is where terrain now lives, and it splits in two.** Untaught, the cap is
**150 flat on every terrain** — Dunbar is a cognitive and social limit and crop
yield has nothing to do with it. Taught, it is **plain 1000 · forest ~800 · hill
~600**, which is crop yield, and which makes the teaching decision read the map:
you teach the plains and leave the hills wild. Because these are ceilings rather
than compounding rates, the numbers can be far apart without the runaway that
fertility-on-the-growth-rate currently produces.

**3. Two teachings, each an intervention, each requiring presence.** *Teach tilling
the land* raises `K` and is the only thing that lets a settlement reckon ground.
*Teach killing* gates the levy and nothing else. A colony inherits its parent's
teachings — it is a work of the settled and is born tilling. A splinter does not.

**4. The wonder trigger moves from population to teaching.** Today
`lost = max(0, settlements≥150 − workingStones)`. Now: **you lose your greatest
remaining wonder the year you teach a settlement to till.** Two reasons this is the
keystone rather than a tidy-up. Mechanically, untaught settlements now sit at 150,
and against a population trigger they would flicker across it every year and the
ladder would jitter. Thematically, it is the thesis stated as a click: you are not
deafened because there are a lot of them, you are deafened because you taught them
to count the fields.

**5. The Seventy-Seven gets teeth.** §4 calls 77–149 *"the regret zone: past magic,
not yet useful"* and it currently means nothing — band and village differ by a
label. Under this, **a settlement under 77 passively blesses adjacent ground each
year**, like a living stone.

### Why 5 is not optional

Without it the model has a hole. An untaught settlement scores 3, exactly what the
blessed tile it replaced scored; founding sets `st = "wild"`, which **severs your
blessed region**, and `region()` is what stone power reads, so every settlement
halves the stones near it; it does not reckon; and it can be encircled and taken
(OP-20). A purely magical player should therefore found *zero* settlements — which
makes Bands strictly worse than Haunt and makes the teaching decision moot, because
there would never be anything to teach.

With it, the untaught band is the magical side's compounding engine, it does not
touch the stone cap, and `concept/lore.md` becomes mechanical: they hear you
because they are few and the country is quiet.

### And it gives Split a job again

Split's old purpose — keeping settlements under the 150 wonder threshold — is
deleted by piece 4. Its new purpose is **keeping them under 77 so they keep
blessing**, and logistic growth toward `K` = 150 means a settlement drifts past 77
unless you act. Split now behaves like a colony: it may target any tile you have
blessed within **path distance 2**, without the 85% founding requirement, and the
splinter is untaught. This is *fission as the central choice*, which `ideas.md` has
listed as designed-but-never-built since the beginning.

### What must be watched

- **Split may kill Found.** With no 85% requirement it is better than Found almost
  everywhere it is legal, leaving Found as the move that starts a region and
  nothing else. Possibly the right shape. Should be chosen, not discovered.
- **Does an under-77 settlement bless one tile a year, or its whole ring?** A stone
  blesses one. Undecided, and the difference is large.
- **Every number is unmeasured** — `r`, the three caps, split's radius, and the
  three land-based unlock conditions in OP-05.

**Settled by:** building it behind `FG.R2` and running the matrix both ways on
identical seeds, watching Bands and Haunt specifically. The goal is stated in the
fiction and should be stated here too: **a magical victory should be possible, and
hard.** If Bands is still in single digits with all of this in, the model is wrong
and not merely untuned.

### Measured — and with two fixes in, the model works

| Flags | Cities | Mixed | Haunt | Bands |
|---|---|---|---|---|
| baseline, all off | 50% | 43% | **20%** | **8%** |
| `logistic` only | 48% | 43% | 57% | 40% |
| stage 1, first cut | 15% | 60% | 100% | 93% |
| **stage 1 `+exitLane +fade`** | **50%** | **50%** | **80%** | **60%** |

**The spread goes from 54 points to 30, and every doctrine is viable.** Bands 8 →
60, Haunt 20 → 80, Cities unchanged at 50 in its own mirror. OP-06 asked whether an
ascetic strategy can ever win; against this build it can.

**It has overshot in the other direction and now needs tuning down, not
rebuilding.** Haunt is the strongest doctrine at 80%, and the goal is *possible,
and hard*. `r`, the three caps, and the value of blessing are the knobs; none of
them has been touched yet.

Two fixes were needed to get here, and both were found by measurement rather than
argument. They are recorded below because the intermediate numbers are misleading
without them.

### The two things that had to be fixed first

**Entombment — a rule interaction.** You found a settlement, which puts your token
on it; you teach it, because you are standing there; it ploughs its own radius-1
ring that same year; reckoned ground is impassable; you are sealed onto one tile
forever. Cities spent **50% of all player-years with a reach of zero**.

Fixed by `exitLane` and `fade` together — the fields close one tile a year in the
first ring instead of three, a tile may never be ploughed if it is the last way out
of a settlement, and ploughed ground became walkable at the OP-14 toll. Zero-reach
player-years fell from **50% to 4%**.

**The teaching pull — an AI artefact, and much the larger effect.** The first cut
gave the chooser a bonus for standing near any untaught settlement of its own, so
that it would walk somewhere it could teach. Weighted at 6 per settlement and
counting *every* untaught one, this held the token loitering among its own villages
— where founding is illegal and the ground is already blessed. Cities went from
**8.8 foundings a game to 2.0**, and every conclusion drawn from that run was
wrong.

The rule was innocent. Gating the bonus on settlements actually ready for the
plough and cutting its weight to 3 restored founding to 7.7 and moved Cities from
15% to 50%.

**This is OP-01, and it is the sharpest demonstration of it in the project so far.**
A twelve-line change to the chooser was worth 35 percentage points — more than any
rule in the batch. Every number in this section carries that caveat.

### First measurement — the first cut, kept for the record

Stage 1 only: logistic growth, teaching, the wonder trigger, the audible
Seventy-Seven. `FG.R2` in `engine/constants.js`; 40 games per matchup, seeds split
between both orders, all against the Cities doctrine.

| Flags | Cities | Mixed | Haunt | Bands |
|---|---|---|---|---|
| baseline, all off | 50% | 43% | 20% | 8% |
| `logistic` only | 48% | 43% | **57%** | **40%** |
| `+teaching +taughtLoss` | **15%** | 60% | **100%** | **93%** |
| `+audible77` — full stage 1 | 15% | 60% | 100% | 93% |

Three things, and the second is the important one.

**Logistic growth alone very nearly does the job.** Bands 8 → 40 and Haunt 20 → 57
with Cities untouched at 48. That is the whole of OP-06 moved by one formula, and
it is a much better result than expected — it says the magical doctrines were
losing to *exponential settlement growth*, not to anything about blessing.

**Teaching in its current form breaks the Cities doctrine, and the cause is
entombment.** Measured directly: Cities teaches **1.6 times per game** and spends
**50% of all player-years with a reach of zero tiles.**

The mechanism is a loop nobody saw coming, though the triage came close:

1. You found a settlement, which puts your token on it.
2. You teach it — the natural moment, since you are standing there.
3. It ploughs its own radius-1 ring that same year.
4. Reckoned ground is impassable, so you are sealed inside a one-tile island,
   permanently.

So the doctrine that teaches most is punished hardest, and the 15% is not a balance
result at all — it is a bug in the interaction between two rules that were each
reasonable alone. **The magical win rates above are therefore not trustworthy
either**, because they were measured against an opponent that spent half the game
unable to move.

**`FG.SOFT` is not enough of a fix to hide behind.** With walls priced at 3 instead
of blocking — the nearest existing stand-in for OP-14 — Cities recovers only to
15%, still teaching about twice a game. One tile a year through your own fields is
not mobility. So OP-14 as currently written, at 10% of manifestation a year, may
not answer this on its own either.

**`audible77` changed nothing measurable**, to two decimal places. Not evidence that
it does nothing — the doctrines that would use it were already winning every game
against a crippled opponent. Re-measure once Cities works.

### Played, and it holds — with two things the matrix could not have found

**First full game, year 40, a pure refuser: 108 to 75, with no farmland at all.**
Nine settlements, six of them sitting at Dunbar, twenty-seven blessed tiles, three
villages taught to till late. **This is the first time OP-06 has been answered
affirmatively by a person rather than by the harness**, and it is worth more than
the win rates because a doctrine the AI plays is not a doctrine anyone chose.

**Why it was won matters more than that it was won, and it is not what the batch
was designed to do.** Twenty-seven blessed tiles at 3 against about twenty-five
farmland tiles at 2 — comparable ground, and the per-tile value decided it.
Settlements used to win by *generating* tiles faster than blessing could keep up;
logistic growth and the reckoning budget have now capped that production, and with
the compounding gone, **A-09's blessed=3 against reckoned=2 is simply a 50% premium
on every tile held**. Blessing was set to 3 when Cities compounded freely and
needed offsetting. That, rather than `r`, is the first knob to turn — and it means
A-09 joins A-13 as a settled question this batch has reopened.

**A bug, found by playing and invisible to every measurement taken so far.** Three
villages were taught to till and never made a single field, because their ground
had been drowned or already ploughed by the rival. `wouldSeal` refused every
candidate: a settlement ringed by the other power's farmland saw each neighbour as
its last way out, when none of them was a way out at all. Fixed — ploughing ground
that is already ploughed takes nobody's exit, it only changes whose furrows they
are. Note the shape of it: **the harness could not have caught this**, because the
greedy AI never teaches a settlement it cannot feed.

**The stone brake is dead for a refuser, and this was not noticed when it was
built.** `lostCount = max(0, taughtCount − workingStones)`. Teach nothing and the
working stones subtract from zero — they hold back nothing, because nothing was
taken. Under the old population trigger that could not happen. It bites hardest in
the doctrine that raises the most stones, and it is the third thing in this batch
to weaken OP-13.

**Two smaller readings of the same board.** Six settlements at exactly 150 read as
a rule rather than as places — jittering the untaught cap per settlement by ±15%
off `t.seed`, which already exists per tile, would cost nothing and is still true
to *Dunbar is social*. And the final board was OP-15's **Polytheism** almost
exactly, two territories divided by a mountain spine and water — but at 108 to 75
it would not have fired, which suggests the near-tie condition on that ending is
wrong.

### Also settled in this batch, and unbuilt

Small rules that arrived with OP-19 and have no question of their own. Recorded
here so they are not lost between a settled argument and an unwritten design doc.
Flags are declared in `FG.R2` and do nothing yet.

| Flag | Rule | Why |
|---|---|---|
| `barren3` | Withered ground stays barren three years before a settlement may plough it again | The immediate effect is currently unnoticeable — reckoning resumes the very next `worldTick`. The permanent cost already in the code stays: re-reckoning re-spends the settlement's 30-tile lifetime budget, which is real and invisible. Tilts magical, which is wanted. |
| `split2` | Split targets any tile you have blessed within path distance 2, without the 85% founding requirement; the splinter is untaught | Path distance rather than ring distance, consistent with A-18, so water and mountains constrain your own fission exactly as they constrain founding. Split cannot leapfrog terrain. |
| `landGates` | See OP-05 | |
| `pathFrac` | See A-18 | |
| `unmake`, `encircle` | See OP-16, OP-20 | |

### What has to be decided before this can be measured again

Teaching-in-person is the design intent and it is not in question. *Where* the
teaching happens is:

- **At founding.** You decide, as you put the settlement down, whether these people
  will till. No journey, no entombment, and the decision stays conscious and
  per-settlement. Loses the ability to convert an old band later, which is part of
  what made the idea attractive.
- **At founding, or later in person.** Most teaching happens at the founding; the
  journey is only needed to convert a settlement that already exists. Keeps both,
  costs a second code path.
- **Your own fields are passable to you; theirs are not.** Fixes it at the source,
  and directly contradicts `design/rules.md` §2, which marks *your own farmland
  walls you out exactly as theirs does* as load-bearing. That rule was written when
  the arc was purely about being shut out. It now also shuts you out of the one
  decision the game is about.
- **OP-14, with a movement allowance large enough to matter**, which the 10% figure
  may not be.

## OP-20 · high · Encirclement, and the god's right to forbid

**Raised August 2026, alongside OP-19 and dependent on it.**

A settlement completely ringed by one power's blessing changes hands after about
two turns. A second path to conquest, deliberately cheap, and the first one the
magical side has ever had.

### The asymmetry is the point

| Route | What transfers |
|---|---|
| **Levy** — people take it | Ownership only. It keeps what it knows. |
| **Encirclement** — you take it | Ownership, **and a decision.** |

On encirclement the player is asked, once, whether tilling and killing remain
permitted in this place or become **taboo**. It is a consequence rather than an
act, and should not cost the year's intervention. Nothing else in the game asks a
question this way.

**People move ownership; gods move knowledge.** The same asymmetry as OP-16 —
creation at a distance, unmaking only in person — extended from ground to what the
ground knows. It is also the only un-teaching in the game, other than a splinter
being born untaught, and it gives the player a verb it has never had: *forbid*.

### What forbidding is worth

**It returns the wonder that teaching cost.** Without that, nobody would ever
choose taboo — you would be trading a city for a hamlet and getting only the
hamlet. With it, encircle-and-forbid is the arc played backwards: you take a loud
place, you make it quiet, and you can hear again. It is `ideas.md`'s *a wonder that
restores a lost wonder, once, at enormous cost*, except the cost is a siege rather
than a number.

**The taboo is permanent.** Once forbidden, a place stays forbidden and neither
power can teach it again. Not a contested state that flips; a thing a god decided
about a place. That permanence is the only thing limiting the mechanic.

`divineLeft` slices from the front of a fixed order, so a returned wonder is the
**most recently lost** — Quicken first, Raise mountains last, having been the first
thing to go. The right order, and free.

### The forbidden city empties

`K` falls from the terrain figure to 150 and the population declines toward it. The
raw logistic multiplier goes badly negative — 800 against `K` = 150 at `r` = 0.32
gives about **−0.39**, which is not a population — so the decline needs a floor
around 25–30% a year, and **the people who leave become refugee columns**, using
the machinery §7 already has for *Bad omen*. A forbidden city empties over six or
seven years, visibly, as people on the road.

The second-order consequence is already documented in §7 as the best emergent
interaction in the build: **the arrivals push another settlement past a
threshold.** Forbidding one place makes another one loud. You cannot forbid your
way to silence.

### What must be watched

- **Is encircle-and-forbid too good?** A wonder count that never falls, a late game
  spent entirely on sieges. The taboo is permanent per *place*, not per player, and
  there is no limit on the number of places. Measure before adding a cap — the cost
  of the siege may limit it alone.
- **Coastal settlements are much cheaper to encircle.** Three land neighbours means
  three blessed tiles, not six, so Drown-then-encircle is a conquest for a wonder
  and two acts. Accepted deliberately; recorded so it is not a surprise.
- **Your own bands are the encircleable ones.** An untaught settlement never
  reckons, so it never breaks its own ring, and under OP-19 you will have many. The
  saving grace is that a rival must physically walk around one, through your
  blessing, which is impassable to them. Probably fine. Worth measuring.
- **Does forbidding un-reckon the ground?** Probably not — that is what *Wither* is
  for, and free reversal would make the taboo strictly better than a wonder. But it
  is not obvious, and the fill colour in OP-17 has to say which way it went.

**Settled by:** building it behind `FG.R2` after OP-19 measures clean, then the
matrix. Watch the wonder count over a game as its own series — if it is flat after
year 25 for any doctrine, this is too strong.

## OP-07 · medium · Map generation is unexamined

The generator makes blob islands with smoothed noise. It has never been checked for
whether it produces chokepoints, isthmuses, or interesting asymmetries — all of
which matter now that terrain can be created and destroyed.

**One asymmetry is now measured, and it is not interesting, it is just unfair.**
With turn order neutralised (A-17), the left-hand seat still finishes **+4.0 ±
1.4 points ahead** over 1,160 mirror games — the same doctrine in both seats, so
the only remaining difference is where the two powers come down. Nearly three
standard errors, so it is real. Small beside the 30 points turn order was worth,
but it is a thumb on the scale nobody put there.

Likely cause: the exclusion falloff in `gen()` is `c/1.9` from the left edge and
`(COLS-1-c)/1.9` from the right, on a 14-wide grid whose odd rows are offset half
a hex to the right. The two sides are not mirror images.

**Settled by:** generating fifty maps and looking at them. Then a fairness check
that is now cheap — `sim/order.js <doctrine> years` on a few hundred games, with
the margin expected to be zero. Seed control already exists, so a good map can be
replayed.

## OP-08 · low · Twenty turns or forty?

Twenty balances more easily and is the length originally wanted. Forty is the only
length at which the walls, the wonder ladder, and the marching armies have room to
matter. Currently forty, somewhat against the earlier instinct for brevity.

**Settled by:** playing both. The knob is in the build.

## OP-09 · low · Contiguity scoring is shelved, not decided

Tested: shifts ~15 points toward the magical side, because blessing forms one blob
and settlements scatter. It would make cutting an opponent's territory meaningful,
which is the one kind of interaction the board still lacks.

**Settled by:** running the matrix with it on and the other numbers re-tuned around
it, rather than bolted onto a balance built without it.

**OP-15** gives the metric a job that requires no re-tuning at all: an ending can
*read* contiguity without anything scoring it. If the endings land, that may be the
whole of what contiguity was ever for.

## OP-10 · low · Only one rival

Everything is built for two powers. Three would change the shape considerably —
alliances, second fronts, and the possibility of being ignored.

**Settled by:** deciding whether this is a two-player game with AI or a
multi-power game. Affects the engine design, so worth deciding before the rewrite.

## OP-11 · low · Bad omen's second-order cost may be invisible

Evacuating a town pushes another past a threshold and costs a wonder. This is the
best emergent interaction in the build and the player may simply not notice it
happening.

**Settled by:** checking whether the log line lands. If not, the fix is to name the
consequence explicitly at the moment of evacuation, not afterwards.

## OP-12 · low · The third leg was never built

The rock-paper-scissors design called for wandering hosts — mobile, holding no
ground, beating cities and losing to blessed ground. It was designed and never
implemented. The game currently has two legs, not three.

**Settled by:** deciding whether the two-way tension is enough. It may be.

## OP-13 · high · Do dead stones carry orders?

A stone below power 6 currently stops blessing and does nothing. The proposal is
that it stops being a place where you are heard and becomes a place from which you
are obeyed: **working stones carry presence, dead stones carry orders.** Wonders
and interventions target through live stones, as now. Works — clearance, colony,
levy — may target a settlement within reach of a dead one.

The reach rule needs its own value. The live formula is `1 + floor(power / 10)`,
and a dead stone has no power to speak of.

Two consequences are the actual reason to want this, rather than the range:

- Severing a blessed region currently only halves your stones. Under this rule it
  also converts you from a god into an administration, so the attack pushes you
  somewhere instead of merely subtracting.
- It is a second answer to OP-03. Works become *reachable* rather than *earlier*,
  which leaves the strength ladder and the population costs of A-13 untouched.

Absorbs **temple as life support** from `ideas.md`. The relay station is a stone
that already exists.

**Settled by:** implementing and re-running the matrix. Watch the Cities doctrine
specifically. Four stones raised early and allowed to die under farmland is a
permanent command network for the price of a few early acts, and if that is
correct for every doctrine then it is not a decision, it is a chore with a
narrative attached.

**Two things in the August 2026 batch move this, in opposite directions.** OP-19
gives settlements under seventy-seven a passive blessing of their own, so a stone
is **no longer the only compounding thing the magical side owns** — which weakens
the argument for stones needing a second job. But OP-14's adoption means works no
longer need a dead stone to be *reachable*, since you can now walk to anything at a
price. Both halves of the "second answer to OP-03" claim above are therefore
weaker than when it was written. What survives untouched is the good part: severing
a blessed region converting you from a god into an administration.

## OP-14 · high · Can you walk on reckoned ground if it ages you? — **adopted, August 2026, and now load-bearing for OP-19**

**Adopted in principle.** What is left open is the sub-question below — cliff or
slope, and what happens at zero — not whether the rule goes in.

It stopped being optional when teaching became a per-settlement decision made in
person (OP-19). Teaching requires presence; a mature settlement is ringed by its
own reckoned ground; so without this rule a settlement can only ever be taught in
its first few years, before it ploughs itself shut. That may be a defensible
window, but it is a large and unintended consequence of an unrelated rule, and
pricing the walls removes it.

It also completes a movement model rather than adding a third exception: **three
tiles a year through your own blessing, one through wild ground, and reckoned
ground enterable at 10% of your manifestation a year.** Fast at home, slow abroad,
costly inside theirs.

---

Reckoned ground becomes passable. Ending a year on it costs 10% of your
manifestation, permanently, so ten tile-years of trespass across a forty-year game
is the whole allowance.

This is **not** the attention problem settled in A-03. Attention refreshed every
turn and had to be spent, so every choice was a denial. This is a permanent stock
that may never be touched at all. A decision, not triage.

The load-bearing part is what happens at zero. If the game ends there, it is a
punishment. If you **lose the body and keep playing** — stones still bless, works
still issue, score still accrues — you finish the game as a network with no
location, which makes the administrative-interface ambition in `concept/` literal
rather than atmospheric. This wants OP-13 built first, or the end state contains
nothing to do.

Sub-question: does manifestation degrade before zero — three movement points
falling to two, to one? A cliff at ten years is invisible until it is not. A slope
is felt every year and may be a death spiral.

Note this contradicts the **[load-bearing]** impassability rule in `design/rules.md`
§2, which is what currently makes a wall a wall. It prices the walls instead of
removing them, which is the same move already made in A-10: a timer is weather, an
exchange is a decision.

**Settled by:** the matrix, plus the three full games OP-03 already asks for.
Expect the magical side to gain, which is the direction OP-06 wants anyway.

## OP-15 · medium · Endings as an unscored reading of the final board

Score stays one number. An **ending** is a description of the final state,
delivered afterwards by a later historian, possibly unfair, and never worth a
point.

The constraint is the entire idea: **never scored, never shown in advance, never
trackable.** Displayed as progress it becomes the six-channel legacy scoring that
`rejected.md` cut for converting grief into optimisation. Discovered at the end, it
is the chronicle idea from `ideas.md` made systematic.

Test for admitting any candidate: it must be computable from state already
tracked. An ending that needs a new counter is suspect.

**Forgotten must be able to fire while leading on points.** If it only ever happens
to losing players it is a consolation label. If it can happen to the winner it is
the thesis delivered as an epilogue.

Draft set, to be cut to five or seven with a fixed priority order:

| Ending | Read from |
|---|---|
| **Syncretism** | Scores near-tied, stone counts equal, blessed and reckoned zones interleaved |
| **Polytheism** | Scores near-tied, two territories geographically separate |
| **Forgotten** | Too few stones standing at the end, whatever the score |
| **Euhemerised** | Many settlements, little blessing, stones intact — remembered as a king who once lived, not as a god |
| **Absorbed** | Rival won large, your stones still stand under their farmland — you survive as a feast day in someone else's calendar |
| **A stone in a field** | Strong on blessing through the game, almost entirely reckoned at the end — remembered as landscape, not as anyone |
| **Still heard** | A working stone and a settlement under seventy-seven at year forty. Should be very hard, and should not be called a win |

Polytheism needs a connected-component check, which the stone power calculation
already performs. This gives contiguity a use that costs no balance work — see
OP-09.

**Settled by:** writing all of them and reading the endings of forty simulated
games. If one fires in 80% of them, the set is wrong.

## OP-18 · medium · Do the wild folk exist in the rules, or only in the fiction?

`concept/lore.md` says the powers put people into the blessed country: few, wild,
living in forest and hill, able to hear because the country is quiet.

**Most of this needs no new mechanic, because the rules already say it.** §3
requires 85% blessed country within two tiles before you may Found, and calls the
blessing requirement load-bearing: *all expansion begins with blessing*. That gate
has always been arbitrary-looking. Under the lore it is not a gate at all — it is
the statement that people are already there, and a settlement is those people
deciding to stop moving. The cheapest possible change is **zero rules and a
drawing**: put wild folk on blessed tiles and §3 explains itself.

What is genuinely open is whether they should carry a number.

**The proposal.** A settlement is founded with a population drawn from the wild
folk in range rather than a flat 30. Where you blessed, and how long ago, decides
how strong the founding is.

Why it is worth measuring rather than dismissing:

- It gives blessing a **second output**, and OP-06 is the standing evidence that
  blessing needs one. Bands wins 8% and Haunt 22% with seeds split. A-09 already
  identified "make blessing worth more" as the lever that actually moves this, and
  this is that lever in a form that is thematic rather than a tuned constant.
- It is **additive and generative**, which is the direction every playtest has
  pushed toward and every subtractive mechanic has failed in.
- It makes *where and when* you bless matter, which currently it barely does —
  blessing is close to fungible once you have enough of it.

Why it might be wrong:

- `concept/concept.md` says **no economy to manage**. A visible population pool on
  wild ground is an economy, and the moment it has a number the player will farm
  it. The version that survives this objection is one where the player never sees
  a count and never spends it — it is only read at the moment of founding.
- It may make founding *automatic* rather than chosen: bless, wait, settle,
  repeat. If the wild folk simply accumulate, the decision drains out of it.

**Settled by:** implementing the founding-population version behind a tune flag
and re-running the matrix, watching Bands and Haunt specifically. If it does not
move OP-06, it is decoration and should stay in the fiction and the artwork only.

**Do not let this settle OP-06 by fiat.** See the caution at the end of
`concept/lore.md`: the powers believe the settled path is the next thing, and the
rules must not agree with them, or the competition becomes ceremonial.

## OP-17 · medium · Art direction was never chosen

The palette in `concept/concept.md` — *"cold, dark, northern"*, *"no gradients,
no shadows, no glow"* — describes the renderer that happened to exist. Nobody
decided it. It has since been quoted back as though it were load-bearing.

Measured, it is worse than that. Blessed plain against wild plain in the current
build separates at **1.00 luminance contrast** — the one-way ratchet in §1, the
distinction the whole arc runs on, is drawn at zero. See
`concept/art-direction/`.

Three directions are now rendered over real board states at years 9, 27 and 40.
The proposal is **warm painted land, cool luminous blessing**: it separates
blessed from wild at 1.99, and it makes the forty-year fade a colour-temperature
shift across the whole board that nothing has to narrate.

**Direction chosen: warm throughout.** The measurement argued for cool blessing
and was overruled, correctly — it showed that warm separates blessed from wild
badly on *fill*, not that warm is wrong. The gap is now closed on other channels:
faction-coloured animated sparkle (motion is independent of hue and luminance),
and contiguous-group outlines. See `concept/art-direction/`.

Hex goes 24 → 50, board 611 × 344 → 1272 × 717, tile area **4.3×**. The grid
stays 14 × 9 — §1 marks the size load-bearing and 18 × 11 measured 0%
interference.

**In the build as of now.** `game/index.html` and `game/ui.js` carry the whole
direction — hex 50, warm palette, group boundaries, temple complexes, figures,
sparkle, boundary stones, faction furrows, wild folk and field hands.
`sim/smoke.js` passes 11,744 checks including a full game played through the
build's own click handlers, so the port did not disturb the engine.

**Settled by:** playing a full game in it. Stills cannot answer OP-03 or OP-05,
and both are partly art questions. Note that a still is now *worse* than the
running game, since sparkle carries real information — this build must not be
judged from screenshots.

**One thing the port carried over from before the direction was chosen, and it is
now wrong.** `game/ui.js:254` reads `if (t.set) fill = P.reck;` — *"a settlement
stands in its own fields"* — so every settlement is farmland-ochre from the year it
is founded, including one that has never tilled anything. Under OP-19 that is no
longer true, and the fill is contradicting the single most important decision in
the game.

**A settlement tile takes the blessed colour until it is taught, and the reckoned
colour afterwards.** Three sites, not one: line 254 sets the fill, line 279 draws
plough furrows on any settlement tile, and line 297 excludes settlements from the
blessed sparkle. All three follow the teaching flag, or an untaught settlement
reads as a farm regardless. Consistent with *Fill is the land* — an untaught
settlement is not a farm.

**What the port did not fix, and knowingly:** blessed hill against farmland is
still 1.35 luminance and blessed plain against wild plain 1.65. In the build the
distinction is carried by content rather than colour — sparkle and standing
figures on blessed ground, furrows, boundary stones and bent figures on
farmland. That works, and it is worth knowing that it is what is doing the work,
because anything that thins the marks will bring the problem straight back.

## OP-16 · low · What silences a stone, and can anything bring one back?

Downgraded from medium after measuring, because the part that was noticed is not
the part that matters.

### What actually happens to stones

194 stones raised across 60 games. At year forty, the ground beneath them:

| Ground | Stones | |
|---|---|---|
| Farmland | 178 | **92%** |
| Wild | 11 | 6% |
| Own blessing | 3 | 2% |
| Rival's blessing | 2 | 1% |

**92% of all stones end under farmland, and that is irreversible**, because
reckoned ground is impassable — you cannot walk to it, so you cannot ever bless
it back. At least one stone is paved over in 56 games out of 60.

The rival-blessing case, which is what the register was opened about, is 1%.

### The proposal on the table, and the answer

*Bless can silence a stone; Quicken cannot; both can bring one back.*

Adopt it. The reasoning holds and is better than the mechanic it fixes:

- **Bless requires presence.** You have to walk there, and a stone deep inside
  its own blessed region is genuinely hard to reach, because your blessing is
  impassable to the rival. They must convert their way inward one ring per year,
  visibly, spending an act each time. That is a siege of a holy place, and it
  makes where you *put* a stone a real decision instead of a formality.
- **Quicken is action at a distance** — reach 3 from a working stone, one
  intervention, no approach and no warning. It lets the attacker skip the entire
  siege, which is what makes the current version bad rather than interesting.
- The asymmetry in the second half is the good part: **creation at a distance,
  destruction only in person.** A power can extend blessing through its network,
  but unmaking someone else's sacred ground requires a body standing on it.

Two things to watch when it goes in:

- **Flip-flopping.** Attacker blesses the tile, defender blesses it back,
  repeat — both spending every act on one hex while blessing is worth ~21 points
  a year elsewhere. Probably self-limiting, and arguably just a siege, but the
  harness should count tiles that change hands more than three times.
- **OP-13.** If dead stones become conduits, silencing a rival's stone *hands
  them a conduit*. That is a funny interaction and possibly a good one — it is
  the same push toward administration OP-13 already describes — but it means
  these two should be decided together rather than in sequence.

### The question this displaces

Since blessing accounts for 1% of silenced stones and farmland accounts for 92%,
the real question is about farmland, and nobody has asked it:

**Clearance can be aimed at a stone.** `targets("clear", …)` excludes settlements
but not stones, so a work can be spent to pave a rival's stone deliberately and
permanently. That is *stones that can be thrown down* from `ideas.md`, already in
the build, arrived at by accident, undocumented and unmeasured.

That needs separating from the incidental case:

- **A settlement growing outward reckons a stone by accident.** Keep it, without
  question. It is the thesis in miniature — the shrine is ploughed under by
  people who were not thinking about it at all, and the chronicle line for it
  already exists.
- **A work aimed at the tile a stone stands on** is an attack, priced in people,
  chosen. Currently identical to the above and indistinguishable in the log.

**Settled by:** implementing the Bless/Quicken split, which is small, and then
deciding the Clearance question separately — it is the larger one and it is the
one the numbers point at.

### Refined and scheduled, August 2026

The split stands, with the mechanism made concrete. **Taking the other power's
blessing returns it to wild, not to you.** Two visits to take a tile: you unmake
before you make. No fractional state, and it says the principle out loud.

This may make the reach change unnecessary. The complaint that started it was that
Quicken reaches three tiles from a working stone with no approach and no warning —
but if unmaking requires presence, then Quicken at range can only take **wild**
ground, which is exactly *creation at a distance, destruction only in person*.
Cutting the reach as well is, net, a nerf to the magical player: Quicken is the
last wonder lost, so whoever teaches fewest settlements keeps it longest.
**Measure before cutting.**

The flip-flopping watch above still applies, and the harness item stands: count
tiles that change hands more than three times.
