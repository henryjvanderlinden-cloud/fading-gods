// Fading Gods — checks.
//
//   node sim/smoke.js
//
// Two jobs. First, engine invariants over many seeded games: legality, the
// one-way ratchet, the reckoning budget, the wonder ladder. Second, load
// game/index.html in a real DOM and play it through the UI's own handlers, so
// that "the game still plays identically" is something checked rather than
// hoped for.
const fs = require("fs");
const path = require("path");
const FG = require("../engine/load.js");

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
 if (cond) { pass++; }
 else { fail++; console.log("  FAIL  " + name + (detail ? "  — " + detail : "")); }
};

// ---------------------------------------------------------------- engine
console.log("\nengine invariants");

const SEEDS = 30;
let capturedStoneYears = 0;
for (let seed = 0; seed < SEEDS; seed++) {
 FG.resetTune();
 FG.createGame({you: "mixed", them: "cities", seed});

 for (let y = 0; y < 40; y++) {
  FG.aiTurn(0);
  if (FG.endYear()) break;

  const G = FG.G;

  // no settlement exceeds its lifetime reckoning budget
  const overBudget = G.T.filter(t => t.set && t.set.spent > FG.TUNE.budget.v);
  ok("reckoning budget respected", overBudget.length === 0,
     `seed ${seed} year ${G.turn}: ${overBudget.length} settlements over ${FG.TUNE.budget.v}`);

  // the ratchet: no blessed tile survives next to reckoned ground
  const survived = G.T.filter((t, k) => t.st === "bless" && FG.NB[k].some(x => FG.T(x).st === "reck"));
  ok("blessing erased beside farmland", survived.length === 0,
     `seed ${seed} year ${G.turn}: ${survived.length} tiles survived`);

  // a tile is in exactly one state, and owned only if it is in a state
  const bad = G.T.filter(t => (t.st === "wild" && t.own !== null) ||
                              (t.st !== "wild" && !t.set && t.own === null));
  ok("land state and ownership agree", bad.length === 0, `seed ${seed} year ${G.turn}: ${bad.length} tiles`);

  // Not an assertion — a measurement. Bless and Quicken overwrite the other
  // side's blessing and neither excludes a tile with a stone on it, so a rival
  // can bless the ground out from under your stone and silence it for good.
  // This is in the shipped build and is documented nowhere. See OP-16.
  [0, 1].forEach(w => G.stones[w].forEach(k => {
   const t = FG.T(k);
   if (t.st === "bless" && t.own !== w) capturedStoneYears++;
  }));

  // the wonder ladder never goes backwards within a year, and never exceeds six
  [0, 1].forEach(w => ok("wonders lost within range", FG.lostCount(w) >= 0));
  [0, 1].forEach(w => ok("wonders left within range",
    FG.divineLeft(w).length >= 0 && FG.divineLeft(w).length <= FG.DIVINE.length));

  // stone cap
  [0, 1].forEach(w => ok("stone cap respected", G.stones[w].length <= FG.TUNE.stonecap.v,
    `seed ${seed}: ${G.stones[w].length} stones`));

  // armies and columns are always somewhere passable or at their target
  const strayed = G.armies.concat(G.refugees).filter(a => FG.impassable(FG.T(a.at)) && a.at !== a.to);
  ok("nothing marches through rock or water", strayed.length === 0, `seed ${seed} year ${G.turn}`);
 }

 // the game ends when it says it will
 ok("game runs to the full term", FG.G.over && FG.G.turn === FG.TUNE.turns.v,
    `seed ${seed}: over=${FG.G.over} turn=${FG.G.turn}`);
}

// determinism: the same seed twice is the same game
function fingerprint(seed) {
 FG.resetTune();
 FG.createGame({you: "bands", them: "cities", seed});
 for (let y = 0; y < 40; y++) { FG.aiTurn(0); if (FG.endYear()) break; }
 const s = FG.score();
 return [s[0].tot, s[1].tot, FG.G.log.length, FG.G.stones[0].length].join("/");
}
ok("same seed gives the same game", fingerprint(11) === fingerprint(11));
ok("different seeds give different games", fingerprint(11) !== fingerprint(12));

console.log(`  ${pass} passed, ${fail} failed`);
console.log(`  measured: ${capturedStoneYears} stone-years spent standing in a rival's blessing`
 + ` over ${SEEDS} games — blessing over a stone silences it, and nothing says so (OP-16)`);

// ------------------------------------------------- 1.6 / 1.8 / 1.9, August 2026
// Three rules that all turn on a predicate the rest of the engine reads, so they
// are checked on constructed boards as well as in play. The constructed half is
// what caught the two things play did not: that split had never once been legal,
// and that a taught settlement broke every siege by ploughing.
console.log("\nthe three rules of the second batch");
{
 const before = fail;
 const {K, NB, T, ring} = FG;

 // A blank plain board with nothing on it, so a rule can be shown one situation
 // at a time. Every flag in the batch is on, because that is the game.
 function blank() {
  FG.resetTune(); FG.R2all(false); FG.R2built(true);
  FG.createGame({you: null, them: "passive", seed: 1});
  FG.G.T.forEach(t => { t.t = "plain"; t.f = 1; t.st = "wild"; t.own = null; t.set = null; });
  FG.G.stones = [[], []]; FG.G.armies = []; FG.G.refugees = []; FG.G.log = [];
  FG.G.p[0].pos = K(4, 4); FG.G.p[1].pos = K(12, 4);
 }
 const settle = (c, r, who, pop, taught) => {
  const t = T(K(c, r));
  t.set = FG.newSet(pop, who); t.set.taught = !!taught; t.st = "wild"; t.own = null; return t;
 };
 const blessRound = (c, r, rad, who) =>
  ring(K(c, r), rad).forEach(x => { T(x).st = "bless"; T(x).own = who; });

 // --- 1.6 split ---------------------------------------------------------
 blank(); blessRound(4, 4, 2, 0); settle(4, 4, 0, 80);
 const parent = K(4, 4), tg = FG.splitTargets(parent, 0), d = FG.pathWithin(parent, 2);
 ok("split has somewhere to go", tg.length > 0);
 ok("no splinter lands beside its parent", tg.every(x => !NB[parent].includes(x)));
 ok("every splinter lands at path distance two", tg.every(x => d[x] === 2));
 ok("every splinter lands on ground you blessed",
    tg.every(x => T(x).st === "bless" && T(x).own === 0));
 ok("sixty is the floor", (T(parent).set.pop = 59, !FG.canSplit(parent, 0))
    && (T(parent).set.pop = 60, FG.canSplit(parent, 0)));

 blank(); blessRound(4, 4, 2, 0); settle(4, 4, 0, 80);
 T(K(4, 2)).st = "wild"; T(K(4, 2)).own = null;
 ok("wild ground two out is not a target", !FG.splitTargets(parent, 0).includes(K(4, 2)));

 blank(); blessRound(4, 4, 2, 0); settle(4, 4, 0, 80);
 const openTargets = FG.splitTargets(parent, 0).length;
 NB[parent].forEach(x => { T(x).t = "water"; T(x).f = 0; T(x).st = "wild"; T(x).own = null; });
 ok("a split cannot leapfrog water", FG.splitTargets(parent, 0).length === 0,
    `open board offered ${openTargets}`);

 blank(); blessRound(4, 4, 2, 0); settle(4, 4, 0, 80);
 FG.G.p[0].pos = parent;
 const aim = FG.splitTargets(parent, 0)[0];
 ok("split goes where it is aimed", FG.doAct("split", 0, aim) === true && T(aim).set !== null);
 ok("eighty splits into forty and forty", T(aim).set.pop === 40 && T(parent).set.pop === 40);
 ok("a splinter is born untaught and unforbidden",
    T(aim).set.taught === false && T(aim).set.tabu === false && T(aim).set.ring === null);
 ok("founding spends the tile's blessing", T(aim).st === "wild" && T(aim).own === null);

 // The rule this replaced, kept as a check rather than a paragraph: it could
 // never fire, in any position, and this is the position most favourable to it.
 blank(); FG.R2.split2 = false; blessRound(4, 4, 2, 0); settle(4, 4, 0, 80);
 ok("the old split was impossible even on an open blessed board",
    FG.splitTargets(parent, 0).length === 0);
 FG.R2built(true);

 // --- 1.8 unmake --------------------------------------------------------
 blank();
 T(K(3, 4)).st = "bless"; T(K(3, 4)).own = 1;
 FG.G.p[0].pos = K(4, 4);
 ok("their blessing, in person, is unmade", FG.blessEffect(T(K(3, 4)), 0, true) === "unmake");
 ok("their blessing, at range, is nothing", FG.blessEffect(T(K(3, 4)), 0, false) === null);
 ok("wild ground, at range, is still taken", FG.blessEffect(T(K(5, 4)), 0, false) === "take");
 FG.doAct("bless", 0);
 ok("Bless returns their ground to wild, not to you",
    T(K(3, 4)).st === "wild" && T(K(3, 4)).own === null);
 ok("the same Bless takes the wild ground beside it",
    T(K(5, 4)).st === "bless" && T(K(5, 4)).own === 0);
 FG.doAct("bless", 0);
 ok("two visits make it yours", T(K(3, 4)).st === "bless" && T(K(3, 4)).own === 0);

 blank();
 FG.G.stones[0] = [K(4, 4)]; blessRound(4, 4, 2, 0);
 [[7, 4], [7, 3], [7, 5]].forEach(([c, r]) => { T(K(c, r)).st = "bless"; T(K(c, r)).own = 1; });
 FG.G.p[0].pos = K(4, 4);
 ok("a tile ringed by their blessing is no Quicken target at range",
    FG.atRange(K(7, 4), 0) && !FG.targets("quicken", 0).includes(K(7, 4)));
 FG.G.p[0].pos = K(6, 4);
 ok("walk to it and Quicken can reach it", FG.targets("quicken", 0).includes(K(7, 4)));
 FG.doIntervene("quicken", K(7, 4), 0);
 ok("Quicken in person unmakes", T(K(7, 4)).st === "wild" && T(K(7, 3)).st === "wild");

 // --- 1.9 encircle ------------------------------------------------------
 blank(); settle(4, 4, 1, 900, true);
 NB[K(4, 4)].forEach(x => { T(x).st = "bless"; T(x).own = 0; });
 ok("a place ringed on every side is ringed", FG.encircledBy(K(4, 4)) === 0);
 T(NB[K(4, 4)][0]).own = 1;
 ok("one tile of their own breaks the ring", FG.encircledBy(K(4, 4)) === null);
 T(NB[K(4, 4)][0]).own = 0;
 FG.encircleTick();
 ok("year one notes the ring and changes nothing",
    T(K(4, 4)).set.own === 1 && T(K(4, 4)).set.ring.n === 1);
 FG.encircleTick();
 ok("year two takes the place", T(K(4, 4)).set.own === 0);
 ok("and forbids it both teachings",
    T(K(4, 4)).set.tabu === true && T(K(4, 4)).set.taught === false && T(K(4, 4)).set.kill === false);
 ok("a forbidden place can never be taught again", !FG.teachTargets("till", 0).includes(K(4, 4)));
 ok("its ceiling falls to Dunbar", FG.carryCap(T(K(4, 4))) === FG.R2TUNE.kWild);

 blank(); settle(4, 4, 1, 300, true);
 NB[K(4, 4)].forEach(x => { T(x).st = "bless"; T(x).own = 0; });
 FG.encircleTick();
 T(NB[K(4, 4)][0]).st = "wild"; T(NB[K(4, 4)][0]).own = null;
 FG.encircleTick();
 ok("breaking the ring resets the clock",
    T(K(4, 4)).set.ring === null && T(K(4, 4)).set.own === 1);

 // The thing that was wrong and was found by building it: farmland erases
 // blessing, so a taught settlement used to plough its besiegers away in one
 // season and was simply immune. A ringed place does not go out to the fields.
 blank(); settle(4, 4, 1, 900, true); settle(9, 4, 1, 100, false);
 NB[K(4, 4)].forEach(x => { T(x).st = "bless"; T(x).own = 0; });
 const pops = [];
 for (let y = 0; y < 9; y++) { FG.worldTick(FG.snapshot()); pops.push(Math.round(T(K(4, 4)).set.pop)); }
 ok("a besieged place cannot plough its way out of the ring", T(K(4, 4)).set.own === 0,
    `still theirs after nine years: ${pops.join(" ")}`);
 ok("a forbidden city empties toward Dunbar", pops[pops.length - 1] < 200, pops.join(" -> "));
 ok("and the people who leave walk back to their own",
    Math.round(T(K(9, 4)).set.pop) > 100, `their other place: ${Math.round(T(K(9, 4)).set.pop)}`);
 console.log(`  a forbidden city, year by year: ${pops.join(" · ")}`);

 // The wonder. Nothing is credited by the rule; the count is derived, so
 // silencing a taught place hands the wonder back to whoever owned it.
 blank(); settle(9, 4, 0, 900, true); settle(11, 4, 0, 300, true);
 const lostA = FG.lostCount(0);
 settle(4, 4, 0, 900, true);
 const lostB = FG.lostCount(0);
 NB[K(4, 4)].forEach(x => { T(x).st = "bless"; T(x).own = 1; });
 FG.encircleTick(); FG.encircleTick();
 ok("a third teaching costs a third wonder", lostB === lostA + 1);
 ok("and losing that place to a ring gives the wonder back", FG.lostCount(0) === lostA);

 FG.R2all(false); FG.R2built(true); FG.resetTune();
 console.log(`  ${fail === before ? "all checks passed" : (fail - before) + " failed"}`);
}

// ------------------------------------------------------- 1.19, August 2026
// The third leg, on constructed boards. Every rule in it is about a choice, and
// OP-19 recorded what that means for measurement: a greedy chooser produces
// numbers of roughly zero for rules of this shape. So the harness's job here is
// not to say whether herding is any good. It is to say that it does what it
// says — which is the job the constructed half did for 1.6 and 1.9, and which
// caught both of the things play had missed.
console.log("\nthe third leg");
{
 const before = fail;
 const {K, NB, T, ring} = FG;

 // The shipped game plus this one rule. Deliberately not `R2built(true)`: that
 // now means *everything that is built*, and 1.12 and 1.19 are both built and
 // off. R2reset is the thing that says "the game".
 function blank() {
  // 1.24 ships on, and everything below this line is the *steered* rule — the
  // acts, the ceiling, the detour out. None of it is dead: it is what the game
  // is with `roam` off, and it is the baseline the roaming version is measured
  // against. So the flag is cleared by name here, and the new rule gets its own
  // block rather than quietly rewriting the expectations in this one.
  FG.resetTune(); FG.R2reset(); FG.R2.herds = true; FG.R2.roam = false;
  FG.createGame({you: null, them: "passive", seed: 1});
  FG.G.T.forEach(t => { t.t = "plain"; t.f = 1; t.st = "wild"; t.own = null; t.set = null;
                        t.bar = 0; t.kur = null; });
  FG.G.stones = [[], []]; FG.G.armies = []; FG.G.refugees = []; FG.G.herds = []; FG.G.log = [];
  FG.G.p[0].pos = K(4, 4); FG.G.p[1].pos = K(12, 4);
 }
 const settle = (c, r, who, pop, taught) => {
  const t = T(K(c, r));
  t.set = FG.newSet(pop, who); t.set.taught = !!taught; t.st = "wild"; t.own = null; return t;
 };
 const furrow = (c, r, who) => { const t = T(K(c, r)); t.st = "reck"; t.own = who; return t; };
 const put = (c, r, who, n) => {
  const h = {at: K(c, r), to: K(c, r), n, own: who, kill: false, held: 0};
  FG.G.herds.push(h); return h;
 };

 // --- availability is a condition, not a clock --------------------------
 blank(); settle(4, 4, 0, 100);
 ok("with no plough anywhere, herding is not on offer", FG.teachTargets("herd", 0).length === 0);
 furrow(9, 4, 1);
 ok("once somebody has broken ground, it is", FG.teachTargets("herd", 0).includes(K(4, 4)));
 settle(6, 6, 0, 100, true);
 ok("a people already shown the plough may not be taught to herd",
    !FG.teachTargets("herd", 0).includes(K(6, 6)));
 blank(); settle(4, 4, 0, 100); furrow(9, 4, 1); T(K(4, 4)).set.tabu = true;
 ok("nor may a forbidden place, which is forbidden both things",
    FG.teachTargets("herd", 0).length === 0);

 // --- what the teaching costs, and what it does not ---------------------
 blank(); settle(4, 4, 0, 300); furrow(9, 4, 1);
 const wonderBefore = FG.lostCount(0), scoreBefore = FG.score()[0].tot;
 FG.doIntervene("herd", K(4, 4), 0);
 ok("the settlement leaves the board", T(K(4, 4)).set === null);
 ok("and a herd stands where it was", FG.G.herds.length === 1 && FG.G.herds[0].at === K(4, 4));
 ok("it costs no wonder", FG.lostCount(0) === wonderBefore);
 ok("it costs the three points the place was worth", FG.score()[0].tot === scoreBefore - 3);
 ok("and a herd is worth nothing at all while it roams", FG.score()[0].tot === 0);

 // --- they move like their god, not like an army ------------------------
 blank(); const h1 = put(4, 4, 0, 60); h1.to = K(8, 4);
 FG.herdTick();
 ok("a herd walks one tile a year", h1.at !== K(4, 4) && NB[K(4, 4)].includes(h1.at));

 blank(); put(4, 4, 0, 60);
 NB[K(4, 4)].forEach(x => { T(x).st = "bless"; T(x).own = 1; });
 ok("the other power's blessing is closed country", FG.herdStep(K(4, 4), K(8, 4), 0) === undefined);
 NB[K(4, 4)].forEach(x => { T(x).own = 0; });
 ok("their own god's blessing never shuts them in", FG.herdStep(K(4, 4), K(8, 4), 0) !== undefined);

 blank(); put(4, 4, 0, 60); settle(5, 4, 1, 100);
 ok("a herd may not walk onto a town", FG.herdBlocked(K(5, 4), 0) && !FG.herdBlocked(K(6, 4), 0));
 blank(); put(4, 4, 0, 60); furrow(5, 4, 1);
 ok("farmland is wide open, which is the point", !FG.herdBlocked(K(5, 4), 0));

 // --- grazing ------------------------------------------------------------
 blank(); const h2 = put(4, 4, 0, 60); h2.to = K(5, 4); furrow(5, 4, 1);
 FG.herdTick();
 ok("they walk onto the furrows and take them", h2.at === K(5, 4) && T(K(5, 4)).st === "wild");
 ok("the ground goes back to wild, not over to you", T(K(5, 4)).own === null);
 ok("and it will not take a furrow for three years", FG.barren(T(K(5, 4))));

 blank(); settle(4, 4, 0, 400, true); T(K(5, 4)).bar = FG.G.turn + 3;
 T(K(4, 4)).set.spent = 0;
 for (let i = 0; i < 3; i++) FG.worldTick();
 ok("a settlement will not plough barren ground", T(K(5, 4)).st !== "reck");
 ok("and being refused does not spend its lifetime budget",
    T(K(4, 4)).set.spent <= 3, `spent ${T(K(4, 4)).set.spent}`);

 blank(); settle(4, 4, 0, 400, true); T(K(5, 4)).bar = FG.G.turn + 3;
 ok("nor may a Clearance be aimed at it", !FG.targets("clear", 0).includes(K(5, 4)));

 // --- what the grass carries --------------------------------------------
 blank(); const h3 = put(4, 4, 0, 300);
 for (let i = 0; i < 15; i++) FG.herdTick();
 ok("a herd falls back to the Seventy-Seven", h3.n > 60 && h3.n < 90, `carried ${Math.round(h3.n)}`);
 blank(); const h4 = put(4, 4, 0, 20);
 for (let i = 0; i < 15; i++) FG.herdTick();
 ok("and a small one grows up to it", h4.n > 60 && h4.n < 90, `carried ${Math.round(h4.n)}`);

 // --- stopping, which is the answer to the third-door objection ----------
 blank(); const h5 = put(4, 4, 0, 70); FG.G.p[0].pos = K(4, 4);
 ok("a herd may stop on open ground", FG.canStop(h5));
 FG.doAct("stop", 0);
 ok("and comes back as a settlement", !!T(K(4, 4)).set && FG.G.herds.length === 0);
 ok("untaught, standing at the fork it walked away from", T(K(4, 4)).set.taught === false);

 blank(); const h6 = put(4, 4, 0, 70); settle(5, 4, 0, 100);
 ok("it may not stop beside another settlement", !FG.canStop(h6));

 // The bug a played game found in year 32 of seed 7, and the reason foundBlock
 // grew a fourth argument: the greedy chooser dropped a colony onto a camp.
 blank(); put(4, 4, 0, 70); ring(K(4, 4), 2).forEach(x => { T(x).st = "bless"; T(x).own = 0; });
 ok("nobody may found a settlement on a camp", !FG.canFound(K(4, 4), 0));
 ok("nor send a colony onto one", !FG.canFound(K(4, 4), 0, true));
 ok("but the herd itself may still stop there", FG.canStop(FG.G.herds[0]));
 FG.G.p[0].pos = K(4, 4);
 ok("and no wonder may be dropped on a camp either",
    !FG.targets("drown", 0).includes(K(4, 4)) && !FG.targets("mountains", 0).includes(K(4, 4)));

 // --- kurgans ------------------------------------------------------------
 blank(); FG.G.stones[0] = [K(4, 4)]; furrow(4, 4, 1);
 const h7 = put(4, 4, 0, 100); FG.G.p[0].pos = K(4, 4);
 ok("a stone that has gone under the plough may be mounded", FG.canMound(h7));
 FG.doAct("mound", 0);
 ok("the mound stands", T(K(4, 4)).kur === 0 && FG.moundCount(0) === 1);
 ok("the ground is still farmland, and still theirs",
    T(K(4, 4)).st === "reck" && T(K(4, 4)).own === 1);
 ok("it cost a fifth of them", Math.round(h7.n) === 80, `left ${Math.round(h7.n)}`);
 ok("a mound never becomes a working stone", FG.working(0).length === 0);
 ok("and never touches the wonder brake", FG.lostCount(0) === 0);
 ok("one grave to a stone", !FG.canMound(h7));

 blank(); FG.G.stones[0] = [K(4, 4)];
 ring(K(4, 4), 2).forEach(x => { T(x).st = "bless"; T(x).own = 0; });
 ok("a stone that still answers is not a grave", !FG.canMound(put(4, 4, 0, 100)));
 blank(); FG.G.stones[1] = [K(4, 4)]; furrow(4, 4, 1);
 ok("and a people bury their own god's stone, not the other one's",
    !FG.canMound(put(4, 4, 0, 100)));

 // --- with the flag off, none of it exists -------------------------------
 blank(); FG.R2.herds = false;
 settle(4, 4, 0, 100); furrow(9, 4, 1);
 ok("flag off: nothing may be taught to herd", FG.teachTargets("herd", 0).length === 0);
 const h8 = put(6, 6, 0, 60); h8.to = K(8, 6);
 FG.herdTick();
 ok("flag off: a herd left in state does not move", h8.at === K(6, 6));

 FG.R2reset(); FG.resetTune();
 console.log(`  ${fail === before ? "all checks passed" : (fail - before) + " failed"}`);
}

// ------------------------------------------- 1.20 / 1.21 / 1.22 / 1.23, August 2026
// Four rules, on constructed boards, for the reason the last two batches were
// checked this way: three of them turn on a predicate the rest of the engine
// reads, and the fourth takes a whole seat out of the game. The register's fifth
// rule is that the legality test and the thing that actually mutates the board
// are written twice in this engine and they drift, so both halves are asserted
// here rather than the one that is easier to reach.
console.log("\nstones that grow, orders that carry, and the bottom of the stock");
{
 const before = fail;
 const {K, NB, T, ring} = FG;

 function blank() {
  FG.resetTune(); FG.R2reset();
  FG.createGame({you: null, them: "passive", seed: 1});
  FG.G.T.forEach(t => { t.t = "plain"; t.f = 1; t.st = "wild"; t.own = null; t.set = null;
                        t.bar = 0; t.kur = null; t.crs = 0; });
  FG.G.stones = [[], []]; FG.G.armies = []; FG.G.refugees = []; FG.G.herds = []; FG.G.log = [];
  FG.G.p[0].pos = K(4, 4); FG.G.p[1].pos = K(12, 4);
 }
 const settle = (c, r, who, pop, taught) => {
  const t = T(K(c, r));
  t.set = FG.newSet(pop, who); t.set.taught = !!taught; t.st = "wild"; t.own = null; return t;
 };
 // n connected blessed tiles for `who`, grown outward from k by flood fill, so a
 // region can be built to an exact size and the working threshold tested on it.
 const blob = (k, who, n) => {
  const seen = new Set(), q = [k];
  while (q.length && seen.size < n) {
   const x = q.shift();
   if (seen.has(x) || FG.impassable(T(x)) || T(x).set) continue;
   seen.add(x); T(x).st = "bless"; T(x).own = who;
   NB[x].forEach(y => q.push(y));
  }
  return seen.size;
 };

 // --- 1.20: who adds a course, and what a course is worth -----------------
 blank();
 const sk = K(4, 4);
 blob(sk, 0, 10);
 FG.G.stones[0].push(sk);
 ok("a stone is raised unfinished", FG.courses(sk) === 0);

 // Nobody in reach: nothing happens, however many years pass. This is the check
 // that says the rule is not a timer — A-10 would be raised against it correctly
 // if it were, and *who does the adding* is the whole reason it is not in
 // rejected.md.
 for (let i = 0; i < 5; i++) FG.growTick();
 ok("a stone with nobody near it never grows", FG.courses(sk) === 0, "got " + FG.courses(sk));

 // A taught settlement in reach is not audible and does not build. This is the
 // thesis inside one object: teach that band to till and the stone stops.
 const tt = settle(5, 4, 0, 40, true);
 for (let i = 0; i < 5; i++) FG.growTick();
 ok("a taught settlement does not add a course", FG.courses(sk) === 0, "got " + FG.courses(sk));

 // Untaught and under the Seventy-Seven: it builds, one course a year, to the cap.
 tt.set.taught = false;
 FG.growTick();
 ok("an audible band adds a course", FG.courses(sk) === 1, "got " + FG.courses(sk));
 for (let i = 0; i < 10; i++) FG.growTick();
 ok("and stops at the cap", FG.courses(sk) === FG.R2TUNE.courses, "got " + FG.courses(sk));

 // Over the Seventy-Seven it stops, without anything being taught at all — the
 // same line 1.5 reads, which is why they share `FG.audible`.
 blank(); blob(sk, 0, 10); FG.G.stones[0].push(sk);
 settle(5, 4, 0, 120, false);
 for (let i = 0; i < 4; i++) FG.growTick();
 ok("past seventy-seven they stop building", FG.courses(sk) === 0, "got " + FG.courses(sk));

 // A herd is the audible band walking, and builds like one. This is the answer to
 // *a herd with nothing left to graze has no behaviour*, and it is the reason the
 // rule reads herds at all.
 blank(); blob(sk, 0, 10); FG.G.stones[0].push(sk);
 FG.G.herds.push({at: K(5, 4), to: K(5, 4), n: 60, own: 0, kill: false, held: 0});
 FG.growTick();
 ok("a herd in reach builds the stone", FG.courses(sk) === 1, "got " + FG.courses(sk));

 // What a course buys: the working threshold, and nothing else.
 blank(); FG.G.stones[0].push(sk);
 blob(sk, 0, 4);
 ok("four tiles is not enough for a new stone", !FG.stoneWorks(sk, 0));
 T(sk).crs = 2;
 ok("but is enough for one with two courses", FG.stoneWorks(sk, 0));
 T(sk).crs = 3;
 blob(sk, 0, 0);
 ok("three courses never goes below three tiles", FG.stoneNeed(sk) === 3, "got " + FG.stoneNeed(sk));

 // And the thing it must not buy. `lost = taught - workingStones`, and a stone
 // kept working by its courses may not subtract there. Two settlements taught, one
 // stone standing on four tiles with two courses: the augmented count says it
 // works, the brake must not.
 blank();
 FG.G.stones[0].push(sk); blob(sk, 0, 4); T(sk).crs = 2;
 settle(8, 2, 0, 200, true); settle(10, 6, 0, 200, true);
 ok("the courses keep the stone working", FG.working(0).length === 1);
 ok("and the wonder brake cannot see them",
    FG.workingStrict(0).length === 0 && FG.lostCount(0) === 2, "lost " + FG.lostCount(0));

 // A stone under farmland is not saved by anything, which is OP-16's 92% and is
 // the thesis rather than a defect. Its own tile is not blessed, so its region is
 // empty, so three courses leave it silent.
 T(sk).st = "reck"; T(sk).own = 1;
 ok("farmland silences a grown stone all the same", !FG.stoneWorks(sk, 0));

 // --- 1.21: a stone that has gone quiet still carries orders --------------
 blank();
 // A silent stone of yours, far from anything, with a settlement big enough to
 // order a clearance beside it and the token nowhere near either.
 const dk = K(9, 4);
 FG.G.stones[0].push(dk);
 ok("a stone standing in nothing is not working", !FG.stoneWorks(dk, 0));
 ok("and is therefore a relay", FG.deadStones(0).length === 1);
 const src = settle(9, 5, 0, 400, true);
 FG.G.p[0].pos = K(1, 1);
 const tgt = ring(K(9, 5), 2).filter(x => x !== dk && !T(x).set && !FG.impassable(T(x)))[0];
 ok("a work aimed by a relay costs nothing", !FG.tolled("clear", tgt, 0));
 FG.R2.deadOrders = false;
 ok("and costs a piece of you without the rule", FG.tolled("clear", tgt, 0));
 FG.R2.deadOrders = true;

 // Only the works. A dead stone relays no wonder and teaches nobody: presence is
 // still presence, and that sentence is the whole rule.
 ok("a relay does not carry a teaching", FG.tolled("till", K(9, 5), 0));
 ok("and does not extend where a wonder may be aimed", !FG.divineReach(0).has(tgt));

 // A mound closes the relay for good, which is what gives raising one a cost.
 T(dk).kur = 0;
 ok("a kurgan is memory and not a command post", FG.deadStones(0).length === 0);
 ok("so the order is charged again", FG.tolled("clear", tgt, 0));

 // --- 1.22: the wild folk found the place --------------------------------
 blank();
 const fk = K(6, 4);
 // Nothing blessed round it: the floor. (Founding is illegal here, which does not
 // matter — this is the population rule and not the legality one.)
 ok("a founding with nothing round it is the floor",
    FG.foundPop(fk, 0) === FG.R2TUNE.foundLow, "got " + FG.foundPop(fk, 0));
 // The whole second ring blessed: the ceiling.
 ring(fk, 2).forEach(x => { if (x !== fk) { T(x).st = "bless"; T(x).own = 0; } });
 ok("and one in the middle of a country is the ceiling",
    FG.foundPop(fk, 0) === FG.R2TUNE.foundHigh, "got " + FG.foundPop(fk, 0));
 ok("their blessing is not yours", FG.foundPop(fk, 1) === FG.R2TUNE.foundLow);

 // The coastal discount, which is the whole reason the denominator is a full ring
 // rather than the tiles that happen to exist. Drown half the second ring and the
 // founding must come down, because water cannot be blessed and is still counted.
 const r2 = ring(fk, 2).filter(x => x !== fk);
 const full = FG.foundPop(fk, 0);
 r2.slice(0, Math.floor(r2.length / 2)).forEach(x => { T(x).t = "water"; T(x).st = "wild"; T(x).own = null; });
 ok("water in the ring founds a smaller place", FG.foundPop(fk, 0) < full,
    full + " -> " + FG.foundPop(fk, 0));
 ok("and never below the floor", FG.foundPop(fk, 0) >= FG.R2TUNE.foundLow);

 // The act writes what the rule says, which is the half that drifts.
 blank();
 ring(fk, 2).forEach(x => { if (x !== fk) { T(x).st = "bless"; T(x).own = 0; } });
 T(fk).st = "bless"; T(fk).own = 0;
 FG.G.p[0].pos = fk;
 const want = FG.foundPop(fk, 0);
 ok("found is legal here", FG.canFound(fk, 0), FG.foundBlock(fk, 0));
 FG.doAct("found", 0);
 ok("and the settlement is the size the country said",
    T(fk).set && T(fk).set.pop === want, T(fk).set ? T(fk).set.pop + " vs " + want : "no settlement");

 // A colony is a work of the settled and keeps its forty; a splinter is half its
 // parent. Only Found reads the wild folk.
 ok("the rule does not reach a colony", FG.newSet(40, 0).pop === 40);

 // --- 1.23: the bottom of the stock ---------------------------------------
 blank();
 FG.G.p[0].pos = K(4, 4);
 T(K(4, 4)).st = "bless"; T(K(4, 4)).own = 0;
 NB[K(4, 4)].forEach(x => { T(x).st = "wild"; T(x).own = null; });
 ok("a whole god has three tiles of movement", FG.manifestMp(0) === 3);
 FG.G.p[0].body = 0.5;
 ok("two thirds gone is two", FG.manifestMp(0) === 2, "got " + FG.manifestMp(0));
 FG.G.p[0].body = 0.2;
 ok("a fifth left is one", FG.manifestMp(0) === 1, "got " + FG.manifestMp(0));
 FG.G.p[0].body = 0;
 ok("and nothing left is none", FG.manifestMp(0) === 0, "got " + FG.manifestMp(0));
 ok("there is nowhere to walk", Object.keys(FG.reach(0)).length === 1);
 ok("no act is possible", FG.doAct("bless", 0) === false);
 ok("and no intervention either", FG.doIntervene("quicken", K(4, 4), 0) === false);

 // The floating point, which is not fussiness: `body` is decremented by a tenth
 // ten times and comes out of that at -2e-17 before the clamp. A strict `<= 0`
 // would be a coin toss on the last spend of a forty-year game.
 FG.G.p[0].body = 1;
 for (let i = 0; i < 10; i++) FG.G.p[0].body = Math.max(0, FG.G.p[0].body - FG.R2TUNE.dreamToll);
 ok("ten tolls is exactly nothing left", FG.spent(0), "body " + FG.G.p[0].body);

 // The year still turns. This is the half that makes it a rule about a god rather
 // than a game over: the world goes on, and the score with it.
 blank();
 FG.G.p[0].body = 0;
 settle(4, 4, 0, 60, false);
 const s0 = FG.score()[0].tot;
 FG.aiTurn(0);                     // a doctrine with nothing left takes no turn
 FG.worldTick(FG.snapshot());
 ok("the year still turns with nothing left of you", FG.G.turn === 2);
 ok("and the score still moves", FG.score()[0].tot >= s0);

 // And the rival fades on the same terms.
 blank();
 FG.G.p[1].body = 0;
 ok("the other one can be spent too", FG.spent(1) && FG.manifestMp(1) === 0);

 FG.R2reset(); FG.resetTune();
 console.log(`  ${fail === before ? "all checks passed" : (fail - before) + " failed"}`);
}

// ------------------------------------------------- the A/B baseline, exact
// The one thing that must never move. FG.R2all(false) plays the pre-batch game,
// and a rule added to the batch must not be able to reach it.
console.log("\nand then the hand comes off");
{
 const before = fail;
 const {K, NB, T, ring} = FG;
 function blank() {
  FG.resetTune(); FG.R2reset(); FG.R2.herds = true; FG.R2.roam = true;
  FG.createGame({you: null, them: "passive", seed: 1});
  FG.G.T.forEach(t => { t.t = "plain"; t.f = 1; t.st = "wild"; t.own = null; t.set = null;
                        t.bar = 0; t.kur = null; });
  FG.G.stones = [[], []]; FG.G.armies = []; FG.G.refugees = []; FG.G.herds = []; FG.G.log = [];
  FG.G.p[0].pos = K(4, 4); FG.G.p[1].pos = K(12, 4);
 }
 const settle = (c, r, who, pop, taught) => {
  const t = T(K(c, r));
  t.set = FG.newSet(pop, who); t.set.taught = !!taught; t.st = "wild"; t.own = null; return t;
 };
 const furrow = (c, r, who) => { const t = T(K(c, r)); t.st = "reck"; t.own = who; return t; };
 const put = (c, r, who, n) => {
  const h = {at: K(c, r), to: K(c, r), n, own: who, kill: false, held: 0};
  FG.G.herds.push(h); return h;
 };

 // --- what they walk at, which is the whole of the autonomy -------------
 blank(); const a1 = put(4, 4, 0, 60); furrow(5, 4, 0); furrow(8, 4, 1);
 ok("they walk at the adversary's furrows and not at their own god's",
    FG.herdAim(a1) === K(8, 4));

 blank(); const a2 = put(4, 4, 0, 60); settle(8, 4, 1, 200);
 const aim2 = FG.herdAim(a2);
 ok("with no furrows anywhere they go to look for people instead",
    aim2 !== null && ring(K(8, 4), 1).includes(aim2));
 ok("and never onto the town itself", aim2 !== K(8, 4));

 blank(); const a3 = put(4, 4, 0, 60);
 ok("nothing of theirs in reach at all is nothing to aim at", FG.herdAim(a3) === null);

 blank(); const a4 = put(4, 4, 0, 60); furrow(8, 4, 1);
 ring(K(4, 4), 1).forEach(x => { T(x).st = "bless"; T(x).own = 1; });
 ok("a rival's blessing still shuts them in, which is the counterplay",
    FG.herdAim(a4) === null);

 // --- and what happens when there is nothing left -----------------------
 blank(); put(4, 4, 0, 90);
 FG.herdTick();
 const box = T(K(4, 4)).set;
 ok("boxed in, they put the roofs back up", !!box && FG.G.herds.length === 0);
 ok("and it is still yours", box.own === 0);
 ok("and they come back **taught**, which is the whole cost of the door",
    box.taught === true);

 // --- the grass, unchanged -----------------------------------------------
 blank(); const g1 = put(4, 4, 0, 60); furrow(5, 4, 1);
 FG.herdTick();
 ok("they walk onto the furrows and take them",
    g1.at === K(5, 4) && T(K(5, 4)).st === "wild" && T(K(5, 4)).own === null);
 ok("and it will not take a furrow for three years", FG.barren(T(K(5, 4))));

 // --- the mound, free and automatic --------------------------------------
 blank(); FG.G.stones[0] = [K(5, 4)]; furrow(8, 4, 1);
 const m1 = put(4, 4, 0, 100);
 FG.herdTick();
 ok("a silent stone of their own, walked over, is a mound",
    m1.at === K(5, 4) && T(K(5, 4)).kur === 0 && FG.moundCount(0) === 1);
 ok("a mound never becomes a working stone", FG.working(0).length === 0);
 ok("and never touches the wonder brake", FG.lostCount(0) === 0);
 // Against a control rather than against a number, because the grass takes its
 // cut either way and the claim is about the *mound*: 1.19 charged a fifth of
 // the band and the whole year for this, and 1.24 charges neither. A band that
 // buried a stone must end the year exactly where a band that merely walked the
 // same road ends it.
 blank(); furrow(8, 4, 1);
 const m0 = put(4, 4, 0, 100);
 FG.herdTick();
 ok("and it costs them nothing now — no act, no fifth, no year",
    Math.abs(m1.n - m0.n) < 0.0001,
    `buried ${m1.n.toFixed(2)}, walked ${m0.n.toFixed(2)}`);

 blank(); FG.G.stones[0] = [K(5, 4)];
 ok("no field is needed under it any more", FG.buryable(K(5, 4), 0));
 ring(K(5, 4), 2).forEach(x => { T(x).st = "bless"; T(x).own = 0; });
 ok("but a stone that still answers is not a grave", !FG.buryable(K(5, 4), 0));
 blank(); FG.G.stones[1] = [K(5, 4)];
 ok("and they bury their own god's stone, never the other one's",
    !FG.buryable(K(5, 4), 0));
 blank(); FG.G.stones[0] = [K(5, 4)]; T(K(5, 4)).kur = 0;
 ok("one grave to a stone", !FG.buryable(K(5, 4), 0));

 // --- absorption ---------------------------------------------------------
 blank(); const b1 = put(4, 4, 0, 60); const town = settle(6, 4, 1, 1000);
 FG.herdTick();
 ok("they take people off a town of theirs they have come up beside",
    town.set.pop < 1000 && b1.n > 60);
 ok("and never more than the cap, however large the town",
    Math.round(1000 - town.set.pop) === FG.R2TUNE.absCap,
    `took ${Math.round(1000 - town.set.pop)}`);

 blank(); const b2 = put(4, 4, 0, 60); const mine2 = settle(5, 4, 0, 1000);
 FG.herdTick();
 ok("they never take from their own", mine2.set.pop === 1000);

 blank(); put(4, 4, 0, 60); const small = settle(5, 4, 1, FG.R2TUNE.absFloor);
 FG.herdTick();
 ok("and a town at the floor is drained no further, not to nothing",
    small.set.pop === FG.R2TUNE.absFloor);

 // --- the fuse -----------------------------------------------------------
 blank(); const f1 = put(4, 4, 0, 200); furrow(9, 4, 1);
 FG.herdTick();
 ok("above the fuse, half go over the rise", FG.G.herds.length === 2);
 ok("and the two halves are halves",
    Math.abs(FG.G.herds[0].n - FG.G.herds[1].n) < 0.001 && f1.n < 110);
 ok("the child inherits the other teaching and nothing else",
    FG.G.herds[1].own === 0 && FG.G.herds[1].kill === f1.kill);

 blank(); furrow(9, 4, 1);
 for (let i = 0; i < FG.R2TUNE.bands; i++) put(4 + i, 6, 0, 200);
 FG.herdTick();
 ok("and never past the cap, or forty years is a great many doublings",
    FG.G.herds.filter(h => h.own === 0).length === FG.R2TUNE.bands);

 // --- the three handles are gone ----------------------------------------
 blank(); const x1 = put(4, 4, 0, 70); FG.G.p[0].pos = K(4, 4);
 ok("you may not stop them", FG.doAct("stop", 0) === false && FG.G.herds.length === 1);
 FG.G.stones[0] = [K(4, 4)]; furrow(4, 4, 1);
 ok("you may not raise the mound yourself either",
    FG.doAct("mound", 0) === false && T(K(4, 4)).kur === null);
 ok("and the herd is still standing there, not listening", FG.G.herds[0] === x1);

 // --- both seats play it the same way, which is the point ---------------
 blank(); const s0 = put(4, 4, 0, 60), s1 = put(10, 4, 1, 60);
 furrow(6, 4, 1); furrow(8, 4, 0);
 ok("the rival's bands aim by the same rule as yours",
    FG.herdAim(s0) === K(6, 4) && FG.herdAim(s1) === K(8, 4));

 // --- with the flag off, the steered rule is exactly as it was ----------
 blank(); FG.R2.roam = false;
 const o1 = put(4, 4, 0, 70); FG.G.p[0].pos = K(4, 4);
 ok("flag off: stopping works again", FG.canStop(o1) && FG.doAct("stop", 0) === true);
 ok("and comes back untaught, standing at the same fork",
    T(K(4, 4)).set.taught === false);

 console.log(`  ${fail === before ? "all checks passed" : (fail - before) + " failed"}`);
}

console.log("\nthe baseline is still exact");
{
 const before = fail;
 const play = (you, them, seed) => {
  FG.resetTune(); FG.createGame({you, them, seed});
  for (let y = 0; y < 40; y++) { FG.aiTurn(0); if (FG.endYear()) break; }
  const s = FG.score(); return s[0].tot + ":" + s[1].tot;
 };
 // Frozen the day 1.6, 1.8 and 1.9 went in, against the engine as it stood
 // before them. If one of these moves, a new rule is reading state it should
 // not, whatever its flag says.
 const OLD = ["55:94", "52:105", "66:116", "71:80", "41:103", "48:124", "34:107", "99:110"];
 FG.R2all(false);
 for (let s = 0; s < OLD.length; s++)
  ok("the old game is unchanged, seed " + s, play("bands", "cities", s) === OLD[s],
     `got ${play("bands", "cities", s)}, want ${OLD[s]}`);

 // 1.19. And the *current* game, frozen the day the third leg went in.
 //
 // This one is new and it is here because the old fingerprint above stopped
 // being enough. It only ever asserted that a new rule cannot reach the
 // pre-batch game — which is a claim about `R2all(false)`, and 1.12 and 1.19
 // ship off, so a rule of theirs that leaked would leak into the game people
 // actually play and this file would not have noticed. `R2reset()` is the game.
 //
 // Re-frozen 25 August 2026, when 1.20-1.23 went in and `herds` and `barren3`
 // came on. Seeds 1, 2, 3 and 4 did not move, which is worth noticing rather
 // than passing over: four of eight games are unchanged to the point, so the
 // batch is not a wash over the whole board — it changes the games where its
 // rules actually come up.
 //
 // Re-frozen again the same day for **A-31**, the furrow guard in `ai.js`. No
 // rule changed; the chooser stopped walking into ploughed ground. The same four
 // seeds moved and the same four did not, and **every one that moved moved the
 // same way** — 117 to 126, 34 to 60, 77 to 94, 50 to 104. That is seat 1 no
 // longer spending itself to nothing, and it is the whole of the change. The
 // baseline array above did not move at all, which is the point: `fade` is off
 // under `R2all(false)`, so the guard cannot reach the pre-batch game by
 // construction rather than by luck.
 const NOW = ["21:126", "75:144", "114:126", "120:123", "42:165", "129:60", "72:94", "57:104"];
 FG.R2reset();
 for (let s = 0; s < NOW.length; s++)
  ok("the shipped game is unchanged, seed " + s, play("bands", "cities", s) === NOW[s],
     `got ${play("bands", "cities", s)}, want ${NOW[s]}`);

 // 1.24. And a third fingerprint, because the two above are blind to this rule.
 //
 // Worth stating plainly rather than discovering later: `bands` and `cities` are
 // the doctrines both arrays are frozen on, and **neither of them ever teaches
 // herding** — `storm` is the only chooser with a herd weight. So the shipped
 // fingerprint did not move by one point when the third leg came off its leash,
 // and it could not have. A rule needs a fingerprint played by somebody who uses
 // it or the check is decoration.
 //
 // Three of these eight seeds move and five do not, which is the same shape the
 // batch fingerprints have: the rule changes the games where it comes up. Seed 0
 // is the one to look at — 90:71 becomes 49:122, the largest single-rule swing
 // in the file, and it is a game where the bands walked and then settled.
 const ROAM = ["49:122", "72:94", "90:72", "120:108", "132:84", "64:67", "55:92", "126:105"];
 FG.R2reset();
 for (let s = 0; s < ROAM.length; s++)
  ok("the roaming game is unchanged, seed " + s, play("storm", "cities", s) === ROAM[s],
     `got ${play("storm", "cities", s)}, want ${ROAM[s]}`);

 const STEERED = ["90:71", "72:94", "90:72", "120:108", "132:84", "75:107", "66:85", "126:105"];
 FG.R2reset(); FG.R2.roam = false;
 for (let s = 0; s < STEERED.length; s++)
  ok("and the steered game underneath it, seed " + s, play("storm", "cities", s) === STEERED[s],
     `got ${play("storm", "cities", s)}, want ${STEERED[s]}`);

 FG.R2all(false); FG.R2built(true); FG.resetTune();
 console.log(`  ${fail === before ? "all checks passed" : (fail - before) + " failed"}`);
}

// ------------------------------------------------------------------- UI
console.log("\nthe build, in a real DOM");
const before = fail;
try {
 const {JSDOM} = require("jsdom");
 const file = path.join(__dirname, "..", "game", "index.html");
 const dom = new JSDOM(fs.readFileSync(file, "utf8"), {
  runScripts: "dangerously",
  resources: undefined,
  url: "file://" + file.replace(/\\/g, "/"),
  beforeParse(win) {
   // jsdom will not fetch the sibling <script src> files itself, so hand it
   // the same files in the same order the browser would use.
   const dir = path.join(__dirname, "..");
   const load = p => win.eval(fs.readFileSync(path.join(dir, p), "utf8"));
   win.__load = load;
  }
 });

 const win = dom.window;
 ["engine/constants.js", "engine/hex.js", "engine/map.js", "engine/state.js",
  "engine/rules.js", "engine/actions.js", "engine/tick.js", "engine/ai.js",
  "game/ui.js"].forEach(p => win.__load(p));

 const doc = win.document;
 ok("engine reached the page", !!win.FG && !!win.FG.G);
 ok("map drew some hexes", doc.querySelectorAll(".hx").length > 60,
    `${doc.querySelectorAll(".hx").length} hexes`);
 ok("the year is shown", /year/i.test(doc.getElementById("bar").textContent));
 ok("wonders are listed", doc.getElementById("divine").children.length === 6);
 ok("works are listed", doc.getElementById("civic").children.length === 3);
 ok("knobs were built", doc.getElementById("tune").querySelectorAll("input[type=range]").length === 11);

 // play it through the buttons, exactly as a person would
 const startTotal = win.FG.score().reduce((a, s) => a + s.tot, 0);
 for (let y = 0; y < 40; y++) {
  const bless = doc.getElementById("bless");
  if (!bless.disabled) bless.click();
  else doc.getElementById("pass").click();
  const end = doc.getElementById("end");
  if (end.disabled) break;
  end.click();
 }
 ok("a full game plays through the interface", win.FG.G.over,
    `stopped at year ${win.FG.G.turn}`);
 ok("the ending panel was written", /you hold more|they hold more|level/.test(doc.getElementById("done").textContent));
 // Deliberately about the board rather than your seat: on an unlucky map you
 // can be walled in from year one and score nothing, which is a legitimate
 // game and not a broken interface.
 ok("the board filled in", win.FG.score().reduce((a, s) => a + s.tot, 0) > startTotal);
 ok("the chronicle was written", win.FG.G.log.length > 20);

 // restarting gives a fresh game
 doc.getElementById("restart").click();
 ok("restart begins a new game", win.FG.G.turn === 1 && !win.FG.G.over);
 ok("restart clears the ending panel", doc.getElementById("done").innerHTML === "");

 // --- OP-23: the interventions, as a row under the board -----------------
 // The row is what is being checked here, not the list. Everything keeps its
 // place in it — a lost wonder struck through, a work that has not opened dim —
 // because the row emptying from the left as wonders go and filling from the
 // right as works open is what tells the arc. A tidy-up that started dropping
 // chips it thought were useless would still look perfectly fine on screen and
 // would have thrown that away, so it is asserted rather than trusted.
 const $$ = id => doc.getElementById(id);
 const chips = id => Array.prototype.slice.call($$(id).children);

 // The batch is on by default as of the 1.16 commit, so the teachings are on the
 // page from the first frame. The assertion that matters is the same one it
 // always was — the row follows the rule — so it is checked in both directions
 // here rather than deleted, and the both-directions version is further down.
 //
 // **Three, since August 2026.** `herds` ships on now, so the third teaching is
 // in the row from the first frame like the other two. This number moving is the
 // correct failure for that change to have caused, and it is worth leaving the
 // arithmetic visible: it is `FG.TEACH` less the ones whose rule is off.
 ok("the teachings are there with the batch on", chips("teach").length === 3,
    "got " + chips("teach").length);
 ok("the works begin locked", chips("civic").every(c => c.classList.contains("off")));
 // 1.18. The works now open on teachings, so the locked reason has to say so —
 // and it is read from FG.civicNeed(), so this check fails if the interface and
 // the rule ever start naming different things.
 ok("a locked work says what it needs", /taught to till/.test(chips("civic")[0].dataset.why),
    chips("civic")[0].dataset.why);

 // Off by class and not by the disabled attribute, deliberately: a disabled
 // button fires no pointer events, and a chip you cannot use still has to
 // answer when you press it rather than refusing in silence.
 chips("civic")[0].click();
 ok("pressing a locked chip does not arm it", !doc.querySelector(".chip.on"));
 ok("pressing a locked chip explains itself", /taught to till/.test($$("hint").textContent),
    $$("hint").textContent);

 const live = chips("divine").filter(c => !c.classList.contains("off"))[0];
 ok("some wonder can be called in year one", !!live);
 live.click();
 ok("arming marks exactly one chip", doc.querySelectorAll(".chip.on").length === 1);
 // A row has no room for the descriptions and a tablet has no hover, so arming
 // is where the description has to arrive — before the target is chosen and the
 // year is spent. If this check fails, the chips are unreadable on an iPad.
 ok("the armed hint carries the description as well as the instruction",
    $$("hint").textContent.length > 60 && /outlined tile/.test($$("hint").textContent),
    $$("hint").textContent);
 live.click();
 ok("pressing it again puts it down", doc.querySelectorAll(".chip.on").length === 0);

 const resting = $$("hint").textContent;
 live.onmouseenter();
 ok("hover borrows the hint line",
    $$("hint").textContent === win.FG.DIVINE.filter(s => s.id === live.dataset.iv)[0].d);
 live.onmouseleave();
 ok("and gives it back", $$("hint").textContent === resting);

 win.FG.R2all(false); win.FG.R2.teaching = true; win.FG.R2.logistic = true;
 $$("restart").click();
 ok("the teachings appear with the rule",
    chips("teach").length === 2 && $$("rowteach").style.display === "");
 win.FG.R2all(false);
 $$("restart").click();
 ok("and go away with it",
    chips("teach").length === 0 && $$("rowteach").style.display === "none");

 // --- 1.19: the third leg in the interface -------------------------------
 // The row follows the rule here too, and this is the check that says so. With
 // herding off there must be two teachings and no herd buttons at all — not
 // three teachings with one permanently dark, which advertises a rule that is
 // not running, and not three dead buttons in the action row, which teaches a
 // player that the row has dead things in it.
 // `R2reset` used to be enough to get herding switched off, because the rule
 // shipped off. It ships on now, so the flag has to be cleared by name — and that
 // is the point of writing it this way rather than adjusting the expected number:
 // the check is *the row follows the rule*, in both directions, whichever
 // direction the shipped default happens to point.
 win.FG.R2reset(); win.FG.R2.herds = false;
 $$("restart").click();
 ok("herding is not in the row when its rule is off", chips("teach").length === 2,
    "got " + chips("teach").length);
 ok("and neither are its buttons", $$("drive").style.display === "none"
    && $$("stopherd").style.display === "none" && $$("mound").style.display === "none");
 win.FG.R2reset();
 $$("restart").click();
 ok("with the rule on there are three teachings", chips("teach").length === 3);
 // Nobody has ploughed in year one, so the chip must be dark — and it must give
 // the *right* reason. "None of yours is in reach" would send a player walking.
 const hc = chips("teach")[2];
 ok("the herd chip is dark before anyone has broken ground", hc.classList.contains("off"));
 ok("and says why, which is not about reach", /broken ground/.test(hc.dataset.why), hc.dataset.why);

 // The buttons come and go with what is possible here, and this is a layout
 // check as much as a teaching one: measured in a browser, nine buttons wrap
 // the action row onto a second line and the four labelled rows are the layout.
 const shown = () => ["drive", "stopherd", "mound"]
   .filter(id => $$(id).style.display !== "none").join(",");
 // 1.24 removes all three for good, so the steered row is checked with the
 // roaming flag down and the ruling gets its own check underneath.
 win.FG.R2reset(); win.FG.R2.roam = false;
 $$("restart").click();
 ok("no herd buttons before there is a herd", shown() === "", shown());
 const GH = win.FG.G, HK = GH.p[0].pos;
 // a camp somewhere the player is not standing
 const away = win.FG.NB[HK].find(x => !win.FG.impassable(win.FG.T(x)) && !win.FG.T(x).set);
 GH.herds.push({at: away, to: away, n: 60, own: 0, kill: false, held: 0});
 $$("sf").checked = !$$("sf").checked; $$("sf").onchange({target: $$("sf")});
 ok("Send appears once a people are walking", shown() === "drive", shown());
 GH.p[0].pos = away;
 $$("sf").checked = !$$("sf").checked; $$("sf").onchange({target: $$("sf")});
 ok("and Stop and Mound when you are standing on them",
    shown() === "drive,stopherd,mound", shown());
 ok("Mound is dark with no stone under the ground", $$("mound").disabled);

 win.FG.R2reset(); win.FG.R2.herds = false; win.FG.R2.roam = false;
 $$("restart").click();
 ok("and all three go away with the rule", shown() === "", shown());

 // 1.24. And with the hand off, they never come back — not even standing on
 // them. This is the rule stated in the interface: once you have said the word
 // there is no button that does anything to them again.
 win.FG.R2reset();
 $$("restart").click();
 const GR = win.FG.G, RK = GR.p[0].pos;
 const near = win.FG.NB[RK].find(x => !win.FG.impassable(win.FG.T(x)) && !win.FG.T(x).set);
 GR.herds.push({at: near, to: near, n: 60, own: 0, kill: false, held: 0});
 GR.p[0].pos = near;
 $$("sf").checked = !$$("sf").checked; $$("sf").onchange({target: $$("sf")});
 ok("roaming: no button touches them, even standing on them", shown() === "", shown());
 win.FG.R2reset();

 // --- 1.16 / 1.17: the toll is shown before it is spent ------------------
 // The whole mechanic is that it is a decision, and a decision needs the price
 // visible at the moment of choosing. A dashed outline is how the board says
 // *this one is said, not done*; if a tidy-up ever drops the dasharray the game
 // still looks right and quietly starts charging people without warning them.
 win.FG.R2built(true);
 $$("restart").click();
 const GG = win.FG.G, ME = 0;
 // put a stone in a blessed blob with a settlement out at its edge, and stand
 // the token somewhere else entirely
 const c = win.FG.K(4, 4);
 win.FG.ring(c, 2).forEach(x => { const q = win.FG.T(x);
  if (!win.FG.impassable(q)) { q.st = "bless"; q.own = ME; q.set = null; } });
 GG.stones[ME] = [c];
 const far = win.FG.ring(c, 2).filter(x => x !== c)[0];
 win.FG.T(far).set = win.FG.newSet(120, ME); win.FG.T(far).st = "wild"; win.FG.T(far).own = null;
 GG.p[ME].pos = win.FG.K(11, 7);
 GG.p[ME].cast = false;

 ok("a dream reaches a settlement you are not standing near",
    win.FG.teachTargets("till", ME).indexOf(far) >= 0);
 ok("and it is marked as costing something", win.FG.tolled("till", far, ME));

 // The chips were built by the render that ran on restart, before the board was
 // arranged above, so the teaching chip is still marked dead. Re-render without
 // restarting by poking the one control that does exactly that and nothing else
 // — the walls checkbox, left as it was found, so no state moves.
 $$("sf").checked = false; $$("sf").onchange({target: $$("sf")});

 const teachChip = chips("teach").filter(b => b.dataset.iv === "till")[0];
 teachChip.click();
 const svg = $$("map").innerHTML;
 ok("the tolled tile is outlined dashed", /stroke-dasharray/.test(svg));
 ok("and the hint names the price before the tile is chosen",
    /beyond your hearing/.test($$("hint").textContent), $$("hint").textContent);

 const body0 = GG.p[ME].body;
 win.FG.doIntervene("till", far, ME);
 ok("teaching by dream costs a tenth of you",
    Math.abs(body0 - GG.p[ME].body - win.FG.R2TUNE.dreamToll) < 1e-9,
    body0 + " -> " + GG.p[ME].body);

 // ...and the same thing in person is free, which is the half that makes it a
 // decision rather than a tax on teaching.
 win.FG.T(far).set.taught = false;
 GG.p[ME].pos = far;
 const body1 = GG.p[ME].body;
 ok("teaching in person is free", !win.FG.tolled("till", far, ME));
 win.FG.doIntervene("till", far, ME);
 ok("and takes nothing", Math.abs(body1 - GG.p[ME].body) < 1e-9);

 // The flag put back exactly restores the older, stricter rule. This is the
 // A/B baseline the whole register depends on, so it is asserted, not assumed.
 win.FG.R2.dreamTeach = false;
 win.FG.T(far).set.taught = false;
 GG.p[ME].pos = win.FG.K(11, 7);
 ok("with the flag off, teaching is in person again",
    win.FG.teachTargets("till", ME).length === 0);

 // Put the batch back where the rest of this section found it. Everything below
 // was written against the pre-batch rules and still measures them; that is on
 // purpose, and it is the only place the old game is still exercised end to end.
 win.FG.R2all(false);
 $$("restart").click();

 // A doctrine that founds, so that wonders are actually lost — a player who only
 // blesses never loses one, and the interesting assertion needs them gone.
 //
 // Seeded first, and worth knowing why: newGame() does not pass a seed, so a game
 // played through the interface runs on whatever FG.rand was left as — which is
 // Math.random in this window, because the engine section above seeds a different
 // FG. Everything in this DOM section has therefore always been a different game
 // each run. That is fine for "does it play at all" and not fine for counting, so
 // the counting part pins the seed.
 win.FG.setSeed(7);
 $$("restart").click();
 win.FG.G.p[0].doc = "cities";
 for (let y = 0; y < 40; y++) { win.FG.aiTurn(0); if ($$("end").disabled) break; $$("end").click(); }
 const lostW = win.FG.lostCount(0);
 // The row saturates: lostCount is settlements past the threshold less working
 // stones and is not clamped, so it can exceed six, and only six chips can ever
 // be struck through. divineLeft() slices, so the game is right either way.
 const struck = Math.min(lostW, win.FG.DIVINE.length);
 ok("a founding doctrine loses wonders over forty years", lostW > 0, "lost " + lostW);
 ok("the row is still six wide at the end", chips("divine").length === 6);
 ok("every lost wonder is still in the row, struck through",
    chips("divine").filter(c => c.classList.contains("gone")).length === struck,
    "lost " + lostW + ", struck " + chips("divine").filter(c => c.classList.contains("gone")).length);
 ok("and they are the first ones, in the order they go",
    chips("divine").slice(0, struck).every(c => c.classList.contains("gone")));

 // --- OP-21: two people at one board ------------------------------------
 // Driven through the same buttons, because the whole of PvP lives in the
 // interface and the engine barely knows about it. The thing being checked is
 // that the world does not move until both seats have finished.
 doc.getElementById("doc").value = "human";
 doc.getElementById("even").checked = true;
 doc.getElementById("restart").click();

 const G = () => win.FG.G, end = doc.getElementById("end");
 ok("a second person makes it a two-seat game", G().pvp === true && G().p[1].doc === null);
 ok("the turn banner is shown", doc.getElementById("turnbar").style.display === "block");
 ok("evening the map blesses one tile for the right hand",
    G().T.filter(t => t.st === "bless" && t.own === 1).length === 1);
 ok("the left hand is asked to hand over, not to end the year", /hand to the right/i.test(end.textContent));

 const y0 = G().turn, seen = new Set([doc.getElementById("turnbar").style.background]);
 doc.getElementById("bless").click();
 end.click();                                    // hand over
 seen.add(doc.getElementById("turnbar").style.background);
 ok("handing over does not move the world", G().turn === y0);
 ok("the right hand now holds the board", /end the year/i.test(end.textContent));
 ok("the banner changes colour with the seat", seen.size === 2);
 ok("the right hand has its own act to spend", G().p[1].acted === false);

 doc.getElementById("bless").click();
 ok("the right hand's act is its own", G().p[1].acted === true && G().p[0].acted === true);
 end.click();                                    // now the year turns
 ok("the year turns once both have acted", G().turn === y0 + 1);
 ok("both seats are reset for the new year",
    G().p[0].acted === false && G().p[1].acted === false
    && G().p[0].cast === false && G().p[1].cast === false);
 ok("the board comes back to the left hand", /hand to the right/i.test(end.textContent));

 // and it plays to the end, both seats, without the AI ever being asked
 for (let y = 0; y < 90; y++) {
  const b = doc.getElementById("bless");
  if (!b.disabled) b.click(); else doc.getElementById("pass").click();
  if (end.disabled) break;
  end.click();
 }
 ok("a two-player game plays out", G().over, `stopped at year ${G().turn}`);
 ok("the two-seat ending names the seats",
    /left hand|right hand/.test(doc.getElementById("done").textContent));

 console.log(`  ${fail === before ? "all checks passed" : (fail - before) + " failed"}`);
} catch (e) {
 if (/Cannot find module 'jsdom'/.test(String(e))) {
  console.log("  skipped — jsdom not installed (npm i jsdom to run the interface checks)");
 } else {
  fail++; console.log("  FAIL  the build threw: " + e.message);
 }
}

console.log(`\n${fail ? fail + " failures" : "everything passed"} (${pass} checks)\n`);
process.exit(fail ? 1 : 0);
