// Fading Gods — engine: constants, tunables, randomness.
//
// Loads two ways, from one source:
//   browser  <script src="../engine/constants.js"></script>   -> globalThis.FG
//   node     require("./engine/constants.js")                 -> the same FG
//
// Classic script, deliberately: ES modules will not load over file://, and the
// game has to stay double-clickable. See architecture/architecture.md.
(function (root) {
"use strict";
const FG = root.FG = root.FG || {};

FG.COLS = 14;
FG.ROWS = 9;
FG.MINREG = 8;          // connected blessed tiles needed to raise a stone

// --- tunables -----------------------------------------------------------
// Mutated in place by the sliders in the build and by the harness. Never
// reassign FG.TUNE wholesale — callers hold a reference to this object.
FG.defaultTune = function () {
 return {
  growth:{l:"growth per year",v:22,min:6,max:40,s:"%"},
  spread:{l:"reckoning / year",v:3,min:1,max:6,s:""},
  budget:{l:"a settlement's limit",v:30,min:6,max:80,s:""},
  frac:{l:"blessing needed to found",v:85,min:0,max:100,s:"%"},
  mfrac:{l:"blessing to raise mountains",v:70,min:0,max:100,s:"%"},
  bval:{l:"blessed ground worth",v:3,min:1,max:5,s:""},
  stonecap:{l:"stones allowed",v:4,min:0,max:6,s:""},
  // 1.18. These count *teachings* now, not settlements past a population.
  // 1 / 2 / 3 rather than 5 / 7 / 9, and the ranges come down with them: the
  // old ceilings were sized for a strength score that ran into double figures
  // and a taught count does not.
  t1:{l:"clearance at",v:1,min:1,max:8,s:" taught"},
  t2:{l:"colony at",v:2,min:1,max:8,s:" taught"},
  t3:{l:"levy at",v:3,min:1,max:8,s:" taught"},
  turns:{l:"years",v:40,min:10,max:60,s:""}};
};
FG.TUNE = FG.defaultTune();

FG.setTune = function (over) {
 Object.keys(over || {}).forEach(k => { if (FG.TUNE[k]) FG.TUNE[k].v = over[k]; });
 return FG.TUNE;
};
FG.resetTune = function () {
 const d = FG.defaultTune();
 Object.keys(d).forEach(k => { FG.TUNE[k].v = d[k].v; });
 return FG.TUNE;
};

// walls are slow going (cost 3) rather than impassable
FG.SOFT = false;

// OP-07/OP-21. Tiles blessed for the right-hand seat at year one, against the
// measured +4.0 ± 1.4 point advantage the left-hand seat gets from map
// generation. Zero by default — every number measured so far was taken without
// it, and it is only wanted when a person is sitting in the right-hand seat.
// Applied in createGame; see the note there for what it cannot fix.
FG.HANDICAP = 0;

// --- R2: the August 2026 batch ------------------------------------------
// OP-19 and OP-20, plus the smaller rules settled alongside them.
//
// **The built rules are now on by default.** Rick played the batch across
// several games in August 2026 and reported it a clear improvement, which is
// the evidence class this project ranks above the matrix for anything about
// choices. The batch stops being an experiment and becomes the game.
//
// Two consequences, and neither is a detail:
//
// 1. `design/rules.md` is now the *old* rules for everything below that is
//    true. It is being caught up in the same commit; if these two ever
//    disagree again, this file is what runs and the design doc is wrong.
// 2. The A/B baseline still exists and is still exact — `FG.R2all(false)`
//    plays the pre-batch game, and every flag below is still individually
//    toggleable, which is what leave-one-out needs.
//
//   FG.R2all(false); node sim/matrix.js 40 40 cities     // the old game
//   FG.R2all(true);  node sim/matrix.js 40 40 cities     // the same seeds
//
// Set before a run and put back afterwards — like FG.SOFT and FG.CONTEST,
// these are not reset between games.
//
// **`pathFrac` is false because it is unbuilt**, not because it was measured and
// declined. Nothing in engine/ reads it. It is a declaration of intent, kept
// here so the numbering does not move; turning it on today changes nothing at
// all. Do not read this block as rules that won and rules that lost.
//
// **`herds` is the one flag that is off for a different reason, and the
// difference matters.** It is built — engine/ reads it everywhere — and it is
// off because nothing has measured it and nobody has played it. It is the
// largest engine change since armies and it went in on top of a batch that has
// been played exactly once. It stays off until a person has sat in front of it.
// See OP-12.
FG.R2 = {
 logistic:   true,   // 1.2   logistic growth; K set by teaching and terrain
 teaching:   true,   // 1.3   tilling and killing, taught per settlement
 taughtLoss: true,   // 1.4   the wonder goes on teaching, not at pop 150
 audible77:  true,   // 1.5   settlements under 77 bless the ground round them
 // 1.6. Built August 2026, and it is a bug fix wearing a rule's clothes.
 //
 // The old split asked for a *neighbour* of the settlement that passed the
 // whole founding test — and `foundBlock` refuses any tile with a settlement in
 // its own neighbourhood, which every neighbour of a settlement has: the
 // settlement doing the splitting. **Split was therefore never legal, in any
 // position, since it was written.** Measured before it was touched: true in 0
 // of 1,047 settlement-years, in a build where `bands` weights it at 14 and the
 // dropdown describes that doctrine as *splits at sixty*.
 //
 // So the flag does two things at once and they should not be confused. It
 // makes split *possible*, which is a repair rather than a balance change; and
 // it decides where a splinter may go, which is a balance change. See OP-19 and
 // registers/rejected.md for the rule it replaces.
 split2:     true,   // 1.6   split targets your blessing at path distance 2
 fade:       true,   // 1.7   reckoned ground enterable at 10% a year (OP-14)

 // 1.8 / OP-16. **Creation at a distance, unmaking only in person** — the line
 // this project has been drawing since teaching moved onto the stone network,
 // now drawn on the ground itself. Blessing wild country is what it always was.
 // Taking country the other power has blessed returns it to *wild*: you unmake
 // before you make, two visits for one tile, and the principle is said out loud
 // on the board instead of asserted in a register.
 //
 // The test is presence, not which of the two spells it is. Bless happens where
 // you stand and can always unmake. Quicken aimed at arm's reach can unmake
 // too; aimed down the stone network it takes wild ground and nothing else.
 // That is what makes a stone deep inside its own blessed region hard to
 // silence — the attacker has to walk in, one ring a year, visibly.
 unmake:     true,   // 1.8   taking their blessing returns it to wild

 // 1.9 / OP-20. A settlement closed in on every side by one power's blessing
 // goes over to it after two years, and what it knows is forbidden for good.
 // People move ownership; gods move knowledge — 1.8's asymmetry carried from
 // the ground to what the ground knows. It is the only un-teaching in the game,
 // and the only verb the player has that is neither making nor breaking.
 //
 // Nothing is handed back for it directly, and it does not need to be.
 // `lostCount` is derived from the board, so silencing a taught place drops the
 // count of whoever owned it — exactly as taking one by levy already does. The
 // wonder returns to the side that lost the loud place. That is the rule the
 // game already had and it is the right one: the fading is caused by your own
 // people ceasing to hear you, so it lifts when they stop being yours.
 encircle:   true,   // 1.9   a ring of blessing takes a place, and forbids it
 // 1.10 was `landGates` — the works unlocking on ground you had tilled. Cut in
 // August 2026 without ever being built, in favour of 1.18 below, which measures
 // the same and costs two lines instead of a new per-settlement unlock model.
 // See registers/rejected.md and OP-05.
 taughtGates: true,  // 1.18  the works open on teachings, not on population
 pathFrac:   false,  // 1.11  UNBUILT — blessFrac counts path distance (A-18)
 // 1.12. Half-built, August 2026, and the halves are deliberately separate.
 //
 // *Barren ground* now exists in the engine: a tile carries `bar`, the year the
 // furrows will take again, and nothing may reckon it before then. 1.19 needed
 // that, because grazing without it is a tempo cost the settled side undoes in
 // one season, and the third leg is not a leg.
 //
 // **This flag is only about Wither.** Whether a wonder should leave the ground
 // barren as well as bare is the question it was raised to ask, and it is still
 // unmeasured, so it stays off and Wither behaves exactly as it always has. A
 // herd grazing leaves ground barren whatever this says, because that is part of
 // the herd rule and lives behind `herds`. One writer per rule; one reader for
 // both. Turning this on changes Wither and nothing else.
 barren3:    true,   // 1.12  Wither also leaves the ground barren for three years
 exitLane:   true,   // 1.15  the fields close slowly, and never seal a place in

 // OP-19, the fifth answer to *where does teaching happen* — August 2026, and
 // it is the one the register never considered. The four candidates on the
 // table were all compromises on presence. This one keeps presence and moves
 // it: you may teach wherever you can still be heard, which is exactly where a
 // wonder already reaches — beside you, or within range of a working stone.
 //
 // A dream, in other words, travelling down the channel your voice already
 // travels down. `concept/lore.md` needs no amendment for it; OP-16's
 // *creation at a distance, unmaking only in person* already draws the line,
 // and teaching is creation.
 //
 // The price is `dreamToll` below, and the second price is free: teaching them
 // to till makes them plough, ploughing eats the blessed ground a stone stands
 // in, and a stone below MINREG stops working. **Teaching at range destroys
 // the channel that carried it.** Nothing had to be written for that; it falls
 // out of rules that were already here, and it is the whole thesis in one loop.
 dreamTeach: true,   // 1.16  teach within divineReach; a toll if not in person

 // The same rule for the works, and it is a *nerf*, which is worth being loud
 // about because it does not look like one. Clearance, colony and levy already
 // reach anywhere on the board for free — `targets()` builds them from the
 // settlement outward and never consults where the player is standing. So this
 // does not grant the works a range they lacked. It charges them for the range
 // they always had, when it exceeds the country you can still be heard in.
 //
 // Late on, you stop performing miracles and start issuing orders, and issuing
 // orders into country that cannot hear you is what wears you away. That is the
 // arc, and it is the first thing in the game that makes the settled doctrine
 // pay a price in *you* rather than in people.
 dreamWorks: true,   // 1.17  a toll on a work aimed outside divineReach

  // 1.20 / OP-16, and *stones grow* in ideas.md. **A stone gains a course while
 // a settlement under seventy-seven stands within its reach.**
 //
 // The bonus is not the design question and never was. *Who does the adding* is,
 // and answering it is what keeps this out of `rejected.md`: a stone that grows
 // on an age counter is a timer, and A-10 would be raised against it correctly. A
 // stone that grows because there are people near it who still hear you is a
 // stock you built and can lose.
 //
 // So a course is added by the audible — the untaught band under the
 // Seventy-Seven, and the herd, which is that band walking. 1.5 already decides
 // who that is; this reads the same predicate rather than writing a second copy
 // of it, which is the drift this project keeps finding.
 //
 // **What a course buys is not reach.** Reach is capped at 3 and a fourth tile of
 // it would be worth nothing. It buys the *working* threshold: each course takes
 // one off the six connected blessed tiles a stone needs to still answer, down to
 // three. An old stone remembers a larger country than it now stands in, so
 // severing a blessed region hurts an ancient stone less than a new one, and
 // defensive geometry gains a history it did not have.
 //
 // It does not reverse OP-16's 92%. A stone under farmland stands in no blessed
 // ground at all, so its region is zero and three courses do not save it. What
 // the courses answer is severance, which is the case the idea was written about.
 //
 // **It must not feed the wonder brake, and does not.** `lost = taught -
 // workingStones` is already recorded in OP-19 as broken for a refuser, where the
 // working stones subtract from zero, and stronger stones would make that worse
 // rather than better. `lostCount` therefore reads `workingStrict` — the plain
 // six — and every other caller reads the augmented test. Two functions, one line
 // of difference, and the difference is written out in rules.js.
 //
 // The reason to want it is that the thesis fits inside one object: **teach that
 // band to till and the stone stops growing.** Nothing enforces that. It falls out
 // of a taught settlement no longer being audible, and the stone is left arrested
 // where it stood, visibly unfinished, for the rest of the game.
 stonesGrow: true,   // 1.20  a stone grows while the audible stand in its reach

 // 1.21 / OP-13. **Working stones carry presence, dead stones carry orders.**
 //
 // A stone below the working threshold stops blessing and today does nothing
 // whatever. Under this it stops being a place where you are *heard* and becomes
 // a place from which you are *obeyed*: a work aimed within `orderRange` of one of
 // your silent stones arrives for nothing, where 1.17 would otherwise charge for
 // it.
 //
 // Note what this is not. It does not extend the reach of the works themselves —
 // `targets()` has always built those from the settlement outward and still does.
 // It extends the country an order arrives in, which is 1.17's test and only
 // 1.17's test. Creation still travels through living stones alone: a dead stone
 // relays no wonder and teaches nobody. That is the sentence, kept exact.
 //
 // **The reason to want it is not the range, it is what severance does.** Cutting
 // a blessed region in half currently only subtracts: it halves your stones and
 // stops there. Under this rule it also *converts* you, from a god into an
 // administration, so the attack pushes you somewhere instead of merely taking
 // something away.
 //
 // With 1.23 in the same batch it gains a second job the register never had for
 // it. Orders are the thing that uses you up, so a network of dead stones is what
 // lets you go on ruling without spending yourself, and **when you run out becomes
 // something you steer rather than something that happens to you.**
 //
 // OP-13's own warning stands and should be watched: four stones raised early and
 // left to die under farmland is a permanent command network for the price of a
 // few early acts. What is meant to hold it honest is the stone cap — the same
 // four slots a magical player wants standing and answering — and that paving one
 // over cannot be undone in either direction.
 //
 // A kurgan is excluded. *Buried stones carry memory* is OP-13's third line and a
 // different disposition, so raising a mound over a dead stone closes the relay
 // for good. That gives the mound a cost and therefore a decision, which is the
 // thing OP-15 has so far been unable to give it.
 deadOrders: true,   // 1.21  a silent stone of yours relays a work, free, at 2

 // 1.22 / OP-18. **The wild folk found the place, and where you blessed decides
 // how many of them there are.**
 //
 // Section 3 has always required 85% blessed country within two tiles before you
 // may Found, and has always called that load-bearing without saying quite what it
 // was. Under `concept/lore.md` it is not a gate at all: the people are already
 // out there, few and wild and able to hear because the country is quiet, and a
 // settlement is those people deciding to stop moving.
 //
 // So a founding stops being a flat thirty and is read off the country instead —
 // `foundLow` to `foundHigh`, by how much of the eighteen tiles two rings out is
 // blessed ground of yours. Rock, water and the edge of the map are in the
 // denominator and never in the numerator, so a coastal founding starts smaller
 // than one in the middle of a country and a valley mouth smaller than a plain.
 //
 // **This is the small version of OP-18 on purpose.** The register's proposal was
 // a population *pool* on wild ground, and `concept/concept.md` forbids that: the
 // moment it has a visible number the player farms it. Here there is no pool and
 // nothing to spend. The number is read once, at the moment of founding, and
 // never again — nothing accumulates and nothing drains.
 //
 // Found only. A colony is a work of the settled and keeps its forty, a splinter
 // is half its parent, and a herd that stops is whatever the grass left of it.
 // Those are people who came from somewhere. This rule is about the ones who were
 // always here.
 wildFolk:   true,   // 1.22  a founding is as big as the country round it

 // 1.23 / OP-14. **What zero is** — the open half of OP-14 since it was raised,
 // and the last question in the batch that needed a person to settle it.
 //
 // Today zero means one movement point forever, which the register calls the
 // punishment reading and which is right: you shuffle a tile a year for the rest
 // of the game and no part of it is a decision.
 //
 // The rule is that **there is no floor.** At nothing left you cannot move, act,
 // teach, order or intervene. The year still turns, the score still accrues, the
 // stones still bless, and your people still plough and march and graze — and you
 // watch it. The game does not end. Your part in it does.
 //
 // The register's alternative was *lose the body and keep playing as a network*,
 // and this is the harder and better version of that thought. A network with no
 // location is still a player taking turns. This is not. It is the title: the
 // whole of what you did to be remembered is what stopped you being heard, and the
 // last of it goes out while the valley carries on without you.
 //
 // **It is a decision because you can see it coming.** The stock is on the bar in
 // whole percent, the slope is felt at two thirds and again at a third, and every
 // spend is chosen — a dream sent, an order carried out of hearing, a year ended
 // standing in their furrows. Nothing takes it by surprise and nothing puts any of
 // it back. What the rule buys is that the last of it is worth spending: you can
 // decide *when* to have nothing left, and what to have bought with the going.
 //
 // The drawing is half of it and is deliberately not behind this flag. Both powers
 // thin toward transparency as their manifestation falls, wherever `fade` is on,
 // so what the number says is also a thing on the board. At a tenth you are a
 // phantom standing in a field.
 zeroSpent:  true,   // 1.23  at nothing left, you may only watch

 // 1.19 / OP-12. **The third leg.** A people never taught the plough may be
 // taught to keep herds instead, and then they stop standing still.
 //
 // Not a new system — a third entry in FG.TEACH, inheriting everything OP-19
 // built: taught per settlement, in person or by dream, one thing only about how
 // to live. The rock-paper-scissors the design called for and never had:
 //
 //   farmland beats blessing   the §1 ratchet — furrows erase the quiet beside them
 //   herds beat farmland       they overrun it and graze it back to thorn
 //   blessing beats herds      a rival power's blessing is closed country to them
 //
 // **Availability is a condition, not a clock** — you may teach herding only
 // once ground has been tilled somewhere on the board. `rejected.md` cut the
 // reverse tech tree because a timer is weather, and A-10 stands. It is also
 // historically right: herding is a secondary product of farming, not a stage
 // before it. And it self-balances, because a valley nobody ploughed has no
 // herders in it.
 //
 // **It costs no wonder, and it earns no points.** That pairing is the whole
 // safety. `lostCount` reads settlements taught to till and a herd is not a
 // settlement at all, so nothing is taken from you — and nothing is given
 // either: a herd holds no ground and `score()` never sees it. They deny, they
 // do not accumulate. This is the answer to the one way this rule goes wrong,
 // which is that it becomes a third door out of the central dilemma. It is not a
 // door. It is a detour: a herd that stops is an ordinary untaught settlement
 // standing at the same fork it left.
 //
 // **They move like their god, not like an army.** §7 says the player's movement
 // rules do not apply to mortals, and that is still true of levies and refugee
 // columns — but a people who were never taught the plough can still hear, and
 // what they can hear, they can be shut out of. The other power's blessing is
 // impassable to them; their own god's never is, which is the §2 self-walling
 // trap and it is avoided by writing the rule this way round.
 //
 // The reverse of that is the compensation for scoring nothing: **a herd is
 // always audible.** Steering one costs no act, no intervention, and no toll,
 // wherever it is. You never lose touch with the people who never stopped
 // listening. See concept/lore.md — Storm & Sky were recorded as indifferent
 // because nobody had a third answer for them, and this is it.
 //
 // **Kurgans** come with it. A herd standing on farmland over one of your own
 // dead stones may raise a mound: a fifth of them, and the year. The tile stays
 // reckoned — a mound in a field — and the stone counts as *standing* without
 // ever working, blessing, or feeding the wonder brake. OP-16 measured that 92%
 // of stones end under farmland and that it is irreversible. This does not
 // reverse it. It makes it mean something, which is the better answer: a refuser
 // cannot have their shrines back as engines, and can have them back as graves.
 herds:      true,   // 1.19  a people taught to herd, who then stop standing still
};

FG.R2all = function (on) {
 Object.keys(FG.R2).forEach(k => { FG.R2[k] = !!on; });
 return FG.R2;
};

// The shipped defaults, frozen at load, and restorable by name.
//
// Added August 2026 because 1.12 and 1.19 broke an equivalence the harness had
// been leaning on: **built** and **on** used to be the same set, so
// `FG.R2built(true)` was also a way of saying *the game*. It is not any more —
// both of those are built and both are off. A caller that wants the game as it
// actually ships should ask for it rather than reconstruct it, which is exactly
// how the interface's private copy of R2BUILT came to drift. A-16.
const R2SHIPPED = Object.assign({}, FG.R2);
FG.R2reset = function () {
 Object.keys(R2SHIPPED).forEach(k => { FG.R2[k] = R2SHIPPED[k]; });
 return FG.R2;
};

// Every built rule on, or every built rule off. Note this is *not* the shipped
// game — see R2reset above. `FG.R2all(true)` additionally sets the unbuilt
// flags, which is harmless today and will stop being harmless the moment one of
// them is written. Prefer one of these two.
FG.R2built = function (on) {
 FG.R2BUILT.forEach(k => { FG.R2[k] = !!on; });
 return FG.R2;
};

// The list itself, exported, because the interface needs exactly this and used
// to keep its own copy — which had drifted: `taughtGates` was missing from it,
// so the build showed the largest tuning lever in the project as *not built*,
// and the "whole batch" button switched it off. One list, read by both. A-16.
//
// `barren3` and `herds` join it built-and-off, which is a state this list has
// never had to carry before. The interface reads the list to know what to offer
// a toggle for, and it must offer one for a rule that is off, or the largest
// thing in the build is invisible in it.
FG.R2BUILT = ["logistic", "teaching", "taughtLoss", "audible77", "fade", "exitLane",
              "dreamTeach", "dreamWorks", "taughtGates",
              "split2", "unmake", "encircle", "barren3", "herds",
              "stonesGrow", "deadOrders", "wildFolk", "zeroSpent"];

// The caps in FG.R2. Separate from FG.TUNE because TUNE is the slider panel and
// these are not sliders yet — if they earn their way into the build they move.
FG.R2TUNE = {
 r:        32,    // growth per year, %. Higher than TUNE.growth: logistic slows
                  // the early years and this is the compensation.
 kWild:    150,   // Dunbar. Flat on every terrain — a social limit, not a yield.
 kTaught:  {plain: 1000, forest: 800, hill: 600},   // early Bronze Age, by yield
 decline:  0.28,  // most a forbidden settlement may lose in a year
 wither:   3,     // years withered ground stays barren
 splitRad: 2,     // path distance, not ring distance
 encircle: 2,     // years a settlement must stay ringed before it changes hands
 spread1:  1,     // tiles a settlement ploughs a year in its own first ring
 // 1.19. What a roaming people carries, and it is the Seventy-Seven on purpose
 // rather than a new constant nobody can justify. A herd is the audible band
 // made mobile. Two consequences fall out of choosing this number and both are
 // wanted: a mature village taught to herd is far *above* its new ceiling and
 // sheds people to reach it, so going nomadic costs you most of a town — which
 // makes it a thing you do to a small place, deliberately, early; and a herd
 // that stops and settles again starts as a band rather than as a village.
 kHerd:    77,    // what the grass carries. The Seventy-Seven, walking.
 mound:    0.20,  // of the herd, to raise a kurgan over a stone in a field
 toll:     0.10,  // of your corporeal being, for ending a year in their fields
 dreamToll: 0.10, // ...and for saying something in country you are not standing in
 mp:       3,     // movement at full manifestation
 // 1.20. What a stone can become, and what each course of it is worth. Three
 // rather than a larger number because the whole of the bonus is spent against a
 // threshold of six: at `courses` = 3 the stone answers on three connected tiles
 // instead of six, which is half a region, and half a region is as far as this
 // should ever go. `course` is what one of them takes off that six.
 courses:  3,     // most courses a stone may gain
 course:   1,     // connected tiles a course takes off the working threshold
 // 1.21. How far an order carries from a stone that has stopped answering. Flat,
 // and not `stoneRange`: that formula reads the blessed region a stone stands in
 // and a dead stone has none to read. Two, which is the ring a settlement's own
 // fields reach into, so a relay covers the place it is relaying to.
 orderRange: 2,
 // 1.22. What the country is worth at the moment people stop moving. The span is
 // narrow on purpose — this is situation, not an economy, and a founding that can
 // double is a resource to be farmed.
 foundLow:  20,   // a founding with nothing blessed round it
 foundHigh: 40,   // a founding in the middle of a blessed country
 foundRing: 18    // tiles in a full second ring — rock, water and the map edge
                  // are counted here and never in the numerator, which is the
                  // whole of the coastal discount
};

// A-17, first candidate fix — rejected. Ground both powers take in the same
// year goes to neither. Measured worse than the problem: mean turn-order swing rose from 24
// to 41 points, because it converts a second-mover advantage into a larger
// first-mover one. Off by default, kept so the result can be re-checked.
FG.CONTEST = false;

// A-17, second candidate fix — rejected. Bless and Quicken take only wild
// ground and can never take the other power's blessing. Removes the overwrite that causes the
// turn-order swing at its source, and settles OP-16 as a side effect: if
// blessing cannot take their ground, it cannot take the ground under their
// stone either.
FG.BLESS_WILD_ONLY = false;

// Is this tile takeable by `who` blessing it?
FG.takeable = function (q, who) {
 if (FG.impassable(q) || q.set) return false;
 if (q.st === "wild") return true;
 return !FG.BLESS_WILD_ONLY && q.st === "bless" && q.own !== who;
};

// 1.8. What blessing this tile actually *does*, which under `unmake` is two
// different things and used to be one. Returns "take", "unmake", or null.
//
// `inPerson` is the caller's answer to *are you standing next to this*, and it
// is the whole rule. Bless passes true always — it happens under your feet.
// Quicken passes whether its target tile was within arm's reach, the same test
// `tolled` uses, so the two prices in the game are read off the same line.
//
// Note that an unmade tile still counts as a gain to the chooser and to the
// hint line, and should: it takes three points off the other power and opens
// the ground to a second visit. It is worth doing. It is only worth *less*.
FG.blessEffect = function (q, who, inPerson) {
 if (FG.impassable(q) || q.set) return null;
 if (q.st === "wild") return "take";
 if (q.st !== "bless" || q.own === who || q.own === null) return null;
 if (!FG.R2.unmake) return FG.BLESS_WILD_ONLY ? null : "take";
 return inPerson ? "unmake" : null;
};

// --- randomness ---------------------------------------------------------
// Every engine call site uses FG.rand() rather than Math.random(), so a whole
// game can be replayed from a seed. This is the one addition to the lift-and-
// shift: the harness is worthless without it, and seeded replay was already
// wanted (architecture.md, "things worth building").
function mulberry32(a) {
 return function () {
  a |= 0; a = a + 0x6D2B79F5 | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
 };
}
FG.rand = Math.random;
FG.setSeed = function (seed) { FG.rand = mulberry32(seed >>> 0); return FG.rand; };
FG.useSystemRandom = function () { FG.rand = Math.random; return FG.rand; };
FG.pick = function (arr) { return arr[Math.floor(FG.rand() * arr.length)]; };

// --- interventions ------------------------------------------------------
FG.DIVINE = [
 {id:"mountains",n:"Raise mountains",d:"Three tiles in a line become rock. Only deep inside blessed country."},
 {id:"drown",n:"Drown the ground",d:"One tile becomes water for good. Nothing crosses it again."},
 {id:"blight",n:"Blight",d:"A hostile settlement loses half its people."},
 {id:"omen",n:"Bad omen",d:"Three quarters of your own town walks out and goes to the nearest of yours."},
 {id:"wither",n:"Wither the furrows",d:"Farmland about a tile goes back to waste."},
 {id:"quicken",n:"Quicken",d:"Blessing spreads over a tile and its neighbours."}];

// OP-19. Neither wonders nor works: the two things you teach a people, in person,
// once, and cannot take back except by forbidding the place entirely (OP-20).
// Only present when FG.R2.teaching is on.
// 1.19. `herd` is third and is the odd one out in every way that matters: it is
// the only teaching that costs no wonder, the only one that takes a settlement
// off the board, and the only one that is not always available — the plough has
// to exist somewhere before anyone can be shown the alternative to it.
FG.TEACH = [
 {id:"till",n:"Teach tilling the land",d:"They learn to plough. The ground answers them instead of you, and you lose a wonder for it."},
 {id:"kill",n:"Teach killing",d:"They learn to march on their neighbours. Nothing else in the world changes."},
 {id:"herd",n:"Teach them to keep herds",d:"They put up the roofs and go after the grass. They will hold no ground and count for nothing, and they will never stop hearing you."}];

FG.CIVIC = [
 {id:"clear",n:"Clearance",d:"Fell and plough three tiles at once. Costs a tenth of the town."},
 {id:"colony",n:"Send a colony",d:"Found a settlement three tiles out, on any ground. Costs a third."},
 {id:"levy",n:"Raise a levy",d:"An army forms and marches on a hostile town. Costs near half."}];

// --- chronicle fragments ------------------------------------------------
FG.DROWN = ["The ground opened and the water came up through it.",
 "The river changed its mind about where it went.","A lake where there was a meadow, overnight."];
FG.BLIGHT = ["Murrain, and then fever, and then the burying.",
 "The wells turned and the children sickened first.","Hail, then rot, then a winter with nothing in the pit."];
FG.MOUNT = ["The hills came up in a night, and there was a sound like a door.",
 "Rock where the road was. Nobody who saw it would speak of it after."];

if (typeof module !== "undefined" && module.exports) module.exports = FG;
})(typeof globalThis !== "undefined" ? globalThis : this);
