// Fading Gods — engine: the one act and the one intervention a year.
// Everything here mutates FG.G.
(function (root) {
"use strict";
const FG = root.FG = root.FG || {};
const {NB, ring, T, say, impassable, DIVINE, MOUNT, DROWN, BLIGHT,
       canFound, canSplit, canStone, settlements, walkStep,
       mountainLine, nearestSource} = FG;

// A settlement, with the two things it may be taught. `taught` and `kill` are
// present whatever FG.R2.teaching says, so state stays one shape and the flag
// only decides whether anything reads them. OP-19.
FG.newSet = function (pop, who, from) {
 return {pop, own:who, spent:0,
         taught: !!(from && from.taught),    // a colony inherits; a splinter does not
         kill:   !!(from && from.kill),
         tabu:   false};                     // OP-20
};

// --- acts ---------------------------------------------------------------
function doAct(kind, who) {
 const k = FG.G.p[who].pos, t = T(k), me = who === 0;
 if (kind === "bless") {
  const n = FG.blessGain(k, who);
  if (!n) return false;
  ring(k, 1).forEach(x => { const q = T(x);
   if (!FG.takeable(q, who)) return;
   FG.claim(x, who); q.st = "bless"; q.own = who; });
  say((me ? "The ground goes over to you in " : "Theirs takes ") + n + " tile" + (n > 1 ? "s" : "") + ".", me ? "" : "riv");
 } else if (kind === "stone") {
  if (!canStone(k, who)) return false;
  FG.G.stones[who].push(k);
  say(me ? "A stone comes up out of the ground. Nobody set it there." : "A stone rises on their side.", me ? "omen" : "riv");
 } else if (kind === "found") {
  if (!canFound(k, who)) return false;
  t.set = FG.newSet(30, who); t.st = "wild"; t.own = null;
  say(me ? "Thirty of them stay. They will not stay thirty." : "They put down a settlement.", me ? "good" : "riv");
 } else if (kind === "split") {
  if (!canSplit(k, who)) return false;
  const free = NB[k].filter(x => canFound(x, who));
  const nk = FG.pick(free);
  const half = Math.floor(t.set.pop / 2); t.set.pop -= half;
  // A splinter is born untaught, always. A split is the opposite gesture from a
  // colony: it is the Seventy-Seven, people choosing to go back. OP-19.
  T(nk).set = FG.newSet(half, who); T(nk).st = "wild"; T(nk).own = null;
  say(me ? "They keep the Seventy-Seven. Half go over the rise." : "They split one of theirs.", me ? "good" : "riv");
 } else return true;   // do nothing
 return true;
}

// --- interventions ------------------------------------------------------
function doIntervene(id, k, who) {
 const me = who === 0, t = T(k);

 // OP-19. Teaching. Nothing is deducted and nothing is spent — the price of
 // tilling is a wonder, and it is charged by lostCount() reading the board.
 if (id === "till" || id === "kill") {
  if (!FG.R2.teaching) return false;
  if (!FG.teachTargets(id, who).includes(k)) return false;
  if (id === "till") {
   t.set.taught = true;
   say(me ? "You show them the plough, and they take to it. The ground will answer them now."
          : "They have been taught to plough.", me ? "bad" : "riv");
  } else {
   t.set.kill = true;
   say(me ? "You teach them the other thing. They learn it faster."
          : "Theirs have been taught to kill.", me ? "bad" : "war");
  }
  return true;
 }

 if (id === "mountains") {
  mountainLine(k).forEach(x => { const q = T(x);
   if (!q.set && !FG.G.stones[0].includes(x) && !FG.G.stones[1].includes(x) && q.t !== "water") {
    q.t = "mount"; q.f = 0; q.st = "wild"; q.own = null; }});
  say(me ? FG.pick(MOUNT) : "Rock came up across your road.", me ? "omen" : "bad");

 } else if (id === "drown") {
  t.t = "water"; t.f = 0; t.st = "wild"; t.own = null; t.set = null;
  say(me ? FG.pick(DROWN) : "Water where there was ground, on your side.", me ? "omen" : "bad");

 } else if (id === "blight") {
  t.set.pop = Math.max(8, t.set.pop * 0.5);
  say(me ? FG.pick(BLIGHT) : "Something took half of one of yours.", me ? "omen" : "bad");

 } else if (id === "omen") {
  const leaving = Math.floor(t.set.pop * 0.75); t.set.pop -= leaving;
  let dest = null, bd = 99;
  settlements(who).forEach(o => {
   if (o.k === k) return;
   if (walkStep(k, o.k) === undefined) return;
   const d = Math.abs(T(o.k).c - t.c) + Math.abs(T(o.k).r - t.r);
   if (d < bd) { bd = d; dest = o.k; }});
  if (dest === null) { t.set.pop += leaving; return false; }
  FG.G.refugees.push({at:k, to:dest, n:leaving, own:who});
  say(me ? "They dreamt the same dream and by morning three quarters of the town was on the road."
         : "Their town emptied overnight.", me ? "omen" : "riv");

 } else if (id === "wither") {
  let n = 0;
  ring(k, 1).forEach(x => { const q = T(x);
   if (!q.set && q.st === "reck" && q.own !== who) { q.st = "wild"; q.own = null; n++; }});
  say(me ? "The furrows go back to thorn in " + n + " tile" + (n > 1 ? "s" : "") + "." : "Their fields go to waste.", me ? "omen" : "riv");

 } else if (id === "quicken") {
  let n = 0;
  ring(k, 1).forEach(x => { const q = T(x);
   if (!FG.takeable(q, who)) return;
   FG.claim(x, who); q.st = "bless"; q.own = who; n++; });
  say(me ? "The ground comes over quickly, in " + n + " tile" + (n > 1 ? "s" : "") + "." : "Theirs quickens.", me ? "omen" : "riv");

 } else {
  // works — the price is paid by the settlement that orders them
  const src = nearestSource(id, k, who);
  if (!src) return false;

  if (id === "clear") {
   src.t.set.pop *= 0.9;
   let n = 0;
   ring(k, 1).forEach(x => { const q = T(x);
    if (!impassable(q) && !q.set && !(q.st === "reck" && q.own === who) && n < 3) { q.st = "reck"; q.own = who; n++; }});
   say(me ? "They fell the wood and put the plough through it — " + n + " tiles in one season." : "They clear a stretch of wood.", me ? "civ" : "riv");
  }
  if (id === "colony") {
   src.t.set.pop *= 0.65;
   // A colony is a work of the settled, and is born tilling. OP-19.
   T(k).set = FG.newSet(40, who, src.t.set); T(k).st = "wild"; T(k).own = null;
   say(me ? "Forty of them go out with carts and a charter." : "They send out a colony.", me ? "civ" : "riv");
  }
  if (id === "levy") {
   const n = Math.floor(src.t.set.pop * 0.45); src.t.set.pop -= n;
   FG.G.armies.push({at:src.k, to:k, n, own:who});
   say(me ? "The levy forms. It will be some years on the road." : "A levy has formed, and it is coming.", me ? "civ" : "war");
  }
 }
 return true;
}

Object.assign(FG, {doAct, doIntervene});

if (typeof module !== "undefined" && module.exports) module.exports = FG;
})(typeof globalThis !== "undefined" ? globalThis : this);
