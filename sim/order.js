// Fading Gods — OP-17. Does the seat you sit in decide the game?
//
//   node sim/order.js <doctrine> <regime> <games> [turns]
//   node sim/order.js report
//
// Mirror matches: the same doctrine in both seats, so the only differences
// between the two powers are where they start and who acts first.
//
// The statistic is the **mean score margin, p0 minus p1**, not the win rate. A
// win rate throws away the size of every result and needs several hundred games
// before it can see a ten-point effect; the margin uses all of it and comes with
// an honest standard error. Under a fair game the margin is zero.
//
// Regimes:
//   p0      you act first every year — what the build does
//   p1      the rival acts first every year
//   years   the order alternates from one year to the next
//
// The margin under p0 contains both the turn-order effect and any bias from the
// starting positions. The margin under years should contain only the second.
// The difference between them is what turn order is actually worth.
const fs = require("fs");
const {FG, playGame} = require("./harness.js");

const OUT = process.env.FG_ORDER_OUT || "/tmp/fg-order.json";

function load() { try { return JSON.parse(fs.readFileSync(OUT, "utf8")); } catch (e) { return {}; } }
function save(d) { fs.writeFileSync(OUT, JSON.stringify(d, null, 1)); }

function run(doc, regime, n, turns, seed0) {
 const rows = [];
 for (let i = 0; i < n; i++) {
  const r = playGame(doc, doc, seed0 + i, {turns}, regime);
  rows.push(r.a - r.b);   // score margin, p0 minus p1
 }
 return rows;
}

const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
function stderr(xs) {
 const m = mean(xs);
 const v = xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (xs.length - 1);
 return Math.sqrt(v / xs.length);
}

if (process.argv[2] === "report") {
 const d = load();
 const DOCS = ["cities", "bands", "mixed", "haunt"];
 const REG = [["p0", "you first"], ["p1", "rival first"], ["years", "alternating"]];
 const pad = (s, n) => String(s).padEnd(n);
 const rp = (s, n) => String(s).padStart(n);

 console.log("\nOP-17 — mean score margin, p0 minus p1, mirror matches");
 console.log("zero is fair. +/- is one standard error.\n");
 console.log(pad("doctrine", 10) + REG.map(r => rp(r[1], 20)).join("") + rp("order worth", 14));
 console.log("-".repeat(84));

 const worth = [];
 for (const doc of DOCS) {
  let line = pad(doc, 10), m = {};
  for (const [k] of REG) {
   const xs = d[doc + "/" + k];
   if (!xs) { line += rp("—", 20); continue; }
   m[k] = mean(xs);
   line += rp(m[k].toFixed(1) + " ± " + stderr(xs).toFixed(1) + " (" + xs.length + ")", 20);
  }
  if (m.p0 !== undefined && m.years !== undefined) {
   const w = Math.abs(m.p0 - m.years);
   worth.push(w);
   line += rp(w.toFixed(1), 14);
  }
  console.log(line);
 }
 if (worth.length) {
  console.log("\nmean turn-order effect removed by alternating: "
   + (worth.reduce((a, b) => a + b, 0) / worth.length).toFixed(1) + " points");
 }

 // residual seat bias under alternating — this is the map, not the order
 const resid = DOCS.map(doc => d[doc + "/years"]).filter(Boolean);
 if (resid.length) {
  const all = [].concat(...resid);
  console.log("residual seat bias with the order alternating: "
   + mean(all).toFixed(1) + " ± " + stderr(all).toFixed(1)
   + " points over " + all.length + " games — this is the starting positions, not the order");
 }
 console.log("");
 process.exit(0);
}

const doc = process.argv[2] || "haunt";
const regime = process.argv[3] || "p0";
const n = Number(process.argv[4] || 100);
const turns = Number(process.argv[5] || 40);
const seed0 = Number(process.argv[6] || 0);

FG.CONTEST = false;
FG.BLESS_WILD_ONLY = false;

const rows = run(doc, regime, n, turns, seed0);
const d = load();
const key = doc + "/" + regime;
d[key] = (d[key] || []).concat(rows);
save(d);
console.log(`${key}: ${rows.length} games, running total ${d[key].length}, `
 + `margin ${mean(d[key]).toFixed(1)} ± ${stderr(d[key]).toFixed(1)}`);
