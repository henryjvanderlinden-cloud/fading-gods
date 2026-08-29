// Fading Gods — engine: end-of-year resolution.
// Order matters: columns move, stones bless, settlements grow, ground is
// reckoned, and only then is blessing erased by what now borders it.
(function (root) {
"use strict";
const FG = root.FG = root.FG || {};
const {NB, ring, T, say, impassable, DIVINE, CIVIC,
       region, reach, stoneRange, lostCount, civicOpen, score, walkStep} = FG;

// 1.20 / OP-16. The people build the stone.
//
// A course goes on while somebody who can still hear you is standing in the
// stone's reach: an untaught band under the Seventy-Seven, or a herd, which is
// that band walking. Read through `FG.audible` rather than re-tested here, so
// this and 1.5 cannot come apart.
//
// Run before `stoneTick`, which matters in one small way and is worth stating: a
// course added this year lowers the threshold this year, so a stone the ploughing
// has just cut down to five tiles is saved by the band beside it in the same tick
// rather than a year later. The people get there first. That is the right order
// for a rule about who is doing the building.
//
// Nothing here ever removes a course. What you can lose is the country, and the
// courses are what let the stone survive losing it — that is the whole bonus. A
// course that decayed would be A-10's timer wearing a different coat.
function growTick() {
 if (!FG.R2.stonesGrow) return;
 [0, 1].forEach(who => FG.G.stones[who].forEach(sk => {
  if (T(sk).crs === undefined) T(sk).crs = 0;
  if (T(sk).crs >= FG.R2TUNE.courses) return;
  // A stone that is not answering is not being added to. The people build what
  // they can still hear; a stone under someone's furrows is a rock in a field and
  // gets no help from the band over the hill.
  if (!FG.stoneWorks(sk, who)) return;
  const near = ring(sk, stoneRange(region(sk, who).length));
  const heard = near.some(x => FG.audible(T(x)) && T(x).set.own === who)
    || (FG.R2.herds && FG.G.herds.some(h => h.own === who && near.includes(h.at) && FG.audibleHerd(h)));
  if (!heard) return;
  T(sk).crs++;
  if (who === 0)
   say(T(sk).crs >= FG.R2TUNE.courses
     ? "They have put the last course on the stone. It is as much of a thing as it will ever be, and it remembers more country than it stands in."
     : "They have added a course to the stone. Nobody asked them to.", "good");
 }));
}

// Working stones bless one wild tile a year without costing an action. The
// only compounding thing the magical side owns.
function stoneTick() {
 [0, 1].forEach(who => FG.G.stones[who].forEach(sk => {
  const P = region(sk, who).length;
  // 1.20. `stoneWorks` rather than `P < 6`, because what a stone needs is now a
  // property of the stone. The literal six lived in five places before that rule
  // and this is one of them.
  if (!FG.stoneWorks(sk, who)) return;
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

// 1.19 / OP-12. Roaming peoples: they walk, they graze, and they shrink to what
// the grass carries.
//
// Placed with the other mortal movement rather than with growth, and before
// `stoneTick`, which matters: ground grazed back to wild this year is ground a
// stone may bless this year. The herd unmakes and the god makes, in that order,
// inside one tick. That is 1.8's line — creation at a distance, unmaking only in
// person — running through mortals instead of through you.
// 1.24 / OP-24. The end of a people, and it is now the only one there is.
//
// Boxed in: no field of theirs in reach, no silent stone of ours, no town of
// theirs to come up beside, and no road to any of it. 1.19 called stopping a
// detour — *an ordinary untaught settlement standing at the same fork it left*.
// That was the softer reading and it is gone. They have been out there a long
// time and they have watched what the other lot do with the ground, so they come
// back **taught**, and they start ploughing next year like anything else that
// learned.
//
// Which is what makes the third leg honest now that it is a door. It is still
// yours; that is the whole of the cost. A wonder goes for it through `lostCount`
// exactly as it would for a town you taught yourself, and the people you sent
// out to break their plough come home holding one.
function settleHerd(h) {
 const s = FG.newSet(Math.max(15, Math.round(h.n)), h.own);
 s.kill = h.kill;
 s.taught = true;
 const t = T(h.at);
 t.set = s; t.st = "wild"; t.own = null;
 FG.G.herds.splice(FG.G.herds.indexOf(h), 1);
 say(h.own === 0
  ? "The herds have nowhere left to go. They put the roofs back up — and this time they know what to do with the ground."
  : "One of theirs has run out of grass and settled, and they are ploughing.",
  h.own === 0 ? "bad" : "riv");
}

// 1.24 / OP-24. A year in the life of a people nobody is steering, and the order
// of it is the argument. See constants.js 1.24 for why it is this order.
function roamTick() {
 const born = [];
 FG.G.herds.slice().forEach(h => {
  const foe = 1 - h.own;

  // Where they are going, decided fresh every year. They are opportunists and
  // nothing holds them to last year's road — and re-aiming is nearly free now
  // that `herdAim` is one breadth-first walk rather than a scan of the board.
  // Nothing to aim at is waiting, not ending. They wander their own god's
  // country until somebody breaks ground somewhere they can reach, and then the
  // wayfinding has something to point at again. Only a people who cannot take a
  // single step — ringed, on every side, by the other power's quiet — are
  // finished. That is now the sole way the door back onto the plough opens, and
  // it is the adversary who opens it.
  const aim = FG.herdAim(h);
  if (aim === null) {
   const drift = FG.herdWander(h);
   if (drift === null) { settleHerd(h); return; }
   h.at = drift; h.to = drift;
  } else {
   h.to = aim;
   const step = FG.herdStep(h.at, aim, h.own);
   if (step !== null && step !== undefined) h.at = step;
  }

  // The grass. One tile, the one under them — a ring would be a plague of
  // locusts and this is a people. Deliberately *not* scaled by how many of them
  // there are: a band that splits has to be twice the destruction, or the fuse
  // is a relief to the man being eaten instead of a threat.
  const t = T(h.at);
  if (t.st === "reck" && !t.set) {
   t.st = "wild"; t.own = null;
   t.bar = FG.G.turn + FG.R2TUNE.wither;
   say(h.own === 0 ? "The herds are over their furrows, and the furrows are going."
                   : "Their herds are over your fields.", h.own === 0 ? "good" : "bad");
  }

  // The mound, and it costs them nothing. 1.19 charged a fifth of the band and
  // the whole year, because it was an act and a god had asked for it. Nobody is
  // asking. They are camped on the place where it is buried and they raise the
  // earth in the season they are there, with what is to hand.
  if (FG.buryable(h.at, h.own)) {
   T(h.at).kur = h.own;
   say(h.own === 0
    ? "They have come over one of your buried stones, and left a mound standing on it."
    : "They have raised a mound over one of their own, far out.",
    h.own === 0 ? "omen" : "riv");
  }

  // The grass has its say first...
  const m = 1 + FG.R2TUNE.r / 100 * (1 - h.n / FG.R2TUNE.kHerd);
  h.n = Math.max(8, h.n * Math.max(1 - FG.R2TUNE.decline, m));

  // ...and the people they take are added after it, which is the only reason a
  // band ever gets above the Seventy-Seven at all. Adjacency only: `herdBlocked`
  // will not let them stand on a town, so beside one is the only reading there
  // is and it is the right one. Their towns and never yours — you taught these
  // people, and they have not forgotten that much.
  //
  // Never below `absFloor`. A band that could absorb a village out of existence
  // would be a second way of removing settlements from the board, and this rule
  // already has enough jobs.
  let took = 0;
  ring(h.at, 1).forEach(x => {
   const q = T(x).set;
   if (!q || q.own !== foe) return;
   const take = Math.min(q.pop * FG.R2TUNE.absorb, FG.R2TUNE.absCap, q.pop - FG.R2TUNE.absFloor);
   if (take <= 0) return;
   q.pop -= take; h.n += take; took += take;
  });
  if (took >= 5) say(h.own === 0
   ? "Some of theirs have gone out to the herds — willingly or otherwise."
   : "People are leaving one of yours, out to where their herds are standing.",
   h.own === 0 ? "good" : "bad");

  // The fuse. `split2` is the wrong precedent — it sends half a settlement to
  // blessed ground you already hold, which is exactly what a roving band has
  // none of. The nearer one is the sentence actions.js already carries: *they
  // keep the Seventy-Seven, half go over the rise.* The child inherits the other
  // teaching and nothing else, and the cap is hard because two becomes four
  // becomes eight and forty years is a great many doublings.
  const mine = FG.herdsOf(h.own).length + born.filter(b => b.own === h.own).length;
  if (h.n >= FG.R2TUNE.fuse && mine < FG.R2TUNE.bands) {
   const spot = NB[h.at].find(x => !FG.herdBlocked(x, h.own) && !FG.herdAt(x));
   if (spot !== undefined) {
    h.n = h.n / 2;
    born.push({at:spot, to:spot, n:h.n, own:h.own, kill:h.kill, held:0});
    say(h.own === 0
     ? "There are too many of them to be one people now. Half go over the rise, and there are two."
     : "One of their herds has broken in two.",
     h.own === 0 ? "omen" : "riv");
   }
  }
 });
 // Added after the loop, so a band born this year walks next year. A child that
 // moved in the tick it was born in would double the rule's tempo for free.
 born.forEach(b => FG.G.herds.push(b));
}

function herdTick() {
 if (!FG.R2.herds) return;
 if (FG.R2.roam) return roamTick();
 FG.G.herds.slice().forEach(h => {
  // a year spent raising a mound is a year spent standing still
  if (h.held > 0) { h.held--; }
  else if (h.to !== h.at) {
   const step = FG.herdStep(h.at, h.to, h.own);
   if (step === undefined) {
    // No road. Either they are ringed, or the place you sent them cannot be
    // walked to any more. They stop where they are if the ground allows it, and
    // if it does not they simply stand — a herd doing nothing, visibly, until
    // you open a way or give them somewhere else to be.
    if (FG.canStop(h)) {
     const s = FG.newSet(Math.max(15, Math.round(h.n)), h.own);
     s.kill = h.kill;
     T(h.at).set = s; T(h.at).st = "wild"; T(h.at).own = null;
     FG.G.herds.splice(FG.G.herds.indexOf(h), 1);
     say(h.own === 0 ? "There is nowhere left to take the herds. They stop, and the roofs go back up."
                     : "One of theirs has run out of grass, and settled.", h.own === 0 ? "" : "riv");
     return;
    }
    if (h.own === 0) say("The herds have nowhere to go and nowhere to stop. They are standing in the open.", "bad");
   } else if (step !== null) h.at = step;
  }

  // Grazing: the tile they are standing on, and only that one. A ring would be a
  // plague of locusts and this is a people. Farmland goes back to **wild**, not
  // to you — they are undoing the plough, not performing your miracle for you,
  // and somebody still has to walk out here afterwards and bless it.
  const t = T(h.at);
  if (t.st === "reck" && !t.set) {
   t.st = "wild"; t.own = null;
   // And it will not take a furrow again for three years. Without this the
   // settled side re-ploughs it next season and grazing is one year of tempo.
   // With it — and with A-14's lifetime budget, which re-ploughing spends a
   // second time — grazed ground is lost twice. See constants.js 1.12.
   t.bar = FG.G.turn + FG.R2TUNE.wither;
   say(h.own === 0 ? "The herds are over their furrows, and the furrows are going."
                   : "Their herds are over your fields.", h.own === 0 ? "good" : "bad");
  }

  // What the grass carries. The same logistic the settled side grows on, at the
  // same rate, against a ceiling of the Seventy-Seven — so a village that was
  // above it when it took down its roofs sheds people until it is a band again.
  const m = 1 + FG.R2TUNE.r / 100 * (1 - h.n / FG.R2TUNE.kHerd);
  h.n = Math.max(8, h.n * Math.max(1 - FG.R2TUNE.decline, m));
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
 herdTick();      // 1.19 — before stoneTick, so grazed ground can be blessed back
 growTick();      // 1.20 — before stoneTick, so a course saves a stone the same year
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
 // 1.20 moved this test into `FG.audible`, because the growth loop needed exactly
 // it and a second copy of *few enough and untaught enough* is how these come
 // apart. The behaviour is unchanged, to the digit.
 if (FG.R2.audible77) FG.G.T.forEach((t, k) => {
  if (!FG.audible(t)) return;
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
    // 1.12. Ground taken back off the plough will not take a furrow again yet.
    // This is the line that makes grazing cost more than a season — see the note
    // on `barren` in rules.js, and note that it *also* holds the budget: a tile
    // refused here is not spent here, so a settlement whose ring is grazed bare
    // keeps its remaining thirty and spends them again when the ground comes
    // back. Lost twice, and the second time invisibly. A-14.
    if (FG.barren(q)) continue;
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
   return !impassable(q) && !q.set && !FG.barren(q) && !(q.st === "reck" && q.own === o); })
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

 const q = FG.G.stones[0].filter(k => !FG.stoneWorks(k, 0)).length;   // 1.20
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
  // 1.23. The bottom of the stock, said once and plainly. Below this line the
  // player has no move, no act and no intervention for the rest of the game, and
  // that has to arrive as a sentence rather than as a row of dead buttons.
  if (FG.spent(0)) say("There is nothing left of you. You will see the rest of it and you will not touch any of it.", "big");
  else if (FG.manifestMp(0) < before)
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

Object.assign(FG, {stoneTick, growTick, moveColumns, herdTick, roamTick, settleHerd,
 snapshot, worldTick, endYear,
 resolveContested, encircleTick, exodus});

if (typeof module !== "undefined" && module.exports) module.exports = FG;
})(typeof globalThis !== "undefined" ? globalThis : this);
