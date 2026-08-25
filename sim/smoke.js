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

// ------------------------------------------------- the A/B baseline, exact
// The one thing that must never move. FG.R2all(false) plays the pre-batch game,
// and a rule added to the batch must not be able to reach it.
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
 ok("the teachings are there with the batch on", chips("teach").length === 2);
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
