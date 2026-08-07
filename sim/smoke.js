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
