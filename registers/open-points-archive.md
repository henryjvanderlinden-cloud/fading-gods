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

### Reopened by OP-21, August 2026

**The answer above depends on a premise that player-versus-player removes.** It was
settled as *leave the game alone and change the measurement*, and that was correct
precisely because only one seat is human — the asymmetry lands on an AI, which does
not care, and splitting the seeds decontaminates the numbers at no cost.

With two people at one board, somebody sits in the disadvantaged seat every game.
A 30.9-point swing for Haunt and 14.9 for Cities is then not a confound to measure
around; it is an unfair match, and no amount of reporting fixes it.

All three candidates here were rejected and none of them becomes acceptable just
because the need changed — the mechanism objection to alternating is the same
objection whoever is sitting there. **A fourth answer is wanted and does not exist
yet.** See OP-21.

## A-18 · Should mountains be special-cased as shields? — **settled: no. Measure distance differently.**

The proposal was that tiles behind a mountain range should not count toward the
85% blessed country a founding requires, so that a ridge could act as a shield and
allow settlements on both sides of it.

**Settled by changing what "within two tiles" means, not by naming mountains.**
`blessFrac` counts tiles at **path distance 2** rather than ring distance 2.

The reasoning, which is why this is archived rather than left open:

- `ring()` is a pure adjacency flood that ignores terrain entirely, so the change
  is a few lines and touches nothing else.
- **Mountain shields fall out for free.** Ground behind a ridge is more than two
  steps away by road, so it stops counting without anything in the code knowing
  what a mountain is.
- **So does the interaction with water**, which nobody asked for and which is
  better than the thing that was asked for: cutting the map with *Drown the
  ground* now shrinks the founding requirement on the far side. That makes Drown
  sharper as an offensive act rather than only as a defensive one.

Note it gates two rules, not one — founding at 85% and *Raise mountains* at 70% —
so raising a mountain beside your own mountain wall becomes harder. Judged a
recursion rather than an annoyance, and left in.

**Unmeasured.** Settled on argument, and the argument is about what a distance
means rather than about a balance number. If the founding rate moves noticeably
when it goes in, reopen it.

## A-19 · Is the arc a law or a theme? — **settled: a theme. Holding it off is a strategy.**

**Raised by a played game, 25 August 2026, and settled by Rick in the same
breath.** Year 40, a hybrid line: a magical enclave walled off behind mountains
and water, and agricultural settlements founded in the middle of the board to
compete with the rival. Final board 73 to 83 — a narrow loss after leading for
part of it.

The board said something the README does not allow for:

| | |
|---|---|
| Taught to till | **3** |
| Working stones | **3** |
| **Wonders lost** | **0** |

`lostCount = max(0, taught − working)` cancelled exactly. All six wonders still
in the row at year forty. *You end the game holding everything you can build, and
nothing you can call* — and this player ended holding both.

### The ruling

**It is a valid strategy and the player decides.** In Rick's words: the
commitment was profound — building and shielding the walled-off magical place —
and from a god's point of view it makes sense to *preserve a chosen people in a
mystical place somewhere.*

**And `concept/concept.md` already said so**, which is the part worth noticing.
Under *What it is not*: **"Not a tragedy on rails. The fading is caused by
choices, including yours, and a well-played game can hold a great deal of it
off."** This is that line being exercised for the first time by an actual game
rather than asserted in a design document. The one sentence is the axis every
decision sits on. It was never a prophecy about where you have to end up.

### Why it is not a loophole

The brake is paid for, and dearly:

- Three **working** stones means three connected blessed regions of at least
  `MINREG`, held for forty years against a rival who can bless over the ground
  they stand on. OP-16 measured that 92% of all stones end under farmland.
- Walling the enclave spends **Raise mountains** and **Drown the ground**, which
  are the two most expensive things a player owns, on terrain rather than on the
  rival.
- Every tile inside the wall is a tile not competing for the middle. This game
  was lost 73–83, with the rival holding a 900-strong city and six towns.

So the wonders were not kept for free. They were kept by spending the whole early
game on the conditions for keeping them, and still losing on points.

### It gives the lore a third stance, and the roster had a hole

`concept/lore.md` frames the powers as **refusers** against **convinced**, and
records Storm & Sky as indifferent because nobody had a third answer for them.
The pastoralists in `ideas.md` were proposed as one. This is another, and it
arrived from play rather than from history: **the preserver.** Not *no settling*
and not *settle everything* — keep a few who can still hear you, somewhere
defensible, and let the rest count the fields. See OP-06 and OP-12.

### What this does *not* settle

- **The same formula is still broken in the other direction.** For a pure refuser
  `max(0, 0 − workingStones)` subtracts from zero, so the stones hold back
  nothing because nothing was taken. That is a real defect and is untouched by
  this ruling. See OP-19.
- **Holding the arc off should stay hard.** One game is one game. If the wonder
  row is still full at year forty across several more, the brake is too generous
  and the strategy has stopped being an achievement. **Watch the wonder count as
  its own series** — the same instrumentation OP-20 already asks for.

**Settled by:** a played game, and the player whose game it was.


## A-20 · Was Split ever legal? — **settled: no. Not once, since it was written.**

Not a balance question and it was never asked as one. It was found by reading
`canSplit` against `foundBlock` while building 1.6, and then measured, because
the register's rule since August 2026 is that a claim about the code is checked
against the code.

`canSplit` asked for a **neighbour** of the settlement that passed the whole
founding test. `foundBlock` refuses any tile with a settlement in its own
neighbourhood. Every neighbour of a settlement has one — the settlement doing the
splitting. The two conditions are mutually exclusive by construction.

**Measured: true in 0 of 1,047 settlement-years**, playing the doctrine that
weights it highest, before anything was changed.

What it cost, which is more than the act:

- **`bands` weights split at 14, above everything but `stone`.** Its whole share
  of the chooser's attention went to an option that could never be selected, so
  the doctrine the dropdown describes as *splits at sixty* has never split, and
  every number ever measured for it is a number for a doctrine playing with one
  fewer act than it thinks it has.
- **The build's Split button has never once been enabled.** Rick reported not
  being able to use it; this is why. Three played games, and the thing was
  simply not reachable.
- **It is the fifth thing in this project found by reading the code against the
  prose rather than by measuring.** `landGates`, two formulas under the growth
  model, the `wouldSeal` entombment, and now this. The register was describing a
  rule that did not exist, and the harness could not tell anyone, because a
  legality test that is always false produces no anomaly — only an absence.

**Settled by:** reading it, then counting it. The repair is 1.6; see OP-19.

**Do not conclude that the old targeting rule was wrong on its merits.** It was
never exercised, so nothing is known about it. What replaced it was chosen for
other reasons and is on its own evidence.

## A-21 · Where may a splinter go? — **settled: your blessing, two tiles out**

The 1.6 rule, and the second half of what that flag does. See A-20 for the first.

**A splinter goes to ground you have blessed, at path distance 2, with the 85%
founding requirement waived.** Everything else `foundBlock` asks is still asked.

Three things fall out rather than being decided:

- **Distance 2 is not a chosen radius, it is the only one available.** *Not next
  to a settlement* rules out distance 1 by itself, and it is the same rule that
  keeps any two settlements apart anywhere else on the board.
- **Path distance, not ring distance** — A-18. Water and mountains constrain your
  own fission exactly as they constrain founding, and a split cannot leapfrog
  terrain. A settlement ringed by water has nowhere to send anyone, which is
  right.
- **The blessing requirement is kept and the percentage is dropped.** The people
  are already there; what they need is somewhere quiet to stop, not a country.
  Keeping the requirement keeps §3's *all expansion begins with blessing* true of
  splitting as well as of founding — see OP-18, where that gate stops looking
  arbitrary.

And one price nobody had to write: **the tile's blessing is spent by the
founding.** A settlement stands on wild ground, so splitting costs you a tile of
your own quiet country, permanently. Nothing in the register had priced that,
because nothing had ever done it.

**Measured**, 80 games a cell against Cities, the build's own turn order, this
rule alone against the batch as it stood: Cities 50 → 45, Mixed 34 → **43**,
Haunt 55 → 48, Bands 34 → **39**. It gives an act back to the doctrines that
weight it and takes the corresponding points off the two that do not. That is
what a repair looks like, and it is the correct sign.

**Still low in play, and that is OP-01 and not this.** Bands splits 0.44 times a
game against 29% of settlement-years in which it is legal. The greedy chooser
compares a flat weight of 14 against `bless × gain`, which reaches 24, and takes
the blessing nearly every time. The opportunity is there and the chooser does not
want it.

## A-22 · Does unmaking require presence? — **settled: yes, and it is built**

OP-16's Bless/Quicken split, refined in August 2026 to a test on *presence*
rather than on which of the two spells it is, and now 1.8.

**Taking country the other power has blessed returns it to wild.** You unmake
before you make: two visits for one tile. Wild country is taken as it always
was. The rule reads `blessEffect(tile, who, inPerson)` and every site that
blesses anything asks it, so the two halves cannot drift apart.

**Bless is always in person** — it happens under your feet. **Quicken asks
whether its target was within arm's reach**, the same test `tolled` uses for the
dream toll, so the game's two prices are read off one line. Sent down the stone
network, Quicken takes wild ground and passes over theirs.

That is *creation at a distance, unmaking only in person*, on the ground rather
than in a register, and it is what makes a stone deep inside its own blessed
region hard to silence: the attacker must walk in, one ring a year, visibly.
OP-16's original complaint — that Quicken skipped the entire siege — is answered
without cutting its reach, which the entry had already warned would be a net nerf
to the magical player.

**Measured alone**, same convention: Cities 50 → 40, Mixed 34 → 30, Haunt 55 →
**66**, Bands 34 → **24**.

**That spread is the interesting result, and it is not about blessing. It is
about turn order.** A-17's swing exists because Bless overwrites, so the second
mover overwrites after the first has committed. Removing the overwrite removes
most of the mechanism. Mirror matches, 60 games, mean margin p0 − p1 with the
starting-position bias subtracted out:

| doctrine | turn order was worth | with 1.8 | with all three |
|---|---|---|---|
| cities | −1.1 | −8.3 | **−19.4** |
| haunt | −11.6 | **−6.5** | −6.5 |
| bands | −14.5 | **−1.8** | +1.2 |

**So 1.8 is A-17's second candidate arriving by another road.** `BLESS_WILD_ONLY`
was rejected as a turn-order fix; this is not that rule — it takes their ground
and gives it to nobody rather than refusing to take it — but it removes the same
overwrite, and it nearly eliminates the bias for Bands and halves it for Haunt.

**And it makes Cities worse, and 1.9 makes Cities worse again.** A ring is
resolved at the end of the year, so the second mover has the last word on whether
it is whole. The total bias across the three doctrines is about what it was; it
has been redistributed, not removed. **A-17 is not reopened — it is re-pointed.**
Its own conclusion was *measure around it*, and the fourth candidate in OP-21,
letting the second player choose their seat, is worth more now than when it was
written: the bias is larger, still doctrine-dependent, and still opposite-signed.

## A-23 · Does a besieged settlement go out to the fields? — **settled: no**

Not a question anybody asked. It was found by building 1.9, watching it never
fire, and reading why.

Farmland erases blessing — the one-way ratchet, §5, the thesis in one line. A
taught settlement ploughs its own first ring. A ring is made of blessing. So the
first season of ploughing broke every siege, and blessing cannot be laid on
farmland, so **the besieger could never repair it. A taught settlement was
structurally immune to encirclement**, which is precisely the settlement OP-20
was written to be able to take. Measured before the fix: a 900-strong city under
a closed ring grew 929 → 950 → 965 → … for nine years.

**A place closed in on every side does not go out to the fields.** That is what a
siege is, and it costs one line. The same city now goes 929 → 669 → 481 → 347 →
250 → 197 → 177 → 167 → 161.

Two things it hands back, both wanted:

- **The defender gets a counter.** Break the ring — one tile of your own blessing
  beside the place, or Wither, or a Clearance aimed at a besieging tile from
  another of your settlements — and the ploughing resumes the same year and the
  clock resets to zero.
- **Relief by clearance is a settled-doctrine answer to a magical attack**, which
  the board did not have. It is not written anywhere; it falls out.

**A mature city is still hard to encircle and should be.** Existing farmland
beside a place stops the ring ever forming, so taking a loud city means Withering
its fields first, then closing the ring, then forbidding. Three stages, several
wonders, several years. That is the late-game project OP-20 asked for, and the
one-ply chooser will never attempt it — so **the matrix systematically
undercounts this rule**, and the number that matters will come from a played
game.

**Settled by:** building it, measuring nothing happening, and reading the tick
order.

---

## A-24 · What does a people taught to herd cost, and what do they earn? — **settled: no wonder, and no points**

**Asked and answered August 2026, before a line of 1.19 was written.** Rick's call,
from three options put to him. See OP-12 and `design/rules.md` §16.

The candidates were *no wonder and no score*, *a wonder like the plough*, and *no
wonder but let them score*.

**The answer is the first, and the two halves are one rule.** A herd costs no
wonder because `lostCount` counts settlements taught to till and a herd is not a
settlement: they were never shown the plough, they still hear you, and nothing
about you has gone quieter. And a herd scores nothing because it holds no ground
and `score()` never sees it. **They deny; they do not accumulate.**

**Why the pairing and not either half.** *A wonder like the plough* makes herding a
strictly worse plough and nobody ever takes it. *No wonder but let them score* is
the failure mode `concept/concept.md` names outright: a player expands without
teaching anyone, and the trade the whole game is built on can simply be declined.
The rule survives only as the pair, and the pair says something true — **you are
not diminished by a people who never stopped listening, and you are not enlarged
by them either.**

**What it costs instead**, and none of this had to be written:

- the three points the settlement was worth, at the moment you say it;
- everything it would have grown into — a taught place tops out between 600 and
  1000, a herd carries 77;
- **most of the people**, because a village that has been standing a while is
  already above the herd's ceiling and sheds the surplus over the next few years.
  Going nomadic costs you most of a town. That falls out of putting `kHerd` at the
  Seventy-Seven and nothing else.

**The safety this rests on is A-26's other half — stopping.** A herd that stops
comes back untaught, so herding defers the central dilemma rather than dissolving
it. If that ever changes, this entry is wrong.

**Unmeasured, and the register should not pretend otherwise.** The greedy chooser
teaches herding 1.65 times a game and the win rates do not move. See OP-12.

**Settled by:** Rick, on the design, August 2026. Built the same day.

---

## A-25 · What does grazed farmland become? — **settled: wild, and barren for three years**

**August 2026.** Rick's call, from three options. See OP-12, `ideas.md`, and
`design/rules.md` §16.

The candidates were *wild then barren*, *wild and immediately re-ploughable*, and
*straight back to your blessing*.

**Straight to blessing was the one to refuse and it is worth saying why**, because
it is the attractive one: it makes herds do your work for you, and a herding line
could then win on points without ever teaching anybody. That is A-24's failure
mode reached by a different road.

**Wild and immediately re-ploughable makes the third leg not a leg.** The settled
side re-ploughs next season and the whole mechanic is one year of tempo denial.

**So: wild, and barren.** The ground goes back to thorn, belonging to nobody, and
nothing may reckon it for three years — not a settlement's year-end spread and not
a Clearance, which had to be blocked in two places because that work takes three
tiles round the one it is aimed at.

**The second cost is the good one and it is invisible.** A-14's thirty-tile
lifetime budget is spent per tile ploughed, so re-ploughing grazed ground spends a
tile of a settlement's thirty that it had already spent. **Grazed ground is lost
twice**, and the second loss is permanent, unannounced, and only felt decades
later when a place stops short of where it should have reached. This project likes
that kind of cost and this is the cleanest instance of it yet.

A tile *refused* for barrenness is not charged to the budget, so the settlement
keeps what it did not get to spend. Checked in `sim/smoke.js`.

**Note what this rule deliberately does not do:** it does not give the ground to
you. Somebody still has to walk out there and bless it. **The herd unmakes and the
god makes**, which is A-22's line — creation at a distance, unmaking only in
person — running through mortals instead of through the player. `herdTick` runs
before `stoneTick` so that a stone may take the ground back in the same year.

**It also half-built `barren3`.** Barren ground now exists in the engine; whether
*Wither* should leave it as well as bare is that flag's own question, is still
unmeasured, and stays off. One writer per rule, one reader for both.

**Settled by:** Rick, on the design, August 2026. Built the same day.

---

## A-26 · What stops a herd? — **settled: the other power's blessing is closed country**

**August 2026.** Rick's call, from three options. See OP-12 and `design/rules.md`
§16.

The candidates were *rival blessing blocks movement*, *a herd ringed by blessing
must settle*, and *both*.

**The answer is the first, and the reason it beats the second is that it is a rule
with a reason rather than an exception with a patch.** §7 says the player's
movement rules do not apply to mortals — a levy crosses anything but rock and
water, because a levy cannot hear you and a god's walls are not there for it. A
people who were never shown the plough **can** still hear. So they move the way
their god does, and what a people can hear, they can be shut out of. That is the
third row of the loop and it is the same sentence as `audible77`.

**The half that had to be got right: the *other* power's blessing only.** Blessing
impassable to herds walls your own herds in with your own quiet, which is §2's
self-walling problem that OP-19 already strained to breaking. Writing the rule as
*theirs blocks, yours never does* avoids it completely, and costs nothing, and is
better lore besides.

**The ring version was not wrong, it was redundant.** A herd that cannot move at
all settles where it stands if the ground allows it, which is what `herdTick` does
when `herdStep` returns undefined — so the second candidate's outcome is already
reachable, without a second clock and without borrowing OP-20's machinery. *Both*
would have bought one behaviour twice.

**And the third thing that stops a herd is you.** Stopping is an act, done standing
on the people, because every founding in this game happens under your feet. It
waives the blessing requirement exactly as a colony does — they are already there,
what they need is somewhere to stop rather than a country — and keeps every other
question §3 asks, including the one about a rival's blessing within two tiles.

**A herd comes back untaught. That is the load-bearing part of this entry**, and it
is what makes herding a detour rather than a door: you may walk around the central
fork for twenty years and you arrive at the same fork. See A-24.

**Settled by:** Rick, on the design, August 2026. Built the same day.

## A-27 · Who adds a course to a stone, and what does a course buy? — **settled: the audible add it, and it buys the working threshold**

Closes the *stones grow* entry in `ideas.md`, which had been sitting there since
the beginning with its own design question written into it. **The bonus was never
the question. Who does the adding was**, because a stone that grows on an age
counter is a timer and A-10 would be raised against it correctly.

**The answer is the audible.** A stone gains a course while an untaught settlement
under seventy-seven, or a herd, stands within its reach — the same people 1.5
already calls audible, read through one predicate rather than two copies of it.
One course a year, three at most.

**And a course buys the working threshold, not reach.** Reach is capped at 3 and a
fourth tile of it would be worth nothing. Each course takes one off the six
connected blessed tiles a stone needs to still answer, down to three: an old stone
remembers a larger country than it now stands in, so severing a blessed region
hurts an ancient stone less than a new one, and defensive geometry gains a history.

Three things fall out of this shape and all three are why it is the shape:

- **The thesis fits inside one object.** Teach that band to till and the stone
  stops growing — not by a rule, but because a taught people are counting the
  fields and not listening. It is arrested where it stood, visibly unfinished, for
  the rest of the game. You can see it from across the board.
- **It does not reverse OP-16's 92%.** A stone under farmland stands in no blessed
  ground at all, so its region is zero and three courses do not save it. The shrine
  ploughed under stays ploughed under, which is the thesis and not a defect. What
  the courses answer is *severance*, which is the case the idea was written about.
- **It may not feed the wonder brake, and does not.** `lost = taught −
  workingStones` is already recorded in OP-19 as broken for a refuser, and stronger
  stones would make it worse. `lostCount` reads `workingStrict` — the plain six —
  and every other caller reads the augmented test. The two functions sit next to
  each other in `rules.js` with the reason between them.

**Evidence, and it is a null with a reason.** Leave-one-out over 80 games a cell
against Cities: 39 / 43 / 54 / 43 / 66 without it against 39 / 45 / 55 / 41 / 68
with. It moves nothing. Over 242 stones the chooser grew a mean of **1.35 courses**
and reached three, so the rule runs — but the threshold it lowers was the deciding
factor in **0** of those games at year forty, and a region of the right size (the
stone's tile still blessed, three to five tiles connected) occurs in about **2.5%
of stone-years**.

That is the same null `taughtLoss` and `audible77` measured, for the same reason
and recorded the same way. **Severing a region is a player's move.** You walk into
their country and unmake a tile to cut it, and the one-ply chooser has no concept
of doing that on purpose. OP-01 is why the number is zero; OP-21 is the instrument
that would read it.

**What that means for the entry.** The rule ships because it is legible, cheap and
thematically load-bearing, and its measured balance effect is nil — which is a
thing to know rather than a thing to fix. If a played game finds the courses never
matter either, the honest disposition is to keep the drawing and cut the threshold.

**Settled by:** Rick, on the design, August 2026. Built, measured and shipped the
same day. See `engine/constants.js` 1.20.

## A-28 · Do dead stones carry orders? — **settled: yes, at range two, and only the works**

Closes **OP-13**, which had been open since the beginning and had been weakened
twice by the August batch without ever being answered.

**Working stones carry presence, dead stones carry orders.** A stone of yours below
the working threshold stops blessing and used to do nothing whatever. It now stops
being a place where you are *heard* and becomes a place from which you are
*obeyed*: a work aimed within two tiles of one arrives for nothing, where 1.17
would otherwise have charged a tenth of you for it.

**Range two, flat, and not `stoneRange`.** That formula reads the blessed region a
stone stands in and a dead stone has none to read. Two is the ring a settlement's
own fields reach into, so a relay covers the place it is relaying to.

**It is a change to `tolled` and to nothing else, which is the discipline.** It does
not extend the reach of the works — `targets()` has always built those from the
settlement outward and still does. It extends the country an *order* arrives in.
Creation still travels through living stones alone: a dead stone relays no wonder
and teaches nobody, which is the sentence kept exact.

Two things settled alongside it:

- **A kurgan is not a relay.** *Buried stones carry memory* is OP-13's own third
  line and a different disposition, so raising a mound over a dead stone closes the
  order network for good. That gives the mound a cost, and therefore a decision,
  which is the thing OP-15 has so far been unable to give it. If OP-15's endings
  are never written, this is now the only reason a mound exists.
- **The OP-13 objection stands and is now the interesting part.** Four stones
  raised early and allowed to die under farmland is a permanent command network for
  a few early acts. What holds it honest is the stone cap: the same four slots a
  magical player wants standing and answering. Your stones can be shrines or they
  can be relays, and paving one over converts it irreversibly in one direction
  only. That is the trade, and it is a good one.

**Evidence — this is the rule in the batch that moves the most.** Leave-one-out,
80 games a cell against Cities, without it against with:

| | cities | mixed | haunt | bands | storm |
|---|---|---|---|---|---|
| the game as it ships | 39% | 45% | 55% | 41% | 68% |
| less 1.21 dead orders | 38% | **36%** | **59%** | 40% | **74%** |

**Mixed loses nine points without it and Haunt gains four.** It is a settled-side
rule and it lands exactly on the settled side, which is the first time anything in
this project has done that on purpose.

**And it acquired a second job the register never had for it.** OP-13 said the end
state at zero manifestation would contain nothing to do without this rule. A-30
closed that reading — at zero you do nothing at all — so the dependency is gone and
something better replaced it: orders are what use you up, so a network of dead
stones is what lets you go on ruling without spending yourself. **When you run out
stops being something that happens to you and becomes something you steer.**

**Settled by:** Rick, on the design, August 2026, including the range. Built,
measured and shipped the same day. See `engine/constants.js` 1.21.

## A-29 · Do the wild folk carry a number? — **settled: yes, at the founding and nowhere else**

Closes **OP-18**, and it is the smallest of the versions the register put on the
table, chosen deliberately.

**A settlement is founded with between twenty and forty people, by how much of the
eighteen tiles two rings out is blessed ground of yours.** Rock, water and the edge
of the map are counted in the denominator and never in the numerator, so a coastal
founding starts smaller than one in the middle of a country, and a valley mouth
smaller than a plain. Found only — a colony is a work of the settled and keeps its
forty, a splinter is half its parent, and a herd that stops is whatever the grass
left of it.

**The objection that shaped it.** `concept/concept.md` says *no economy to manage*,
and OP-18 recorded that a visible population pool on wild ground is an economy the
player would immediately farm. So there is no pool. The number is read once, at the
moment they stop moving, and never again; nothing accumulates and nothing drains.
What is left is *situation* rather than a resource, which is the whole of what was
wanted: §3's 85% requirement stops being an arbitrary gate and becomes the
statement that the people were already there.

**Evidence — and it is the largest balance mover in the batch, against expectation.**
Rick's own reading when it was proposed was that it is *mainly cosmetic*. It is not:

| | cities | mixed | haunt | bands | storm |
|---|---|---|---|---|---|
| the game as it ships | 39% | 45% | 55% | **41%** | 68% |
| less 1.22 wild folk | 38% | 43% | 54% | **30%** | 64% |

**Bands loses eleven points without it, and Storm four.** That is A-09's lever —
*make blessing worth more* — landing on exactly the doctrines OP-06 has been
failing on for the whole project, and landing there in a form that is thematic
rather than a tuned constant.

Measured over 225 foundings across five doctrines: **minimum 24, median 31, maximum
40, mean 31.1.** The mean founding is what the flat constant always was, so nothing
has been handed out. What changed is that *where* you found now decides how it
starts, and it decides it by a number the player can read off the board without
being told.

**The caution in `concept/lore.md` is respected and should stay watched.** This must
not be allowed to settle OP-06 by fiat. Bands at 41% against Cities is *a magical
victory is possible, and hard*, which is the stated goal; if a later change pushes
it past Cities the model has stopped being a competition.

**Settled by:** Rick, on the design, August 2026 — including the bounds and the
discount for rock and water. Built, measured and shipped the same day. See
`engine/constants.js` 1.22.

## A-30 · What is zero manifestation? — **settled: you may only watch**

Closes the last open half of **OP-14**, which has been the register's oldest
deferred sub-question and which the August batch finally made reachable.

**There is no floor.** At nothing left you cannot move, act, teach, order or
intervene. The year still turns, the score still accrues, the stones still bless,
and your people still plough and march and graze — and you watch it. The game does
not end. Your part in it does.

**What was rejected, and why the rejected version was the register's own.** OP-14
proposed *lose the body and keep playing as stones, works and score* — a network
with no location, which would have made the administrative-interface ambition in
`concept/` literal. It was the better idea for about a year and it is the softer
one. A network with no location is still a player taking turns. This is not. It is
the title said out loud: everything you did to be remembered is what stopped you
being heard, and the last of it goes out while the valley carries on without you.

**The old behaviour was the punishment reading and the register said so.** One
movement point forever is a god shuffling a tile a year for the rest of the game,
and no part of that is a decision.

**It is a decision because you can see it coming, and that is the whole design.**
The stock is on the bar in whole percent. The slope is felt at two thirds and again
at a third. Every spend is chosen — a dream sent, an order carried out of hearing,
a year ended standing in their furrows — and nothing puts any of it back. What the
rule buys is that the last tenth is worth spending: **you can time the sacrifice of
yourself**, and decide what to have bought with the going.

**The drawing is half the rule.** Both powers thin toward transparency as their
manifestation falls, wherever `fade` is on. At a tenth you are a phantom standing
in a field, and so is the other one — watching what the tolls are doing to *them*
is how the cost becomes legible before you have paid it yourself. A number in the
corner of a bar is not a thing anybody feels.

**Evidence.** Measured over 60 games across five doctrines: seat 0 spends itself to
nothing in **5**, seat 1 in **12**, at a mean of **year 33** and never before year
24. So it is a last-quarter event and not a mid-game collapse, which was the thing
worth checking before shipping it.

**It forced one change to the chooser, recorded here rather than slipped in.**
Before it, seat 1 spent itself to nothing in 27 games out of 100 and then stood
paralysed for the rest of them, which moved every number in the table for a reason
that has nothing to do with any rule in this batch. `free()` in `ai.js` now
*declines* a tolled target near the bottom of the stock instead of falling back to
it, keeping two tolls in reserve. Like the fallback it extends, this is deliberately
not an improvement in judgement — it does not weigh the last tenth of a body
against the work it would buy, which is precisely the decision this rule exists to
give a player. It only stops a machine that cannot time its own sacrifice from
making one by accident, so that the matrix measures the rule rather than the
accident. **OP-01, again, and it is the second time this year the chooser has been
the largest term in a measurement.**

| | cities | mixed | haunt | bands | storm |
|---|---|---|---|---|---|
| the game as it ships | 39% | 45% | 55% | 41% | 68% |
| less 1.23 zero spent | 38% | 43% | 55% | 39% | 69% |

**Small, and expected to be.** A one-ply chooser cannot value its own body, so what
this rule takes from it is a few late turns it was spending badly anyway. The real
measurement is a person deciding to spend the last of themselves on something, and
the instrument for that is OP-21 and a played game.

**Settled by:** Rick, August 2026, on the design and on the reading. *It's not for
nothing called Fading Gods.* Built, measured and shipped the same day. See
`engine/constants.js` 1.23.

---

## A-31 · Should the chooser be allowed to walk into a furrow? — **settled: no, and the rule stands as it is**

**Raised by** game 6, the first play of `9eefc81`. Rick reported that the rival
*spent himself* and that there was no action left in the last stretch of the game.
There was not. It had walked into its own fields and stayed there.

**The rule is not the defect and does not change.** `endYear` charges a tenth of
your manifestation for **ending a year on reckoned ground of any owner** — the
comment beside the constant says *their* fields and the chronicle line says *their
furrows*, and both are wrong about what the code does. Offered the correction,
Rick took the other half: *gods have no place on tilled lands, it destroys them.*
So `own` stays out of it. Ploughed ground is ploughed ground, and standing in it
costs you whether or not you were the one who said to plough.

**The defect is that the chooser had no concept of a body.** It would stand a year
in its own fields for a teaching nudge worth nothing, pay a tenth of itself, and be
back next spring. `free()` — the guard A-30 put in for exactly this — covers the
**dream** toll only. The standing toll was unguarded.

**What it was doing to the numbers.** 200 games a row, the shipped build, before
and after:

| | rival reached zero | furrow tolls a game | inert years a game |
|---|---|---|---|
| bands v cities | 21% → **6%** | 1.65 → 0.45 | 1.6 → 0.2 |
| haunt v cities | 15% → **2.5%** | 1.67 → 0.43 | 0.9 → 0.1 |
| mixed v cities | 32% → **7.5%** | 2.67 → 0.72 | 2.0 → 0.3 |
| cities v cities | 38% → **10.5%** | 3.13 → 0.98 | 2.6 → 0.5 |
| storm v cities | 21.5% → **5%** | 2.29 → 0.68 | 1.4 → 0.3 |
| bands v mixed | 7% → **1.5%** | 0.69 → 0.11 | 0.2 → 0.0 |

A doctrine that never ploughs never paid at all — bands against bands and haunt
against haunt were **0%** before the change and after it. The toll has only ever
been charged to the side that feeds people, which is worth knowing on its own.

**Three guards, in the order they were needed, and each one found by measuring the
one before it.**

1. **The act.** Two-tier, exactly like `free()`: the best act that does not stand
   in a furrow, and only if every candidate does, the best act there is. The
   no-candidate fallback picks a clean tile too — a token with nothing to do
   wandered into the fields at random and that branch was doing real damage.
2. **The clearance.** The act guard left 51 tolls in a hundred games and **49 of
   them were the god ordering the plough through its own feet**: a Clearance takes
   the six tiles *round* the one it is aimed at, and one of the six was the tile it
   was standing on. `notUnderfoot` aims somewhere else when there is somewhere
   else.
3. **The walk out.** The act and the order both happen where you stand, and then
   you walk on — ordinary play, which the interface has always allowed and the
   chooser never did. `stepOff` asks `reach` again from where the token now stands,
   **with the budget the act did not spend**, and walks to the nearest clean tile.
   A god that jumped the whole year's movement to get to its act has nothing left
   and stays in what it ordered. Nothing here is free.

**None of the three is an improvement in judgement, and that is deliberate.** No
guard weighs a tenth of a body against the act it would buy. That is the decision
1.7 and 1.23 exist to hand a *player*, and OP-01 says this chooser cannot see it.
They are preferences with fallbacks, and the fallbacks are the point.

**What is left is the rule, and it is the better half.** After all three, the
dominant cause of a toll is no longer anything the chooser did. Over a hundred
games of mixed against cities: 0 boxed in, 13 stood in a furrow having spent their
movement getting there, 9 charged after they were already spent — and **71 where
the fields simply grew out under the token during the world tick.** The plough came
to the god. It is a cost arriving from an advance elsewhere, it is visible a year
ahead to anyone who looks at what is next to a settlement, and a player has exactly
the same exposure. That is the rule working, and it should stay.

### And it re-bases every number the last batch produced

This is the third time OP-01 has been the largest term in a measurement, and the
largest of the three. The sweep table was reading an opponent that falls over.

80 games a cell, against Cities:

| | cities | mixed | haunt | bands | storm |
|---|---|---|---|---|---|
| **as it ships, with the guard** | **36%** | **36%** | **53%** | **33%** | **61%** |
| the same game, without it | 39% | 45% | 55% | 41% | 68% |

Re-measured at **300 games a cell**, where the 95% interval on a difference is
about ±7 points, the batch's two headline results do not survive:

| claim, as published | measured again |
|---|---|
| `wildFolk` is worth **+11** to Bands | **−3.7** |
| `deadOrders` is worth **+9** to Mixed | **+2.0** |
| `wildFolk` is worth **+4** to Storm | **−2.0** |
| `stonesGrow` measures at nothing | **−0.7**, unchanged |

And the arc, at 300 games a cell: Bands **13% → 38% → 34%**, not 10% → 28% ->
41%. **The August batch is what moved Bands. The batch after it did not move it at
all**, and the gains attributed to `wildFolk` and `deadOrders` were the rival
killing itself at different rates in the presence and absence of those rules.

**This does not un-ship anything.** `taughtLoss` and `audible77` were kept on
judgement against a measurement of exactly zero and the reasoning is in OP-19; the
same reasoning covers these. What it does mean is that **OP-06's answer is 34%, not
41%** — still yes, still hard — and that no number in §17.6 should be quoted
again without re-running it.

**Evidence.** `sim/smoke.js` at 11,924 checks, all passing. **The `R2all(false)`
fingerprint did not move on a single seed**, which is the check that matters: the
guard reads `FG.R2.fade`, which is off in the pre-batch game, so it cannot reach it
by construction rather than by luck. The `R2reset()` fingerprint moved on four of
eight seeds and **every one moved the same way** — 117→126, 34→60, 77→94,
50→104, all of them the rival no longer spending itself to nothing.

**Settled by:** Rick, 25 August 2026, on the ruling that decides it — *gods have no
place on tilled lands, it destroys them.* The rule is untouched; the chooser
changed. See `engine/ai.js`, and `design/rules.md` §18.

---

## A-32 · What is the settled side actually for? — **settled: denial, and the code already said so**

**Raised by game 7**, the first game anyone has played from the settled side, and
by Rick's reading of it: *the main mechanic is not gaining points with agriculture,
because you can't. It is the interdiction of the opponent, and in this it is very
effective. Agriculture destroys your own divine realm, but it lets you destroy the
other's faster.*

That is correct, it is the design working as written, and the sentence is already
in `tick.js` above the loop that does it: **the one-way ratchet — farmland does
not out-score blessing, it erases it.** What was missing was that nobody had said
it out loud as *the settled doctrine's whole theory of victory*.

### The four lines that make it true

| | blessing | farmland |
|---|---|---|
| worth, a tile | **3** | **2** |
| how it spreads | one act, in person, one tile — plus one free tile a year from a working stone | **by itself**, up to 3 tiles a year, 30 per settlement for life, no act and no toll |
| what it may be laid on | **wild ground only** (`blessEffect` returns null on `reck`) — or, in person, unmade off the rival | anything that is not already your own furrow, **including their blessing and their furrows** |
| what takes it away | any furrow within one tile, automatically, to **nobody** | a wonder, or a herd, one tile at a time |

So a furrow is the worst-scoring ground in the game and it annihilates the best.
One tile worth two points can wipe six tiles worth eighteen, and the eighteen go to
neither power. **And it is irreversible: you cannot bless farmland.** Ground that
has been ploughed leaves the divine economy for good.

The magical side has a denial tool of its own — `unmake`, three points off them
for an act and a walk — but it is an act, in person, one tile at a time.
Ploughing is free, automatic, and happens while you are elsewhere.

### Measured

200 paired seeds, each doctrine as seat 0 against Cities, compared with the same
doctrine on the same seeds against Passive — so "builds alone" is that
doctrine's ceiling with nobody in the way.

| doctrine | builds alone | loses to the rival | takes off the rival | ends at |
|---|---|---|---|---|
| **cities** | **153** | −74 | **−69** | 79 |
| mixed | 165 | −86 | −58 | 79 |
| haunt | 253 | −151 | −55 | 102 |
| bands | 252 | −157 | −44 | 95 |

**Against the same opponent, agriculture takes half again as much and loses half as
much. It simply cannot build.** Bands makes 252 and keeps 95 — it loses 62%
of everything it ever holds. Cities makes 153 and keeps 79, losing 48%. The
settled side is a low ceiling, high denial, low vulnerability; the magical side is
the exact mirror.

Blessing erased per game by the ratchet, 120 games: **8 to 15 tiles** in a
magical-against-settled game, and **35 a side** when both powers plough.

### Why this is the lore rather than a balance problem

`concept/concept.md` says a mechanic that does not sit on *you can only be
remembered by the thing that deafens you* belongs in `ideas.md`. This one sits on
it from the other end. **A god of farmers is not building a smaller realm. It is
making the category smaller for everybody**, and it wins because the other power
had more to lose. That is the one sentence read as a weapon rather than as a fate,
and it is the first time the settled side has had a reason to exist that is not
"the doctrine you play if you want the numbers to go up".

### What it opens

- **The score does not show a settled player how they are doing.** Cities' 4,700
  people in game 7 were worth 27 points; the win came from the rival's absence. The
  interesting number for that doctrine is *the opponent's blessing*, and the
  interface never names it. A "what went out this year" line, or the ratchet count,
  would make the strategy legible while it is being played rather than at the end.
  See OP-23.
- **Population still feeds nothing.** A city of 827 scores what one blessed tile
  scores. For a doctrine whose whole engine is population —— driving the
  ploughing budget —— that is defensible, and it should be written down as a
  decision rather than left as an accident of `score()`.
- **OP-06 has a mirror and it is now answered too.** *Does an ascetic strategy ever
  win* has been yes since A-19. *Does the settled strategy have anything to do
  besides grow* now also has an answer, and it is a different answer: **it wins by
  subtraction.**

**Settled by:** Rick, 25 August 2026, from game 7 and stated as a reading rather
than as a request. Measured the same day and it holds. Nothing changed in the
engine — this is a name for something that was already running. See
`engine/tick.js` (the ratchet), `engine/constants.js` `blessEffect`, and the
playtests doc, game 7.
