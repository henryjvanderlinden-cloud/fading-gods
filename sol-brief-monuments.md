# SOL brief — monuments, escalation, and what the late game is for

**What this is.** A self-contained prompt for OpenAI's `gpt-5.6-sol`, running as
Codex, asking it the monument question raised on 31 August 2026. It is written to
be pasted whole. Everything SOL needs is in this file — it does **not** need to
read the repository, and telling it not to is deliberate: the value of this reader
is that it has no history here, and the last review (`registers/open-points.md`,
*SOL's reading, 29 August 2026*) was made from documents alone and produced OP-27,
OP-28 and OP-29.

**Why it is a file and not a tool call.** Run from a Cowork session the MCP call
window is shorter than a `gpt-5.6-sol` reasoning run, and every substantive
generation timed out — four attempts, including one capped at 400 words with
reasoning effort lowered. A one-word ping returned fine, so the model is reachable
and the call is not. Run it from a terminal instead, where nothing is waiting:

```
codex --model gpt-5.6-sol
```

then paste everything below the line. Ask for the answer in one pass; if it stalls,
ask for (a) and (b) first and the rest in a second turn.

**Round two is at the bottom of this file** — a separate paste that shows SOL the
counter-proposal and asks it to attack it. Do not include round two in the first
paste. The first answer is worth having unanchored.

---

You reviewed a game repository called *Fading Gods* on 29 August 2026, from its
documents alone. Your review is filed in its register. Three of your points became
open items: **OP-27**, that the first-game ruleset may be too large to be played;
**OP-28**, previewability, that the tragedy should come from choosing knowingly
rather than discovering hidden resolution order; **OP-29**, replay tooling. Your
central worry was that *the design may be more fascinating to analyse than
pleasurable to inhabit*, and your test for the whole design was whether a player
feels **temptation** — wanting to teach, grow, split or refuse while knowing the
cost — or merely calculates which irreversible penalty is cheapest.

Do not read any files. Answer from this brief.

## The game

Two supernatural powers walk a 14×9 hex valley for forty years. Eighty-four tiles
are walkable.

**Ground.** Where you walk, you bless (worth 3 points). Where your settlements
plough, ground becomes *reckoned* farmland (worth 2). Reckoned ground permanently
erases blessing adjacent to it, and is **impassable to you** — your own farmland
walls you out exactly as the rival's does. A settlement is worth 3. Highest total
at year forty wins. There is no other scoring.

**Founding.** Only on ground you have blessed, with 85% of the two-ring yours. A
founding is 20–40 people depending on how much of that ring is blessed. Untaught
settlements are asymptotic to about 150 people and never do anything but exist.

**The trade, which is the whole game.** Teaching a settlement to till costs you
**the greatest wonder you have left** and moves you one step up the ladder of
*works*. You begin with all six wonders and lose them in a fixed order — raise
mountains, drown the ground, blight, bad omen, wither the furrows, quicken — so
world-shaping goes first and small tending gestures last. Late in the game you can
still bless a hedgerow and can no longer move a hill. The works arrive on the same
counter running the other way: one teaching opens **clearance**, two open a
**colony**, three open a **levy**. Every teaching costs a wonder and buys a work.

**Stones.** Maximum four, raised on blessed ground with eight or more connected
blessed tiles. A stone blesses one tile a year for free and **holds back one
wonder**. Its power is the size of its **connected** blessed region, so severing
your own ground silences your stones. A stone gains a *course* each year — three at
most — while an untaught people under seventy-seven stand within its reach; courses
lower its working threshold, so an old stone remembers a larger country than it now
stands in. Teach that people to till and the stone stops, permanently unfinished.
**92% of stones end buried under farmland**, and that is irreversible, because
reckoned ground cannot be walked to and so cannot be blessed back. A silenced stone
still relays *orders* — a work aimed within two tiles of one arrives free of toll —
but relays no blessing and teaches nobody.

**Your body.** One stock, *what is left of you*. Teaching or ordering beyond your
hearing costs 10% of it, permanently; so does ending a year standing in furrows,
including your own. Nothing refunds any of it. At zero you cannot move, act, teach
or intervene: the year still turns, the score still accrues, your people still
plough and march, and **the game does not end — your part in it does.**

**The people.** Under seventy-seven and untaught, a people can hear you and bless
the ground round them simply by being there. Past that, or once shown the plough,
they cannot. A third teaching, *herding*, is available only once somebody somewhere
has broken ground; a herd roams, grazes farmland back to wild, holds no ground and
scores nothing. A herd standing on farmland over a dead stone of its own god may
raise a **kurgan**: it does not clear the tile, it counts the stone as *standing*,
and it **scores nothing and gates nothing**. `moundCount` is tracked and displayed
and nothing in the game reads it.

**The thesis.** *You can only be remembered by the thing that deafens you.* You are
not a victim of this. You put the wild folk in the blessed country yourself,
knowing exactly what grows from them.

## The problem this question exists to solve

The register's highest-ranked open item, OP-25. The valley is a fixed pie: blessed,
the whole board is worth 252 points; ploughed, 168. Total points on the board, both
powers together, **peak at year twelve or thirteen at about 230 — 91% of everything
that can ever exist — and fall for the remaining twenty-seven years.** Creation does
not slow because the players lose interest; it stops because there is nothing left
to create on. Two settled powers destroy 29% of everything they ever made.

So the late game is **interdiction only, by arithmetic**: roughly twenty-five of the
forty years contain no constructive decision, only choices about whose thing to
break. That may be correct. It has not been chosen.

## The new input

A long piece on the Neolithic megaliths of Brittany — Carnac, Locmariaquer,
Barnenez, Gavrinis, Er Lannic, c. 4790–3200 BCE — arguing they are an
**"architecture of anxiety"**: monument building explodes exactly where
hunter-gatherers and incoming farmers collide over finite land, because a wooden
marker rots in a generation and a fifty-tonne granite block is a permanent legal
claim. *Our bones are in this hill. We were here first. This land is ours.* Six
load-bearing details:

1. **The impulse is Mesolithic** — slab-lined graves, antler crowns, the dead
   buried inside the living space — but it is **scaled up** once farming makes land
   ownable. So the giant stones belong to the **settled** side. This inverts the
   game, where stones belong to the refusers and are killed by farmland.
2. **Two answers to one panic.** South: giant tumuli for individual *Big Men*,
   fabulous imported grave goods, a dynasty lasting 200–300 years that then
   collapses. North: Barnenez, eleven passage graves side by side inside one cairn,
   individual identity erased into a single anonymous ancestor block — *we are
   eleven, but we are one.*
3. **Escalation.** Once Le Ménec existed, Kermario had to be bigger. Legitimacy
   could be claimed only by moving more granite than the previous generation — a
   cold war of stone that ends when the labour force cannot pay.
4. **Cannibalism of the sacred.** Mané-er-Hroëk roofed its chamber with a fragment
   of a smashed older standing stone. The Gavrinis capstone, the Table des Marchands
   capstone and the Er Grah roof are three pieces of **one** shattered fourteen-metre
   menhir: a broken god, cut up, load-bearing in three of somebody else's tombs.
5. **Potlatch.** At Er Lannic, jadeite axes carried a thousand kilometres from the
   Alps were deliberately smashed and burnt; at Petit Rohu they were planted upright
   in rising marsh. Destroying immense wealth as a display of power, and as a plea
   against an encroaching sea.
6. **Collapse by ecocide.** Deforestation and soil exhaustion, from feeding the
   workforce that moved the stone.

## The constraints, which are not negotiable

- **No new scoring category may be added to fix a balance problem.** The project's
  own ruling is gameplay first, scoring after. **Population must not score** — a city
  of 827 scores what one blessed tile scores, and rewarding people would let the
  settled side's growth engine feed itself.
- **Conditions, not clocks.** A reverse tech tree was cut on the grounds that *a
  timer is weather*. Anything that triggers on a turn number is refused.
- **Nothing may be a third door out of the central dilemma.** If a line can win
  without ever teaching people the plough, the thesis has stopped being
  load-bearing and the mechanic is wrong however well it plays.
- **Your own OP-27 stands.** The ruleset may already be beyond a reasonable
  first-game model. Anything you propose must earn its complexity, and you must name
  **what you would cut to pay for it**.
- **The balance matrix cannot settle this.** The rival AI is one-ply greedy; it
  raised **zero** kurgans in three hundred games, and two existing rules of this
  class measured at exactly zero and shipped anyway. Do not propose validating any
  of this with the matrix.

## What to answer

1. **How should bigger-and-bigger monuments be incorporated, for more interesting
   gameplay?** Specify **one** rule tightly enough to be argued with — who may
   build, on what ground, and what the condition for *bigger* is. One rule specified
   beats five listed.
2. **What does it cost, and what does it buy?**
3. **What interesting decision does it create?**
4. **What makes you more vulnerable for having built one?** An escalating monument
   race is only interesting if building the biggest thing exposes you. Say exactly
   how.
5. **How does the opponent thwart it?** Name the counterplay verbs.

Then: name the **single piece you would build first**, and what you would cut for
it. If you think the monument framing is wrong for this game, say so and say why
instead of answering.

---

## Round two — paste only after the first answer

A counter-proposal exists. Attack it. Say which of its parts survive, which are
decoration, and where it breaks a constraint above.

**The Mound.** A settlement **taught to till** — so one that has already cost a
wonder — may raise a mound on its own reckoned ground within radius 1. It does not
un-reckon the tile. The *bigger* condition is board state, not a clock: **a new
mound must exceed the tallest mound standing on the board, either side**, in
courses; the first is one course, the next two, and so on.

**Cost.** Each course costs 20% of the settlement's population and one tile of its
thirty-tile lifetime reckoning budget, permanently. The settlement orders nothing
else that year.

**What it buys.** A standing mound counts toward the wonder brake exactly as a
working stone does — one term added to a formula that already exists, rather than a
new scoring category.

**Vulnerability.** The builder stands still, grows less, and pushes no ring outward
for a year; it is smaller, and a small settlement is easier to encircle and empties
faster once forbidden; and every course permanently spends a tile it will now never
plough, which is an invisible wound that arrives around year thirty-five.

**Counterplay.** *Cannibalise* — a taught settlement within two tiles of the rival's
mound may raise its own using that mound as material: one course cheaper, and the
rival's mound loses a course. *Ring and forbid* — a captured settlement can never
teach again, so it can never build or extend. *Wither* — break the farmland ring to
make the builder encirclable. *Outbid*, which is the trap.

**What it cuts.** The kurgan as it currently stands, which scores nothing, gates
nothing, and which the register already says to cut if the endings are never
written. The two become one object with two doors: a herd over a dead stone raises
one free, one course, memory only; a taught settlement in its own field raises one
expensive and escalating that holds a wonder.
