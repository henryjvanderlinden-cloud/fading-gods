# Open points

Live register. Things genuinely unresolved. When one is settled, move it to
`open-points-archive.md` with the answer and the evidence.

Format: `OP-nn` · severity · the question · why it matters · how it would be settled.

---

## OP-01 · high · The rival AI is one-ply greedy

Every balance number in `design/rules.md` was produced against an opponent that
picks the highest-scoring immediate action with a little noise. It never plans, never
defends, never keeps a wonder in reserve. A better AI could invalidate all of it.

**Settled by:** writing a two- or three-ply search, or a scripted "expert" line per
doctrine, and re-running the matrix. Expect the numbers to move.

## OP-02 · high · Two implementations of the rules exist and have drifted

The playable game is JavaScript in `game/index.html`. The balance harness was
Python, re-implemented by hand. They already disagree in small ways. Every number
in the design doc is therefore measured against something that is *almost* the
game.

**Settled by:** the architecture change in `architecture/architecture.md` — one
engine, imported by both. This should probably be done before any further tuning.

## OP-03 · high · Does being walled in feel like an ending or like confiscation?

At forty turns with hard walls, late-game reachable area falls to single digits and
13% of turns leave four tiles or fewer. Simulation says you are almost never fully
stuck. But "not stuck" as a number and "not stuck" as a feeling are different
things, and this is the emotional payload of the whole design.

**Settled by:** three full games, paying attention to the last ten turns
specifically. If it feels like the game taking your toys away, the fix is probably
that the *works* need to open faster so there is more to do late.

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

## OP-06 · medium · Does an ascetic strategy ever win?

Bands sits around 33% — the weakest of the four. If deliberately staying small can
never win, the central dilemma is decorative.

**Settled by:** either tuning until Bands is competitive, or accepting that the
viable magical strategy is *few settlements and many stones* rather than *many
small settlements*, and renaming the doctrine accordingly.

## OP-07 · medium · Map generation is unexamined

The generator makes blob islands with smoothed noise. It has never been checked for
whether it produces chokepoints, isthmuses, or interesting asymmetries — all of
which matter now that terrain can be created and destroyed.

**Settled by:** generating fifty maps and looking at them. Possibly seed control so
a good map can be replayed.

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
