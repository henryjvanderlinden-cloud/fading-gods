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

## OP-06 · high · Does an ascetic strategy ever win?

**Raised from medium.** Re-measured against the game itself, Bands wins 8% against
Cities and 24% across all matchups; Haunt, the pure-blessing line, wins 13% and
40%. The old figures of 33% and 42–56% came from a simulator that was not this
game. Cities wins 78% of everything it plays.

The central dilemma is currently decorative. Two things must be separated before
tuning anything, because they are confounded:

- **Turn order** (OP-17) is worth roughly 35 points to a blessing doctrine, and
  the human seat always has the bad side of it.
- **The one-ply AI** (OP-01) plays blessing badly in a way it does not play
  founding badly — greedy tile-count maximisation is close to correct for Cities
  and visibly wrong for Bands, which needs to split at the right moment rather
  than the most immediately profitable one.

**Settled by:** fixing OP-17 and OP-01 first, then re-running the matrix, and only
then tuning. Tuning now would be tuning against the AI's blind spots. If the
magical side is still at 20% afterwards, the honest options are to accept that the
viable magical line is *few settlements and many stones* and rename the doctrine,
or to make blessing worth more, which A-09 shows is the lever that actually moves
this.

## OP-07 · medium · Map generation is unexamined

The generator makes blob islands with smoothed noise. It has never been checked for
whether it produces chokepoints, isthmuses, or interesting asymmetries — all of
which matter now that terrain can be created and destroyed.

**One asymmetry is now measured, and it is not interesting, it is just unfair.**
With turn order neutralised (OP-17), the left-hand seat still finishes **+4.0 ±
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

## OP-14 · high · Can you walk on reckoned ground if it ages you?

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

## OP-17 · high · Acting second is worth 35 points to a blessing doctrine

Bless overwrites the other side's blessing, so when both powers bless contested
ground in the same year, whoever acts second keeps it. Measured in mirror
matches: Haunt swings 28% → 68% by moving second, Bands 35% → 68%, Mixed 55% →
38%, Cities 57% → 53%.

**In the build, you always act first.** The human seat is structurally on the bad
side of this, and it is worst for exactly the doctrines that are already losing —
which means OP-06 cannot be answered until this is.

### Two candidate fixes implemented and measured. Both fail.

Mean turn-order swing across the four doctrines, mirror matches, 40 games each:

| Rule | Mean swing |
|---|---|
| As built | **24%** |
| Contested ground goes to neither | **41%** — much worse |
| Bless takes only wild ground | **26%** — no better |

**Contested ground goes to neither** (`FG.CONTEST`, off by default, kept as a
toggle). Ground both powers take in the same year reverts to wild. It converts a
second-mover advantage into a *larger* first-mover one: Haunt went from 28%/68%
to 88%/8%. Two things were learned building it:

- The first version counted a power merely *asserting* ground, so re-blessing
  what you already held defended it. That made every overlap mutually
  destructive and was worse still — swing 83%. Narrowing the claim to tiles that
  actually change hands helped, but not enough.
- The greedy AI made it worse in a way that is not the rule's fault. `blessGain`
  counts taking the other side's blessing, so the second mover walked into the
  contested zone every year and annihilated its own act. Teaching `blessGain`
  to discount ground the other power took this year recovered about ten points.
  That fix is in and is correct regardless of what happens to this rule — but
  note it implies an interface obligation: if contested ground is ever adopted,
  **the player must be able to see which ground changed hands this year**, and
  at present nothing on the map says so.

**Bless takes only wild ground** (`FG.BLESS_WILD_ONLY`, off by default). Removes
the overwrite entirely, which would also settle OP-16 for free. It does not help,
and it produces a large number of drawn games, which suggests it makes the board
less decisive rather than more fair.

### What the failures actually showed

The swing is two effects, not one, and they partly cancel:

- **The overwrite** favours whoever acts *second*, because they take fresh
  ground that has not yet scored.
- **First pick of open country** favours whoever acts *first*, and survives even
  when the overwrite is removed entirely — under wild-only, the first mover
  still wins nearly twice as often as the second.

Any rule that only addresses one of the two relocates the advantage rather than
removing it, which is exactly what the contested rule did.

### The third candidate works. Alternate the order year by year.

Run properly this time — `sim/order.js`, 300 mirror games per cell, ~3,500 games
in total. The statistic is the **mean score margin, p0 minus p1**, not the win
rate: a win rate throws away the size of every result and needs thousands of
games to see a ten-point effect. Zero is fair.

| Doctrine | You first | Rival first | Seat swing | Alternating |
|---|---|---|---|---|
| Cities | +13.0 ± 3.0 | −1.9 ± 3.2 | 14.9 | +5.2 ± 2.9 |
| Bands | −6.5 ± 3.3 | +10.1 ± 3.2 | 16.6 | +6.6 ± 3.2 |
| Mixed | +3.1 ± 2.3 | −1.1 ± 2.4 | 4.2 | +2.9 ± 2.2 |
| Haunt | −16.8 ± 2.6 | +14.1 ± 2.7 | **30.9** | **+0.8 ± 2.7** |

Note the sign. Cities does *better* going first — first pick of open country —
while Bands and Haunt do better going second, from the overwrite. The two
effects are real, opposed, and of similar size, which is why every rule that
addressed only one of them made things worse.

Alternating removes the turn-order effect: a mean of 9.7 points across the four,
and for Haunt, the worst case, 30.9 points collapse to 0.8 ± 2.7 —
indistinguishable from zero. Re-run on a fresh seed block (900–939) it held at
−1.2 ± 2.5.

**Adopt it.** It is the only candidate that averages both effects rather than
trading one for the other, and unlike simultaneous resolution it needs no new
concept — the two of you simply do not always move in the same order.

**What it costs.** A rule change with an interface consequence, which is why it
is not already in. In a rival-first year the rival must move *before* you, so
the build needs a phase it does not currently have: resolve the rival, draw it,
then let the player act. `endYear()` currently runs the rival and the world
together. The engine change is small; the honest part is that the player has to
be able to see it happen, and the chronicle should probably say whose year it
was.

### What is left over, and it is not turn order

With the order alternating, p0 still ends **+4.0 ± 1.4 points ahead** across
1,160 mirror games — nearly three standard errors, so real. That is the *starting
positions*, not the order: p0 begins on the left of the valley and p1 on the
right, and the generator has never been asked whether those two halves are worth
the same. It is small next to the 30 points turn order was worth, and it belongs
to OP-07 rather than here.

**Settled by:** wiring alternating order into the engine and the build, then
re-running `node sim/order.js report` to confirm the effect stays gone once a
human is in the loop rather than a doctrine.
