// Fading Gods — engine: end-of-year resolution.
// Order matters: columns move, stones bless, settlements grow, ground is
// reckoned, and only then is blessing erased by what now borders it.
(function (root) {
"use strict";
const FG = root.FG = root.FG || {};
const {NB, ring, T, say, impassable, DIVINE, CIVIC,
       region, reach, stoneRange, lostCount, civicOpen, score, walkStep} = FG;

// Working stones bless one wild tile a year without costing an action. The
// only compounding thing the magical side owns.
function stoneTick() {
 [0, 1].forEach(who => FG.G.stones[who].forEach(sk => {
  const P = region(sk, who).length;
  if (P < 6) return;
  const cand = ring(sk, stoneRange(P)).filter(x => { const q = T(x);
   return !impassable(q) && !q.set && q.st === "wild"; });
  if (cand.length) { T(cand[0]).st = "bless"; T(cand[0]).own = who; }
 }));
}

// OP-17. Ground both powers asserted this year goes to neither, and reverts to
// wild. A tile with a stone on it is the exception: it goes to the stone's
// owner, so defending your own holy ground works whatever the turn order, and
// nobody's defence hands the attacker the tile.
function resolveContested() {
 if (!FG.CONTEST) return 0;
 let n = 0, mine = 0;
 Object.keys(FG.G.claims).forEach(ks => {
  if (FG.G.claims[ks] !== 3) return;   // 0b11 — both powers asserted it
  const k = +ks, t = T(k);
  if (t.set || impassable(t)) return;
  const stone = FG.G.stones[0].includes(k) ? 0 : FG.G.stones[1].includes(k) ? 1 : null;
  if (stone !== null) { t.st = "bless"; t.own = stone; return; }
  if (t.own === 0) mine++;
  t.st = "wild"; t.own = null; n++;
 });
 if (mine) say(mine + (mine > 1 ? " tiles are" : " tile is") + " claimed by both of you, and answer to neither.", "bad");
 return n;
}

// Armies and refugee columns move one tile a year.
function moveColumns() {
 FG.G.armies.slice().forEach(a => {
  const tgt = T(a.to);
  if (!tgt.set || tgt.set.own === a.own) {
   say(a.own === 0 ? "The levy arrives to find nothing worth taking, and goes home." : "Their levy turns back.", a.own === 0 ? "civ" : "riv");
   FG.G.armies.splice(FG.G.armies.indexOf(a), 1); return;
  }
  const step = walkStep(a.at, a.to);
  if (step === undefined) {
   // the payoff for spending Drown or Raise mountains defensively
   say(a.own === 0 ? "The levy can find no road. It disbands where it stands." : "Their levy is walled out and disbands.", a.own === 0 ? "bad" : "good");
   FG.G.armies.splice(FG.G.armies.indexOf(a), 1); return;
  }
  a.at = step;
  if (a.at === a.to) {
   tgt.set.own = a.own; tgt.set.pop = Math.max(15, tgt.set.pop * 0.4 + a.n * 0.25);
   tgt.set.spent = 0; tgt.set.done = false;
   say(a.own === 0 ? "The levy takes the place. It answers to you now." : "They have taken one of yours.", a.own === 0 ? "civ" : "war");
   FG.G.armies.splice(FG.G.armies.indexOf(a), 1);
  }
 });

 FG.G.refugees.slice().forEach(f => {
  const d = T(f.to);
  if (!d.set || d.set.own !== f.own) {
   say(f.own === 0 ? "The column arrives to find nowhere to go, and scatters." : "Their people scatter.", f.own === 0 ? "bad" : "riv");
   FG.G.refugees.splice(FG.G.refugees.indexOf(f), 1); return;
  }
  const step = walkStep(f.at, f.to);
  if (step === undefined) { FG.G.refugees.splice(FG.G.refugees.indexOf(f), 1); return; }
  f.at = step;
  if (f.at === f.to) {
   d.set.pop += f.n;
   say(f.own === 0 ? "The column comes in at last. The town is fuller than it was, and louder." : "Their people arrive somewhere else.", f.own === 0 ? "" : "riv");
   FG.G.refugees.splice(FG.G.refugees.indexOf(f), 1);
  }
 });
}

// Taken after your act and before the rival's, so the year's messages can
// report what changed rather than what is.
function snapshot() {
 return {before: Object.keys(reach(0)).length,
         lostBefore: lostCount(0),
         civBefore: civicOpen(0).length};
}

// Everything that happens once both powers have acted. Returns true if the
// game is over. The caller draws; the engine never does.
function worldTick(snap) {
 snap = snap || snapshot();
 resolveContested();
 moveColumns();
 stoneTick();

 // growth
 FG.G.T.forEach((t, k) => {
  if (!t.set) return;
  const land = NB[k].filter(x => !impassable(T(x))).length / 6;
  const f = t.f * (0.55 + 0.45 * land), b = t.set.pop;
  t.set.pop = Math.min(2600, t.set.pop * (1 + FG.TUNE.growth.v / 100 * f));
  if (t.set.own === 0) {
   if (b < 77 && t.set.pop >= 77) say("A settlement has passed seventy-seven. Nothing comes through there now.", "bad");
   if (b < 150 && t.set.pop >= 150) say("Past a hundred and fifty. They begin working the ground outward.", "bad");
  }
 });

 // reckoning, against a lifetime budget per settlement [load-bearing, A-14]
 FG.G.T.forEach((t, k) => {
  if (!t.set || t.set.pop < 150) return;
  if (t.set.spent >= FG.TUNE.budget.v) {
   if (!t.set.done) { t.set.done = true;
    if (t.set.own === 0) say("They have taken in as much ground as they ever will.", ""); }
   return;
  }
  const o = t.set.own, rad = t.set.pop < 800 ? 1 : 2;
  // Clamped to what is left of the budget as well as to the year's rate. Without
  // the first clamp a settlement overshoots its lifetime limit by up to
  // spread-1 tiles, which A-14 calls load-bearing and which went unnoticed until
  // the harness asserted it.
  const allowed = Math.min(FG.TUNE.spread.v, FG.TUNE.budget.v - t.set.spent);
  ring(k, rad).filter(x => { const q = T(x);
   return !impassable(q) && !q.set && !(q.st === "reck" && q.own === o); })
   .slice(0, allowed)
   .forEach(x => { T(x).st = "reck"; T(x).own = o; t.set.spent++; });
 });

 // the one-way ratchet: farmland does not out-score blessing, it erases it
 let lost = 0;
 FG.G.T.forEach((t, k) => {
  if (t.st !== "bless") return;
  if (NB[k].some(x => T(x).st === "reck")) { if (t.own === 0) lost++; t.st = "wild"; t.own = null; }
 });
 if (lost) say(lost + " tile" + (lost > 1 ? "s of your blessing go" : " of your blessing goes") + " out. It has been surveyed.", "bad");

 const q = FG.G.stones[0].filter(k => region(k, 0).length < 6).length;
 if (q > FG.G.warned) { FG.G.warned = q; say("A stone stands in ground that no longer answers. It is only a stone now.", "bad"); }

 const lostAfter = lostCount(0);
 for (let i = snap.lostBefore; i < Math.min(lostAfter, DIVINE.length); i++)
  say("You reach for it and it is not there. " + DIVINE[i].n + " is gone.", "bad");

 const civAfter = civicOpen(0);
 if (civAfter.length > snap.civBefore)
  say("They have learned to do without you: " + CIVIC.find(c => c.id === civAfter[civAfter.length - 1]).n.toLowerCase() + ".", "civ");

 FG.G.hist.push({s: score(), r: Object.keys(reach(0)).length});
 const after = Object.keys(reach(0)).length;
 if (after <= 6 && snap.before > 6) say("There is very little country left that you can walk into.", "bad");

 if (FG.G.turn >= FG.TUNE.turns.v) { FG.G.over = true; return true; }
 FG.G.turn++;
 FG.G.claims = {};
 FG.G.p[0].mp = 3; FG.G.p[0].acted = false; FG.G.p[0].cast = false;
 return false;
}

// One whole year, from the moment you have finished acting. Returns true if
// that was the last one.
function endYear() {
 if (FG.G.over) return true;
 const snap = snapshot();
 FG.aiTurn(1);
 return worldTick(snap);
}

Object.assign(FG, {stoneTick, moveColumns, snapshot, worldTick, endYear, resolveContested});

if (typeof module !== "undefined" && module.exports) module.exports = FG;
})(typeof globalThis !== "undefined" ? globalThis : this);
