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

**Settled by:** playing a full game in it. Stills cannot answer OP-03 or OP-05,
and both are partly art questions. Note that a still is now *worse* than the
running game, since sparkle carries real information — this build must not be
judged from screenshots.

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
