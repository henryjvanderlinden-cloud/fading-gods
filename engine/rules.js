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
const manifestMp = who =>
 FG.R2.fade ? Math.max(1, Math.round(FG.R2TUNE.mp * manifest(who))) : FG.R2TUNE.mp;

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
function reach(who) {
 const from = FG.G.p[who].pos, mp = FG.G.p[who].mp, d = {};
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
const working = who => FG.G.stones[who].filter(k => region(k, who).length >= 6);

// --- settlements --------------------------------------------------------
const settlements = who => FG.G.T.map((t, k) => ({t, k})).filter(o => o.t.set && o.t.set.own === who);
const bigCount  = who => settlements(who).filter(o => o.t.set.pop >= 150).length;
const hugeCount = who => settlements(who).filter(o => o.t.set.pop >= 800).length;
const civicStrength = who => bigCount(who) + hugeCount(who);

// OP-19. Settlements of yours that have been taught to till.
const taughtCount = who => settlements(who).filter(o => o.t.set.taught).length;

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
const lostCount = who =>
 Math.max(0, (FG.R2.taughtLoss ? taughtCount(who) : bigCount(who)) - working(who).length);
function divineLeft(who) { return DIVINE.slice(Math.min(lostCount(who), DIVINE.length)); }

function civicOpen(who) {
 const cs = civicStrength(who), o = [];
 if (cs >= FG.TUNE.t1.v) o.push("clear");
 if (cs >= FG.TUNE.t2.v) o.push("colony");
 if (cs >= FG.TUNE.t3.v) o.push("levy");
 return o;
}

// Where a wonder may be aimed: within reach of a working stone, or next to you.
function divineReach(who) {
 const s = new Set();
 working(who).forEach(k => ring(k, stoneRange(region(k, who).length)).forEach(x => s.add(x)));
 ring(FG.G.p[who].pos, 1).forEach(x => s.add(x));
 return s;
}

// --- legality -----------------------------------------------------------
function blessFrac(k, who) {
 const r2 = ring(k, 2).filter(x => !impassable(T(x)));
 if (!r2.length) return 0;
 return r2.filter(x => T(x).st === "bless" && T(x).own === who).length / r2.length;
}

// Returns null if founding is legal, otherwise the reason, in the log's voice.
function foundBlock(k, who, free) {
 const t = T(k);
 if (impassable(t)) return t.t === "mount" ? "rock" : "water";
 if (t.set) return "already a settlement";
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
const canFound = (k, who, free) => !foundBlock(k, who, free);

// How much ground a Bless here would actually take. The FG.CONTEST branch is a
// rejected A-17 candidate, kept behind its toggle: under it, ground the other
// power took this year is worth nothing to take, because taking it sends the
// tile to neither of you.
function blessGain(k, who) {
 const claims = FG.G.claims || {};
 const other = 1 << (1 - who);
 return ring(k, 1).filter(x => {
  if (!FG.takeable(T(x), who)) return false;
  if (FG.CONTEST && (claims[x] & other)) return false;
  return true;
 }).length;
}

function canSplit(k, who) {
 const t = T(k);
 return t.set && t.set.own === who && t.set.pop >= 60 && NB[k].some(x => canFound(x, who));
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
// OP-19. Teaching is done in person: you must be standing on the settlement or
// beside it. No stone relays it — this is the one thing that cannot be said at a
// distance. A settlement tile is walkable, so standing on one is possible; its
// reckoned ring is not, which is why OP-14 had to be adopted alongside this.
function teachTargetsAt(from, id, who) {
 if (!FG.R2.teaching) return [];
 return ring(from, 1).filter(k => {
  const t = T(k);
  if (!t.set || t.set.own !== who) return false;
  if (t.set.tabu) return false;                  // OP-20 — forbidden for good
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
   if (id === "mountains") {
    if (impassable(t) || t.set || FG.G.stones[0].includes(k) || FG.G.stones[1].includes(k)) return;
    if (blessFrac(k, who) * 100 < FG.TUNE.mfrac.v) return;
    if (mountainLine(k).some(x => T(x).set)) return;
    out.push(k);
   }
   else if (id === "drown") { if (!impassable(t) && !t.set && !FG.G.stones[0].includes(k) && !FG.G.stones[1].includes(k)) out.push(k); }
   else if (id === "blight") { if (t.set && t.set.own !== who && t.set.pop > 40) out.push(k); }
   else if (id === "omen") { if (t.set && t.set.own === who && t.set.pop > 40 && settlements(who).length > 1) out.push(k); }
   else if (id === "wither") { if (ring(k, 1).some(x => { const q = T(x); return !q.set && q.st === "reck" && q.own !== who; })) out.push(k); }
   else if (id === "quicken") { if (ring(k, 1).some(x => FG.takeable(T(x), who))) out.push(k); }
  });
  return [...new Set(out)];
 }
 settlements(who).forEach(o => {
  if (id === "clear" && o.t.set.pop >= 150)
   ring(o.k, 2).forEach(x => { const q = T(x);
    if (!impassable(q) && !q.set && !(q.st === "reck" && q.own === who)) out.push(x); });
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

Object.assign(FG, {cost, reach, walkStep, region, stoneRange, working, settlements,
 bigCount, hugeCount, civicStrength, taughtCount, carryCap, lostCount, divineLeft,
 civicOpen, divineReach, blessFrac, foundBlock, canFound, blessGain, canSplit,
 stoneBlock, canStone, mountainLine, targets, teachTargets, teachTargetsAt,
 nearestSource, score, band, manifest, manifestMp, wouldSeal});

if (typeof module !== "undefined" && module.exports) module.exports = FG;
})(typeof globalThis !== "undefined" ? globalThis : this);
