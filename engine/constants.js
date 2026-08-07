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
  t1:{l:"clearance at",v:5,min:1,max:12,s:""},
  t2:{l:"colony at",v:7,min:2,max:14,s:""},
  t3:{l:"levy at",v:9,min:3,max:16,s:""},
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
// OP-19 and OP-20, plus the smaller rules settled alongside them. Every one is
// off by default, and with all of them off this engine plays exactly the game
// described in design/rules.md — that is the A/B baseline and it is worth
// keeping true.
//
// Individually toggleable on purpose. The working method in the README is
// argue, simulate, then build, and a single master switch over eleven rules
// cannot tell you which of the eleven moved a number. Turn them on one at a
// time when measuring, all at once when playing.
//
//   FG.R2all(true);  node sim/matrix.js 40 40 cities
//   FG.R2all(false); node sim/matrix.js 40 40 cities     // the same seeds
//
// Set before a run and put back afterwards — like FG.SOFT and FG.CONTEST,
// these are not reset between games.
FG.R2 = {
 logistic:   false,  // 1.2   logistic growth; K set by teaching and terrain
 teaching:   false,  // 1.3   tilling and killing, taught per settlement
 taughtLoss: false,  // 1.4   the wonder goes on teaching, not at pop 150
 audible77:  false,  // 1.5   settlements under 77 bless the ground round them
 split2:     false,  // 1.6   split targets your blessing at path distance 2
 fade:       false,  // 1.7   reckoned ground enterable at 10% a year (OP-14)
 unmake:     false,  // 1.8   taking their blessing returns it to wild (OP-16)
 encircle:   false,  // 1.9   a ring of blessing takes a settlement; the taboo
 landGates:  false,  // 1.10  works unlock on tilled land, not on population
 pathFrac:   false,  // 1.11  blessFrac counts path distance (A-18)
 barren3:    false,  // 1.12  withered ground stays barren three years
 exitLane:   false   // 1.15  the fields close slowly, and never seal a place in
};

FG.R2all = function (on) {
 Object.keys(FG.R2).forEach(k => { FG.R2[k] = !!on; });
 return FG.R2;
};

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
 toll:     0.10,  // of your corporeal being, for ending a year in their fields
 mp:       3      // movement at full manifestation
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
FG.TEACH = [
 {id:"till",n:"Teach tilling the land",d:"They learn to plough. The ground answers them instead of you, and you lose a wonder for it."},
 {id:"kill",n:"Teach killing",d:"They learn to march on their neighbours. Nothing else in the world changes."}];

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
