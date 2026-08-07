// Fading Gods — what the compensating tile is actually worth. OP-07, OP-21.
//
// The left-hand seat finishes ahead from map generation alone: +4.0 ± 1.4 points
// over 1,160 mirror games (OP-07). Tolerable when the right-hand seat is a
// machine, not tolerable between two people, so `FG.HANDICAP` blesses N tiles
// for seat 1 at year one and the build exposes it as a toggle.
//
// This measures it rather than guessing it. Mirror matches — the same doctrine
// in both seats — with the seeds split evenly between both turn orders, so the
// A-17 seat advantage cancels and what is left is the map. The statistic is the
// mean score margin p0 minus p1 with a standard error, as in sim/order.js: a
// win rate discards the size of every result and needs thousands of games to
// resolve a ten-point effect. Zero is fair.
//
//   node sim/handicap.js [games] [doctrine ...]
//
// Note what this cannot measure. The turn-order swing is 14.9 points for Cities
// and 30.9 for Haunt, and its *sign depends on the doctrine* — Cities wants to
// act first, blessing doctrines want to act second. No static handout to one
// seat corrects a bias that points both ways. This corrects the one that does
// not, and A-17 is still open for the one that does. See OP-21.
const {FG, playGame} = require("./harness.js");

const n = +(process.argv[2] || 200);
const docs = process.argv.length > 3 ? process.argv.slice(3) : ["cities", "bands", "haunt"];

function margin(doc, handicap, games) {
 FG.HANDICAP = handicap;
 const m = [];
 for (let i = 0; i < games; i++) {
  const r = playGame(doc, doc, i, null, i % 2 ? "p1" : "p0");
  m.push(r.a - r.b);
 }
 FG.HANDICAP = 0;
 const mean = m.reduce((a, b) => a + b, 0) / m.length;
 const varr = m.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (m.length - 1);
 return {mean, se: Math.sqrt(varr / m.length)};
}

const f = x => (x >= 0 ? "+" : "") + x.toFixed(1);
console.log(`\nThe compensating tile — mirror matches, seeds split between both orders`);
console.log(`${n} games per cell. Mean score margin, left seat minus right. Zero is fair.\n`);
console.log("doctrine     none            one tile        moved by");
console.log("-".repeat(56));
docs.forEach(d => {
 const a = margin(d, 0, n), b = margin(d, 1, n);
 console.log(d.padEnd(12)
  + (f(a.mean) + " ± " + a.se.toFixed(1)).padEnd(16)
  + (f(b.mean) + " ± " + b.se.toFixed(1)).padEnd(16)
  + f(b.mean - a.mean));
});
console.log();
