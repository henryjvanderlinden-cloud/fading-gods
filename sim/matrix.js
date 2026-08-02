// Fading Gods — the balance matrix.
//
//   node sim/matrix.js [games] [turns] [section]
//
// section is one of: full, cities, order, interference, all (default).
// Prints every doctrine against every other, plus the interference diagnostic
// from A-05. Seeds are fixed, so two runs of the same command agree exactly.
const {FG, match, interference} = require("./harness.js");

const N = Number(process.argv[2] || 40);
const TURNS = Number(process.argv[3] || 40);
const SECTION = process.argv[4] || "all";
const want = s => SECTION === "all" || SECTION === s;
const DOCS = ["cities", "bands", "mixed", "haunt"];
const tune = {turns: TURNS};

const pad = (s, n) => String(s).padEnd(n);
const rpad = (s, n) => String(s).padStart(n);
const pct = x => (x * 100).toFixed(0) + "%";
const one = x => x.toFixed(1);

console.log(`\nFading Gods — balance matrix`);
console.log(`${N} games per matchup, ${TURNS} turns, seeds 0..${N - 1}\n`);

// --- full matrix --------------------------------------------------------
const summary = {};
if (want("full")) {
console.log(pad("playing", 9) + pad("against", 9) + rpad("win", 6) + rpad("tie", 6)
 + rpad("you", 8) + rpad("them", 8) + rpad("bless", 7) + rpad("reck", 7)
 + rpad("set", 7) + rpad("wond", 7) + rpad("works", 7));
console.log("-".repeat(88));

for (const you of DOCS) {
 summary[you] = [];
 for (const them of DOCS) {
  const m = match(you, them, N, {tune});
  summary[you].push(m.win);
  console.log(pad(you, 9) + pad(them, 9) + rpad(pct(m.win), 6) + rpad(pct(m.tie), 6)
   + rpad(one(m.a), 8) + rpad(one(m.b), 8) + rpad(one(m.bless), 7)
   + rpad(one(m.reck), 7) + rpad(one(m.set), 7) + rpad(one(m.wonders), 7)
   + rpad(one(m.works), 7));
 }
 console.log("");
}

// --- overall spread ------------------------------------------------------
console.log("\noverall, every matchup\n");
console.log(pad("playing", 12) + rpad("mean win", 10));
console.log("-".repeat(22));
const overall = DOCS.map(d => ({d, w: summary[d].reduce((a, b) => a + b, 0) / DOCS.length}));
overall.forEach(o => console.log(pad(o.d, 12) + rpad(pct(o.w), 10)));
const spread = Math.max(...overall.map(o => o.w)) - Math.min(...overall.map(o => o.w));
console.log(`\nspread between strongest and weakest doctrine: ${pct(spread)}`);
}

// --- against Cities, which is the row design/rules.md §10 reports ---------
if (want("cities")) {
console.log("\nagainst the Cities doctrine\n");
console.log(pad("playing", 12) + rpad("wins", 8));
console.log("-".repeat(20));
for (const you of DOCS) {
 const m = match(you, "cities", N, {tune});
 console.log(pad(you, 12) + rpad(pct(m.win), 8));
}
}

// --- turn order ----------------------------------------------------------
// Bless overwrites the other side's blessing, so in a year where both powers
// bless the same ground, the one who acts second keeps it. The build always
// has you acting first.
if (want("order")) {
console.log("\nturn order — mirror matches, same doctrine both seats\n");
console.log(pad("doctrine", 12) + rpad("p0 first", 10) + rpad("p1 first", 10) + rpad("swing", 8));
console.log("-".repeat(40));
for (const d of DOCS) {
 const a = match(d, d, N, {tune, first: "p0"});
 const b = match(d, d, N, {tune, first: "p1"});
 console.log(pad(d, 12) + rpad(pct(a.win), 10) + rpad(pct(b.win), 10)
  + rpad(pct(Math.abs(a.win - b.win)), 8));
}
}

// --- against Cities with the order alternated ----------------------------
if (want("order")) {
console.log("\nagainst Cities, turn order alternated across seeds\n");
console.log(pad("playing", 12) + rpad("wins", 8));
console.log("-".repeat(20));
for (const you of DOCS) {
 const m = match(you, "cities", N, {tune, first: "alternate"});
 console.log(pad(you, 12) + rpad(pct(m.win), 8));
}
}

// --- A-05: is anyone actually playing anyone? ----------------------------
if (want("interference")) {
console.log("\ninterference — score against a live rival vs against Passive\n");
console.log(pad("playing", 12) + pad("against", 10) + rpad("live", 8) + rpad("alone", 8) + rpad("interf", 8));
console.log("-".repeat(46));
for (const you of DOCS) {
 const r = interference(you, "cities", N, {tune});
 console.log(pad(you, 12) + pad("cities", 10) + rpad(one(r.live), 8)
  + rpad(one(r.solo), 8) + rpad(pct(r.interference), 8));
}
}
console.log("");
