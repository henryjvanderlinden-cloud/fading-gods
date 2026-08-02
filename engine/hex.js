// Fading Gods — engine: hex geometry. Pointy-top hexes, odd-r offset.
(function (root) {
"use strict";
const FG = root.FG = root.FG || {};
const COLS = FG.COLS, ROWS = FG.ROWS;

const K = (c, r) => r * COLS + c;

function nbr(c, r) {
 const o = (r & 1) ? [[1,0],[1,-1],[0,-1],[-1,0],[0,1],[1,1]]
                   : [[1,0],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1]];
 return o.map(d => [c + d[0], r + d[1]])
         .filter(p => p[0] >= 0 && p[0] < COLS && p[1] >= 0 && p[1] < ROWS);
}

// Neighbour table, precomputed once. Index by tile key.
const NB = [];
for (let r = 0; r < ROWS; r++)
 for (let c = 0; c < COLS; c++)
  NB[K(c, r)] = nbr(c, r).map(p => K(p[0], p[1]));

// Every tile within `rad` steps of k, k included.
function ring(k, rad) {
 let s = [k];
 for (let i = 0; i < rad; i++) {
  const a = [];
  s.forEach(x => NB[x].forEach(y => a.push(y)));
  s = s.concat(a);
 }
 return [...new Set(s)];
}

FG.K = K; FG.nbr = nbr; FG.NB = NB; FG.ring = ring;

if (typeof module !== "undefined" && module.exports) module.exports = FG;
})(typeof globalThis !== "undefined" ? globalThis : this);
