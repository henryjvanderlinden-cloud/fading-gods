# Rejected

Ideas that were tried and cut, with the reason. This register exists because in a
few weeks several of these will look salvageable again, and they are not. Where a
number is given, it was measured over 40+ games.

---

## Attention as currency

**What:** a fixed budget of audiences each turn, spent on situations that arrive.

**Why out:** subtractive. Nothing accumulates, there is no surplus, and therefore
no short-, medium-, or long-term planning — the thing most enjoyed about Civ. Every
choice is a denial rather than a construction. Playtested and found actively
unpleasant.

**Do not revive as:** "attention, but it accumulates." That is just a resource, and
the design already has better ones.

## Delegates with hidden natures as the core loop

**What:** a court of named people with concealed personalities, cast at problems;
repeated casting crystallises them into permanent offices.

**Why out:** the mechanic is good and the game around it was wrong. It tested
*watching* rather than *playing*. Partially survives as an idea for cohort
character at founding.

**Prototype kept:** the crystallisation logic is worth re-reading if delegates ever
return.

## The reverse tech tree as global decay

**What:** magic fades on a timer as population rises; you rebuild lost capabilities
as institutions.

**Why out:** a timer is weather. You cannot cause it, plan around it, or trade
against it. Replaced by the paired exchange, which is the same arc as a series of
priced decisions.

## Epochs and dealt empires

**What:** the game divided into ages, with the player handed a different
civilisation each age.

**Why out:** specific to *A Brief History of the World* rather than to what was
liked about it. The sweep comes from one continuous timeline and a map that
accumulates.

## LLM-driven delegates and rivals

**What:** advisors and opposing powers reasoning in natural language.

**Why out:** cost, latency, and grounding — an LLM will fluently propose things the
simulation cannot represent and the seams show immediately. Cut before any
implementation. Nothing in the current design has a place for it.

## Any combat system

**What:** units, stacks, battle resolution.

**Why out:** never needed. Conflict resolves through ground, cult, and whether an
army arrives. Adding it would roughly double the project for no gain the design
asks for.

## Destruction as a regular action

**What:** spending your one action per turn to attack.

**Why out:** measured at 0–15% win rates in every variant. Blessing is worth ~21
points a turn; anything else in that slot is a losing move. Fixed by giving
interventions their own slot, not by making destruction stronger — every attempt to
strengthen it made things *worse*.

## Sacred stones as active weapons

**What:** a stone spends blessed ground to strike a settlement.

**Why out:** made the magical player lose, 54% → 2%. The cost of the action plus
the cost of the blessed ground far exceeded the value of temporary population
damage. Now passive engines instead.

## Population damage as the primary form of attack

**What:** blight, storms, plague reducing a settlement's people.

**Why out:** population regrows exponentially. Damage that heals is worthless
against a compounding engine. Retained only as a minor effect (Blight) — the real
attacks take ground or take the settlement.

## Randomised causality between campaigns

**What:** what causes the fading differs each game — population in one world,
writing in another.

**Why out:** kills the exact thing it was meant to create. Testable theories require
stable laws. Randomised physics degrades into arbitrariness by the fifth game.
Randomise the surface manifestations instead.

## A large map

**What:** 18 × 11, ~200 tiles.

**Why out:** measured 0% interference between players. Two solitaires. Rejected on
data, not taste.

## Six-channel legacy scoring

**What:** descendants, institutions, monuments, myths, ideas, carriers — each scored
separately.

**Why out:** a scoreboard converts grief into optimisation, and six of them
converts it into spreadsheet work. One number, from tiles held.

## The trajectory simulator as a game

**What:** set five founding parameters, press run, watch two hundred years.

**Why out:** it is a *readout*, not a game. Fascinating for about three runs. Kept
in `game/previous/the-founding.html` because the writing-distortion mechanic in it
is still one of the best ideas produced and deserves a home somewhere.

## Contested ground reverting to wild

**What:** ground both powers bless in the same year goes to neither, to remove
the advantage the second mover gets from overwriting fresh blessing (A-17).

**Why out:** measured worse than the problem. Mean turn-order swing across the
four doctrines went from 24% to **41%**, because it converts a second-mover
advantage into a larger first-mover one — Haunt moved from 28%/68% to 88%/8%. A
broader version, where merely re-asserting ground you already held counted as a
claim, was worse again at 83%.

**Kept as a toggle** — `FG.CONTEST` in `engine/constants.js`, off by default — so
the result can be re-checked once the AI is better, since part of the effect is
OP-01 and not the rule.

**Do not revive as:** "contested ground, but only for tiles neither side held
before." That is the version that was measured.

## Alternating the turn order year by year

**What:** flip who acts first from one year to the next, so the seat advantage
averages out over a game (A-17).

**Why out:** not on the numbers — it worked. Haunt's 30.9-point seat swing fell
to 0.8 ± 2.7 over ~3,500 games. It is out on the **mechanism**. The world
resolves at the end of each year, so flipping the order means a power acts, the
world ticks, and then that same power acts again — a double move at every
changeover, roughly twenty per side over forty years. That is a constant rhythm,
not an edge case, and the fairness it produced was two opposed biases cancelling
on average while the sequence stayed lumpy. It also needs a phase the interface
does not have.

**Done instead:** left the game alone and changed the measurement. Doctrine
strength is reported with the seeds split evenly between both orders, which costs
nothing and decontaminates the only thing the confound was blocking. See A-17.

**Do not revive as:** "alternate, but resolve the world between the two halves of
the year." That is a second world tick per year and a much larger change than the
problem justifies.

## Contiguity scoring as the default

**What:** score only your largest unbroken region.

**Why out:** not rejected, *shelved* — see OP-09. It favours blessing by ~15 points
because blessing blobs and settlements scatter, and it was tested bolted onto a
balance built without it. Worth revisiting properly.

## Land-read gates for the works (`landGates`)

**What:** the works unlocking on ground you could see rather than on a population
count — clearance once a settlement's radius-1 ring is tilled, colony at that ring
plus two further tiles, levy the year killing is taught. Proposed in OP-05 as the
answer to two invisible population gates.

**Why out, August 2026:** superseded before it was built, by a version that
measures the same and costs two lines. `taughtGates` counts settlements taught to
till — 1 / 2 / 3 for clearance, colony, levy — and it wins on three counts:

- **Same numbers.** 80 games a cell: Cities 50%, Mixed 34%, Haunt 55%, Bands 34%,
  works opening in 85% of Cities games at about year 23. The land-read version was
  not measured against this because it would have had to be built first, which is
  most of the argument.
- **Already on screen.** `taughtCount` is in the stat bar and already drives the
  wonder ladder, so the gate is a number the player is looking at. That was the
  whole point of the proposal and this gets it for nothing.
- **It keeps the unlock realm-wide.** Land conditions are per-settlement, which
  would have changed what a dim chip in OP-23's row means — from *you have not
  come far enough* to *not from this place*. A real change to the interface's
  grammar, taken on for no measured gain.

**Note the honest weakness of this entry:** it was never built and so was never
measured, which is not this file's usual standard. It is here rather than left in
OP-05 because leaving a cut proposal in a live register is how it comes back
looking attractive. If per-settlement unlocks are ever wanted for their own sake —
and *not from this place* is a genuinely interesting thing for a row of chips to
say — this is the design, and it should be re-argued rather than re-derived.

**Where it went:** OP-05, and `engine/rules.js` `civicOpen()`.

