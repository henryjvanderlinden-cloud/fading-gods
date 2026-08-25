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
         tabu:   false,                      // OP-20 — forbidden both teachings
         ring:   null};                      // 1.9  — {by, n}, the siege clock
};

// 1.8. Blessing a set of tiles, with the two outcomes counted apart so the
// chronicle can say which happened. Taking their ground gives it to nobody: it
// goes back to wild, and a second visit is what makes it yours.
//
// The claim is recorded for a take and not for an unmaking, which matters only
// under FG.CONTEST (a rejected A-17 candidate, off by default): a tile you
// merely emptied is not a tile you asserted.
function blessTiles(k, who, inPerson) {
 let took = 0, unmade = 0;
 ring(k, 1).forEach(x => {
  const q = T(x), e = FG.blessEffect(q, who, inPerson);
  if (!e) return;
  if (e === "unmake") { q.st = "wild"; q.own = null; unmade++; return; }
  FG.claim(x, who); q.st = "bless"; q.own = who; took++;
 });
 return {took, unmade};
}

// One act, so one sentence, with a clause each way.
function blessSay(r, me, quick) {
 const b = [];
 if (r.took)   b.push(me ? "the ground goes over to you in " + r.took + " tile" + (r.took > 1 ? "s" : "")
                         : "theirs takes " + r.took + " tile" + (r.took > 1 ? "s" : ""));
 if (r.unmade) b.push(me ? "what was theirs in " + r.unmade + " goes back to thorn"
                         : r.unmade + " of yours goes back to thorn");
 if (!b.length) return;
 const s = b.join(", and ");
 say((quick ? "Quickly, " + s : s.charAt(0).toUpperCase() + s.slice(1)) + ".",
     me ? (quick ? "omen" : "") : "riv");
}

// --- acts ---------------------------------------------------------------
// `opt` is an optional target for the acts that have one. Only `split` reads
// it, and only since 1.6 gave a splinter more than one place to go.
function doAct(kind, who, opt) {
 const k = FG.G.p[who].pos, t = T(k), me = who === 0;
 if (kind === "bless") {
  if (!FG.blessGain(k, who)) return false;
  blessSay(blessTiles(k, who, true), me, false);
 } else if (kind === "stone") {
  if (!canStone(k, who)) return false;
  FG.G.stones[who].push(k);
  say(me ? "A stone comes up out of the ground. Nobody set it there." : "A stone rises on their side.", me ? "omen" : "riv");
 } else if (kind === "found") {
  if (!canFound(k, who)) return false;
  t.set = FG.newSet(30, who); t.st = "wild"; t.own = null;
  say(me ? "Thirty of them stay. They will not stay thirty." : "They put down a settlement.", me ? "good" : "riv");
 } else if (kind === "split") {
  // 1.6. The candidates come from the engine rather than being rebuilt here,
  // which is how the old version came to be unreachable: the legality test and
  // the list of places it was legal to go were written twice and only one of
  // them was ever checked.
  const free = FG.splitTargets(k, who);
  if (!free.length) return false;
  const nk = (opt !== undefined && free.includes(opt)) ? opt : FG.pick(free);
  const half = Math.floor(t.set.pop / 2); t.set.pop -= half;
  // A splinter is born untaught, always. A split is the opposite gesture from a
  // colony: it is the Seventy-Seven, people choosing to go back. OP-19.
  //
  // And it is born on blessed ground that it does not consume — the tile keeps
  // its blessing right up until the settlement stands on it, at which point
  // `st` goes to wild like any founding. That is the cost of a split nobody
  // priced: it spends a tile of your own quiet country to make a place.
  T(nk).set = FG.newSet(half, who); T(nk).st = "wild"; T(nk).own = null;
  say(me ? "They keep the Seventy-Seven. Half go over the rise." : "They split one of theirs.", me ? "good" : "riv");
 } else return true;   // do nothing
 return true;
}

// --- interventions ------------------------------------------------------

// 1.16 / 1.17. The toll for saying a thing in country you are not standing in.
//
// The same currency as OP-14's trespass toll and deliberately the same rate:
// there is one stock called *what is left of you*, and everything that spends it
// spends it at the same price, so the player has one number to reason about
// rather than a tariff. It is permanent, it is never refunded, and nothing in
// the game puts any of it back — which is the whole reason it is the right
// currency for this. A wonder you lose is gone; a piece of you is gone the same
// way.
//
// Charged once per intervention, and a year holds one intervention, so the
// ceiling is 10% a year from this and another 10% from standing in their
// furrows. Ten years of ruling entirely by dream and there is nothing left of
// you at all. What *happens* then is still OP-14's open sub-question — today
// movement floors at one tile and you keep playing — but until now nothing in
// the game spent the stock fast enough for anyone to reach the question.
function payDream(who, kind) {
 const p = FG.G.p[who];
 if (p.body === undefined) p.body = 1;
 const before = FG.manifestMp(who);
 p.body = Math.max(0, p.body - FG.R2TUNE.dreamToll);
 if (who !== 0) return;
 say(kind === "teach"
   ? "It came to them in a dream, and it cost you something to send it."
   : "You made yourself heard where you were not standing, and it cost you.", "bad");
 if (p.body <= 0)  say("There is nothing left of you to spend. You are a voice and a set of places.", "bad");
 else if (FG.manifestMp(who) < before) say("You do not cover the ground you used to.", "bad");
}

function doIntervene(id, k, who) {
 const me = who === 0, t = T(k);

 // OP-19. Teaching. No people are deducted — the price of tilling is a wonder,
 // and it is charged by lostCount() reading the board. 1.16 adds the second
 // price, and only when the teaching is done at range.
 if (id === "till" || id === "kill") {
  if (!FG.R2.teaching) return false;
  if (!FG.teachTargets(id, who).includes(k)) return false;
  if (FG.tolled(id, k, who)) payDream(who, "teach");
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
  // 1.8. The one place in the game where the same intervention does two
  // different things depending on where you are standing. In arm's reach it
  // can unmake; sent down the stone network it takes wild ground and passes
  // over theirs, because a thing you say cannot undo a thing they believe.
  blessSay(blessTiles(k, who, !FG.atRange(k, who)), me, true);

 } else {
  // works — the price is paid by the settlement that orders them
  const src = nearestSource(id, k, who);
  if (!src) return false;

  // 1.17. And a second price, paid by you, when the work is aimed outside the
  // country you can be heard in. Note the test is divineReach and not atRange:
  // a work does not need you present — it never did, and `targets()` above has
  // always built the works from the settlement outward without consulting where
  // you are standing. What it needs is for the order to arrive. Inside your own
  // blessing and your stones' range it arrives for nothing. Beyond that you have
  // to make yourself heard, and that is what wears you away.
  //
  // This is the first rule in the game that charges the settled doctrine in
  // *you* rather than in people, and it is the arc stated as a cost: early you
  // point at the ground, late you issue orders, and the orders are what use you
  // up.
  if (FG.tolled(id, k, who)) payDream(who, "order");

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
