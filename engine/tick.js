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

// A-17. Ground both powers asserted this year goes to neither, and reverts to
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

// 1.9 / OP-20. People who leave a place go somewhere; they do not evaporate.
// Reuses the refugee machinery §7 already has for Bad omen, and reuses it
// deliberately — the second-order consequence documented there is the best
// emergent interaction in the build, and it is the whole point here. The
// arrivals push another settlement past a threshold, so **forbidding one place
// makes another one loud. You cannot forbid your way to silence.**
//
// **They walk back to their own people, not to yours.** They are leaving because
// the plough is forbidden here, so they go where ploughing still happens — which
// is the country of the power that lost them, recorded as `exile` at the moment
// the ring closed. That is the cost of forbidding a loud place, and it is a real
// one: you break their engine here and make their next town bigger. Silence is
// not achieved; loudness is moved. If their country is gone or cannot be reached
// they fall back on the place's new owner, and failing that they scatter.
function nearestOf(k, who) {
 const t = T(k);
 let dest = null, bd = 99;
 FG.settlements(who).forEach(o => {
  if (o.k === k) return;
  if (walkStep(k, o.k) === undefined) return;
  const d = Math.abs(T(o.k).c - t.c) + Math.abs(T(o.k).r - t.r);
  if (d < bd) { bd = d; dest = o.k; }
 });
 return dest;
}

function exodus(k, n) {
 if (n <= 0) return;
 const t = T(k), mine = t.set.own;
 const home = t.set.exile === undefined ? mine : t.set.exile;
 let to = nearestOf(k, home), own = home;
 if (to === null) { to = nearestOf(k, mine); own = mine; }
 if (to === null) {
  if (mine === 0) say("They go out of the forbidden place, and there is nowhere left to go. They scatter.", "bad");
  return;
 }
 FG.G.refugees.push({at:k, to, n, own});
 if (own === 0) say(n + " come out of the place they were forbidden, and take the road to the nearest of yours.", "");
 else if (mine === 0) say(n + " leave rather than give up the plough, and go back to their own.", "bad");
 else say("People are leaving the place you were forbidden.", "riv");
}

// 1.9 / OP-20. A place closed in on every side by one power's blessing goes over
// to it, and what it knows is forbidden for good.
//
// Two years rather than one, so it is a siege and not a trick: the ring has to
// survive a year in which the other power gets to act, and under 1.8 relieving
// it means walking there. The clock is cleared the moment the ring breaks or
// changes hands, so one tile taken back resets the whole thing.
//
// Nothing is credited to anybody here. `lostCount` is derived from the board and
// counts *taught settlements you currently own*, so un-teaching this place drops
// the former owner's count and the wonder goes back to them in the same tick,
// with no bookkeeping — which is exactly what already happens when a taught city
// is taken by levy. The capturer gains a settlement, a permanent silence, and
// whatever the fields stop producing. See constants.js 1.9.
function encircleTick() {
 if (!FG.R2.encircle) return;
 FG.G.T.forEach((t, k) => {
  if (!t.set) return;
  const by = FG.encircledBy(k);
  if (by === null) { t.set.ring = null; return; }
  if (!t.set.ring || t.set.ring.by !== by) t.set.ring = {by, n: 0};
  t.set.ring.n++;

  if (t.set.ring.n < FG.R2TUNE.encircle) {
   if (t.set.own === 0) say("One of yours is closed in on every side. Whatever is out there is not moving.", "bad");
   else if (by === 0) say("One of theirs is closed in on every side, and the ring holds.", "good");
   return;
  }

  const from = t.set.own, was = t.set.taught || t.set.kill;
  t.set.own = by; t.set.ring = null; t.set.spent = 0; t.set.done = false;
  t.set.exile = from;   // where the ones who will not stay are walking to
  // The taboo. Both teachings, for good — `teachTargetsAt` refuses a forbidden
  // place for ever after, and `carryCap` reads `taught`, so the ceiling drops to
  // Dunbar in this same tick and the emptying starts immediately.
  t.set.taught = false; t.set.kill = false; t.set.tabu = true;

  if (by === 0)
   say(was ? "The ring closes. The place is yours, and what they were taught there is forbidden — nobody will plough here again, or march from it."
           : "The ring closes, and the place is yours. It will stay quiet.", "omen");
  else if (from === 0)
   say("They have closed the ring. The place has gone over, and what you taught them there is forbidden for good.", "war");
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
 // Before growth, so a place that changes hands this year declines at its new
 // ceiling this year rather than getting one more season of the old one.
 encircleTick();

 // growth
 FG.G.T.forEach((t, k) => {
  if (!t.set) return;
  const land = NB[k].filter(x => !impassable(T(x))).length / 6;
  const b = t.set.pop;

  if (FG.R2.logistic) {
   // OP-19. Logistic, with the ceiling carrying everything the growth rate used
   // to: terrain, teaching, and how much land there is. The rate itself is now
   // uniform. Above its ceiling — which is what forbidding a place does, OP-20 —
   // the multiplier goes negative, so the decline is floored and the difference
   // leaves as people rather than as arithmetic.
   const K = FG.carryCap(t);
   const m = 1 + FG.R2TUNE.r / 100 * (1 - t.set.pop / K);
   const next = t.set.pop * Math.max(1 - FG.R2TUNE.decline, m);
   // 1.9. And here is where it leaves as people. Only for a forbidden place —
   // that is the one thing in the game that puts a settlement far above its own
   // ceiling, and a town shrinking by a percent because a column arrived is not
   // an exodus and should not be drawn as one.
   if (FG.R2.encircle && t.set.tabu && next < b) exodus(k, Math.floor(b - next));
   t.set.pop = next;
  } else {
   const f = t.f * (0.55 + 0.45 * land);
   t.set.pop = Math.min(2600, t.set.pop * (1 + FG.TUNE.growth.v / 100 * f));
  }

  if (t.set.own === 0) {
   if (b < 77 && t.set.pop >= 77)
    say(FG.R2.audible77 ? "A settlement has passed seventy-seven. They cannot hear you there now."
                        : "A settlement has passed seventy-seven. Nothing comes through there now.", "bad");
   if (!FG.R2.taughtLoss && b < 150 && t.set.pop >= 150)
    say("Past a hundred and fifty. They begin working the ground outward.", "bad");
  }
 });

 // OP-19. A settlement under seventy-seven blesses the ground round it, as a
 // stone does, and for the same reason: they are few, the country is quiet, and
 // there is nothing between them and you but air. Untaught only — a people who
 // have been shown the plough are counting the fields, not listening.
 if (FG.R2.audible77) FG.G.T.forEach((t, k) => {
  if (!t.set || t.set.taught || t.set.pop >= 77) return;
  const cand = ring(k, 1).filter(x => { const q = T(x);
   return !impassable(q) && !q.set && q.st === "wild"; });
  if (cand.length) { T(cand[0]).st = "bless"; T(cand[0]).own = t.set.own; }
 });

 // reckoning, against a lifetime budget per settlement [load-bearing, A-14]
 FG.G.T.forEach((t, k) => {
  if (!t.set) return;
  // OP-19. Only a people who have been taught to till turn ground into fields.
  if (FG.R2.teaching ? !t.set.taught : t.set.pop < 150) return;
  // 1.9. And not while the ring is closed. Found by building the rule and then
  // watching it never fire: farmland erases blessing, a taught settlement
  // ploughs its own first ring, and blessing cannot be laid on farmland — so
  // one season's ploughing broke every siege permanently and a taught place was
  // simply immune. A place closed in on every side does not go out to the
  // fields, which is what a siege *is*, and it hands the defender the right
  // counter: break the ring and the ploughing resumes the same year.
  if (FG.R2.encircle && t.set.ring) return;
  if (t.set.spent >= FG.TUNE.budget.v) {
   if (!t.set.done) { t.set.done = true;
    if (t.set.own === 0) say("They have taken in as much ground as they ever will.", ""); }
   return;
  }
  const o = t.set.own, rad = t.set.pop < 800 ? 1 : 2;
  if (FG.R2.exitLane) {
   // OP-19. Slower in the first ring, and never over the last way out.
   const cap = Math.min(rad === 1 ? FG.R2TUNE.spread1 : FG.TUNE.spread.v,
                        FG.TUNE.budget.v - t.set.spent);
   let n = 0;
   for (const x of ring(k, rad)) {
    if (n >= cap) break;
    const q = T(x);
    if (impassable(q) || q.set || (q.st === "reck" && q.own === o)) continue;
    if (FG.wouldSeal(x)) continue;
    q.st = "reck"; q.own = o; t.set.spent++; n++;
   }
   return;
  }
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
 // OP-19/OP-20. The count can now fall as well as rise — a place forbidden, or a
 // taught city lost to someone else. The most recently lost comes back first.
 for (let i = Math.min(snap.lostBefore, DIVINE.length) - 1; i >= lostAfter; i--)
  say("Somewhere it has gone quiet enough again. " + DIVINE[i].n + " is yours once more.", "good");

 const civAfter = civicOpen(0);
 if (civAfter.length > snap.civBefore)
  say("They have learned to do without you: " + CIVIC.find(c => c.id === civAfter[civAfter.length - 1]).n.toLowerCase() + ".", "civ");

 FG.G.hist.push({s: score(), r: Object.keys(reach(0)).length});
 const after = Object.keys(reach(0)).length;
 if (after <= 6 && snap.before > 6) say("There is very little country left that you can walk into.", "bad");

 // OP-14. The toll. Crossing ploughed ground is free; still being in it when the
 // year turns is not. Charged to both powers, and to the rival too, so a doctrine
 // that lives in the fields pays for it.
 if (FG.R2.fade) [0, 1].forEach(who => {
  const p = FG.G.p[who];
  if (p.body === undefined) p.body = 1;
  if (T(p.pos).st !== "reck") return;
  const before = FG.manifestMp(who);
  p.body = Math.max(0, p.body - FG.R2TUNE.toll);
  if (who !== 0) return;
  say("You spent the year standing in their furrows, and there is less of you than there was.", "bad");
  if (FG.manifestMp(0) < before)
   say("You do not cover the ground you used to.", "bad");
 });

 if (FG.G.turn >= FG.TUNE.turns.v) { FG.G.over = true; return true; }
 FG.G.turn++;
 FG.G.claims = {};
 // Both seats, always. This used to clear `acted` and `cast` for seat 0 only,
 // on the reasoning that the AI never reads them — true, and it made the engine
 // quietly unable to carry a second person. OP-21.
 [0, 1].forEach(who => { const p = FG.G.p[who];
  p.mp = FG.manifestMp(who); p.acted = false; p.cast = false; });
 return false;
}

// One whole year, from the moment the human seat — or in a two-player game,
// both of them — has finished acting. Returns true if that was the last one.
//
// This was `FG.aiTurn(1)` unconditionally, and OP-21 named it the engine's only
// structural assumption about who is human. `aiTurn` already no-ops on a null
// doctrine, so the guard is belt and braces; it is written out because the
// assumption is the thing worth being explicit about.
function endYear() {
 if (FG.G.over) return true;
 const snap = snapshot();
 if (!FG.G.pvp) FG.aiTurn(1);
 return worldTick(snap);
}

Object.assign(FG, {stoneTick, moveColumns, snapshot, worldTick, endYear, resolveContested,
 encircleTick, exodus});

if (typeof module !== "undefined" && module.exports) module.exports = FG;
})(typeof globalThis !== "undefined" ? globalThis : this);
