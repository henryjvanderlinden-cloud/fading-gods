// Fading Gods — engine: doctrine AI.
//
// One-ply greedy with a little noise. It never plans, never defends, and never
// keeps a wonder in reserve. This is OP-01, and it is the largest caveat
// attached to every balance number in design/rules.md.
(function (root) {
"use strict";
const FG = root.FG = root.FG || {};
const {T, ring, reach, canFound, canSplit, canStone, blessGain,
       divineLeft, civicOpen, targets, doAct, doIntervene} = FG;

// found, bless, split, stone. cities/bands/mixed are the weights the build has
// always used. haunt is new here — the JS game only ever offered three
// doctrines, though design/rules.md §10 reports a Haunt row.
// `till` and `kill` are OP-19, and they are where a doctrine stops being a set
// of weights and becomes a theology. A refuser never teaches, so its people stay
// at Dunbar for forty years and keep hearing it. See concept/lore.md — the
// dropdown is now labelled with the disputants' positions, not their tactics.
// `tillAt` is when a doctrine judges a place ready for the plough. It exists
// because the first measurement of OP-19 found the greedy chooser teaching every
// settlement the year it founded it, which immediately ploughs the blessing that
// the 85% founding rule needs — so Cities destroyed its own preconditions and
// founded 1.6 times a game instead of 8.8. Waiting is not a subtlety here; it is
// most of the doctrine. See OP-01.
const DOCTRINE = {
 cities: {found:12, bless:3,   split:0,  stone:4,  till:1,   kill:1,   tillAt:130},
 bands:  {found:5,  bless:4,   split:14, stone:16, till:0,   kill:0,   tillAt:0},
 mixed:  {found:8,  bless:3.5, split:6,  stone:10, till:0.6, kill:0.5, tillAt:140},
 haunt:  {found:2,  bless:9,   split:2,  stone:12, till:0,   kill:0,   tillAt:0},
 // 1.19 / OP-12. The third answer to *was settling the right thing to allow* —
 // not yes, not no, but let them keep animals and keep moving. `concept/lore.md`
 // records Storm & Sky as indifferent, which was a way of saying nobody had a
 // third position for them. This is it, and the dropdown gains a theology rather
 // than a fourth set of weights.
 //
 // **Read every number this doctrine produces as a floor, not a measurement.** A
 // one-ply greedy chooser cannot play herds. It cannot judge that a place is
 // worth more walking than standing, it will not drive a herd four years across
 // the board to reach a city's fields, and it grazes nothing on purpose that it
 // did not happen to be beside. OP-19 recorded `taughtLoss` and `audible77`
 // measuring at exactly zero for that reason, and this rule is more
 // decision-shaped than either of them. OP-21 is the instrument. See OP-01.
 // `found` is high and `stone` is low, against the instinct — a doctrine whose
 // whole idea is sending peoples out has to make peoples first, and at found 6
 // it made 0.2 settlements a game and taught herding 0.38 times, which measures
 // nothing at all. `herdAt` is a floor of 35 rather than the 130 Cities waits
 // for, because the point of sending them out is that they are small: a village
 // held back until it is ready to plough has already grown past what the grass
 // will carry.
 storm:  {found:12, bless:3.5, split:3,  stone:4,  till:0,   kill:0,   tillAt:0,
          herd:1,   herdAt:35, mound:9,  stop:5},
 passive:null
};

// 1.16 / 1.17. Prefer a target that costs no body over one that does, and fall
// back to the whole list when every target costs.
//
// Recorded as an AI change rather than slipped in, because OP-01 says a twelve-
// line change to this chooser was once worth 35 percentage points — more than
// any rule in the August batch. This one is deliberately not an improvement in
// judgement: it does not weigh a piece of the body against a settlement's whole
// future, which is the decision a player actually makes and which this chooser
// remains structurally unable to see. It only stops the AI paying a toll it had
// no reason to pay, when a free target was sitting in the same list. Without it
// the matrix measures the tariff against an opponent that spends its body at
// random, which is a measurement of nothing.
//
// The real version of this decision is unmeasurable here for the same reason
// `taughtLoss` and `audible77` measure at exactly zero. See OP-01, and OP-21 —
// two people at one board is the instrument that reads it.
const free = (id, tg, who) => {
 const cheap = tg.filter(k => !FG.tolled(id, k, who));
 if (cheap.length) return cheap;
 // 1.23. And near the bottom of the stock, *decline* rather than fall back.
 //
 // Measured before this line existed: seat 1 spent itself to nothing in 27 games
 // out of 100 and then stood paralysed for the rest of them, which moved every
 // number in the table and moved them for a reason that has nothing to do with
 // any rule in this batch.
 //
 // Like the fallback above, this is deliberately not an improvement in judgement.
 // It does not weigh the last tenth of a body against the work it would buy —
 // that is the decision 1.23 exists to give a player, and this chooser remains
 // structurally unable to see it. It only stops the AI walking off the end of a
 // stock it has no concept of, in a year where the alternative was to do nothing
 // much. A machine that cannot time its own sacrifice should not be allowed to
 // make one by accident, or the matrix measures the accident. OP-01, OP-21.
 return FG.manifest(who) <= FG.R2TUNE.dreamToll * RESERVE ? [] : tg;
};
// Tolls the chooser keeps back. Two, so it always has one spend left for a year
// in which something actually matters, and stops before the year that ends it.
const RESERVE = 2;

// A-31. Where the chooser will not end its year, if it has any choice at all.
//
// The furrow toll in `endYear` charges for ending a year on reckoned ground of
// **any** owner, and Rick's ruling is that this is the rule and stays the rule:
// *gods have no place on tilled lands, it destroys them.* The defect was never
// the toll. It was that the chooser had no concept of one. It would stand a year
// in its own fields for a teaching nudge worth nothing, pay a tenth of itself
// for the privilege, and be back there next spring.
//
// Measured before this line existed, 100 games a row against Cities: seat 1
// walked all the way to nothing in **17%** of games against Bands and **31%**
// against Mixed, then stood inert a mean of five to eight years and as many as
// eighteen. Two doctrines that never plough did it in **0%**. That is not a rule
// being tested. That is an opponent falling over, and every cell of the sweep
// table was reading some of it.
//
// Like `free()` above, this is deliberately **not** an improvement in judgement.
// It does not weigh a tenth of a body against the act it would buy — that is the
// decision 1.7 and 1.23 exist to hand a *player*, and OP-01 says this chooser
// cannot see it. It is a preference with a fallback, and the fallback is the
// whole point: **a power whose country is all furrows still has nowhere to
// stand, and still pays.** The toll keeps its teeth exactly where it earned
// them, and loses them where it never had any business having them.
//
// Inert under `R2all(false)`, because `fade` is off there — so the pre-batch
// fingerprint is untouched by construction rather than by luck. OP-01, OP-21.
const furrow = k => !!FG.R2.fade && T(k).st === "reck";

// A-31, the other half, and the larger one. A clearance ploughs the six tiles
// **round** the one it is aimed at, and the chooser had no idea that one of the
// six was the tile it was standing on. Measured after the act-phase guard above
// went in: of the 51 tolls that survived it across a hundred games, **49 were a
// god ordering the plough through its own feet.** The remaining two were a token
// boxed in by fields on every side, which is the rule working.
//
// A player steps aside. This one aims somewhere else, and only when there is
// nowhere else does it stand in what it ordered — so a country with one stretch
// of wood left still costs its god a tenth of itself to clear it.
const notUnderfoot = (tg, who) => {
 if (!FG.R2.fade) return tg;
 const here = FG.G.p[who].pos;
 const away = tg.filter(k => !ring(k, 1).includes(here));
 return away.length ? away : tg;
};

// 1.19 / OP-12. Where a chooser sends its herds, and it is the crudest thing
// that is not nothing: walk at the nearest reckoned tile there is a road to.
//
// Free, so it happens outside the act and the intervention and costs the year
// nothing — which is the rule, not a shortcut. What it is not is a strategy. It
// will not starve a city, it will not ring anything, and it will not cross the
// board for a better target than the one under its nose. A player driving herds
// at a rival's breadbasket is doing something this function has no concept of.
function driveHerds(who) {
 if (!FG.R2.herds) return;
 FG.herdsOf(who).forEach(h => {
  if (h.held > 0) return;
  if (h.to !== h.at && FG.herdStep(h.at, h.to, who) !== undefined) return;  // still walking
  let best = null, bd = 99;
  FG.G.T.forEach((t, k) => {
   if (t.st !== "reck" || t.set || k === h.at) return;
   const d = Math.abs(t.c - FG.T(h.at).c) + Math.abs(t.r - FG.T(h.at).r);
   if (d >= bd) return;
   if (FG.herdStep(h.at, k, who) === undefined) return;
   best = k; bd = d;
  });
  // Nothing to graze anywhere it can walk. Stop if the ground allows it — a herd
  // standing still forever is worse than a settlement, and the chooser has no
  // reason to be holding one.
  if (best === null) { h.to = h.at; return; }
  h.to = best;
 });
}

// A-31. How much of the year's movement the act used up. Module-local because
// `aiPlay` and `stepOff` run back to back on one seat and nothing else may read
// it — the chooser has never decremented `mp` and this does not start.
let walked = 0;

function aiPlay(who) {
 const doc = FG.G.p[who].doc;
 if (!doc || doc === "passive") return;
 const w = DOCTRINE[doc] || DOCTRINE.mixed;
 driveHerds(who);

 // --- the act: move somewhere reachable and do the best thing there
 //
 // OP-19 puts a pull on the act phase that was not there before: teaching is an
 // intervention, but it can only be done in person, so the token has to be
 // walked to a settlement first. A doctrine that wants to teach is drawn toward
 // its own untaught places. This is the crudest possible version of that and it
 // is still one-ply — see OP-01, which this does nothing to fix.
 const wantsTeach = FG.R2.teaching && (w.till > 0 || w.kill > 0);
 const R = reach(who);
 let best = null, off = null;
 Object.keys(R).forEach(ks => {
  const k = +ks, c = [];
  if (canFound(k, who)) c.push([w.found * (0.6 + T(k).f), "found"]);
  const hg = blessGain(k, who);
  if (hg) c.push([w.bless * hg, "bless"]);
  if (canSplit(k, who)) c.push([w.split, "split"]);
  if (canStone(k, who)) c.push([w.stone, "stone"]);
  // 1.19. Standing on your own herd is worth an act if there is a grave to
  // raise, and worth one if the herd has run out of anywhere to be. Both are
  // included so that the two acts are exercised in a played-out game at all —
  // read them as coverage, not as judgement. Deciding *when* a people should
  // stop walking is the whole of this rule and it is precisely the kind of
  // decision a one-ply chooser has no way to make. OP-01, OP-21.
  const hh = FG.R2.herds ? FG.herdAt(k) : null;
  if (hh && hh.own === who) {
   if (FG.canMound(hh)) c.push([w.mound || 0, "mound"]);
   else if (hh.to === hh.at && FG.canStop(hh)) c.push([w.stop || 0, "stop"]);
  }
  // standing next to something teachable is worth a detour, whatever else the
  // act turns out to be — including doing nothing at all when there is nothing
  // else worth doing there
  // Only for places actually judged ready, and only as a nudge. An earlier
  // version counted every untaught settlement and weighted it at 6, which held
  // the token loitering among its own villages — where founding is illegal and
  // the ground is already blessed — and cut Cities from 8.8 foundings a game to
  // 2.0. The rule was innocent; the chooser was not. OP-01.
  let pull = 0;
  if (wantsTeach) {
   const ready = id => FG.teachTargetsAt(k, id, who)
                        .filter(x => T(x).set.pop >= (w.tillAt || 0)).length;
   pull = (ready("till") * w.till + ready("kill") * w.kill) * 3;
   if (pull && !c.length) c.push([0, "none"]);
  }
  c.forEach(([v, a]) => {
   const s = v + pull - R[k] * 0.35 + FG.rand() * 0.9;
   if (!best || s > best.s) best = {s, k, a};
   if (!furrow(k) && (!off || s > off.s)) off = {s, k, a};
  });
 });
 // A-31. The best act that does not end the year in a furrow, and only if every
 // single one of them does, the best act there is.
 const go = off || best;
 if (go) { FG.G.p[who].pos = go.k; walked = R[go.k] || 0; doAct(go.a, who); }
 else {
  // Nothing worth doing anywhere in reach. Stand somewhere — and out of the
  // fields, which is the branch that was quietly doing most of the damage: a
  // token with no act and no preference wandered into the furrows at random.
  const all = Object.keys(R).map(Number), dry = all.filter(k => !furrow(k));
  FG.G.p[who].pos = FG.pick(dry.length ? dry : all);
  walked = R[FG.G.p[who].pos] || 0;
 }

 // --- the intervention
 const dl = divineLeft(who).map(s => s.id);

 // evacuate a threatened town before anything else
 if (dl.includes("omen")) {
  for (const a of FG.G.armies) {
   if (a.own === who) continue;
   const t = T(a.to);
   if (t.set && t.set.own === who && t.set.pop > 60 && targets("omen", who).includes(a.to)) {
    doIntervene("omen", a.to, who); return;
   }
  }
 }

 // OP-19. Teach before anything else once you have walked there — the slot is
 // worth less than the settlement's whole future, and a refuser skips this
 // entire block because its weights are zero.
 if (FG.R2.teaching) {
  // 1.19. Herding is offered first, and only to a doctrine that wants it. Order
  // matters more than the weight does: `till` and `herd` are mutually exclusive
  // on the same settlement, so whichever is tried first is the one that ever
  // happens. A doctrine with both weights set would teach only this one, which
  // is worth knowing before anybody sets both.
  for (const id of ["herd", "till", "kill"]) {
   if (!w[id]) continue;
   if (id === "till" && FG.rand() > w[id]) continue;   // mixed teaches some, not all
   // not before the place is judged ready — teaching ploughs the blessing that
   // the next founding needs. Herding has its own floor and a much lower one:
   // the point of sending a people out is that they are small, and a village
   // held back until it is ready to plough is a village that has already grown
   // past what the grass will carry.
   const floor = id === "herd" ? (w.herdAt || 0) : (w.tillAt || 0);
   const tg = free(id, targets(id, who).filter(k => T(k).set.pop >= floor), who);
   if (tg.length) { doIntervene(id, tg[0], who); return; }
  }
 }

 // works first, strongest first
 const cv = civicOpen(who);
 for (const id of ["levy", "colony", "clear"]) {
  if (!cv.includes(id)) continue;
  let tg = free(id, targets(id, who), who);
  if (id === "clear") tg = notUnderfoot(tg, who);   // A-31
  if (tg.length) {
   let p = tg[0];
   if (id === "levy") p = tg.reduce((a, b) => T(a).set.pop >= T(b).set.pop ? a : b);
   doIntervene(id, p, who); return;
  }
 }

 // then whatever wonders are left, greatest first
 for (const s of divineLeft(who)) {
  if (s.id === "omen") continue;
  const tg = targets(s.id, who);
  if (!tg.length) continue;
  let p = tg[0];
  if (s.id === "blight") p = tg.reduce((a, b) => T(a).set.pop >= T(b).set.pop ? a : b);
  if (s.id === "drown" || s.id === "mountains") {
   // only worth spending next to something of theirs
   const n = tg.filter(k => ring(k, 1).some(x => T(x).set && T(x).set.own !== who));
   if (!n.length) continue;
   p = n[0];
  }
  doIntervene(s.id, p, who); return;
 }
}

// A-31, the last of it. The turn is over. If the year is going to end with the
// token standing in a furrow, walk out of one — with whatever is left of the
// year's movement and **not a step more**.
//
// This is the one thing a player does that the chooser could not. The act and
// the order both happen where you are standing, and then you walk on; that is
// ordinary play and the interface has always allowed it. So `reach` is asked
// again from where the token now stands, with the budget the act did not spend.
// A god that jumped the whole year's movement to get to its act has nothing
// left and stays in what it ordered. Nothing here is free, and nothing here is
// judgement — it walks to the *nearest* clean tile, not the best one.
function stepOff(who) {
 const p = FG.G.p[who];
 if (!furrow(p.pos)) return;
 const left = Math.min(p.mp, FG.manifestMp(who)) - walked;
 if (left < 1) return;
 const save = p.mp; p.mp = left;
 const R = reach(who);
 p.mp = save;
 let best = null;
 Object.keys(R).forEach(ks => { const k = +ks;
  if (furrow(k)) return;
  if (best === null || R[k] < R[best]) best = k; });
 if (best !== null) p.pos = best;
}

function aiTurn(who) {
 const doc = FG.G.p[who].doc;
 if (!doc || doc === "passive") return;
 // 1.23 / OP-14. A power with nothing left of it does not take a turn. Note it
 // does not even drive its herds: steering costs no act and no toll, but it is
 // still a thing said to somebody, and there is nobody left to say it. The rival
 // fades on exactly the terms the player does. It does not walk out of a furrow
 // either — A-31 is a decision, and there is nobody left to make it.
 if (FG.spent(who)) return;
 walked = 0;
 aiPlay(who);
 stepOff(who);
}

FG.DOCTRINE = DOCTRINE;
FG.aiTurn = aiTurn;
FG.doctrines = () => Object.keys(DOCTRINE);

if (typeof module !== "undefined" && module.exports) module.exports = FG;
})(typeof globalThis !== "undefined" ? globalThis : this);
