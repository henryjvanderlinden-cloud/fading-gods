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
const DOCTRINE = {
 cities: {found:12, bless:3,   split:0,  stone:4},
 bands:  {found:5,  bless:4,   split:14, stone:16},
 mixed:  {found:8,  bless:3.5, split:6,  stone:10},
 haunt:  {found:2,  bless:9,   split:2,  stone:12},
 passive:null
};

function aiTurn(who) {
 const doc = FG.G.p[who].doc;
 if (!doc || doc === "passive") return;
 const w = DOCTRINE[doc] || DOCTRINE.mixed;

 // --- the act: move somewhere reachable and do the best thing there
 const R = reach(who);
 let best = null;
 Object.keys(R).forEach(ks => {
  const k = +ks, c = [];
  if (canFound(k, who)) c.push([w.found * (0.6 + T(k).f), "found"]);
  const hg = blessGain(k, who);
  if (hg) c.push([w.bless * hg, "bless"]);
  if (canSplit(k, who)) c.push([w.split, "split"]);
  if (canStone(k, who)) c.push([w.stone, "stone"]);
  c.forEach(([v, a]) => {
   const s = v - R[k] * 0.35 + FG.rand() * 0.9;
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

 // works first, strongest first
 const cv = civicOpen(who);
 for (const id of ["levy", "colony", "clear"]) {
  if (!cv.includes(id)) continue;
  const tg = targets(id, who);
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
