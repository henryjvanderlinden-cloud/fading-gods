// Fading Gods — engine: terrain generation.
(function (root) {
"use strict";
const FG = root.FG = root.FG || {};
const {COLS, ROWS, K, NB} = FG;

// Smoothed noise, pulled down at the edges so the land forms an island.
// OP-07: this generator has never been examined for chokepoints or asymmetry.
function gen() {
 const N = COLS * ROWS;
 let v = [];
 for (let i = 0; i < N; i++) v.push(FG.rand());
 for (let p = 0; p < 3; p++) {
  const n = v.slice();
  for (let k = 0; k < N; k++)
   n[k] = (v[k] + NB[k].reduce((s, x) => s + v[x], 0)) / (NB[k].length + 1);
  v = n;
 }
 const L = [];
 for (let r = 0; r < ROWS; r++)
  for (let c = 0; c < COLS; c++) {
   const ex = Math.min(c / 1.9, (COLS - 1 - c) / 1.9, r / 1.4, (ROWS - 1 - r) / 1.4, 1);
   const x = v[K(c, r)] * 0.5 + 0.5 * ex;
   let t = "plain", f = 1;
   if (x < 0.36) { t = "water"; f = 0; }
   else if (x > 0.74) { t = "hill"; f = .55; }
   else if (x > 0.60) { t = "forest"; f = .75; }
   L.push({c, r, t, f, st:"wild", own:null, set:null, seed:FG.rand()});
  }
 return L;
}

const impassable = t => t.t === "water" || t.t === "mount";

FG.gen = gen; FG.impassable = impassable;

if (typeof module !== "undefined" && module.exports) module.exports = FG;
})(typeof globalThis !== "undefined" ? globalThis : this);
