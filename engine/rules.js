// Fading Gods — engine: movement, legality, targeting, scoring.
// Queries only. Nothing in this file mutates state.
(function (root) {
"use strict";
const FG = root.FG = root.FG || {};
const {NB, K, ring, T, impassable, MINREG, ROWS, DIVINE} = FG;

// --- movement -----------------------------------------------------------
// Reckoned ground of either side, and the other side's blessing, are
// impassable. [load-bearing] — see design/rules.md §2, and OP-14, which
// proposes pricing these walls instead of removing them.
function cost(t, who) {
 if (impassable(t)) return 99;
 // OP-14. Ploughed ground is walkable once the toll exists — it costs nothing to
 // cross and 10% of your manifestation to still be standing in it at year's end,
 // which is charged in tick.js. Their blessing stays shut: a wall of belief is
 // not a wall of hedges.
 if (t.st === "reck") return FG.R2.fade ? 1 : (FG.SOFT ? 3 : 99);
 if (t.st === "bless" && t.own !== who) return FG.SOFT ? 3 : 99;
 return 1;
}

// OP-14. What is left of you, and what it buys. The slope rather than the cliff:
// three tiles at full manifestation, two at two thirds, one at a third, and never
// less than one — you are not stranded, only slowed. Whether it should instead do
// nothing at all until zero is the sub-question OP-14 still holds open.
const manifest = who => (FG.G.p[who].body === undefined ? 1 : FG.G.p[who].body);

// 1.23 / OP-14. Is there anything left of this power at all?
//
// The epsilon is not fussiness. `body` is decremented by 0.1 ten times and comes
// out of that at -2e-17 before the clamp, so a strict `<= 0` would be a coin
// toss on the last spend. Everything that asks *may this power still do
// anything* asks here, and there is exactly one such question in the game.
const spent = who => !!FG.R2.zeroSpent && FG.R2.fade && manifest(who) <= 1e-9;

// OP-14. What is left of you, and what it buys. The slope rather than the cliff:
// three tiles at full manifestation, two at two thirds, one at a third — and,
// since 1.23, none at all at nothing. The floor of one was the punishment
// reading: a god shuffling a tile a year forever is not making a decision. Now
// the last movement point goes the way the rest of them went.
const manifestMp = who =>
 !FG.R2.fade ? FG.R2TUNE.mp
 : spent(who) ? 0
 : Math.max(1, Math.round(FG.R2TUNE.mp * manifest(who)));

// OP-19. A tile may not be ploughed if it is the last way out of a settlement.
// The fields close, but they never quite close over — without this, founding a
// place and teaching it while you stand on it seals you onto one tile forever,
// which is what the first stage-1 measurement found happening in half of all
// player-years.
function wouldSeal(x) {
 // Ploughing ground that is already ploughed takes nobody's way out — it only
 // changes whose furrows they are. Without this first line a settlement ringed
 // by the rival's fields can never plough anything again, because every
 // candidate looks like the last exit while none of them is an exit at all.
 // Found in a played game: three taught villages that never made a field.
 if (T(x).st === "reck") return false;
 return NB[x].some(sk => {
  const s = T(sk);
  if (!s.set) return false;
  return !NB[sk].some(y => y !== x && !impassable(T(y)) && T(y).st !== "reck");
 });
}

// Every tile the player can reach this year, keyed by movement spent.
//
// 1.23. Clamped to what is left of the power as well as to what is left of the
// year. `p.mp` is the year's allowance counting down as you walk and is set from
// `manifestMp` when the year turns — so without this clamp a power that spends
// its last tenth *mid-year*, on a dream or an order, would keep walking on an
// allowance issued when there was still something of it. The buttons stop in the
// same instant; the board has to stop with them.
function reach(who) {
 const from = FG.G.p[who].pos, mp = Math.min(FG.G.p[who].mp, FG.manifestMp(who)), d = {};
 d[from] = 0;
 const q = [[from, 0]];
 while (q.length) {
  const [k, c] = q.shift();
  NB[k].forEach(nk => {
   const nc = c + cost(T(nk), who);
   if (nc <= mp && (d[nk] === undefined || nc < d[nk])) { d[nk] = nc; q.push([nk, nc]); }
  });
 }
 return d;
}

// 1.6 / A-18. Path distance for people on foot: every tile within `rad` steps
// of `from`, where rock and water block and nothing else does. Deliberately not
// `cost()` — that is the *player's* movement, and a splinter going over the
// rise is not the player. Keyed by tile, valued by distance, `from` at zero.
function pathWithin(from, rad) {
 const d = {}; d[from] = 0;
 const q = [[from, 0]];
 while (q.length) {
  const [k, c] = q.shift();
  if (c >= rad) continue;
  for (const nk of NB[k]) {
   if (impassable(T(nk))) continue;
   if (d[nk] !== undefined) continue;
   d[nk] = c + 1; q.push([nk, c + 1]);
  }
 }
 return d;
}

// Mortals walk anywhere that is not rock or water — the player's movement
// rules do not apply to armies or refugee columns. Returns the next tile on
// the path, null if already there, undefined if no road exists at all.
function walkStep(from, to) {
 if (from === to) return null;
 const prev = {}, seen = new Set([from]), q = [from];
 while (q.length) {
  const k = q.shift();
  for (const nk of NB[k]) {
   if (seen.has(nk)) continue;
   if (impassable(T(nk)) && nk !== to) continue;
   seen.add(nk); prev[nk] = k;
   if (nk === to) { let c = to; while (prev[c] !== from) c = prev[c]; return c; }
   q.push(nk);
  }
 }
 return undefined;
}

// 1.19 / OP-12. How a people who were never taught the plough move, and it is
// deliberately neither of the two movement rules the game already has.
//
// `walkStep` above is how mortals move: rock and water only, because a levy
// cannot hear you and a god's walls are not there for it. `cost()` is how *you*
// move. A herd moves the way you do, minus the part about your own country —
// they were never shown the plough, so they can still hear, and what a people
// can hear, they can be shut out of.
//
// Rock and water block. A settlement blocks; you cannot graze a town. And the
// **other** power's blessing blocks, which is the third row of the loop: closed
// country, because it is another god's quiet and they know it. Their own god's
// blessing never blocks them, and writing the rule this way round rather than as
// *blessing is impassable to herds* is what keeps §2's self-walling problem out
// of it. Farmland is wide open. That is the point of the whole mechanic.
function herdBlocked(k, who) {
 const t = T(k);
 if (impassable(t)) return true;
 if (t.set) return true;
 return t.st === "bless" && t.own !== null && t.own !== who;
}

// The next tile on a herd's road; null if it is already there, undefined if
// there is no road at all. The same shape as walkStep, deliberately — tick.js
// reads the two of them the same way.
//
// Note there is no exception for the destination, which walkStep does have. A
// levy is aimed *at* a settlement and has to be allowed to arrive on it. A herd
// aimed somewhere it may not stand simply has no road, and having no road is a
// state this rule needs to be able to reach — see herdTick.
function herdStep(from, to, who) {
 if (from === to) return null;
 const prev = {}, seen = new Set([from]), q = [from];
 while (q.length) {
  const k = q.shift();
  for (const nk of NB[k]) {
   if (seen.has(nk)) continue;
   if (herdBlocked(nk, who)) continue;
   seen.add(nk); prev[nk] = k;
   if (nk === to) { let c = to; while (prev[c] !== from) c = prev[c]; return c; }
   q.push(nk);
  }
 }
 return undefined;
}

// --- blessed regions ----------------------------------------------------
// Connected, not total. [load-bearing] — severing a blessed region halves the
// stones standing in it, which is what makes defensive geometry matter.
function region(k, who) {
 const t = T(k);
 if (t.st !== "bless" || t.own !== who) return [];
 const seen = new Set([k]), q = [k];
 while (q.length) {
  const x = q.pop();
  NB[x].forEach(y => {
   const z = T(y);
   if (!seen.has(y) && z.st === "bless" && z.own === who) { seen.add(y); q.push(y); }
  });
 }
 return [...seen];
}

const stoneRange = P => Math.min(1 + Math.floor(P / 10), 3);

// The number a stone needs and cannot be silenced above. Six connected blessed
// tiles, written once, because until 1.20 it was written out as the literal `6`
// in five places — rules.js twice, tick.js twice, and the interface — and the
// fifth rule of this project is that a test written twice drifts.
const STONEWORK = 6;

// 1.20. How much of a stone has been built. Stored on the tile the stone stands
// on rather than in a parallel array, because `FG.G.stones[who]` is a list of
// tile keys and a stone is never taken off it — so the tile *is* the stone's
// identity, and state stays JSON-serialisable with nothing new in it.
const courses = k => Math.min(T(k).crs || 0, FG.R2TUNE.courses);

// 1.20. What this particular stone needs, which is the six less what it has been
// built up to. Never below three: a stone that answered on one tile would be a
// stone that farmland could not silence, and farmland silencing stones is the
// thesis rather than a defect.
function stoneNeed(k) {
 if (!FG.R2.stonesGrow) return STONEWORK;
 return Math.max(STONEWORK - FG.R2TUNE.courses,
                 STONEWORK - courses(k) * FG.R2TUNE.course);
}

// Does this stone still answer? One predicate, read by stoneTick, stoneReach,
// the chronicle's warning, the stone list in the interface and 1.21's test of
// what a *dead* stone is. See STONEWORK above for why that is worth a function.
const stoneWorks = (k, who) => region(k, who).length >= stoneNeed(k);

const working = who => FG.G.stones[who].filter(k => stoneWorks(k, who));

// 1.20, and the one caller that must not see the courses.
//
// `lostCount` subtracts working stones from taught settlements, and OP-19 already
// records that formula as broken for a refuser — the working stones subtract from
// zero and the max() eats them. Letting 1.20 keep more stones working would make
// that worse rather than better, and *the wonder brake is the one thing growth
// must not feed* is written into the idea this rule comes from.
//
// So the brake reads the plain six and everything else reads the augmented test.
// The two functions are next to each other, and this comment is the reason they
// are not one.
const workingStrict = who => FG.G.stones[who].filter(k => region(k, who).length >= STONEWORK);

// 1.21. The stones of yours that have stopped answering — and are therefore the
// places you are obeyed from rather than heard in. A kurgan is not one of them:
// a mound is memory, and raising one closes the relay for good. See constants.js.
const deadStones = who => FG.G.stones[who].filter(k =>
  !stoneWorks(k, who) && (T(k).kur === undefined || T(k).kur === null));

// 1.21. The country an *order* arrives in, as against the country you are heard
// in. Everything divineReach covers, plus a flat ring round each silent stone.
// Only `tolled` reads this, and only for the works: nothing else in the game may
// travel down a dead stone.
function orderReach(who) {
 const s = divineReach(who);
 if (!FG.R2.deadOrders) return s;
 deadStones(who).forEach(k => ring(k, FG.R2TUNE.orderRange).forEach(x => s.add(x)));
 return s;
}

// --- settlements --------------------------------------------------------
const settlements = who => FG.G.T.map((t, k) => ({t, k})).filter(o => o.t.set && o.t.set.own === who);
const bigCount  = who => settlements(who).filter(o => o.t.set.pop >= 150).length;
const hugeCount = who => settlements(who).filter(o => o.t.set.pop >= 800).length;
const civicStrength = who => bigCount(who) + hugeCount(who);

// OP-19. Settlements of yours that have been taught to till.
const taughtCount = who => settlements(who).filter(o => o.t.set.taught).length;

// 1.5, and from 1.20 read in two places rather than one. *The audible* — a people
// few enough and untaught enough that there is nothing between them and you but
// air. They bless the ground round them each year (tick.js), and they are who
// adds a course to a stone (1.20).
//
// Written out here because 1.20 needed exactly this test and the alternative was
// a second copy of it in the growth loop. `audibleHerd` is the same sentence for
// a people who are walking: a herd is the Seventy-Seven made mobile and was given
// that ceiling on purpose, so it is audible by construction and stays audible
// until it stops.
const audible = t => !!t.set && !t.set.taught && t.set.pop < 77;
const audibleHerd = h => !!h && h.n < FG.R2TUNE.kHerd;

// OP-19. How many people this settlement's ground will carry.
//
// Untaught it is Dunbar, flat on every terrain — a cognitive and social limit,
// and crop yield has nothing to do with it. Taught it is yield, and the land
// fraction comes in here rather than on the growth rate, so a settlement hemmed
// in by water tops out lower instead of merely climbing more slowly.
function carryCap(t) {
 if (!t.set) return 0;
 if (!t.set.taught) return FG.R2TUNE.kWild;
 const base = FG.R2TUNE.kTaught[t.t] || FG.R2TUNE.kTaught.plain;
 const land = NB[K(t.c, t.r)].filter(x => !impassable(T(x))).length / 6;
 return Math.max(FG.R2TUNE.kWild, base * (0.55 + 0.45 * land));
}

// You lose the greatest remaining wonder for every settlement past 150, less
// one for each working stone.
//
// OP-19 moves the trigger from population to teaching. Note this stays
// *derived* rather than becoming a stored counter, which was the plan and was
// wrong: because it counts taught settlements you currently own, forbidding a
// place (OP-20) drops the count and hands the wonder back with no bookkeeping,
// and taking a taught city by levy raises it — you did not teach them, but they
// are yours now, and they are loud.
// 1.20. `workingStrict`, not `working` — the courses a stone has gained are the
// one thing that may not reach this line. See the note beside the two functions.
const lostCount = who =>
 Math.max(0, (FG.R2.taughtLoss ? taughtCount(who) : bigCount(who)) - workingStrict(who).length);
function divineLeft(who) { return DIVINE.slice(Math.min(lostCount(who), DIVINE.length)); }

// 1.18. What opens a work.
//
// It used to be `civicStrength` — settlements past 150, plus one more for each
// past 800 — against 5 / 7 / 9. That ladder was priced when a city could reach
// the old 2600 clamp, and `logistic` moved the ground out from under it without
// anybody noticing: an untaught settlement is asymptotic to `kWild` = 150 and so
// never counts at all, and a taught one now tops out between 600 and 1000, so
// the 800 rung is nearly unreachable. Measured over 40 games, the mean Cities
// game ended at strength **3.1** against a first gate of **5** — the works
// opened in 28% of games, at about year 33, and the levy fired once in forty.
// The half of the arc where you lose wonders and gain works had quietly lost its
// second half. See OP-05.
//
// So the ladder now counts the thing the batch is actually about: **settlements
// you have taught to till.** One teaching opens clearance, two the colony, three
// the levy — the same counter that takes a wonder away each time it goes up.
// Every teaching costs you a wonder and buys you a work, and the chip row empties
// from the left and fills from the right on one number rather than two.
//
// It is also the most legible version available, for free: `taughtCount` is
// already on the stat bar, so the gate is a number the player is looking at.
// `landGates` — reading the unlock off ground you had tilled — was the register's
// proposal and was cut in favour of this; it measured the same and cost a new
// per-settlement unlock model. registers/rejected.md.
//
// Falls back to the old ladder when `teaching` is off, so `FG.R2all(false)`
// still plays exactly what design/rules.md §6 describes.
// The pre-batch ladder's own numbers, frozen. TUNE.t1/t2/t3 are the *live*
// sliders and now read in teachings, so the old path cannot borrow them without
// silently rescaling the baseline from 5/7/9 to 1/2/3. A baseline that moves is
// not a baseline. A-16 again, in miniature.
const OLDGATES = [5, 7, 9];

function civicOpen(who) {
 const useTaught = FG.R2.taughtGates && FG.R2.teaching;
 const cs = useTaught ? taughtCount(who) : civicStrength(who), o = [];
 const g = useTaught ? [FG.TUNE.t1.v, FG.TUNE.t2.v, FG.TUNE.t3.v] : OLDGATES;
 if (cs >= g[0]) o.push("clear");
 if (cs >= g[1]) o.push("colony");
 if (cs >= g[2]) o.push("levy");
 return o;
}

// What the chip row says a locked work is waiting for, so the interface and the
// rule cannot drift apart.
FG.civicNeed = function (who) {
 return (FG.R2.taughtGates && FG.R2.teaching) ? "taught to till" : "strength";
};

// The country your stones can still be heard in, without you standing in it.
// Split out of divineReach for 1.16: a dream travels the stone network and does
// not travel through your feet, so the two halves of reach now have separate
// names.
function stoneReach(who) {
 const s = new Set();
 working(who).forEach(k => ring(k, stoneRange(region(k, who).length)).forEach(x => s.add(x)));
 return s;
}

// Where a wonder may be aimed: within reach of a working stone, or next to you.
function divineReach(who) {
 const s = stoneReach(who);
 ring(FG.G.p[who].pos, 1).forEach(x => s.add(x));
 return s;
}

// 1.16 / 1.17. Is this said rather than done — is the target out of arm's reach?
// Deliberately *not* the same test as divineReach. Standing on a settlement or
// beside it is in person and free; everything else is at range and is charged,
// even when a stone is what carries it.
const atRange = (k, who) => !ring(FG.G.p[who].pos, 1).includes(k);

// Does aiming this at k cost a piece of you? One predicate, because the two
// rules have two different tests and having them written out twice is how they
// drift apart.
//
//   teaching — legal only inside divineReach, free only in person. The stone
//              carries the dream; sending it still costs.
//   a work   — legal anywhere, as it always was, because a work needs your
//              people and not you. Free anywhere you can be heard. Charged
//              only out past that, where the order has to be carried.
//
// Everything else — the wonders — is unchanged and never charged. They are
// bounded by divineReach already, and OP-14's trespass toll is the only thing
// that has ever taken a piece of you.
function tolled(id, k, who) {
 if (FG.TEACH.some(s => s.id === id)) return !!FG.R2.dreamTeach && atRange(k, who);
 // 1.21. `orderReach` rather than `divineReach`, and that substitution is the
 // whole of the dead-stone rule. Presence is unchanged above; only the carrying
 // of an order down a stone that no longer answers is new.
 if (FG.CIVIC.some(s => s.id === id)) return !!FG.R2.dreamWorks && !orderReach(who).has(k);
 return false;
}

// --- legality -----------------------------------------------------------
function blessFrac(k, who) {
 const r2 = ring(k, 2).filter(x => !impassable(T(x)));
 if (!r2.length) return 0;
 return r2.filter(x => T(x).st === "bless" && T(x).own === who).length / r2.length;
}

// Returns null if founding is legal, otherwise the reason, in the log's voice.
//
// 1.19 adds `ignoreHerd`, and it is the fourth argument rather than a separate
// predicate because there turned out to be five callers and only one of them
// wants the exception. A people camped on a tile is as good a reason not to
// build a town there as a town already being there — found, colony and split all
// have to refuse it, and this was found the way things get found here: a full
// game threw *a herd is standing on a settlement* in year 32 of seed 7, because
// the greedy chooser dropped a colony straight on top of one.
//
// The single exception is a herd **settling itself**, where the camp is not an
// obstacle to the founding but the reason for it.
function foundBlock(k, who, free, ignoreHerd) {
 const t = T(k);
 if (impassable(t)) return t.t === "mount" ? "rock" : "water";
 if (t.set) return "already a settlement";
 const camp = FG.G.herds.find(h => h.at === k);
 if (camp && camp !== ignoreHerd) return "a people are camped here";
 if (FG.G.stones[0].includes(k) || FG.G.stones[1].includes(k)) return "a stone stands here";
 if (NB[k].some(x => T(x).set)) return "too close to a settlement";
 for (const x of ring(k, 2)) {
  const q = T(x);
  if (q.st === "bless" && q.own !== null && q.own !== who) return "their blessing lies within two tiles";
 }
 if (free) return null;   // a colony ignores the blessing requirement
 if (!(t.st === "bless" && t.own === who)) return "the ground here is not blessed";
 const f = blessFrac(k, who);
 if (f * 100 < FG.TUNE.frac.v)
  return "only " + Math.round(f * 100) + "% of the country two tiles round is blessed — needs " + FG.TUNE.frac.v + "%";
 return null;
}
const canFound = (k, who, free, ignoreHerd) => !foundBlock(k, who, free, ignoreHerd);

// 1.22 / OP-18. How many of them stay.
//
// The people were already here. How many were already *here* is how much of the
// country round this tile you had made quiet, so the number is read off the
// second ring at the moment they stop moving, and never again.
//
// The denominator is `foundRing` — a full second ring, eighteen tiles — and not
// the tiles that happen to exist. That is deliberate and it is the whole of the
// coastal discount: water, rock and the edge of the map cannot be blessed, so
// they cannot be counted, so a place hemmed in by them founds smaller. A tile on
// the shore of a lake is a worse place to stop than the middle of a plain, and
// nobody has to be told that.
//
// Note the centre is excluded. The tile they are standing on stops being blessed
// the moment they stand on it — every founding in this game sets `st` to wild —
// so counting it would be counting the thing the founding spends.
function foundPop(k, who) {
 if (!FG.R2.wildFolk) return 30;
 const mine = ring(k, 2).filter(x =>
   x !== k && T(x).st === "bless" && T(x).own === who).length;
 const f = Math.min(1, mine / FG.R2TUNE.foundRing);
 return Math.round(FG.R2TUNE.foundLow + (FG.R2TUNE.foundHigh - FG.R2TUNE.foundLow) * f);
}

// How much ground a Bless here would actually take. The FG.CONTEST branch is a
// rejected A-17 candidate, kept behind its toggle: under it, ground the other
// power took this year is worth nothing to take, because taking it sends the
// tile to neither of you.
// 1.8. `inPerson` defaults to true, because every caller but Quicken is: Bless
// happens under your feet, and the chooser asks this about a tile it is
// considering standing on.
function blessGain(k, who, inPerson) {
 const claims = FG.G.claims || {};
 const other = 1 << (1 - who);
 const near = inPerson === undefined ? true : inPerson;
 return ring(k, 1).filter(x => {
  if (!FG.blessEffect(T(x), who, near)) return false;
  if (FG.CONTEST && (claims[x] & other)) return false;
  return true;
 }).length;
}

// 1.6. Where a splinter from k may go.
//
// **The rule this replaces could never fire.** It asked for a *neighbour* of
// the settlement that passed the whole founding test, and `foundBlock` refuses
// any tile with a settlement in its own neighbourhood — which every neighbour
// of a settlement has, namely the settlement doing the splitting. Legal in 0 of
// 1,047 settlement-years when it was finally measured. See constants.js 1.6.
//
// The new rule: a splinter goes to ground *you have blessed*, at path distance
// `splitRad`, with the 85% founding requirement waived. The people are already
// there and what they need is somewhere to stop, not a country — but they will
// not stop anywhere you have not made quiet, which is what keeps blessing the
// thing every expansion begins with (§3, OP-18).
//
// Everything else `foundBlock` asks is still asked, and one of those questions
// does the shaping: *not next to a settlement* rules out distance 1 entirely,
// so `splitRad` = 2 means the splinter lands at exactly two, which is also the
// only distance at which two settlements do not touch. Path distance rather
// than ring distance, per A-18 — water and mountains constrain your own fission
// exactly as they constrain founding, and a split cannot leapfrog terrain.
function splitTargets(k, who) {
 const t = T(k);
 if (!t.set || t.set.own !== who || t.set.pop < 60) return [];
 if (!FG.R2.split2) return NB[k].filter(x => canFound(x, who));
 const d = pathWithin(k, FG.R2TUNE.splitRad);
 return Object.keys(d).map(Number).filter(x => {
  if (x === k) return false;
  const q = T(x);
  if (!(q.st === "bless" && q.own === who)) return false;
  return canFound(x, who, true);
 });
}
const canSplit = (k, who) => splitTargets(k, who).length > 0;

// --- 1.19 / OP-12: roaming peoples --------------------------------------
const herdsOf = who => FG.G.herds.filter(h => h.own === who);
const herdAt  = k => FG.G.herds.find(h => h.at === k) || null;

// The condition on teaching herding, and it is a condition rather than a clock
// on purpose: `rejected.md` cut the reverse tech tree because a timer is
// weather, and A-10 stands. Herding is a secondary product of farming and not a
// stage before it, so the plough has to exist somewhere on the board before
// anyone can be shown the alternative to it. It self-balances as well — a valley
// nobody ever ploughed has no herders in it.
const ploughed = () => FG.G.T.some(t => t.st === "reck");

// 1.12. Ground taken back off the plough does not take a furrow again at once.
// One reader, whatever wrote it: Wither writes `bar` only when `barren3` is on,
// a herd grazing writes it always, and everything that reckons ground asks here.
const barren = t => (t.bar || 0) > FG.G.turn;

// Where a herd may stop, and it is `canFound` with the blessing requirement
// waived — exactly as a colony waives it, and for the same reason. The people
// are already standing there; what they need is somewhere to stop, not a
// country. Every other question founding asks is still asked, including the one
// about a rival's blessing within two tiles, so a herd cannot simply sit down in
// the middle of somebody else's quiet.
const canStop = h => !!FG.R2.herds && !!h && canFound(h.at, h.own, true, h);

// Where a herd may raise a kurgan: standing on ground that has gone under the
// plough, over a stone of **its own god** that has already stopped working. Not
// the rival's — the motivating case is a refuser whose shrines are all under
// somebody else's fields, and OP-16's answer is that they come back as graves
// rather than as engines.
//
// The working test is `region(...).length < 6`, and it does double duty for
// free: a reckoned tile is not blessed, so its region is empty, so a stone under
// farmland always fails it. It is written as the general test anyway, because
// what matters is that the stone is silent and not how it was silenced.
function canMound(h) {
 if (!FG.R2.herds || !h) return false;
 const t = T(h.at);
 if (t.st !== "reck") return false;
 if (t.kur !== undefined && t.kur !== null) return false;
 if (!FG.G.stones[h.own].includes(h.at)) return false;
 return region(h.at, h.own).length < 6;
}

// 1.24. A stone of your own that has gone silent and has no mound on it yet.
//
// `canMound`'s test with two clauses gone: the farmland one, because Rick's
// ruling is that a monument does not need a field under it — *they graze the
// ground and build their monument in their spare time, with the materials at
// hand* — and the herd one, because nobody is standing here asking for it. The
// silence test stays exactly as it was and for the reason written above
// canMound: what matters is that the stone has stopped answering, not how it
// was silenced.
//
// Note which stones this can ever reach. A rival's blessed country is closed to
// a band, so the only stones they can walk to are their own god's and whatever
// is standing under somebody's plough. That is not a restriction anybody had to
// write; it falls out of `herdBlocked`, and it is the same 92% OP-16 measured.
const buryable = (k, who) => !!FG.R2.roam && FG.G.stones[who].includes(k) &&
 (T(k).kur === undefined || T(k).kur === null) && region(k, who).length < 6;

// 1.24. The nearest tile a band wants, by road rather than by rule of thumb.
//
// `driveHerds` measured Manhattan distance on (c, r) and then asked `herdStep`
// whether a road existed at all — a proxy and a check, and the proxy is wrong
// wherever the road bends round water. One breadth-first walk outward answers
// both questions exactly and answers them once: the first tile the wave touches
// that `want` accepts is the nearest reachable one there is. Ties go to whatever
// the neighbour order reached first, which is arbitrary and does not matter,
// because they are the same distance away.
//
// The tile they are standing on is never a candidate. They move every year.
function herdSeek(from, who, want) {
 const seen = new Set([from]), q = [from];
 while (q.length) {
  const k = q.shift();
  for (const nk of NB[k]) {
   if (seen.has(nk)) continue;
   if (herdBlocked(nk, who)) continue;
   seen.add(nk);
   if (want(nk)) return nk;
   q.push(nk);
  }
 }
 return null;
}

// 1.24 / OP-24. What a people out of hearing walk at, in the order they want it.
//
// **Their fields, and our graves, in the same rank.** Ploughed ground of the
// adversary is the first thing they want, and a silent stone of their own god is
// the other — and the two are ranked together on purpose rather than one above
// the other. A band crossing a valley to eat a furrow buries a shrine standing
// on the way without being told to, which is the whole of what Rick asked for
// when he said they should also be drawn to nearby stones. It costs almost
// nothing to add, because OP-16 measured that 92% of stones end up under exactly
// the ground they are already walking at.
//
// **Failing that, their people.** A band cannot stand on a settlement, so the
// second rank is the open ground beside one — which is where absorption happens.
// That makes going to look for people the thing they do when there is nothing
// left to graze, rather than a plan they hold: they are a plough-breaker first
// and a press-gang second.
//
// **Failing that, null, and null is the end of them.** See `settleHerd`.
function herdAim(h) {
 const who = h.own, foe = 1 - who;
 const want = herdSeek(h.at, who, k => {
  const t = T(k);
  if (t.st === "reck" && !t.set && t.own === foe) return true;
  return buryable(k, who);
 });
 if (want !== null) return want;
 return herdSeek(h.at, who, k => !T(k).set &&
  ring(k, 1).some(x => { const q = T(x).set; return q && q.own === foe; }));
}

// Mounds standing, by power. Nothing in the engine scores this or gates on it,
// deliberately: a kurgan is memory and not a point. It is counted because
// OP-15's *Forgotten* is the thing it is for, and that ending does not exist
// yet — so the number is here, on the board and in the stat bar, waiting for the
// reading that will use it. If it never gets one, this rule is decoration and
// should be cut.
const moundCount = who => FG.G.T.filter(t => t.kur === who).length;

// 1.9 / OP-20. Who, if anyone, has closed this place in.
//
// A settlement is ringed when every neighbour it has that is not rock or water
// is blessed ground belonging to one single power that does not own it. Rock
// and water count as part of the ring and do not have to be blessed, which is
// deliberate and is recorded in OP-20 as accepted: a coastal place with three
// land neighbours is closed in by three tiles, so Drown-then-encircle is a
// conquest for a wonder and two acts.
//
// Blessing of the settlement's *own* power breaks the ring, so relieving a
// siege is a thing you can do — and under 1.8 it has to be done in person,
// which is what makes the siege a siege. `audible77` will not do it for you:
// a small untaught place blesses only *wild* neighbours, and a place that is
// ringed has none left.
function encircledBy(k) {
 const t = T(k);
 if (!t.set) return null;
 let who = null;
 for (const x of NB[k]) {
  const q = T(x);
  if (impassable(q)) continue;
  if (q.st !== "bless" || q.own === null) return null;
  if (q.own === t.set.own) return null;
  if (who === null) who = q.own;
  else if (who !== q.own) return null;
 }
 return who;
}

function stoneBlock(k, who) {
 if (FG.G.stones[who].length >= FG.TUNE.stonecap.v) return "you hold all the stones you can";
 const t = T(k);
 if (t.st !== "bless" || t.own !== who) return "the ground here is not blessed";
 if (FG.G.stones[0].includes(k) || FG.G.stones[1].includes(k)) return "a stone already stands here";
 if (t.set) return "a settlement stands here";
 const r = region(k, who).length;
 if (r < MINREG) return "only " + r + " connected blessed tiles — needs " + MINREG;
 return null;
}
const canStone = (k, who) => !stoneBlock(k, who);

function mountainLine(k) {
 const t = T(k), out = [k];
 [-1, 1].forEach(d => { const r = t.r + d; if (r >= 0 && r < ROWS) out.push(K(t.c, r)); });
 return out;
}

// --- targeting ----------------------------------------------------------
// OP-19. Teaching was done in person: standing on the settlement or beside it,
// with no stone relaying it, on the reasoning that this was the one thing that
// could not be said at a distance.
//
// 1.16 reverses that reasoning rather than waiving it. A stone is a place you
// are still heard, and teaching is a thing you say. So teaching now reaches
// wherever a wonder reaches — and it is charged for, in `actions.js`, whenever
// it is said rather than done. See the note in constants.js for why this needed
// no change to the lore, and for the second price nobody has to write.
//
// `from` is a candidate position, not necessarily the current one: `ai.js` calls
// this while deciding where to walk. Note what that does to the chooser. With
// the flag off, the returned set depends entirely on `from`, so an untaught
// settlement pulls the token toward it. With the flag on, the stone half of the
// set is the same for every candidate `from` and cancels in the argmax, leaving
// only the in-person half as a nudge — which is the correct shape, arrived at
// for free: a doctrine that can teach by dream has much less reason to walk.
function teachTargetsAt(from, id, who) {
 if (!FG.R2.teaching) return [];
 const near = ring(from, 1);
 const cand = FG.R2.dreamTeach
   ? [...new Set([...near, ...stoneReach(who)])]
   : near;
 // 1.19. Herding is the one teaching that is not always on offer. It needs the
 // plough to exist somewhere first, and it is refused to a people who have
 // already been shown it — a people are only ever taught one thing about how to
 // live, and this is where that sentence is enforced.
 if (id === "herd" && (!FG.R2.herds || !ploughed())) return [];
 return cand.filter(k => {
  const t = T(k);
  if (!t.set || t.set.own !== who) return false;
  if (t.set.tabu) return false;                  // OP-20 — forbidden for good
  if (id === "herd") return !t.set.taught;
  return id === "till" ? !t.set.taught : !t.set.kill;
 });
}
const teachTargets = (id, who) => teachTargetsAt(FG.G.p[who].pos, id, who);

function targets(id, who) {
 const out = [];
 if (FG.TEACH.some(s => s.id === id)) return teachTargets(id, who);
 if (DIVINE.some(s => s.id === id)) {
  divineReach(who).forEach(k => {
   const t = T(k);
   // 1.19. A camp counts as a place, for exactly the two wonders that already
   // refuse to be aimed at one. Raising rock under a people or drowning them
   // would be a new rule — a wonder that kills mortals outright, which this game
   // has never had — and it is not one being written by accident here. If it is
   // ever wanted it should be argued for on its own. `herdAt` on the whole
   // mountain line as well, because that line is three tiles long and only the
   // aimed-at one was ever checked for anything.
   if (id === "mountains") {
    if (impassable(t) || t.set || herdAt(k) || FG.G.stones[0].includes(k) || FG.G.stones[1].includes(k)) return;
    if (blessFrac(k, who) * 100 < FG.TUNE.mfrac.v) return;
    if (mountainLine(k).some(x => T(x).set || herdAt(x))) return;
    out.push(k);
   }
   else if (id === "drown") { if (!impassable(t) && !t.set && !herdAt(k) && !FG.G.stones[0].includes(k) && !FG.G.stones[1].includes(k)) out.push(k); }
   else if (id === "blight") { if (t.set && t.set.own !== who && t.set.pop > 40) out.push(k); }
   else if (id === "omen") { if (t.set && t.set.own === who && t.set.pop > 40 && settlements(who).length > 1) out.push(k); }
   else if (id === "wither") { if (ring(k, 1).some(x => { const q = T(x); return !q.set && q.st === "reck" && q.own !== who; })) out.push(k); }
   // 1.8. Quicken is legal where it would do something, and what it would do
   // depends on where you are standing. Out past arm's reach it takes wild
   // ground only, so a tile ringed entirely by the other power's blessing
   // stops being a target at all until you walk to it.
   else if (id === "quicken") {
    const near = !atRange(k, who);
    if (ring(k, 1).some(x => FG.blessEffect(T(x), who, near))) out.push(k);
   }
  });
  return [...new Set(out)];
 }
 settlements(who).forEach(o => {
  if (id === "clear" && o.t.set.pop >= 150)
   ring(o.k, 2).forEach(x => { const q = T(x);
    // 1.12. Ground that has just been taken back off the plough will not take a
    // furrow again yet, and a work cannot buy its way past that. Clearance is
    // the one thing that could have — the year-end reckoning is slow and
    // budgeted, but a Clearance is three tiles at once and would have undone a
    // herd's whole season for a tenth of a town.
    if (!impassable(q) && !q.set && !barren(q) && !(q.st === "reck" && q.own === who)) out.push(x); });
  if (id === "colony" && o.t.set.pop >= 200)
   ring(o.k, 3).forEach(x => { if (canFound(x, who, true)) out.push(x); });
  if (id === "levy" && o.t.set.pop >= 300)
   ring(o.k, 4).forEach(x => { const q = T(x);
    if (q.set && q.set.own !== who && walkStep(o.k, x) !== undefined) out.push(x); });
 });
 return [...new Set(out)];
}

// Which of your settlements pays for a work aimed at k — the largest in range.
function nearestSource(id, k, who) {
 let best = null, bp = -1;
 settlements(who).forEach(o => {
  const min = id === "levy" ? 300 : id === "colony" ? 200 : 150;
  if (o.t.set.pop < min) return;
  const rad = id === "colony" ? 3 : id === "levy" ? 4 : 2;
  if (ring(o.k, rad).includes(k) && o.t.set.pop > bp) { best = o; bp = o.t.set.pop; }
 });
 return best;
}

// --- scoring ------------------------------------------------------------
function score() {
 const s = [{h:0, c:0, s:0, tot:0}, {h:0, c:0, s:0, tot:0}];
 FG.G.T.forEach(t => {
  if (impassable(t)) return;
  if (t.set) s[t.set.own].s += 3;
  else if (t.st === "bless") s[t.own].h += FG.TUNE.bval.v;
  else if (t.st === "reck") s[t.own].c += 2;
 });
 s.forEach(x => x.tot = x.h + x.c + x.s);
 return s;
}

function band(p) { return p < 77 ? ["band", 1] : p < 150 ? ["village", 2] : p < 800 ? ["town", 3] : ["city", 4]; }

Object.assign(FG, {cost, reach, walkStep, pathWithin, region, stoneRange, working, settlements,
 bigCount, hugeCount, civicStrength, taughtCount, carryCap, lostCount, divineLeft,
 civicOpen, divineReach, stoneReach, atRange, tolled, blessFrac, foundBlock, canFound,
 blessGain, canSplit, splitTargets, encircledBy, stoneBlock, canStone, mountainLine,
 targets, teachTargets, teachTargetsAt, nearestSource, score, band, manifest,
 manifestMp, wouldSeal,
 herdBlocked, herdStep, herdSeek, herdAim, herdsOf, herdAt, ploughed, barren,
 canStop, canMound, buryable, moundCount,
 // 1.20 / 1.21 / 1.22 / 1.23
 STONEWORK, courses, stoneNeed, stoneWorks, workingStrict, deadStones, orderReach,
 audible, audibleHerd, foundPop, spent});

if (typeof module !== "undefined" && module.exports) module.exports = FG;
})(typeof globalThis !== "undefined" ? globalThis : this);
