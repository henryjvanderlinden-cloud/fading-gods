// Fading Gods — engine: game state and its accessors.
//
// State lives on FG.G. It is a plain object and is already JSON-serialisable,
// which is most of what architecture.md asks for from save/load and replay.
(function (root) {
"use strict";
const FG = root.FG = root.FG || {};
const {COLS, gen, impassable} = FG;

FG.G = null;

// Tile by key. Reads FG.G at call time, so it survives a new game.
FG.T = k => FG.G.T[k];

FG.say = function (x, cls) {
 FG.G.log.push({t: FG.G.turn, x, cls: cls || ""});
};

// A power *taking* ground this year — recorded only when the tile actually
// changes hands, not when a power re-blesses what it already holds. See A-17.
//
// The broader version, where merely asserting ground counted, was tried and was
// much worse: it made every overlap mutually destructive, and since the greedy
// AI picks the tile with the highest bless-gain — which counts taking the other
// side's ground — the second player walked into the overlap every year and
// annihilated its own act. Swing went from 40 points to 83, the other way.
FG.claim = function (k, who) {
 FG.G.claims[k] = (FG.G.claims[k] || 0) | (1 << who);
};

// opts.them  — doctrine string for player 1 ("cities" | "bands" | "mixed" |
//              "haunt" | "passive"), or null for a second person at the board
// opts.you   — doctrine for player 0, or null for a human at the controls
// opts.pvp   — two people at one board. The only thing the engine does with it
//              is decline to play seat 1 itself. OP-21.
// opts.seed  — if given, the whole game is reproducible from it
FG.createGame = function (opts) {
 opts = opts || {};
 if (opts.seed !== undefined && opts.seed !== null) FG.setSeed(opts.seed);

 let tries = 0, G = null;
 do {
  G = {T: gen(), turn: 1, over: false, log: [], hist: [],
       stones: [[], []], warned: 0, armies: [], refugees: [], claims: {},
       seed: (opts.seed === undefined ? null : opts.seed),
       pvp: !!opts.pvp,
       // `body` is what is left of your manifestation — OP-14. It is only read
       // when FG.R2.fade is on, but it is always present, so state stays one
       // shape whatever the flags say.
       p: [{pos:0, mp:3, body:1, acted:false, cast:false, doc: opts.you  || null},
           {pos:0, mp:3, body:1, acted:false, cast:false,
            doc: opts.pvp ? null : (opts.them || "cities")}]};
  tries++;
 } while (G.T.filter(t => !impassable(t)).length < 64 && tries < 50);

 const land = G.T.map((t, k) => ({t, k})).filter(o => !impassable(o.t));
 const left  = land.filter(o => o.t.c < COLS * 0.34);
 const right = land.filter(o => o.t.c > COLS * 0.66);
 G.p[0].pos = (left.length  ? left  : land)[Math.floor((left.length  ? left  : land).length / 2)].k;
 G.p[1].pos = (right.length ? right : land)[Math.floor((right.length ? right : land).length / 2)].k;

 FG.G = G;

 // OP-07. The left-hand seat finishes +4.0 ± 1.4 points ahead over 1,160 mirror
 // games, from map generation alone — the exclusion falloff in gen() is not
 // symmetric on a grid whose odd rows are offset half a hex. Tolerable when the
 // right-hand seat is a machine; not tolerable between two people.
 //
 // A blessed tile is worth 3, which is very nearly the measured margin. It is a
 // patch on the symptom and it is deliberately one: the generator is the thing
 // that is wrong, and fixing it is OP-07's own business. Zero by default, so
 // nothing measured so far changes.
 //
 // Note what it cannot fix. The turn-order swing (A-17) is 14.9 points for
 // Cities and 30.9 for Haunt, and its *sign depends on the doctrine* — Cities
 // wants to act first, blessing doctrines want to act second. No static handout
 // to one seat corrects a bias that points both ways. This corrects the one
 // that does not.
 if (FG.HANDICAP > 0) {
  let n = 0;
  for (const x of FG.ring(G.p[1].pos, 1)) {
   if (n >= FG.HANDICAP) break;
   const q = G.T[x];
   if (!FG.takeable(q, 1)) continue;
   q.st = "bless"; q.own = 1; n++;
  }
 }

 FG.say("You come down on one side of the valley. Something else comes down on the other.", "big");
 return G;
};

if (typeof module !== "undefined" && module.exports) module.exports = FG;
})(typeof globalThis !== "undefined" ? globalThis : this);
