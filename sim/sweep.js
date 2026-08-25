// Fading Gods — a leave-one-out sweep for the 1.20–1.23 batch.
//
//   node sim/sweep.js            the table below
//
// Five doctrines against Cities, 80 games a cell, the build's own turn order —
// the convention OP-19 and OP-20 use and the commit messages quote. Plus two
// measurements the matrix has never had to take before: how often a power spends
// itself to nothing under 1.23, and what the stones did under 1.20.
const FG = require("../engine/load.js");
const {match} = require("./harness.js");

const DOCS = ["cities", "mixed", "haunt", "bands", "storm"];
const N = +(process.argv[3] || 80);

function row(label) {
 const out = [];
 for (const d of DOCS) out.push(match(d, "cities", N, {}).win);
 return label.padEnd(30) + out.map(v => (Math.round(v * 100) + "%").padStart(7)).join("");
}

// The instrumentation. Plays its own games rather than going through match(),
// because none of this is in the harness's return shape.
function probe(n) {
 let zero = [0, 0], body = [0, 0], crs = 0, stones = 0, maxcrs = 0,
     dead = 0, savedByCourses = 0, foundPops = [];
 for (const d of DOCS) for (let s = 0; s < n; s++) {
  FG.resetTune(); FG.createGame({you: d, them: "cities", seed: s});
  for (let y = 0; y < 40; y++) { FG.aiTurn(0); if (FG.endYear()) break; }
  [0, 1].forEach(w => {
   if (FG.spent(w)) zero[w]++;
   body[w] += FG.manifest(w);
   FG.G.stones[w].forEach(k => {
    stones++; const c = FG.T(k).crs || 0; crs += c; if (c > maxcrs) maxcrs = c;
    if (!FG.stoneWorks(k, w)) dead++;
    // a stone the courses are the only reason for
    if (FG.stoneWorks(k, w) && FG.region(k, w).length < FG.STONEWORK) savedByCourses++;
   });
  });
  FG.G.T.forEach(t => { if (t.set) foundPops.push(t.set.pop); });
 }
 const g = DOCS.length * n;
 return {games: g, zero, body: body.map(b => (b / g).toFixed(2)),
         stones, crs: (crs / (stones || 1)).toFixed(2), maxcrs, dead, savedByCourses};
}

const ROWS = [
 ["the game as it now ships", () => FG.R2reset()],
 ["  less 1.20 stones grow",  () => { FG.R2reset(); FG.R2.stonesGrow = false; }],
 ["  less 1.21 dead orders",  () => { FG.R2reset(); FG.R2.deadOrders = false; }],
 ["  less 1.22 wild folk",    () => { FG.R2reset(); FG.R2.wildFolk = false; }],
 ["  less 1.23 zero spent",   () => { FG.R2reset(); FG.R2.zeroSpent = false; }],
 ["  less 1.19 herds",        () => { FG.R2reset(); FG.R2.herds = false; }],
 ["  less 1.12 barren3",      () => { FG.R2reset(); FG.R2.barren3 = false; }],
 ["august batch (the old on)", () => { FG.R2reset();
    ["stonesGrow","deadOrders","wildFolk","zeroSpent","herds","barren3"].forEach(k => FG.R2[k] = false); }],
 ["the pre-batch game",       () => FG.R2all(false)]
];

console.log("\n" + N + " games a cell, against Cities, the build's own turn order\n");
console.log("".padEnd(30) + DOCS.map(d => d.padStart(7)).join(""));
for (const [label, set] of ROWS) { set(); console.log(row(label)); }

FG.R2reset();
console.log("\ninstrumentation, the shipped game, " + (N / 4 | 0) + " seeds a doctrine");
const p = probe(Math.max(6, N / 4 | 0));
console.log("  games                       " + p.games);
console.log("  spent to nothing  seat 0    " + p.zero[0] + "   seat 1 (cities) " + p.zero[1]);
console.log("  mean body left    seat 0    " + p.body[0] + "  seat 1 " + p.body[1]);
console.log("  stones raised               " + p.stones + ", mean " + p.crs + " courses, most " + p.maxcrs);
console.log("  of those, silent (relays)   " + p.dead);
console.log("  working only because grown  " + p.savedByCourses);
