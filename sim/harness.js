// Fading Gods — headless harness.
//
// Imports the same engine files the browser build loads. No re-implementation,
// no second set of rules. Every number this prints is measured against the
// game itself, which is the whole point of OP-02.
const FG = require("../engine/load.js");

// One game, both seats played by doctrine. Returns the final score plus the
// things worth reporting about how it got there.
//
// `first` decides who acts first each year. The build itself is always "p0" —
// you act, then the rival, then the world. It turns out to matter a great deal
// for blessing doctrines, because Bless overwrites the other side's blessing,
// so acting second means overwriting theirs after they have committed.
function playGame(you, them, seed, tune, first) {
 FG.resetTune();
 if (tune) FG.setTune(tune);
 FG.createGame({you, them, seed});

 const turns = FG.TUNE.turns.v;
 for (let i = 0; i < turns; i++) {
  // "years" alternates who moves first from one year to the next, within a
  // single game — the third candidate fix for OP-17.
  if (first === "years" ? (i % 2 === 1) : first === "p1") {
   FG.aiTurn(1);
   FG.aiTurn(0);
   if (FG.worldTick(FG.snapshot())) break;
  } else {
   FG.aiTurn(0);
   if (FG.endYear()) break;   // endYear runs the rival, then the world
  }
 }

 const s = FG.score();
 return {
  seed,
  a: s[0].tot, b: s[1].tot,
  parts: {bless: s[0].h, reck: s[0].c, set: s[0].s},
  wondersLeft: FG.divineLeft(0).length,
  worksOpen: FG.civicOpen(0).length,
  stones: FG.G.stones[0].length,
  working: FG.working(0).length,
  settlements: FG.settlements(0).length,
  reach: Object.keys(FG.reach(0)).length - 1,
  mountains: FG.G.T.filter(t => t.t === "mount").length
 };
}

const mean = xs => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);

// n games of `you` against `them`, seeds 0..n-1 unless told otherwise.
// opts.first — "p0" (the build's own order, default), "p1", or "alternate",
// which splits the seeds evenly and is the fairer measure of a doctrine.
function match(you, them, n, opts) {
 opts = opts || {};
 const seed0 = opts.seed0 || 0;
 const first = opts.first || "p0";
 const rows = [];
 for (let i = 0; i < n; i++) {
  const f = first === "alternate" ? (i % 2 ? "p1" : "p0") : first;
  rows.push(playGame(you, them, seed0 + i, opts.tune, f));
 }

 const wins = rows.filter(r => r.a > r.b).length;
 const ties = rows.filter(r => r.a === r.b).length;
 return {
  you, them, n, first,
  win: wins / n, tie: ties / n,
  a: mean(rows.map(r => r.a)), b: mean(rows.map(r => r.b)),
  bless: mean(rows.map(r => r.parts.bless)),
  reck: mean(rows.map(r => r.parts.reck)),
  set: mean(rows.map(r => r.parts.set)),
  wonders: mean(rows.map(r => r.wondersLeft)),
  works: mean(rows.map(r => r.worksOpen)),
  working: mean(rows.map(r => r.working)),
  reach: mean(rows.map(r => r.reach)),
  rows
 };
}

// A-05's diagnostic, generalised: how much does the opponent actually matter?
// Score against a live opponent versus against Passive on the same seeds. 0%
// means the two of you were never playing each other.
function interference(you, them, n, opts) {
 const live = match(you, them, n, opts);
 const solo = match(you, "passive", n, opts);
 return {you, them, n, live: live.a, solo: solo.a,
         interference: solo.a === 0 ? 0 : (solo.a - live.a) / solo.a};
}

module.exports = {FG, playGame, match, interference, mean};
