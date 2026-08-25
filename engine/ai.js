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
 return cheap.length ? cheap : tg;
};

function aiTurn(who) {
 const doc = FG.G.p[who].doc;
 if (!doc || doc === "passive") return;
 const w = DOCTRINE[doc] || DOCTRINE.mixed;

 // --- the act: move somewhere reachable and do the best thing there
 //
 // OP-19 puts a pull on the act phase that was not there before: teaching is an
 // intervention, but it can only be done in person, so the token has to be
 // walked to a settlement first. A doctrine that wants to teach is drawn toward
 // its own untaught places. This is the crudest possible version of that and it
 // is still one-ply — see OP-01, which this does nothing to fix.
 const wantsTeach = FG.R2.teaching && (w.till > 0 || w.kill > 0);
 const R = reach(who);
 let best = null;
 Object.keys(R).forEach(ks => {
  const k = +ks, c = [];
  if (canFound(k, who)) c.push([w.found * (0.6 + T(k).f), "found"]);
  const hg = blessGain(k, who);
  if (hg) c.push([w.bless * hg, "bless"]);
  if (canSplit(k, who)) c.push([w.split, "split"]);
  if (canStone(k, who)) c.push([w.stone, "stone"]);
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
  });
 });
 if (best) { FG.G.p[who].pos = best.k; doAct(best.a, who); }
 else { FG.G.p[who].pos = FG.pick(Object.keys(R).map(Number)); }

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
  for (const id of ["till", "kill"]) {
   if (!w[id]) continue;
   if (id === "till" && FG.rand() > w[id]) continue;   // mixed teaches some, not all
   // not before the place is judged ready — teaching ploughs the blessing that
   // the next founding needs
   const tg = free(id, targets(id, who).filter(k => T(k).set.pop >= (w.tillAt || 0)), who);
   if (tg.length) { doIntervene(id, tg[0], who); return; }
  }
 }

 // works first, strongest first
 const cv = civicOpen(who);
 for (const id of ["levy", "colony", "clear"]) {
  if (!cv.includes(id)) continue;
  const tg = free(id, targets(id, who), who);
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

FG.DOCTRINE = DOCTRINE;
FG.aiTurn = aiTurn;
FG.doctrines = () => Object.keys(DOCTRINE);

if (typeof module !== "undefined" && module.exports) module.exports = FG;
})(typeof globalThis !== "undefined" ? globalThis : this);
