# Open points

Live register. Things genuinely unresolved. When one is settled, move it to
`open-points-archive.md` with the answer and the evidence.

Format: `OP-nn` · severity · the question · why it matters · how it would be settled.

**Settled and moved out, August 2026** — the rest of this file still points at
these by number, so the numbers are kept here rather than left dangling:

| was | question | answer |
|---|---|---|
| OP-13 | do dead stones carry orders? | **A-28** — yes, at range two, works only |
| OP-14 | walking on reckoned ground, and what zero is | **A-19 / A-30** — adopted; at zero you may only watch |
| OP-18 | do the wild folk carry a number? | **A-29** — at the founding, and nowhere else |

---

## OP-21 · highest · Two players at one board

**Raised August 2026, and placed above OP-01 deliberately.** Not a feature. It is
the instrument for the class of question the harness has just been shown to be
blind to.

The batch ended with two rules — `taughtLoss` and `audible77` — kept on judgement
against a null measurement, because both are about choices a greedy chooser does
not make, and OP-01 says nothing better is coming soon. **A second person at the
board measures those rules today.** Whether a player keeps a settlement under
seventy-seven so it can still hear them, and whether losing a wonder to teach feels
like a price or a formality, are both directly observable the moment someone is
choosing rather than maximising. That is why this outranks writing a better AI:
the AI is a faster instrument for the questions it can already see, and this is a
different instrument for the ones it cannot.

It also makes the two most-parked fairness questions urgent, which is the part that
will cost the most.

### What it breaks, and both are already in the register

**A-17 reopens, and its answer does not survive.** Turn order was settled as *leave
it alone, measure around it* — explicitly on the grounds that the build has a fixed
order and only one seat is human, so the asymmetry lands on an AI that does not
care. Mirror matches measured a seat swing of up to **30.9 points** for Haunt and
14.9 for Cities. With two people, one of them sits in that seat every game and it
is simply an unfair match. All three candidate fixes were rejected — two on the
numbers, one on the mechanism, because the world resolves at year end and
alternating produces a double move at every changeover. **PvP needs a fourth
answer, and there isn't one yet.**

**OP-07 stops being a curiosity.** The left-hand seat finishes **+4.0 ± 1.4 points**
ahead over 1,160 mirror games, from map generation alone. Small beside turn order
and entirely tolerable when the right-hand seat is a machine. Not tolerable between
two people. The likely cause is already identified — the exclusion falloff in
`gen()` is not symmetric on a grid whose odd rows are offset half a hex.

### What it costs in code

Less than it looks in the engine and more than it looks in the interface.

- ~~**`engine/tick.js:229`** — `endYear()` hardcodes `FG.aiTurn(1)`.~~ **Done.** Gated
  on `G.pvp`. `aiTurn` already no-ops on a null doctrine, so the guard is belt and
  braces; it is written out because the assumption is the thing worth being
  explicit about.
- ~~**`engine/tick.js:219–220`** — the year reset clears `acted` and `cast` for seat 0
  only.~~ **Done.** Both seats. Provably neutral to every number measured so far:
  `engine/ai.js` never reads either field, and `node sim/matrix.js 40 40 cities`
  reproduces §10 exactly — 57 / 8 / 43 / 13.
- ~~**`game/ui.js`** — 52 call sites pass a literal `0` and 18 read `G.p[0]`.~~ **Done**,
  as one `SEAT` variable. The map click handler reads `SEAT` at click time rather
  than closing over it, so the cached land layer survives a hand-over.
- **The chronicle is still the real problem, and it is not plumbing.** Every `say()`
  in `actions.js` and `tick.js` branches on `me = who === 0` and writes to *you*
  about *theirs*. Two players means either two logs or a neutral voice, and a
  neutral voice loses the thing `concept/concept.md` specifies as the chronicle.
  **Not done, and deliberately.** In a two-player game the log is folded shut and
  labelled *told from the left hand*, which is honest and costs nothing. Doing it
  properly is a mechanical change to ~40 call sites — `say(who, mine, theirs)`
  rather than a pre-framed string — and it should be done as its own pass.

### The turn should hand itself over

Wanted alongside, and useful in the single-player build too: **when nothing further
is possible, pass to the other player.**

The naive condition is wrong and will hang. Waiting for movement, act *and*
intervention all to be spent means waiting forever whenever a player has no legal
intervention, or does not want to walk their last tile. The condition is **nothing
further is possible**, not everything is used:

- the act is taken, and
- the intervention is spent *or* no intervention has a legal target, and
- movement is exhausted *or* nowhere reachable is worth the walk

The last clause is a judgement the interface cannot make, so movement probably
should not gate it at all — a player who has acted and intervened has finished
their year in every sense that matters.

**A toggle, off by default.** Some players will want to look at the board after
their last move, and taking that away to save a click is a bad trade.

**Settled by:** building it. Then three games between two people, watching
specifically whether either of them ever declines to teach — which is the one
observation nothing else in this project can currently make.

---

### Built, August 2026

In the build. *A second person, at this board* is an option in the doctrine
dropdown; choosing it restarts, because it changes the shape of a year rather
than the strength of an opponent. The year goes left seat → hand over → right
seat → the world moves. `sim/smoke.js` plays a full two-seat game through the
build's own buttons and asserts the thing that matters — that handing over does
*not* move the world — at 11,758 checks.

**Hotseat is much cheaper here than hotseat usually is, and the reason is worth
recording: there is no hidden information in this game.** No fog, and the wonder
count is derivable from the board, so no curtain is needed between turns. What
would normally be the expensive part of a hotseat does not exist.

**The active seat is carried by colour across the full width of the board**, not
by a label in a side panel. On a shared screen that banner is the only thing
standing between one player and somebody else's year.

**Two things went in as toggles and one of them is not validated.** The hand-over
stays a toggle, as written above. The compensating tile does not have the number
it was argued to have — see OP-07.

### What is still open

- **The chronicle.** One log, folded shut and labelled. See above.
- **A-17 still has no fourth answer**, and PvP is the case that needs one. A
  candidate the register has never considered, and which costs no engine change:
  **let the second player choose their seat.** The turn-order bias is
  doctrine-dependent and opposite-signed — Cities wants to act first, blessing
  doctrines want to act second — so seat choice converts the asymmetry into a
  decision rather than a handicap. That is A-10's move exactly: a timer is
  weather, an exchange is a decision. Unmeasured, and cheap enough to try.
- **The board is 1272 × 717 at hex 50 and an 11-inch iPad is 1194 points wide**,
  before the side panels. Deferred deliberately. **Taken up in OP-23**, August
  2026, and measured in a browser rather than asserted: the stacking breakpoint
  was fourteen points too low to catch that device at all, and height binds well
  before width does. Not closed — the board there is hex 35 against the 50 the art
  was drawn at — but no longer deferred.
- **Mis-tapping.** A year is one act and one intervention, and on touch a stray
  tap spends one irreversibly with an opponent watching. The engine reproduces a
  game exactly from a seed, so an undo-within-turn is available in principle.
  Deferred until it is shown to be a problem in play.

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

**Now second to OP-21**, which is a different instrument for the questions this one
cannot see rather than a faster one for the questions it can.

### Two measurements from the August 2026 batch make this concrete

It has been stated as a caveat since it was raised. It is now a demonstrated,
quantified obstacle, twice over.

**A twelve-line change to the chooser was worth 35 percentage points.** More than
any rule in the batch. A teaching bonus weighted at 6 instead of 3, counting every
untaught settlement instead of the ones ready for the plough, held the token
loitering among its own villages and cut Cities from 8.8 foundings a game to 2.0.
The first full measurement of OP-19 was drawn from that run and every conclusion in
it was wrong. **The AI is not a caveat on the numbers; on that run it was the
largest term in them.**

**And it cannot see two of the batch's rules at all.** `taughtLoss` and `audible77`
both measure at exactly zero. Both are rules about choices a greedy one-ply chooser
does not make — when to spend a wonder, whether to keep a settlement small enough
to hear you. They are kept anyway, on judgement, which is recorded in OP-19 and is
the first time this project has kept anything against its own measurement.

**That is the real cost of OP-01, and it is not "the numbers might move."** It is
that a whole category of rule — the kind that trades something now for something
later, which is most of what this game is about — is currently unmeasurable.
Settling this does not just re-rank the doctrines. It decides whether several rules
in the build have a reason to exist.

### A third measurement, August 2026, and this one is not about judgement

**Every number ever measured for `bands` was measured against a doctrine playing
with one fewer act than it has.** Split has never been legal — A-20 — and `bands`
weights it at 14, second only to `stone`. The chooser has been spending that
weight on an option that could not be selected since the build was written.

Two things follow and they point in opposite directions:

- The historical numbers for that doctrine are worth less than they looked, and
  so is anything tuned against them.
- **The chooser still barely wants it now that it works.** Split is legal in 29%
  of `bands` settlement-years and taken 0.44 times a game, because a flat weight
  of 14 loses to `bless × gain` reaching 24 nearly every time. Making an option
  legal did not make a one-ply greedy chooser use it, which is this entry in one
  sentence.

### Deliberately deferred, August 2026

Not because it stopped mattering — the two measurements above stand and are the
sharpest things in the register. Because **an AI is an instrument built against a
rule set, and the rule set is still moving.** OP-19 and OP-20 are measured and
untuned, and OP-12 now has a third leg waiting behind them. A chooser written
against `FG.R2` half-finished would have to be written again.

OP-21 already supplies the instrument that reads choice-shaped rules, and it reads
them today. Revisit when `FG.R2` is tuned and closed.


### A fourth, 25 August 2026, and it is the largest of them

**The chooser had no concept of a body, and it was worth up to thirty-two points of
win rate in a single cell.** 1.7 charges a tenth of your manifestation for ending a
year on ploughed ground; `free()` guarded the dream toll and nothing guarded the
standing one. The rival walked itself to nothing in **21%** of games against Bands
and **38%** against itself, then stood inert for a mean of two years and as many as
eighteen. Every cell of §17.6 was reading some of that.

Three guards later — see A-31 — the rate is 6% and 10.5%, and the two headline
results of the 1.20–1.23 batch are gone: `wildFolk`'s eleven points to Bands
measure at −3.7 and `deadOrders`'s nine to Mixed at +2.0, both inside the noise at
300 games a cell.

**What this one adds to the argument above.** The first three entries said the
chooser cannot *see* certain decisions. This one says something worse and simpler:
the chooser was **losing games to a resource it did not know it had**, and the
matrix scored that as the other doctrine playing well. A rule does not have to be
about an invisible decision to be mismeasured. It only has to change how often the
opponent falls over.

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

**Both of those are now built, and this entry is the one that has to be played to
be answered.** OP-14's toll is in and a person has been to 10% of himself and
called it a decision. Encirclement is in, and it is additive, and taking a mature
city with it is a multi-year project rather than a click. **Nothing else is
needed here except somebody playing the last ten turns and saying which it felt
like.** Candidate fixes should not be added before that happens.

## OP-04 · medium · Is the wonder → work trade actually felt?

The intended moment is: *I would rather have had Drown back than the levy I used
instead.* If that thought never occurs, the ladder is just a power curve wearing a
costume.

**Settled by:** playing and noticing. If it doesn't land, candidate fixes are
fewer works, or works that are situationally weaker than wonders rather than
strictly later.

**Measured, August 2026, and the number is unkind.** OP-19 moved the wonder trigger
from population to teaching — a change to *when you lose every wonder in the game* —
and it altered no win rate at all. Not by a little: `taughtLoss` on and off produce
identical tables.

The straightforward reading is that in the AI's hands **wonders are worth
approximately nothing**, so it makes no difference when they are taken away. That
is either a devastating answer to this question or an artefact of OP-01, which
spends them greedily on whatever is in reach and never holds one in reserve — and
holding one in reserve is the entire premise of the trade this question is about.

Note which way the evidence runs, though: the trade cannot be *felt* by a chooser
that has no feelings, and the one played game so far had a player deliberately
teaching three villages knowing what it cost. **The question is unchanged and the
measurement cannot answer it.** But it can now be said with numbers that nothing
mechanical is carrying the ladder, so if the trade does not land emotionally, there
is nothing else holding it up.

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

### Measured and fixed, August 2026 — and it was not a sag, it was an absence

**Read from the code, then measured.** This entry has claimed since it was
written that OP-19 removes both population gates. It never did: `landGates` was a
declaration in `FG.R2` that nothing in `engine/` read. Both gates were still
there — `civicOpen()` on `strength = settlements≥150 + settlements≥800` at
5 / 7 / 9, and `targets()` on per-settlement population at 150 / 200 / 300.

Harmless while the batch was off. Not harmless once it was default-on, because
**`logistic` moved both distributions out from under those numbers:**

- An untaught settlement is asymptotic to `kWild` = 150 and **never reaches it**,
  so it never counts. A pure refuser had `civicStrength` 0 for forty years.
- A taught settlement now tops out between 600 and 1000 against the old 2600
  clamp, so the 800 rung is nearly unreachable off good plain.

**What that did to the game, 40 games a doctrine:**

| Playing | Games where any work ever opened | First one at |
|---|---|---|
| Cities | **28%** | year 33 |
| Mixed | **13%** | year 33 |
| Haunt | never | — |
| Bands | never | — |

The clinching figure: **the mean Cities game ended at strength 3.1 against a
first gate of 5.** The average game finished below the bottom rung of a
three-rung ladder, and the levy fired once in forty games. So this was never a
mid-game sag. The half of the arc where you lose wonders and gain works had
quietly lost its second half, and the chip row OP-23 built to empty from the left
and fill from the right only ever did the first of those.

### The fix, and it turned out to be the largest tuning lever in the project

**`taughtGates`, built and on by default.** The ladder counts **settlements you
have taught to till** — 1 opens clearance, 2 the colony, 3 the levy.

Three reasons this beat lowering 5 / 7 / 9 in place, which measured the same:

- **It is the number the batch is actually about.** `lostCount` already reads it.
  So one counter now runs the arc both ways: **every teaching costs you a wonder
  and buys you a work.** The game was computing that twice, differently, and
  showing the player only half of it.
- **It is legible for free.** `taughtCount` is already on the stat bar, so the
  gate is a number the player is looking at. That is what this entry has wanted
  since it was raised, and it cost two lines.
- **`landGates` is cut.** Reading the unlock off tilled ground measured no better
  and cost a new per-settlement unlock model, which would also have changed what
  a dim chip in the row means. `registers/rejected.md`.

**And the balance result is the thing to take away, 80 games a cell:**

| | Cities | Mixed | Haunt | Bands |
|---|---|---|---|---|
| the old game | 55% | 38% | 11% | 10% |
| the batch, old 5/7/9 ladder | 53% | 46% | **79%** | **63%** |
| **the batch, taught 1/2/3** | 50% | 34% | **55%** | **34%** |

Works now open in 85% of Cities games and 91% of Mixed, first one around year 23,
and all three open in about two thirds of Cities games.

**Haunt 79 → 55 and Bands 63 → 34, from giving the settled side its late game
back.** That is larger than any knob OP-19 lists — `r`, the taught caps, the
reckoning budget — and it is *not* a nerf to the magical line; nothing about
blessing changed. It undoes something that was deleted by accident.

Which means part of what the register has been reading as *the batch made magic
strong* was really *the batch switched the settled endgame off*. OP-19's
overshoot is therefore smaller than it looked and partly diagnosed rather than
merely tuned. **`r` and the caps have still not been touched**, and Haunt at 55%
is close enough to *possible, and hard* that they may not need to be.

### Still open

- **The per-settlement minimums are untouched, deliberately.** `targets()` still
  wants 150 / 200 / 300 in the ordering settlement. One thing was moved at a
  time. Under the new ladder they are much less redundant than they were — a
  first teaching opens clearance while the place is still growing toward 150 —
  but they are a second gate and nobody has decided they should be.
- **A-13 is live again.** The works' costs in people — 10% / 35% / 45% — were
  priced against a ladder that has been replaced, and against works that in
  practice never opened. They have never been measured against works that do.
- **A feedback loop, unwatched.** Teachings per game rose from 3.8 to 5.0 when
  the gates came down, because a colony is born tilling: more works make more
  taught settlements, which open more works. Self-limiting in principle, since
  each teaching also costs a wonder. Not measured.
- **The refusers still never get a work at all**, at any threshold. That is
  intended — the works are what the settled do — but it means three of the nine
  chips are permanently dead for a refusing doctrine, which is a third of the
  row, and OP-23 should know it.
- **The original question is still unanswered.** Nobody has played the middle
  years and mapped which turns go by without hesitation. That was what this entry
  was opened about and it needs a person, not the harness.

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

### A second played game, 25 August 2026, and it is a different line from the first

The first was a **pure refuser**: 108 to 75, no farmland at all, nine settlements
sitting at Dunbar. The second is a **hybrid** — a magical enclave walled off with
mountains and water, agricultural settlements founded in the middle to compete —
and it went **73 to 83**, a narrow loss after leading for part of the game,
against a rival holding a 900-strong city and six towns.

**Two people-played lines, two different shapes, neither winning by fiat.** That
is the thing this open point has been asking for since it was raised: the fiction
requires the argument to stay open, and a board that can be played two ways with
the result in doubt to the last year is the argument staying open. The reported
experience — *"anything can happen, and I wasn't able to gain a substantial
advantage"* — is the answer in the register's own terms.

A third line is also reported working and is not measured: **walling the rival in
with mountains and water.** Worth noting that this makes *Raise mountains* and
*Drown* strategic terrain-shaping rather than harassment, which is not how either
was priced.

**This does not close the entry**, because the matrix still says Haunt 55% and
Bands 34% against Cities, and because two games are two games. It does mean the
central dilemma has stopped being decorative. See A-19 for the ruling that came
out of the same game.

**A third position on the question arrives August 2026, and it is not a
rebalance.** The pastoralists (`ideas.md`, live entry OP-12) are neither refusal
nor conviction but *let them keep animals and keep moving* — which gives Storm &
Sky the stance `concept/lore.md` never had for them, and gives the dropdown a
fourth theology rather than a fourth set of weights. Whether the line is *viable*
is OP-12's problem. Whether the argument is better for having a third side in it
is this one's, and it is: a two-sided argument the numbers have already decided is
a verdict, and a three-sided one is harder to deliver by fiat.

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

**And the same formula was measured from the other end in play, 25 August 2026 —
where it turned out to be a feature and was ruled one.** Three settlements taught,
three working stones, **zero wonders lost at year forty**. A hybrid player kept
every wonder in the game while running an agricultural arm, because a walled
magical enclave is an excellent place to grow stones.

**That is deliberate and stays. See A-19.** The arc is a theme rather than a law,
`concept/concept.md` already says a well-played game can hold a great deal of the
fading off, and this is a player doing exactly that at real cost — three stones
held for forty years, two wonders spent on terrain instead of on the rival, and a
narrow loss on points anyway.

Note what this does *not* excuse. The refuser case above is still a defect: the
hybrid pays for the cancellation and the refuser gets it against a count of zero.
Fixing one must not re-break the other, which is the reason both readings are
recorded here together rather than in separate entries.

**Instrumentation this now wants:** the wonder count as its own series over a
game, which OP-20 already asks for and nobody has built. Holding the arc off
should be an achievement. If the row is still full at year forty across several
played games, the brake is too generous.

**Two smaller readings of the same board.** Six settlements at exactly 150 read as
a rule rather than as places — jittering the untaught cap per settlement by ±15%
off `t.seed`, which already exists per tile, would cost nothing and is still true
to *Dunbar is social*. And the final board was OP-15's **Polytheism** almost
exactly, two territories divided by a mountain spine and water — but at 108 to 75
it would not have fired, which suggests the near-tie condition on that ending is
wrong.

### Which rule is doing what — leave-one-out

30 games per cell, seeds split, each row the whole batch minus one rule.

| | Cities | Haunt | Bands |
|---|---|---|---|
| shipped | 53% | 17% | 10% |
| the whole batch | 40% | 77% | 67% |
| without `logistic` | 53% | 63% | **23%** |
| without `teaching` | 47% | 57% | 47% |
| without `taughtLoss` | 40% | 77% | 67% |
| without `audible77` | 40% | 77% | 67% |
| without `fade` | 37% | 67% | 53% |
| without `exitLane` | **53%** | 77% | 67% |

**`logistic` is the batch.** Bands falls 67 → 23 without it. Cutting blessing from
3 to 2 was worth only 12 points by comparison, so **A-09 is not reopened** — that
was proposed on the reading of one played game and withdrawn on measurement. The
per-tile premium is not what makes the magical line work; capping settlement
production is.

### Three decisions taken on this table

**The overshoot stands for now.** Haunt at 77% and Bands at 67% are higher than
*possible, and hard* wants, and `r`, the taught caps, and A-14's reckoning budget
are the three ways down. Left alone deliberately — the batch is not finished, and
tuning an unfinished rule set means tuning it twice.

**`exitLane`'s rate is kept, and is now a decision rather than an accident.** It
arrived attached to the entombment fix and was never argued; measured, it costs
Cities 13 points, because ploughing one tile a year in the first ring instead of
three is a straight nerf to settlements. **Settlements should be nerfed, and one
tile a year is enough.** The two halves of the flag are separable and both stay:
the never-seal-a-place-in invariant is the bug fix, the rate is the balance change.

**`taughtLoss` and `audible77` are kept against a null result, on purpose.** Both
measure at exactly zero — not a small effect, no effect. Both are rules about
*choices*: when to spend a wonder, whether to keep a settlement small enough to
hear you. A one-ply greedy chooser makes neither, so **the harness is structurally
incapable of seeing what they are for.** They are for players.

This is the first thing in the project kept against its own measurement, and it
should be uncomfortable, so it is written down rather than left implicit. Two
consequences follow:

- **Neither is dead code and neither should be cleaned up.** If someone later finds
  a flag with no measured effect and removes it, this paragraph is why not.
- **Re-measure both the moment OP-01 improves.** A chooser that can plan two moves
  is the first thing that could give either of them a number. If they still measure
  zero against an opponent that can see a wonder coming, that is a different result
  and this decision should be revisited.

### Also settled in this batch, and unbuilt

Small rules that arrived with OP-19 and have no question of their own. Recorded
here so they are not lost between a settled argument and an unwritten design doc.
Flags are declared in `FG.R2` and do nothing yet.

| Flag | Rule | Why |
|---|---|---|
| `split2` | **Built, August 2026 — and it was a repair.** See A-20 and A-21. |
| `barren3` | Withered ground stays barren three years before a settlement may plough it again | The immediate effect is currently unnoticeable — reckoning resumes the very next `worldTick`. The permanent cost already in the code stays: re-reckoning re-spends the settlement's 30-tile lifetime budget, which is real and invisible. Tilts magical, which is wanted. |
| `landGates` | See OP-05 | |
| `pathFrac` | See A-18 | |
| `unmake`, `encircle` | **Both built, August 2026.** See OP-16 and A-22, OP-20 and A-23. | |

### Answered, August 2026 — and by a fifth candidate none of the four below is

**`dreamTeach`, built and on by default.** Rick's tactic in play is a magical
enclave sealed behind mountains and water plus an agricultural arm out in the
open competing with the rival, and it exposed the real shape of this question:
the two halves of that game cannot be walked between, because the agricultural
half ploughs itself shut. Every candidate below answers that by weakening
presence. This one keeps presence and moves it.

**Teaching reaches wherever a wonder reaches** — beside you, or within range of a
working stone. It is free in person and costs **10% of your manifestation,
permanently**, at range. The lore did not have to bend for it: OP-16 already
draws the line at *creation at a distance, unmaking only in person*, and teaching
is creation. What the old rule had was not a principle but an accident of which
functions happened to exist.

**The second price is the good part and nobody had to write it.** Teaching them
to till makes them plough; ploughing eats the blessed ground a stone stands in; a
stone under `MINREG` stops working; and a working stone is what carried the
dream. Teaching at range destroys the channel that carried it. No cap, no
counter, no timer — A-10 is untouched.

Measured: it moves no win rate at 30 games a cell, which is the expected null and
the same one `taughtLoss` and `audible77` returned, for the same reason — a
one-ply chooser does not value its own body. What it does move is the drain.
Cities and Mixed arrive at year forty with **0.54 and 0.49 of themselves**;
Haunt and Bands never pay it at all, because they never teach. Full numbers in
`design/rules.md` §11.

**This is the first thing that makes OP-14's zero state reachable**, and that is
worth as much as the answer to this question. See OP-14.

**Still open, and only a person can close it:** whether the drain reads as a
decision or as a punishment. That is OP-21's instrument, not the harness's.

### The four candidates this replaces, kept for the record

Teaching-in-person was the design intent and was not in question. *Where* the
teaching happens was:

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

### Built, August 2026 — with the choice taken out of it and one rule added

`FG.R2.encircle`, 1.9, on by default. Two years ringed and the place changes
hands.

**The taboo is not offered, it is what happens.** Rick's call, and it removes the
entry's hardest problem rather than answering it. A captured ringed-in place is
forbidden **both teachings, for good** — it cannot be taught to till or to kill
by anybody, ever. There is no question asked at the moment of capture and no
version of the mechanic in which you take the place and leave it loud.

**Nothing is credited for forbidding, and the entry above is wrong about needing
it.** That paragraph — *it returns the wonder that teaching cost, without which
nobody would ever choose taboo* — was written when taboo was a choice. It is not
one now, so there is nothing to make attractive. And the wonder moves anyway,
because `lostCount` is derived from the board: un-teaching the place drops the
count of **whoever owned it**, so the wonder goes back to the side that lost the
loud city. That is exactly what already happens when a taught city is taken by
levy, it needs no bookkeeping, and it is the right reading — the fading is caused
by your own people ceasing to hear you, so it lifts when they stop being yours.

**Which makes the trade sharper than the entry imagined.** Encircling a loud
place of theirs stops their farmland engine, gains you three points of
settlement, and **hands them back a wonder.** You make your rival weaker
agriculturally and more dangerous magically, in one act. Nobody designed that; it
is what the derived count already said.

**A rule had to be added, and it is A-23.** A besieged settlement does not
plough. Without it a taught place broke every siege in one season and was
structurally immune to the mechanic written to take it. It also hands the
defender the counter this entry had no answer for: break the ring and the fields
resume the same year.

**The emptying is built and the people are real.** `carryCap` drops to Dunbar the
moment the place is untaught, so the decline needs no special case at all — the
floor at 28% a year was already there. The ones who leave become refugee columns
on §7's machinery, and **they walk back to the country of the power that lost
them**, because they are leaving over the plough and they go where ploughing is
still allowed. So forbidding a loud place makes the rival's *next* town bigger.
Silence is not achieved; loudness is moved.

### What is still open

- **The wonder count as its own series is still not built.** This entry has asked
  for it twice and A-19 asks for it a third time. It is now the single most
  wanted piece of instrumentation in the project.
- **Is it too good?** Measured alone, 80 games a cell against Cities: Cities 50 →
  56, Mixed 34 → 40, Haunt 55 → 70, Bands 34 → 44. Everything goes up, blessing
  doctrines most. With 1.6 and 1.8 alongside it the batch lands at 34 / 36 / 54 /
  29. **Left untuned** — see the standing rule about tuning an unfinished rule
  set twice.
- **The matrix undercounts this rule and always will.** A one-ply chooser never
  builds a ring on purpose; every capture measured is an accident of blessing,
  0.2–0.5 a game. A player aiming at it does much better, and taking a *mature*
  city requires Withering its fields first — a three-stage siege no chooser will
  ever attempt. OP-01.
- **It costs the second mover's advantage.** A ring resolves at the end of the
  year, so whoever acts second has the last word on whether it is whole. See
  A-22's table: Cities' turn-order bias goes from −1.1 to −19.4 across the three
  new rules. That is OP-21's problem more than this one's.
- **The taboo has no cap and needs none yet**, on the same reasoning as before:
  the cost of the siege limits it. Unmeasured, because nothing sieges on purpose.
- **Does forbidding un-reckon the ground?** Built as *no* — the fields stay, they
  are simply never extended. Wither is still the only thing that undoes farmland.
  OP-17's fill colour now has to say *forbidden*, and today it is a thin inner
  ring and the settlement list saying so.

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

### A patch exists, and measuring it did not go as argued

`FG.HANDICAP` blesses N tiles for the right-hand seat at year one, exposed in the
build as *even the map* and **off by default**. It was put in for OP-21 on a
clean-looking argument: a blessed tile is worth 3, the measured bias is +4.0, so
one tile very nearly cancels it.

**The argument does not survive contact with `sim/handicap.js`.** Mirror matches,
seeds split between both orders so turn order cancels, mean margin left minus
right:

| Doctrine | No tile | One tile | Moved by | Games/cell |
|---|---|---|---|---|
| Cities | +6.8 ± 4.1 | +3.5 ± 4.1 | −3.3 | 160 |
| Haunt | +0.2 ± 3.5 | −7.7 ± 3.3 | −7.9 | 160 |
| Bands | −0.4 ± 2.8 | +2.6 ± 2.6 | **+3.0** | 400 |

Three things, and the third is the one that matters.

**It is not worth a flat 3 points.** Haunt moved nearly 8. A blessed tile is not
only 3 points of score — it enlarges the connected region a stone's power is
measured over, and it gives a tile to bless outward from.

**It may not even point the same way for every doctrine.** Bands moved the wrong
way. At 160 games that looked like +10.8 and alarming; at 400 it is +3.0 ± 3.8
and is noise. Which is the honest state: **not resolved**, not refuted.

**Nothing here is resolved at these sample sizes.** OP-07's own +4.0 ± 1.4 took
1,160 games. These cells are 160 and 400, and every difference above is inside
one to two standard errors. The likely mechanism is OP-01 again: a pre-blessed
start tile lowers `blessGain` where the token is standing, so a one-ply chooser
takes a different first act and the game diverges from there. That is an AI
effect, not a fairness effect.

**Disposition: the toggle ships, off, and is documented as unvalidated.** If the
doctrine-dependence is real it has exactly the disease A-17's bias has — a bias
whose sign depends on how you play cannot be corrected by a static handout to one
seat — and the answer for both is the same one, in OP-21: let the second player
choose their seat.

**Settled by:** ~1,000 games a cell across all four doctrines, which is an
overnight run and nobody has done it. Until then the generator is still the thing
that is actually wrong, and fixing `gen()` beats compensating for it.

## OP-08 · low · Twenty turns or forty?

Twenty balances more easily and is the length originally wanted. Forty is the only
length at which the walls, the wonder ladder, and the marching armies have room to
matter. Currently forty, somewhat against the earlier instinct for brevity.

**Settled by:** playing both. The knob is in the build.

## OP-22 · low · Years or generations?

**Raised August 2026.** Forty turns are currently counted in years. The proposal is
to count them in **generations**, which puts the game at roughly a thousand years
end to end. Mostly a label — and the parts that are not a label are gains.

**It makes the demography honest.** Twenty-two per cent growth a *year* is nonsense
that survives only because nobody reads it as demography. `r` = 0.32 a generation
against `K` at Dunbar is a real population model, and OP-19's logistic curve was
written at generational scale without anyone saying so. A settlement clearing three
tiles a generation is a clearance; three tiles a year is a lawn. Six wonders lost
over forty years is a busy fortnight; over a thousand years it is a civilisation.

**And it is the unit the other two August ideas are denominated in.** *Every
generation the people add to the stones* only parses if a turn is a generation, and
a herd covering one tile a turn is a migration at generational scale and a confused
army at annual scale. See `ideas.md`.

**The one real cost is marching.** §7 moves armies and refugee columns one tile a
year. One tile a *generation* is twenty-five years to cross a hex — absurd as an
army, and fine as a war, a feud, or a migration. Refugee columns improve: *the
column comes in at last* already reads like something that took decades. The levy
wants renaming. OP-20's two-turn encirclement becomes a fifty-year siege, which is
arguably better — a god starving a city over two lifetimes is the right register —
but it should be chosen rather than discovered.

**Cheapest implementation, and probably also the best: leave `G.year` alone in the
engine and change only the label.** Show the turn as the generation count with an
era beside it — *the twelfth generation · year 300* — which buys the scale for
free, keeps all eighty-nine code sites and every chronicle line untouched, and
avoids false precision about how long a generation was. `concept/concept.md`'s
*over forty years* wants a pass, and so does the interface ambition at the end of
it, which reads better at this scale than it did at the old one.

**Settled by:** deciding what a levy is. That is the only question in it. The rest
is text.

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

## OP-12 · medium · The third leg was never built

The rock-paper-scissors design called for wandering hosts — mobile, holding no
ground, beating cities and losing to blessed ground. It was designed and never
implemented. The game currently has two legs, not three.

**A candidate arrived August 2026, and it is far better motivated than this
entry.** The **pastoralists** in `ideas.md` are the same mechanic reached from
history rather than from the diagram: a third entry in `FG.TEACH` beside *till* and
*kill*, teachable only to a people who never learned the plough, and only once
somebody somewhere has ploughed. The objection this entry never answered — what
stops a host — is answered there twice, and it brings a second mechanic with it in
the **kurgans**, which give OP-16's paved stones a disposition other than
attrition.

**Raised from low to medium on that account, and blocked on OP-19.** `FG.R2` is
measured and explicitly not tuned down — Haunt at 77–80% against a target of
*possible, and hard*. A third leg laid on an untuned second leg is the trap OP-19
already names: tuning an unfinished rule set means tuning it twice. The order is
tune the batch, close it, then measure this.

**Settled by:** as before — deciding whether two legs are enough. The difference is
that there is now something concrete to say no to.

### Built, August 2026 — and it ships off

`FG.R2.herds`, 1.19. `design/rules.md` §16 is the rule; **A-24**, **A-25** and
**A-26** are the three decisions it was built on, all three taken by Rick before a
line was written. The blocking condition this entry recorded — *do not tune an
unfinished rule set* — was not waived. It was **stepped around**: the rule is
built, tested and off, so the batch of 1.6 / 1.8 / 1.9 remains exactly the thing
that has been measured and played, and this sits beside it rather than on top.

**It is the first flag in the project that is built and off**, and that broke an
equivalence the harness had been leaning on: `FG.R2built(true)` used to mean both
*everything built* and *the game*. It does not any more. `FG.R2reset()` is the
game, and `sim/smoke.js` now freezes a fingerprint of that as well as of the
pre-batch baseline — the old one only ever asserted that a new rule could not
reach `R2all(false)`, which is a claim about a game nobody plays.

**The shape of it, in one paragraph.** A settlement never shown the plough may be
taught to herd, once somebody somewhere has broken ground. It stops being a
settlement: it walks a tile a year, holds nothing, scores nothing, costs no
wonder, carries the Seventy-Seven, and grazes the farmland it stands on back to
wild and barren. It moves the way the *player* does rather than the way an army
does — the other power's blessing is closed country to it, because a people who
were never taught the plough can still hear. It stops when you tell it to,
standing on it, and comes back untaught. And on a stone of yours that has gone
under somebody's fields, it may raise a kurgan.

**The objection this entry has always had to answer, and the answer.** *It is a
third door out of the central dilemma.* It is not a door, it is a **detour**: a
herd scores nothing while it roams and comes back untaught, so a player may walk
around the fork for twenty years and arrive at the same fork with fewer people.
The pairing that carries this is **no wonder, no points**, and neither half works
without the other — see A-24.

### One thing was found by playing it, in the way things get found here

A full game threw *a herd is standing on a settlement* in year 32 of seed 7. The
greedy chooser had dropped a colony straight onto a camp, because `foundBlock` had
never heard of herds. Found, colony and split all had to refuse a camp, and so did
Drown and Raise mountains — and `mountainLine` needed its own guard, because that
loop has always kept a private copy of the exclusions and only the aimed-at tile
was ever checked for anything.

Worth recording as a fourth instance of the standing lesson: **the legality test
and the thing that actually mutates the board are written twice in this engine,
and they drift.** A-20 was that, 1.9's ploughing-through-a-siege was that, and this
is that.

### What is still open

- **Nobody has played it.** That is the whole of it. It is off for that reason, and
  it should be turned on by a person reporting it better — the way the batch was —
  and not by a table.
- **The matrix says nothing, and always will.** 80 games a cell: the four standing
  doctrines are identical to the digit with the rule on and off, and `storm` wins
  63% without it and 61% with it. Over 300 games across every doctrine pairing the
  chooser taught herding 1.65 times a game, grazed 2.3 tiles, spent **more than
  half of every herd-year standing still**, settled a herd once, and raised zero
  kurgans. OP-01, and OP-21 is the instrument.
- **`storm` is a poor instrument for its own rule.** It wins 63% *without* herds —
  its weights are simply strong — so its win rate measures the weights and not the
  leg. If a number is wanted here, the comparison to run is storm against storm
  with the flag on one side only.
- **The availability condition gates harder than it looks.** Herding needs the
  plough to exist somewhere, and against a slow-ploughing opponent the first
  furrow lands around year 25. **A refuser cannot unlock herding on its own at
  all**, and in a refuser-against-refuser game it never becomes available. That is
  arguably right — no farming, no pastoralism — but it means the third leg only
  exists in games where the settled side is already turning the ratchet, and it
  can never be a plan you start with. Not a defect. Also not something anybody
  chose. It wants a decision.
- **A herd with nothing left to graze has no behaviour.** Half of all herd-years
  are spent standing still. Under the chooser that is OP-01, but the hole
  underneath is real: once the farmland in reach is grazed and barren there is
  nothing for a people to do, and the rule offers them nothing to be. *Stones that
  grow* in `ideas.md` is the obvious candidate — a herd standing where you can
  hear it ought to be doing something.
- **Nomad ⇄ settled cycling is unpriced.** A herd that stops is untaught, so it may
  be taught to herd again. Each cycle costs a year's intervention and most of the
  people, which is probably enough, and nothing has tested whether it is.
- **Kurgans gate nothing and score nothing**, deliberately, and are therefore
  currently unmeasurable. They exist for OP-15's *Forgotten*, and that ending is
  unwritten. If it stays unwritten, this half of the rule is decoration and should
  be cut. See OP-15 and OP-16.
- **`barren3` is now half-built and is a separate question.** Barren ground exists
  in the engine; whether *Wither* should also leave it is unmeasured beyond one
  row, and that row moves four numbers — cities 34→39, mixed 36→44, haunt 54→50,
  bands 29→26. It is off. It is not this rule and must not be turned on with it.

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

**Kurgans are now built, and this entry is what they are for.** August 2026, inside
1.19 — see OP-12 and OP-16. `FG.moundCount(who)` exists, is on the board and in
the stat bar, gates nothing and scores nothing, and reads from state this entry's
own admission test already allows. **Nothing else in the game consults it.**

That makes this entry the blocker on half of a built rule, which it has never been
before. A kurgan is a disposition for a stone that has gone under farmland and its
only purpose is to be read at the end. **If the endings never get written, the
mounds are decoration and should be cut** — which is the cleanest argument this
register has ever had for writing them.

**Kurgans give *Forgotten* something to be escaped by**, August 2026. As drafted
it reads *too few stones standing at the end, whatever the score*, and under
OP-16's numbers that is very nearly a measure of how much farmland the rival built
— which makes it closer to a second scoreboard than to a reading. If a herding
people can raise a mound over a paved stone (`ideas.md`), the ending becomes
something a player can act against late in the game, and **A stone in a field**
becomes literal rather than figurative. Both still read from state already tracked,
so the test at the head of this entry is not weakened.

## OP-23 · medium · The interface is a laboratory with a game in it

**Raised August 2026, from reading the build rather than playing it.** The page
interleaves two documents that have nothing to do with each other. One is the
valley — on the road, the interventions, the stones, the settlements, the chart,
the chronicle. The other is the *instrument*: which rules, the knobs, the other
seat, even the map. A slider reading `growth per year · 22%` eight pixels under
the chronicle does more damage to the register `concept/concept.md` specifies than
any colour decision in OP-17.

**The split is not a matter of taste, and the code says so.** Almost every control
in the instrument half restarts the game when touched — `even` (`ui.js:788`),
every R2 checkbox (`:763`), both presets (`:765–766`), the knobs by way of
*Restart with these*, and choosing the human seat (`:784`). The single exception is
swapping one machine doctrine for another mid-game, which is a debugging
affordance rather than something a player does. **They are year-one controls.**
They belong on the way in, behind one door, not beside the board.

### What went in

- **`the terms`** — one dialog holding the other seat, the hand-over and
  even-the-map toggles, which rules, and the knobs. One door, not two: they are
  the same category of object.
- **`what this is`** — the epigraph and the two paragraphs of premise, behind a
  button. The epigraph stays on the page as the header's subtitle, because it is
  one line and it is the whole thesis.
- **The chronicle folds shut by default.** `render()` used to force it open every
  frame (`$("logwrap").open = !pvp()`), which meant it could not be dismissed.

### The regression this knowingly takes

`7623cee` put the primer on the page *deliberately*, so that "somebody opening
this for the first time now learns the ratchet — blessed ground, reckoned ground,
and that your own farmland walls you out — before they are asked to make a
decision about it." Nothing else on the page teaches the ratchet; the key under
the board names the colours and does not say that one erases the other. Hiding it
reverses that decision on purpose, for a quieter page.

**Settled by:** watching somebody who has never seen it open the build, and seeing
whether they find `what this is` before year five, or ever. If they do not and the
ratchet surprises them, the answer is probably a line in the key rather than the
paragraphs coming back.

### The interventions move under the board

They were a 400px column beside the board. Two things were wrong with that, and
only one of them was size. `design/rules.md` §2 marks **one act and one
intervention** load-bearing — they are the two halves of a year — and the two
halves were three hundred pixels apart, in different type, under different
headings.

They are now a row of chips directly beneath the act row. **The list stays a
list**, because its shrinking is the story: §6 says the loss order matters
emotionally as much as mechanically, and the struck-out wonder is the best piece
of information design on the page. Lost wonders keep their place in the row,
struck through and dead; locked works keep theirs, dim.

**And the row does something the column could not.** `gone = i < lostN`, so
wonders die from the front of `FG.DIVINE`, and the works unlock in ladder order.
The row therefore **empties from the left and fills from the right**, turning from
blessing-green to farmland-ochre along a single horizontal axis over forty turns.
That is `ideas.md`'s *the interface becomes administrative over forty years*,
delivered by a layout decision rather than by a feature, and narrated by nothing.

**The hover problem solved itself.** The descriptions cannot live in tooltips —
`concept/` wants this playable on an iPad, and OP-21 names the tablet explicitly.
But arming is *already* two-step: the chip sets `ARM` and the tile is chosen
afterwards, with a `hintline` under the row that already says *choose an outlined
tile*. So the description goes into the confirmation step. Hover or keyboard-focus
a chip and the hintline carries its description; tap one on a tablet and the
description appears next to the target instruction, before anything is committed.
No tooltip was needed.

Chips are disabled by class rather than by the `disabled` attribute, so a locked
one still answers when you press it — *needs strength 9*, *nothing in reach*,
*gone* — instead of silently refusing.

### Tablets, with the arithmetic done properly

The board is 1272 × 717 at hex 50, aspect 1.775. **An 11-inch iPad is 1194 × 834
points in landscape**, which is the orientation this is meant to be played in; a
10.9-inch Air is 1180 × 820. Two consequences the register had not worked out:

**A note on the unit, because this register has been loose about it and the
stylesheet must not be.** Apple specifies a device in *points*; CSS lays out in
*px*. With `width=device-width, initial-scale=1` in the head — which this page has
— and a 2× display, they are the same number: an 11-inch iPad reports an
`innerWidth` of 1194. So every figure in this entry can be read either way, and
OP-21's *1194 points wide* was right. **CSS `pt` is a different unit entirely**,
one seventy-second of an inch and 1.333 px, and nothing in `game/index.html` may
ever be written in it. The board cap is `calc((100vh - 340px) * 1.775)`, and
tidying that `340px` to `340pt` would quietly make it 453 and take a hundred and
forty-five pixels off the board.

- **The stacking breakpoint was in the wrong place.** `max-width:1180px` catches
  the Air exactly and misses the 11-inch Pro by fourteen points, so that device
  kept the two-column layout and drew a 792px board — hexes at 31 for art authored
  at 50. Moved to 1280.
- **Height, not width, is the binding constraint, and it does not fit.** Landscape
  gives about 745 points of viewport under Safari's chrome. Measured in a real
  browser at 1194 × 745: header 81, stat bar 64, key 29, act row 52, chip row 60,
  hint 26 — **312 points of chrome**, leaving 433 for a board whose aspect is
  1.775. A board that fits is 769 wide. Hex 30, for art authored at 50.

So the board's column is capped by the height available rather than by the window
— `min(1272px, max(880px, (100vh − 340px) × 1.775))` — **and the 880 floor is
there deliberately.** Without it the arithmetic runs away: shrinking the board
narrows the chip row, which wraps onto more lines, which demands a smaller board.
Two iterations of that put the board at 719 in a 1154 window, a postage stamp
inside empty margins, which is worse than a short scroll. The floor stops it.

**What the trade actually is, measured rather than argued.** On an 11-inch iPad in
landscape the board is **880 wide — hex 35, against 792 and hex 31 before this
change** — the stat bar, the whole board and the act row are above the fold, and
the chip row and hint line sit about 60 points below it. On a 1440 × 900 laptop
and anything larger, everything fits with room to spare. That is better than the
build had, and it is not what this set out to do, which was everything visible at
once. A 14 × 9 board at a readable hex size plus two control rows does not fit in
745 points, and no amount of layout makes it.

**Also settled by playing**, on the device, in landscape. The three candidates if
hex 35 reads badly are folding the key into `what this is` (29 points), shortening
the intervention names so the chip row holds one line (up to 60), and
`design/rules.md` §1's grid — which is marked load-bearing at 14 × 9 and is
therefore the last thing to touch, not the first.

### Four labelled rows, August 2026 — Rick's layout, and it costs nothing

**Changed on request, and the ordering is the argument.** One act row plus one
flowing chip row became four labelled rows: **action · wonders · teach · works.**
Read down, that is the game — here is what you may do, here is what you still
have, here is the one thing that trades the one for the other, and here is what
it bought. The act row gains a label so it is one of the four rather than a
different kind of object sitting above them.

**Teaching now sits physically between the two ladders it moves in opposite
directions.** The single flowing row could not show that, because it put all
three groups on one line in whatever order they happened to wrap.

**What this knowingly gives up.** The old row turned from blessing-green to
farmland-ochre along one continuous horizontal axis over forty years, and that
was the best thing about it. The gradient now runs down the rows rather than
across them. Still there, still narrated by nothing — one axis rotated, not an
axis lost. Each row still empties from the left and fills from the right.

**And it costs no screen at all, which was the thing to check.** Measured in a
real browser at six sizes rather than asserted, because that is why this entry
exists:

| | Board | Chrome below the board | Against the fold |
|---|---|---|---|
| iPad 11 landscape, 1194 × 745 | 880 (unchanged) | 4 rows, 117px | 102px below — **was 108** |
| iPad Air, 1180 × 820 | 880 (unchanged) | " | 27px below |
| Laptop 1440 × 900 | 994 (unchanged) | " | 12px below — **was 18** |
| Desktop 1920 × 1080 | 1272 (unchanged) | " | all above the fold |

Six pixels *shorter* than the two-row version. The fixed, right-aligned label
column is tighter than the old flowing `gap: 5px 14px`, and four short rows wrap
less than two long ones. No board size changed anywhere.

### A latent layout bug this surfaced, and it had been there all along

`.play` carries `margin: 0 auto` and is a grid item. **Auto inline margins make a
grid item shrink-to-fit rather than stretch**, so the playing column has always
sized itself to its widest child's max-content, and the `max-width` cap that this
entry's whole tablet argument rests on was only ever reached by accident — the
old single chip row happened to be wider than the cap, so the cap won.

Restacked into four rows, the widest child became the six wonder chips at 803px,
and **the board silently dropped from 994 to 803 on a laptop** — a 19% smaller
board caused by a layout change two hundred pixels away, with nothing in the
stylesheet appearing to have anything to do with it. Fixed by `width: 100%`,
which is what the cap was always written to assume.

Worth recording as a shape rather than a fix: *the board's width was
load-bearing on the width of the chip row.* Nobody would have looked for that,
and it was found only because the board is measured in a browser after every
layout change. That habit is the whole of what this open point bought.

**Also:** `strength` and `past 800` came off the status line. Neither gates
anything since 1.18 — the works read `taughtCount` now — and a number on screen
that no rule consults is worse than absent, because it reads as a thing to aim
at. Dropping them is also what lets the tally sit beside the works rather than
taking a fifth row.

**Still settled by:** playing it, on the device, in landscape. The four-row
layout does not change that and the 102px below the fold is unchanged in
character from before — the stat bar, the board and the action row are above it,
and the three chip rows and the hint are the short scroll.

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
- **OP-13 — settled, August 2026, as A-28, and this interaction is now live.**
  Dead stones carry orders, so silencing a rival's stone *hands them a relay*.
  It is the same push toward administration OP-13 always described, and it is now
  a thing that can actually happen on a board: an attacker who besieges a holy
  place and wins converts it from a shrine into a command post for the defender.
  Nothing has measured whether that is funny or annoying. **It is the first thing
  a played game should be watched for**, and OP-21 is the instrument.

**And a third thing about stones arrived with the same batch (A-27).** A stone now
gains a course while the audible stand in its reach, and the course lowers the
working threshold. That does *not* touch the 92% — a stone under farmland stands in
no blessed ground and three courses do not save it — but it means the question this
entry displaces has a second half now: **what a grown stone is worth is decided by
whoever paves it over**, and clearance aimed at a stone is still undocumented and
still unmeasured.

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

### Built, August 2026 — the split is in, and it is a rule about presence

`FG.R2.unmake`, 1.8, on by default. **Taking the other power's blessing returns
it to wild.** The test is presence rather than which spell it is: Bless always
unmakes, Quicken unmakes only within arm's reach and takes wild ground at range.
See **A-22** for the reasoning, the numbers, and the thing it turned out to be
about, which is turn order and not blessing.

**What this closes:** the reach complaint that opened the argument. Quicken can
no longer skip the siege, and its reach did not have to be cut to achieve it —
which the entry itself had warned would be a net nerf to the magical player.

**What it does not close, and it is the larger half.** Blessing accounts for 1%
of silenced stones and farmland for 92%, and *Clearance can still be aimed at a
stone*. That is the question this entry named as the real one and then did not
answer, and 1.8 does not touch it. It is still open, still undocumented in the
build, and still unmeasured. **The flip-flopping watch is also unfired:** nobody
has counted tiles changing hands more than three times, and under 1.8 a
contested tile now takes two acts to flip rather than one, which should make
flip-flopping less attractive and has not been checked.

### A third disposition for a paved stone, August 2026

Neither silencing nor restoration. A **kurgan** — a herding people raising a burial
mound over a stone that has already gone under farmland — leaves the ground
reckoned and the stone dead, and makes it count as a monument *standing*. See the
pastoralists in `ideas.md`, and OP-12.

It does not touch the Bless/Quicken split scheduled above, which is about the 1%.
It is an answer to the question this register said was the real one and then did
not answer: **what the other 92% are for.** They are not a loss to be reversed.
They are what the people build on top of once they have stopped hearing you, which
is the thesis with a mound over it.

**Built, August 2026, inside 1.19.** A herd standing on farmland over a stone of
**its own god** that has already stopped working may raise a mound: a fifth of
them, and the year. The ground stays reckoned and stays whosever ploughed it — if
raising a mound cleared its own tile, herding would be a permanent tile-conversion
engine with a monument bolted on, and this entry says so already. The stone counts
as *standing* and never works, never blesses, is never targeted through, and never
touches the wonder brake. One grave to a stone. See OP-12 and `design/rules.md`
§16.

**What that does and does not settle here.** It gives the 92% a disposition, which
is what this section asked for. It does **not** touch the larger half above —
*Clearance can still be aimed at a stone, on purpose, and is indistinguishable in
the log from a settlement paving one by accident.* That is still open, still
undocumented in the build, and still unmeasured, and 1.19 does not go near it.

**And a mound currently gates nothing and scores nothing**, deliberately. Its
whole purpose is OP-15's *Forgotten*, and that ending does not exist. `moundCount`
is tracked and shown against the day it does. If that day does not come, this is
decoration and should be cut.
