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

## Contiguity scoring as the default

**What:** score only your largest unbroken region.

**Why out:** not rejected, *shelved* — see OP-09. It favours blessing by ~15 points
because blessing blobs and settlements scatter, and it was tested bolted onto a
balance built without it. Worth revisiting properly.
