# Open points — archive

Settled questions, with the answer and the evidence. Kept because in a few weeks
several of these will look reopenable and they are not.

---

## A-01 · What is the player? — **settled**

A fading old power that walks among people, seen by fewer of them as the world
gets louder; eventually confined. Long-lived, not immortal in effect.

This resolved a great deal downstream at once: presence became *spatial* rather
than a budget, delegates became *the people who can still perceive you*, and
temples became life support rather than memorials.

## A-02 · What is the scarce resource? — **settled**

Position. Not attention, not mana. Where you are standing, and what ground you can
enter.

## A-03 · Is attention a viable currency? — **settled: no**

Playtested in the first prototype. Attention is *subtractive* — you start each
turn with six and spend to zero, nothing accumulates, and there is no surplus with
which to plan. Every decision is a denial. It produced a triage game, which is a
real genre and not the one wanted.

## A-04 · Should there be a combat system? — **settled: no**

Conflict resolves through ground, cult, and marching. An army arrives or it is
walled out. No units, no tiles-of-battle, no resolution table. Nothing has been
lost by this.

## A-05 · How big should the map be? — **settled: small**

Measured. At 18 × 11 (198 tiles) the Cities strategy scored 122.3 against a rival
that did nothing and 121.8 against one playing optimally — **0% interference**. Two
solitaires on a shared board. At 14 × 9 (126 tiles) interference is 31–39%.

Crowding is what makes it a game. This is the single most important measured
result in the project.

## A-06 · Can destruction be an action? — **settled: no, it needs its own slot**

Every version of a destructive action tested made the magical player *lose* —
between 0% and 15% win rates. The cause is action economy, not damage: blessing is
worth ~21 points a turn, and spending your one action on anything else is losing.
Splitting act and intervention into two slots fixed it immediately.

## A-07 · Are sacred stones weapons? — **settled: no, engines**

As active weapons, they made the magical side worse (54% → 2%). As passive
engines that bless without costing an action, they work — because they are the only
compounding thing the magical side has, and cities compound by default.

## A-08 · Does damaging population work as an attack? — **settled: no**

Population regrows exponentially. Knocking a town from 200 to 100 costs the owner
about four years and costs the attacker permanent board position. Damage that heals
is worthless against a compounding engine. Attacks have to take *ground* or take
*the settlement*.

## A-09 · What are the scoring values? — **settled**

Blessed 3, reckoned 2, settlement 3. At blessed=1 the Cities strategy won 98–100%
of all games. Raising blessed to 3 was the single change that made the magical path
exist at all.

## A-10 · Should magic decay on a timer? — **settled: no**

Replaced with the paired exchange — each thing gained silences a specific thing
lost, priced and visible before you commit. A timer is weather; an exchange is a
decision. Same arc, completely different feeling.

## A-11 · Should causality be randomised between campaigns? — **settled: no**

Randomising what causes the fading makes player theories untestable and degrades
into arbitrariness by the fifth playthrough. Fixed laws, varied initial conditions —
which is what makes Civ replayable. Randomise the surface, never the physics.

## A-12 · Terminology for the two ground states — **settled**

*Haunted* → *thin* → **blessed**, and *cultured* → **reckoned**. "Haunted" implied
malevolence; the player is not a malevolence. "Reckoned" carries counted, surveyed,
measured, known — which is exactly what silences the ground.

## A-13 · Do the works need a price? — **settled: yes, in people**

Without population costs, granting civic interventions swung Cities from 45% to
82–90%. With costs (10% / 33% / 45%) the whole field sits within sixteen points.

## A-14 · Does a settlement's reckoning need a cap? — **settled: yes**

A settlement's reckoning radius grows with population, making its output quadratic
in time while blessing is linear. Over 20 turns survivable; over 40 decisive. At 40
turns *nothing else* balanced — every growth rate, every stone configuration, every
strike strength failed. A lifetime budget was the only fix.

## A-15 · Epochs, dealt empires, LLM delegates — **settled: out**

See `registers/rejected.md`.

## A-16 · The two implementations of the rules — **settled: unified**

There is now one engine in `engine/`, loaded by `game/index.html` as script tags
and by `sim/harness.js` through `engine/load.js`. Classic scripts rather than ES
modules, so the game still opens by double-clicking. `sim/smoke.js` plays a full
game through the build's own click handlers in a headless DOM, which is what
makes "the game and the simulator are the same game" a checked claim rather than
an intention.

The finding was worse than "they drifted." `balance-sim-reference.py` was an
18 × 11 map with *haunted* and *cultured* ground, blessing worth 1, 20 turns, and
no stones, wonders, works, armies, refugee columns, reckoning budget or blessing
requirement for founding. Every one of those contradicts a decision already
recorded here — A-05, A-09, A-12, A-14. It was not a copy of the game that had
drifted. It was the game from several months earlier.

It therefore cannot have produced the balance table that stood in
`design/rules.md` §10, which also reported a *Haunt* doctrine that the JavaScript
build has never contained. Those numbers came from a simulator that is not in the
repository and may never have been committed.

Re-measured against the actual game, the field is not within 30 points, it is
within 54, and Cities wins 78% of everything. The corrected table is in §10. Two
open points came out of the exercise: OP-16 and OP-17. The Python is deleted.

**The lesson worth keeping:** a second implementation of the rules does not drift
slowly and visibly. It stops being updated, keeps producing plausible numbers, and
nothing announces it.

## A-17 · Should turn order be changed? — **settled: no. Measure around it.**

The effect is real. Mirror matches, same doctrine in both seats, mean score
margin p0 minus p1 over ~3,500 games:

| Doctrine | You first | Rival first | Seat swing | Alternating |
|---|---|---|---|---|
| Cities | +13.0 ± 3.0 | −1.9 ± 3.2 | 14.9 | +5.2 ± 2.9 |
| Bands | −6.5 ± 3.3 | +10.1 ± 3.2 | 16.6 | +6.6 ± 3.2 |
| Mixed | +3.1 ± 2.3 | −1.1 ± 2.4 | 4.2 | +2.9 ± 2.2 |
| Haunt | −16.8 ± 2.6 | +14.1 ± 2.7 | **30.9** | **+0.8 ± 2.7** |

It is two opposed effects of similar size: first pick of open country favours
acting first, and the blessing overwrite favours acting second. Cities wants to
go first; Bands and Haunt want to go second.

Three fixes were built and measured. Two failed outright — contested ground and
wild-only blessing, both in `rejected.md`. The third, alternating the order year
by year, made the numbers fair.

**It was still rejected, on the mechanism rather than the numbers.** Alternating
does not alternate anything a player would recognise as turn order: because the
world resolves at the end of each year, flipping the order means somebody acts,
the world ticks, and then that same somebody acts again. A double move at every
changeover — roughly twenty per side over forty years, not an edge case but a
constant rhythm. The fairness measurement was real and the mechanism producing it
was close to coincidence: two biases cancelling on average while the sequence
stayed lumpy. Paying for that with a phase the interface does not have was not
worth it.

**What was done instead: change the measurement, not the game.** The build keeps
its fixed order, and doctrine strength is reported with the seeds split evenly
between both orders — `first: "alternate"` in `sim/harness.js`, which costs
nothing and was already there.

That decontaminates the one thing the confound was actually blocking:

| Playing, against Cities | As built | Seeds split |
|---|---|---|
| Cities | 60% | 50% |
| Bands | 8% | **8%** |
| Mixed | 38% | 37% |
| Haunt | 10% | 22% |

Turn order was worth about half of Haunt's deficit and **none** of Bands'. Bands
is weak on its own account, which is what OP-06 needed to know.

**Worth remembering if it comes back:** the residual +4.0 ± 1.4 point advantage
to the left-hand seat is *not* turn order and does not go away with any of this.
It is the map, and it moved to OP-07.
