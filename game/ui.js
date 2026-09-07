// Fading Gods — renderer and input. Owns no rules.
//
// Everything this file knows about the game it asks the engine for. If a rule
// appears in here, it is in the wrong file and the simulator will not see it.
//
// Art direction: concept/art-direction/README.md. Warm painted earth, flat hexes,
// boundaries embossed per contiguous group, Bronze Age temple complexes, the two
// powers drawn as figures. Everything below is read from engine state — the wild
// folk and the field hands are presentation over `t.st`, not a mechanic. See
// OP-18 for the version of them that would be.
"use strict";
(function () {
const {COLS, ROWS, DIVINE, CIVIC, T, ring, reach, score, targets, region,
       stoneRange, working, bigCount, hugeCount, civicStrength, lostCount,
       civicOpen, band, blessGain, canStone, canFound, canSplit, stoneBlock,
       foundBlock, impassable, walkStep, doAct, doIntervene} = FG;

const SZ = 50, W = Math.sqrt(3) * SZ, VS = 1.5 * SZ, U = SZ / 24;
const BW = W * (COLS + 0.5) + 8 * U, BH = VS * (ROWS - 1) + 2 * SZ + 8 * U;
let ARM = null;   // the intervention currently armed, awaiting a target
// 1.6. And the act that now has a target of its own. Split used to pick a tile
// at random out of the one place it could go; since it can reach any of your
// blessing two tiles out, where the splinter lands is a decision — it is a
// founding, and founding is the one thing in the game every expansion begins
// with. So it arms like an intervention rather than firing like a button.
let ARMACT = null;
// 1.19. Steering a herd is not an act and never spends a year, so it cannot use
// ARMACT — a player must be able to send the herds and *then* bless. It is its
// own two-stage arming: null, then "pick" while the herds themselves are the
// targets, then the chosen herd while the whole country it can walk to is.
//
// Two stages rather than one because a player may have more than one, and
// because the second stage is the only moment in the game that draws the third
// movement rule — the country a herd can reach is not the country you can, and
// seeing the difference is most of learning what the rule is.
let ARMHERD = null;
// OP-23. The hint line is now shared: render() computes what it says by default,
// and hovering or pressing a chip borrows it to describe that intervention. The
// descriptions used to sit under every name in a column; there is no room for
// them in a row and no tooltip that works on a tablet, so they go here instead.
let HINT = "";
function showHint(t) {
 const h = document.getElementById("hint");
 if (h) h.textContent = t === undefined ? HINT : t;
}
let LAND = {key: null, html: ""};   // cached land layer, see render()

// OP-21. The seat whose year this is. In a single-player game it is always 0
// and nothing below behaves differently. In a two-player game it flips 0 → 1,
// and only then does the world tick.
//
// This is the one variable that replaced 52 hardcoded seat literals and 18
// reads of G.p[0]. Everything the interface asks the engine, it asks about
// SEAT — which is why it had to be done as one change rather than as seventy
// edits, and why nothing in here may go back to naming a seat directly.
let SEAT = 0;
const other = s => 1 - s;
// Off by default. On a shared screen the hand-over is what stops the previous
// player carrying on tapping into somebody else's year — but some players want
// to look at the board after their last move, and taking that away to save a
// click is a bad trade. So it stays a choice.
let AUTOPASS = false;

// The names the two seats have when neither of them is "you". Deliberately
// positional rather than mythological: the seats are where people are sitting.
const SEATNAME = ["the left hand", "the right hand"];
const pvp = () => !!(FG.G && FG.G.pvp);

const $ = id => document.getElementById(id);
const u = n => n * U;                       // marks were authored against a 24px hex

// How strongly a ground texture is laid over the state colour. Measured, not
// picked. Blessed-vs-wild WCAG contrast, which is what `concept.md`'s one
// load-bearing visual rule runs on:
//
//        alpha   plain   forest   hill
//        0.00     1.65     1.54    1.31   <- as built, no texture
//        0.25     1.46     1.38    1.23
//        0.35     1.39     1.32    1.19
//        0.50     1.29     1.24    1.15
//
// Any alpha composite pulls both states toward the same colour, so texture
// costs contrast unavoidably. The art-direction README already calls 1.35 close
// enough to read as the same ground at speed, and scores the old renderer's
// 1.00 as a failure — so 0.25 is where this sits: enough grain to see, and
// still clear of the number the direction was chosen to avoid. Raise it and the
// board gets prettier and harder to read, in that order.
const TEXA = 0.25;
function px(c, r) { return [W * (c + 0.5 * (r & 1)) + W / 2 + u(4), VS * r + SZ + u(4)]; }
function verts(x, y, s) {
 const v = [];
 for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i - 30);
  v.push([x + s * Math.cos(a), y + s * Math.sin(a)]); }
 return v;                                  // 0 r-up 1 r-dn 2 btm 3 l-dn 4 l-up 5 top
}
const poly = v => v.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("") + "Z";
const hexPath = (x, y, s) => poly(verts(x, y, s === undefined ? SZ : s));

function shift(hex, f) {
 const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
 const m = v => Math.max(0, Math.min(255, f > 0 ? v + (255 - v) * f : v * (1 + f)));
 return "#" + c.map(v => Math.round(m(v)).toString(16).padStart(2, "0")).join("");
}
function mix(a, b, t) {
 const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
 const A = p(a), B = p(b);
 return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
// deterministic per-tile jitter, so a stone looks the same every render
function rng(seed) { let s = Math.floor(seed * 99991) >>> 0 || 7;
 return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ---------------------------------------------------------------- palette
const P = {
 land:  {water: "#274F6B", plain: "#6E7A3C", forest: "#3C5A2C", hill: "#8A7A4C", mount: "#7A7166"},
 bless: {plain: "#88A448", forest: "#4E7A34", hill: "#A08E58"},
 reck: "#C9A24A", seam: "#1E2A1C", stone: "#DCD2B4",
 crops: ["#C9A24A", "#D8B45C", "#7E8A34", "#A88A38", "#94A03E", "#BE9440"],
 tree: "#24421C", treeBless: "#2C5420", ink: "#F0E6CE"
};
const COL = ["#7CF04A", "#A96BF0"];                          // you, them
const SPARK = [["#E8FFC8", "#7CF04A", "#B4FF80"], ["#F0E4FF", "#A96BF0", "#C89CFF"]];

// ------------------------------------------------------------------ marks
//
// Every mark below opens the same way: ask `art.js` whether the active set has
// a sprite for it, and draw the sprite if it does. `FGART.sprite` returns null
// in the mode this game has always shipped in, and null for any key a set has
// not filled in, so the vector drawing underneath is not a fallback in the
// apologetic sense — it is still the default, and it is what a half-finished
// sprite set shows through to. See the note at the top of art.js.
const ART = FGART;
function conifer(x, y, h, w, col, dark, bless) {
 // scale off the authored height, because a tile draws three at three sizes
 const sp = ART.sprite(bless ? "conifer.bless" : "conifer", x, y, {scale: h / 10});
 if (sp) return sp;
 return `<path d="M${x} ${y - u(h)} L${x + u(w)} ${y} L${x - u(w)} ${y} Z" fill="${col}"/>`
      + `<path d="M${x} ${y - u(h)} L${x} ${y} L${x - u(w)} ${y} Z" fill="${dark}" opacity=".45"/>`;
}
// The hill hump and the mountain were written inline in `tileArt`. They are
// marks like any other and now say so, because a sprite needs a call site with
// a name on it.
function hillMark(x, y, bless, seed) {
 // Two piles of cut hills, green and dry, and which pile is used says whether
 // the ground is blessed. That is the one distinction the whole ratchet runs
 // on, and on hills the fills carry it worst of anywhere on the board — so the
 // mark carries it here instead, by hue and silhouette rather than by a
 // difference in lightness the eye has to hunt for.
 const sp = ART.sprite(ART.variantKey(bless ? "hill.bless" : "hill",
                                      rng(seed + 6.4)()), x, y);
 if (sp) return sp;
 const col = bless ? shift(P.bless.hill, -.40) : shift(P.land.hill, -.34);
 return `<path d="M${x - u(11)} ${y + u(7)} q${u(5.5)} ${u(-11)} ${u(11)} 0 Z" fill="${col}"/>`
   + `<path d="M${x - u(1)} ${y + u(8)} q${u(5)} ${u(-13)} ${u(11)} 0 Z" fill="${shift(col, .20)}"/>`
   + `<path d="M${x - u(11)} ${y + u(7)} q${u(5.5)} ${u(-11)} ${u(11)} 0" fill="none"
      stroke="${shift(col, -.3)}" stroke-width="${u(0.9)}"/>`;
}
function mountMark(x, y, seed) {
 // Four cut peaks where a set holds them, picked off the tile's own seed. Not
 // off a counter and not off Math.random: the land layer is cached and rebuilt
 // whenever the board changes, so a variant chosen any other way would reshuffle
 // the whole range every time somebody blessed a tile on the far side of the
 // map. Seeded, a mountain is that mountain for the length of the game.
 const sp = ART.sprite(ART.variantKey("mount", rng(seed + 2.7)()), x, y);
 if (sp) return sp;
 return `<path d="M${x - u(12)} ${y + u(8)} L${x - u(3)} ${y - u(9)} L${x + u(3)} ${y - u(1)}
        L${x + u(7)} ${y - u(7)} L${x + u(13)} ${y + u(8)} Z" fill="${shift(P.land.mount, .16)}"/>`
    + `<path d="M${x - u(3)} ${y - u(9)} L${x + u(1)} ${y - u(2)} L${x - u(6)} ${y + u(2)} Z" fill="${shift(P.land.mount, .5)}"/>`
    + `<path d="M${x - u(3)} ${y - u(9)} L${x - u(12)} ${y + u(8)} L${x - u(5)} ${y + u(8)} Z" fill="${shift(P.land.mount, -.3)}"/>`;
}
// Sparkle phase is seeded rather than fixed, so that re-rendering the map on
// every click does not resynchronise the whole field into one blink.
function twinkle(x, y, r, col, ph) {
 const q = r * 0.19;
 return `<path class="sp" fill="${col}" style="animation-delay:${(-ph * 2.4).toFixed(2)}s,${(-ph * 5.2).toFixed(2)}s"`
  + ` d="M${x.toFixed(1)} ${(y - r).toFixed(1)} Q${(x + q).toFixed(1)} ${(y - q).toFixed(1)}`
  + ` ${(x + r).toFixed(1)} ${y.toFixed(1)} Q${(x + q).toFixed(1)} ${(y + q).toFixed(1)} ${x.toFixed(1)} ${(y + r).toFixed(1)}`
  + ` Q${(x - q).toFixed(1)} ${(y + q).toFixed(1)} ${(x - r).toFixed(1)} ${y.toFixed(1)}`
  + ` Q${(x - q).toFixed(1)} ${(y - q).toFixed(1)} ${x.toFixed(1)} ${(y - r).toFixed(1)} Z"/>`;
}
// Blessing, as a scatter of small points in the owner's colour.
//
// The four-pointed stars read as *stars* — a literal sparkle sitting on top of
// the board. Against flat vector ground that was fine; against textured ground
// it looks like clip art. Many small points instead: they read as the ground
// being charged rather than decorated, and being the owner's colour they say
// whose blessing it is, which the pale stars never did.
//
// Seeded off the tile rather than the shared stream, so restyling the sparkle
// cannot move anything else on the tile.
function sparkPoints(x, y, own, seed) {
 const g = rng(seed + 11.7), col = COL[own], lit = shift(col, .45);
 // Sampled against the hex's own edge rather than in a box, and pushed out to
 // the rim.
 //
 // The middle of a tile is the busiest part of it — the mountain, the wood, the
 // temple, the power itself all stand there — so points scattered evenly landed
 // on top of whatever the tile was about and read as speckle over the art. The
 // periphery is the quiet ground, and blessing gathered at the edges reads as
 // something coming *in* over the tile rather than something sprinkled on it.
 //
 // R is the circumradius less a margin, A the apothem. For a pointy-top hex the
 // edge normals lie at 0°, 60°, 120° …, so folding the angle into one 60° wedge
 // gives the distance to the edge along it, and every point can then be placed
 // as a fraction of the way out. A box could not do this: the distance to the
 // boundary is not the same in every direction, which is exactly the thing that
 // makes a hex look like a hex.
 const R = 22.5, A = R * 0.8660254;
 let out = "";
 for (let i = 0; i < 18; i++) {
  const th = g() * Math.PI * 2;
  const edge = A / Math.cos(((th + Math.PI / 6) % (Math.PI / 3)) - Math.PI / 6);
  // Four in five out on the rim, the rest scattered inside — enough that the
  // middle is not conspicuously empty, not so many that they crowd the mark.
  const d = edge * (g() < 0.8 ? 0.68 + g() * 0.28 : 0.14 + g() * 0.40);
  const dx = Math.cos(th) * u(d), dy = Math.sin(th) * u(d), t = g();
  // Small. The first pass used a radius up to u(1.7) and the result was
  // confetti — at this hex size anything past about u(0.8) stops being a point
  // and becomes a bead. Depth comes from varying `fill-opacity`, not size, and
  // not `opacity`: the twinkle animation drives opacity and would override it.
  out += `<circle class="sp" cx="${(x + dx).toFixed(1)}" cy="${(y + dy).toFixed(1)}"`
   + ` r="${u(0.3 + t * 0.5).toFixed(2)}" fill="${t > 0.62 ? lit : col}"`
   + ` fill-opacity="${(0.55 + t * 0.45).toFixed(2)}"`
   + ` style="animation-delay:${(-g() * 2.4).toFixed(2)}s,${(-g() * 5.2).toFixed(2)}s"/>`;
 }
 return out;
}

function wavePath(x, y, len, amp, phase) {
 const seg = len / 4; let d = `M${(x - len / 2).toFixed(1)} ${y.toFixed(1)}`;
 for (let i = 0; i < 4; i++) {
  const dir = ((i + phase) % 2 === 0) ? -1 : 1;
  d += `q${(seg / 2).toFixed(1)} ${(amp * dir).toFixed(1)} ${seg.toFixed(1)} 0`;
 }
 return d;
}
function water(x, y, seed) {
 const r = rng(seed + 0.7);
 const w1 = shift(P.land.water, .22), w2 = shift(P.land.water, .55);
 let s = `<g style="--w1:${w1};--w2:${w2};--w3:#EAF4FF" fill="none" stroke-linecap="round"
   opacity=".72" stroke-width="${u(1.7).toFixed(1)}">`;
 [[-6.5, 15, 1.9, 0], [0.5, 18, 2.2, 1], [7.5, 13, 1.7, 0]].forEach((row, i) => {
  const [dy, len, amp, ph] = row, ox = x + (r() - 0.5) * u(4), oy = y + u(dy);
  const a = wavePath(ox, oy, u(len), u(amp), ph), b = wavePath(ox, oy, u(len), u(amp), ph + 1);
  s += `<path class="wv wv${i + 1}" stroke="${w1}" d="${a}">`
    + `<animate attributeName="d" dur="${(3.4 + i * 0.7).toFixed(1)}s" repeatCount="indefinite"
       values="${a};${b};${a}" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" keyTimes="0;0.5;1"/></path>`;
 });
 return s + `</g>`;
}
// Megalithic: irregular tapered slab, no straight edges, seeded so it is stable.
function menhir(x, y, h, w, seed, opt) {
 const r = rng(seed), lean = opt.lean || 0, j = a => (r() - 0.5) * u(a);
 const tw = w * (0.52 + r() * 0.16), lx = lean * h;
 const p = [[x - w / 2 + j(1.4), y], [x - w / 2 * (0.86 + r() * 0.2) + j(1), y - h * 0.34],
   [x - tw / 2 + lx * 0.85 + j(1), y - h * 0.72], [x + j(1.6) + lx, y - h],
   [x + tw / 2 + lx * 0.85 + j(1), y - h * 0.70], [x + w / 2 * (0.88 + r() * 0.2) + j(1), y - h * 0.36],
   [x + w / 2 + j(1.4), y]];
 let s = `<path d="${poly(p)}" fill="${opt.fill}"/>`;
 s += `<path d="M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)} L${p[1][0].toFixed(1)} ${p[1][1].toFixed(1)}`
   + ` L${p[2][0].toFixed(1)} ${p[2][1].toFixed(1)} L${p[3][0].toFixed(1)} ${p[3][1].toFixed(1)}`
   + ` L${(x + lx * 0.3).toFixed(1)} ${y.toFixed(1)} Z" fill="${shift(opt.fill, .26)}"/>`;
 if (opt.crack) s += `<path d="M${(x - u(1) + lx * 0.6).toFixed(1)} ${(y - h * 0.62).toFixed(1)}`
   + ` l${u(2.4).toFixed(1)} ${(h * 0.2).toFixed(1)} l${u(-1.6).toFixed(1)} ${(h * 0.16).toFixed(1)}"`
   + ` stroke="${shift(opt.fill, -.42)}" stroke-width="${u(1).toFixed(1)}" fill="none"/>`;
 return s;
}
// 1.20. `live` is passed in rather than derived from `power` here, because what a
// stone needs is now a property of the stone — see `stoneNeed` in rules.js. The
// interface asking the engine is the fifth rule of this project; this function
// having its own private copy of the number six is exactly the drift it names.
function stoneGroup(x, y, k, who, power, live, crs) {
 const base = live ? (who === 0 ? "#E4DCC0" : "#DCD4C0") : "#7E8079";
 // The courses and the sparkle stay vector in every mode. Courses are drawn
 // from a count that runs 0..n with no ceiling, so they cannot be a sprite
 // without capping a rule at whatever the art happens to hold; the sparkle
 // animates. Only the megaliths themselves switch — which is right, because
 // the silhouette is the state and the silhouette is what is being tested.
 const key = !live ? "stone.dead" : (power >= 12 ? "stone.big." : "stone.live.") + who;
 let s = ART.has(key) ? ""
  : `<ellipse cx="${x}" cy="${y + u(9)}" rx="${u(12)}" ry="${u(3.4)}" fill="#000" opacity=".26"/>`;
 // The courses the people have put on it: a stepped plinth under the stone, one
 // low wide slab a course, widest at the bottom. Drawn under everything else so
 // the stone itself sits on top of what was built up to it, and drawn on a dead
 // stone as well as a live one — the masonry does not fall down when the country
 // goes quiet, and a grown stone standing silent in a field is the picture the
 // rule is for.
 // Measured by looking at it, which is the only way to measure this: the first
 // version was near-black and one course was indistinguishable from two. So the
 // slabs are the stone's own colour a shade down, they step inward by a clear
 // margin, and each one is tall enough to read at the size a hex actually is.
 for (let i = 0; i < (crs || 0); i++) {
  const w = u(15.5 - i * 3.2), hh = u(3.4);
  s += `<rect x="${(x - w).toFixed(1)}" y="${(y + u(8.6) - i * u(3.2)).toFixed(1)}"
    width="${(w * 2).toFixed(1)}" height="${hh.toFixed(1)}" rx="${u(0.6).toFixed(1)}"
    fill="${shift(base, -0.16 - i * 0.05)}" stroke="#000" stroke-width="${u(0.8).toFixed(1)}"/>`;
 }
 const r = rng(k * 0.017 + 0.3);
 // Everything above the plinth is lifted by what is under it, so a three-course
 // stone reads as a taller thing and not as a stone with a box beside it.
 const lift = u((crs || 0) * 3.2);
 y -= lift;
 const sp = ART.sprite(key, x, y);
 if (sp) s += sp;
 else {
  for (let i = 0; i < 3; i++)
   s += menhir(x - u(11) + i * u(11) + (r() - 0.5) * u(3), y + u(8) - (i === 1 ? u(2) : 0),
        u(5 + r() * 2.5), u(3.4), k * 0.31 + i, {fill: shift(base, -0.3)});
  if (live && power >= 12) {
   s += menhir(x - u(6.5), y + u(7), u(15), u(5.5), k * 0.11, {fill: base});
   s += menhir(x + u(6.5), y + u(7), u(15), u(5.5), k * 0.53, {fill: base});
   s += `<path d="M${x - u(11)} ${y - u(8)} L${x + u(11)} ${y - u(9.4)} L${x + u(11)} ${y - u(5.6)}
         L${x - u(11)} ${y - u(4.4)} Z" fill="${shift(base, .1)}"/>`;
  } else s += menhir(x, y + u(7), u(live ? 17 : 13), u(8), k * 0.07,
       {fill: base, lean: live ? 0 : 0.20, crack: !live});
 }
 if (live) { const sp = SPARK[who];
  s += twinkle(x - u(13), y - u(6), u(2.6), sp[0], r())
     + twinkle(x + u(12), y - u(12), u(2.2), sp[1], r())
     + twinkle(x + u(3), y - u(17), u(2.4), sp[2], r());
 }
 return s;
}
// The people. Blessed ground shows people — few, upright, scattered. Farmland
// shows work — more of them, bent, aligned to the rows. Same species, different
// relationship to the ground.
function person(fx, fy, h, col, own) {
 const sp = ART.sprite("person." + own, fx, fy, {scale: h / u(1)});
 if (sp) return sp;
 return `<ellipse cx="${fx}" cy="${fy + u(0.4)}" rx="${u(2)}" ry="${u(0.7)}" fill="#000" opacity=".28"/>`
  + `<g stroke="#1A1508" stroke-width="${u(0.45)}" stroke-linejoin="round" fill="${col}">`
  + `<path d="M${fx - h * 1.5} ${fy} L${fx - h * 0.9} ${fy - u(4.2)} L${fx + h * 0.9} ${fy - u(4.2)}
      L${fx + h * 1.5} ${fy} Z"/><circle cx="${fx}" cy="${fy - u(5.4)}" r="${u(1.15)}"/></g>`;
}
function stooped(fx, fy, col, flip, own) {
 const sp = ART.sprite("stooped." + own, fx, fy, {flip: !!flip});
 if (sp) return sp;
 const d = flip ? -1 : 1;
 return `<ellipse cx="${fx}" cy="${fy + u(0.4)}" rx="${u(2.4)}" ry="${u(0.7)}" fill="#000" opacity=".26"/>`
  + `<g stroke="#1A1508" stroke-width="${u(0.5)}" stroke-linejoin="round" stroke-linecap="round" fill="${col}">`
  + `<path d="M${fx - d * u(1.4)} ${fy} L${fx - d * u(1.7)} ${fy - u(3.4)} L${fx + d * u(2.6)} ${fy - u(5.2)}
      L${fx + d * u(3.4)} ${fy - u(3.4)} L${fx + d * u(0.5)} ${fy - u(2.1)} L${fx + d * u(0.8)} ${fy} Z"/>`
  + `<circle cx="${fx + d * u(4.1)}" cy="${fy - u(5)}" r="${u(1.15)}"/>`
  + `<path d="M${fx + d * u(3.6)} ${fy - u(3.6)} L${fx + d * u(4.6)} ${fy - u(1.2)}" fill="none"/></g>`;
}
// A kudurru — squared, upright, inscribed. Everything the menhirs are not.
function boundaryStone(x, y, own, seed) {
 const col = COL[own], r = rng(seed + 1.3);
 const ox = x + u(-7 + r() * 4), oy = y + u(6.5), st = mix("#CFC4A6", col, 0.46);
 // The sprite takes the same jittered offset, so switching sets moves the art
 // and not the kudurru — which is what makes two sets comparable on one board.
 const sp = ART.sprite("kudurru." + own, ox, oy);
 if (sp) return sp;
 return `<ellipse cx="${ox}" cy="${oy + u(0.6)}" rx="${u(3.8)}" ry="${u(1.1)}" fill="#000" opacity=".32"/>`
  + `<path d="M${ox - u(2.9)} ${oy} L${ox - u(2.6)} ${oy - u(8)} Q${ox} ${oy - u(10)} ${ox + u(2.6)} ${oy - u(8)}
      L${ox + u(2.9)} ${oy} Z" fill="${st}" stroke="#1A1508" stroke-width="${u(0.7)}"/>`
  + `<path d="M${ox - u(2.72)} ${oy - u(6.2)} Q${ox} ${oy - u(10)} ${ox + u(2.72)} ${oy - u(6.2)}
      L${ox + u(2.6)} ${oy - u(4.9)} Q${ox} ${oy - u(8.4)} ${ox - u(2.6)} ${oy - u(4.9)} Z" fill="${col}"/>`
  + `<g stroke="${shift(col, -.42)}" stroke-width="${u(0.8)}" stroke-linecap="round" opacity=".95">`
  + `<path d="M${ox - u(1.6)} ${oy - u(3.8)} h${u(3.2)}"/><path d="M${ox - u(1.6)} ${oy - u(2.2)} h${u(3.2)}"/>`
  + `<path d="M${ox - u(1.6)} ${oy - u(0.7)} h${u(2.1)}"/></g>`;
}
function banner(x, yTop, h, col, seed) {
 const pole = `<rect x="${(x - u(0.5)).toFixed(1)}" y="${yTop.toFixed(1)}"
   width="${u(1.1).toFixed(1)}" height="${h.toFixed(1)}" fill="#3A3020"/>`;
 const w = u(5.2), hh = u(3.6), y0 = yTop + u(0.6);
 const f = b => `M${(x + u(0.5)).toFixed(1)} ${y0.toFixed(1)}`
  + `q${(w * 0.5).toFixed(1)} ${(b * 1.5).toFixed(1)} ${w.toFixed(1)} ${(-b * 0.6).toFixed(1)}`
  + `l0 ${hh.toFixed(1)}q${(-w * 0.5).toFixed(1)} ${(b * 0.8).toFixed(1)} ${(-w).toFixed(1)} ${(b * 0.6).toFixed(1)}Z`;
 const a = f(u(1.1)), b = f(u(-1.1));
 return pole + `<path fill="${col}" stroke="#2A2114" stroke-width="${u(0.6).toFixed(1)}" d="${a}">`
  + `<animate attributeName="d" dur="${(1.5 + ((seed * 7) % 10) / 10).toFixed(2)}s" repeatCount="indefinite"
     values="${a};${b};${a}" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" keyTimes="0;0.5;1"/></path>`;
}
// Four stages, and the stage is read from the size of the complex. Under
// seventy-seven there is no temple at all, which is the point of the custom.
function temple(x, y, b, col, seed, own) {
 // Banners stay vector even when the complex is a sprite: they animate, and a
 // still flag on a board where everything else moves is worse than no flag.
 // They matter more now than they did — a cut settlement is stone and thatch
 // and carries no faction colour of its own, so the banner and the raised
 // border are the whole of what says whose place this is.
 const sp = ART.sprite(ART.variantKey("settle." + b, rng(seed + 3.9)()), x, y)
         || ART.sprite("temple." + b + "." + own, x, y);
 // One banner from a village, two from a town, and the city's stand out on the
 // flanks of the hex it fills. The thresholds are band indices as the engine
 // numbers them, 1..4 — they used to read 2 and 3 against a scale that starts
 // at 1, so a city flew no flag at all: the one tile on the board where nothing
 // else was left to say whose it was.
 if (sp) return sp
  + (b >= 2 ? banner(x + u(11), y - u(4), u(12.5), col, seed) : "")
  + (b === 3 ? banner(x - u(14), y - u(8), u(13), col, seed + 3) : "")
  + (b >= 4 ? banner(x - u(17), y - u(9), u(15), col, seed + 3)
            + banner(x + u(17), y - u(9), u(15), col, seed + 7) : "");
 const stone = mix(P.stone, col, 0.30), lit = shift(stone, .20), dark = shift(stone, -.34),
       deep = "#2A2114", trim = shift(col, -.1);
 const slab = (x0, x1, yT, yB) =>
   `<rect x="${x + u(x0)}" y="${y + u(yT)}" width="${u(x1 - x0)}" height="${u(yB - yT)}" fill="${stone}"/>`
  + `<rect x="${x + u(x0)}" y="${y + u(yT)}" width="${u(x1 - x0)}" height="${u(1)}" fill="${lit}"/>`
  + `<rect x="${x + u(x0)}" y="${y + u(yB) - u(0.9)}" width="${u(x1 - x0)}" height="${u(0.9)}" fill="${dark}"/>`;
 const door = (w, yT, yB) => `<rect x="${x - u(w / 2)}" y="${y + u(yT)}" width="${u(w)}" height="${u(yB - yT)}" fill="${deep}"/>`;
 const cols = (x0, x1, yT, yB, n) => { let o = "";
  for (let i = 0; i < n; i++) { const cx = x0 + (x1 - x0) * (i + 0.5) / n;
   o += `<rect x="${x + u(cx - 0.6)}" y="${y + u(yT)}" width="${u(1.2)}" height="${u(yB - yT)}" fill="${lit}"/>`; }
  return o; };
 let s = `<ellipse cx="${x}" cy="${y + u(9)}" rx="${u(15)}" ry="${u(3.4)}" fill="#000" opacity=".24"/>`;

 if (b === 0) {                                         // the Seventy-Seven — no temple
  const r = rng(seed);
  for (let i = 0; i < 3; i++) {
   const ax = x + u(-7 + i * 7 + (r() - 0.5) * 1.5), ay = y + u(7 - (i === 1 ? 2.5 : 0));
   s += `<path d="M${ax} ${ay - u(6.5)} l${u(4.2)} ${u(6.5)} l${u(-8.4)} 0 Z" fill="${stone}"
         stroke="${deep}" stroke-width="${u(0.6)}"/>`
     + `<path d="M${ax} ${ay - u(6.5)} l0 ${u(6.5)} l${u(-4.2)} 0 Z" fill="${dark}" opacity=".6"/>`;
  }
  return s;
 }
 if (b === 1) return s + slab(-8, 8, 5, 8.5) + slab(-5.5, 5.5, -1, 5) + door(2.6, 1.2, 5)
  + `<path d="M${x - u(6.5)} ${y - u(1)} L${x} ${y - u(5)} L${x + u(6.5)} ${y - u(1)} Z"
     fill="${trim}" stroke="${deep}" stroke-width="${u(0.6)}"/>`;
 if (b === 2) {
  s += slab(-12, 12, 4.5, 8.5) + slab(-8.5, 8.5, -0.5, 4.5) + cols(-7.5, 7.5, 0.4, 4.5, 4)
    + slab(-5, 5, -5.5, -0.5) + door(2.8, -3.4, -0.5)
    + `<path d="M${x - u(6.6)} ${y - u(5.5)} L${x} ${y - u(9.5)} L${x + u(6.6)} ${y - u(5.5)} Z"
       fill="${trim}" stroke="${deep}" stroke-width="${u(0.6)}"/>`;
  return s + banner(x + u(11), y - u(4), u(12.5), col, seed);
 }
 s += slab(-15.5, 15.5, 4.5, 9) + slab(-12, 12, 0.5, 4.5) + cols(-11, 11, 1.4, 4.5, 6)
   + slab(-8, 8, -4, 0.5) + cols(-7, 7, -3.2, 0.5, 4) + slab(-4.5, 4.5, -9, -4) + door(3, -7.2, -4)
   + `<path d="M${x - u(6)} ${y - u(9)} L${x} ${y - u(13.5)} L${x + u(6)} ${y - u(9)} Z"
      fill="${trim}" stroke="${deep}" stroke-width="${u(0.7)}"/>`;
 return s + banner(x - u(14), y - u(8), u(13), col, seed) + banner(x + u(14), y - u(8), u(13), col, seed + 3);
}
// The powers. Drawn from the roster in concept/Player-character-inspiration:
// the arms-raised epiphany gesture, and the horned Cernunnos type.
function figureF(x, y, col) {
 return `<g stroke="#1A1508" stroke-width="${u(0.75)}" stroke-linejoin="round" fill="${col}">`
  + `<path d="M${x - u(6.5)} ${y - u(4)} L${x - u(4.4)} ${y - u(11.6)} L${x - u(2.2)} ${y - u(11)} L${x - u(3.4)} ${y - u(4)} Z"/>`
  + `<path d="M${x + u(6.5)} ${y - u(4)} L${x + u(4.4)} ${y - u(11.6)} L${x + u(2.2)} ${y - u(11)} L${x + u(3.4)} ${y - u(4)} Z"/>`
  + `<path d="M${x - u(2.8)} ${y - u(9.5)} L${x + u(2.8)} ${y - u(9.5)} L${x + u(2.1)} ${y - u(2)} L${x - u(2.1)} ${y - u(2)} Z"/>`
  + `<path d="M${x - u(2.4)} ${y - u(2)} L${x + u(2.4)} ${y - u(2)} L${x + u(6.2)} ${y + u(9)} L${x - u(6.2)} ${y + u(9)} Z"/>`
  + `<circle cx="${x}" cy="${y - u(11.8)}" r="${u(2.5)}"/></g>`
  + `<g fill="none" stroke="#1A1508" stroke-width="${u(0.7)}" opacity=".8">`
  + `<path d="M${x - u(3.4)} ${y + u(2)} L${x + u(3.4)} ${y + u(2)}"/>`
  + `<path d="M${x - u(4.8)} ${y + u(5.6)} L${x + u(4.8)} ${y + u(5.6)}"/></g>`;
}
function figureM(x, y, col) {
 return `<rect x="${x + u(5.2)}" y="${y - u(13)}" width="${u(1.3)}" height="${u(21.5)}" rx="${u(0.6)}"
      fill="#4A3B24" stroke="#1A1508" stroke-width="${u(0.55)}"/>`
  + `<g stroke="#1A1508" stroke-width="${u(0.75)}" stroke-linejoin="round" stroke-linecap="round" fill="${col}">`
  + `<path d="M${x - u(4.6)} ${y - u(4.4)} L${x + u(4.6)} ${y - u(4.4)} L${x + u(3.2)} ${y + u(1.6)} L${x - u(3.2)} ${y + u(1.6)} Z"/>`
  + `<path d="M${x - u(4.3)} ${y - u(3.8)} L${x - u(6.1)} ${y + u(2.6)} L${x - u(4.3)} ${y + u(3.2)} L${x - u(2.6)} ${y - u(3.2)} Z"/>`
  + `<path d="M${x + u(4.3)} ${y - u(3.8)} L${x + u(6.3)} ${y + u(0.4)} L${x + u(4.8)} ${y + u(1.4)} L${x + u(2.6)} ${y - u(3.2)} Z"/>`
  + `<path d="M${x - u(3.1)} ${y + u(1.6)} L${x - u(0.6)} ${y + u(1.6)} L${x - u(0.9)} ${y + u(9.2)} L${x - u(3.9)} ${y + u(9.2)} Z"/>`
  + `<path d="M${x + u(3.1)} ${y + u(1.6)} L${x + u(0.6)} ${y + u(1.6)} L${x + u(0.9)} ${y + u(9.2)} L${x + u(3.9)} ${y + u(9.2)} Z"/>`
  + `<circle cx="${x}" cy="${y - u(7.4)}" r="${u(2.7)}"/>`
  + `<path d="M${x - u(2.1)} ${y - u(9)} q${u(-3.6)} ${u(-1.2)} ${u(-4)} ${u(-5.2)} q${u(2.4)} ${u(2.6)} ${u(3.4)} ${u(3)} Z"/>`
  + `<path d="M${x + u(2.1)} ${y - u(9)} q${u(3.6)} ${u(-1.2)} ${u(4)} ${u(-5.2)} q${u(-2.4)} ${u(2.6)} ${u(-3.4)} ${u(3)} Z"/></g>`;
}

// ------------------------------------------------------------------ a tile
function tileArt(t, k) {
 const [x, y] = px(t.c, t.r), r = rng(t.seed);
 // OP-19. A settlement stands in its own fields — but only once it has been
 // taught to make them. Untaught, it is still blessed country with people in it,
 // and the fill has to say so, because the fill is the most legible thing on the
 // board and this is the decision the game is about.
 const tilled = t.set && (!FG.R2.teaching || t.set.taught);
 const blessed = (t.st === "bless" || (t.set && !tilled)) && !impassable(t);
 let fill = P.land[t.t];
 if (blessed) fill = P.bless[t.t] || fill;
 if (t.st === "reck") fill = P.reck;
 if (tilled) fill = P.reck;
 let s = `<path class="hx" d="${hexPath(x, y)}" fill="${fill}" stroke="${P.seam}"
   stroke-width="${u(0.7).toFixed(1)}" data-k="${k}"/>`;

 // Ground texture, when the set carries one: grain laid over the state colour,
 // never instead of it.
 //
 // This is the one place the sprite work touches the rule `concept.md` calls
 // load-bearing — *fill is the land* — and the art-direction README has
 // measured luminance numbers behind it. Replacing the fill with a texture
 // would throw those away: blessed forest and wild forest would become the same
 // picture. So the flat fill is drawn first and still decides the colour, and
 // the texture goes over it at TEXA, which costs some contrast but keeps the
 // ordering. The number is measured, not chosen — see the README.
 //
 // Drawn as a second path rather than as the fill of `.hx` because `.hx` is the
 // click target and carries `data-k`; this one takes no pointer events so the
 // hit test still lands on the tile underneath.
 const tex = ART.texture(t.t === "hill" ? "plain" : (t.st === "reck" || tilled ? "reck" : t.t));
 if (tex && t.t !== "water")
  s += `<path d="${hexPath(x, y)}" fill="${tex}" opacity="${TEXA}" pointer-events="none"/>`;

 if (t.t === "water") s += water(x, y, t.seed);
 if (t.t === "mount") s += mountMark(x, y, t.seed);
 if (t.t === "forest" && t.st !== "reck" && !t.set) {
  const col = blessed ? P.treeBless : P.tree, dk = shift(col, -.35);
  // A cut clump is a whole stand of trees with its own arrangement, so one
  // goes on the tile. Scattering three would be scattering three woods. The
  // three r() calls still happen either way — the same rule as the furrows,
  // because everything downstream of here draws from the same stream.
  const jitter = [r(), r(), r()];
  const clump = ART.sprite(ART.variantKey("forest", rng(t.seed + 8.3)()), x, y);
  s += clump || (conifer(x - u(6) + jitter[0] * u(2), y + u(7), 10, 4.4, col, dk, blessed)
     + conifer(x + u(5) - jitter[1] * u(2), y + u(5), 8.5, 3.8, col, dk, blessed)
     + conifer(x + jitter[2] * u(3), y + u(10), 7.5, 3.4, col, dk, blessed));
 }
 if (t.t === "hill" && t.st !== "reck" && !t.set) s += hillMark(x, y, blessed, t.seed);
 // Farmland: strips of different crop, some green, some fallow, angled by
 // faction. Strips stay inside 0.64·SZ so they rotate without leaving the hex.
 if (t.st === "reck" || tilled) {
  const own = t.set ? t.set.own : t.own, ang = own === 0 ? -32 : 30;
  const gap = u(5.4), top = y - u(8.6), hgt = u(3.1);
  // The crop stream is drawn whether or not it is used. Four calls to r() go
  // into choosing strip colours, and the field hands are placed from the same
  // stream immediately afterwards — so skipping the strips in sprite mode would
  // move every worker on every farm, and the two modes would no longer be the
  // same board wearing different clothes. Consume, then decide.
  const strip = [];
  for (let i = 0; i < 4; i++)
   strip.push({c: P.crops[Math.floor(r() * P.crops.length)],
               wd: (i === 0 || i === 3) ? u(17) : u(22)});
  // The cut furrows carry their own angle — the rows already run on a diagonal
  // — so they are neither rotated here nor baked to the two seat angles. The
  // seats are told apart by mirroring, which reverses the direction the rows
  // run and is exact on a pixel sprite in a way a rotation never is.
  //
  // And a settlement's tile shows the settlement. Where a set carries field
  // art, the ground under a temple is left as bare fill: the patch competes
  // with the building standing on it and reads as clutter rather than as
  // farmland. The fill is still `P.reck`, so the tile has not stopped saying
  // what it is — only the mark is dropped, which is the fill rule doing its job.
  const furKey = ART.variantKey("furrow", rng(t.seed + 5.1)());
  const bare = t.set && ART.has(furKey);
  const fur = bare ? null : ART.sprite(furKey, x, y, {flip: own === 1});
  if (fur) s += fur;
  s += `<g transform="rotate(${ang} ${x.toFixed(1)} ${y.toFixed(1)})">`;
  if (!fur && !bare) strip.forEach((sp, i) => {
   s += `<rect x="${(x - sp.wd / 2).toFixed(1)}" y="${(top + i * gap).toFixed(1)}" width="${sp.wd.toFixed(1)}"
         height="${hgt.toFixed(1)}" rx="${u(1).toFixed(1)}" fill="${sp.c}" opacity=".9"/>`
     + `<rect x="${(x - sp.wd / 2).toFixed(1)}" y="${(top + i * gap + hgt).toFixed(1)}" width="${sp.wd.toFixed(1)}"
         height="${u(1.1).toFixed(1)}" fill="#000" opacity=".16"/>`;
  });
  if (!t.set) { const n = 2 + Math.floor(r() * 3), col = shift(COL[own], -.14);
   for (let i = 0; i < n; i++) {
    // Drawn from the stream either way — see the note above. A set that omits
    // people wants an empty field, not vector figures standing in its furrows.
    const fx = x + u(-8 + r() * 16), fy = y + u(-6.4 + Math.floor(r() * 4) * 5.4) + u(3.1),
          fl = r() < 0.4;
    if (!ART.omits("stooped")) s += stooped(fx, fy, col, fl, own);
   }
  }
  s += `</g>`;
  if (!t.set && !ART.omits("kudurru")) s += boundaryStone(x, y, own, t.seed);
 }
 // An untaught settlement still sparkles: they are few, and they can still hear.
 if (blessed && (!t.set || !tilled)) {
  const own2 = (t.set ? t.set.own : t.own) === 0 ? 0 : 1, sp = SPARK[own2];
  // The four arguments are drawn from the stream whether or not the four stars
  // are used, so that a set which restyles the sparkle does not move everything
  // downstream of it. Consume, then decide — the same rule as the furrows.
  const star = [[x - u(9) + r() * u(4), y - u(7) + r() * u(3), u(4.4), sp[0], r()],
                [x + u(7) - r() * u(4), y - u(1) + r() * u(4), u(3.4), sp[1], r()],
                [x - u(3) + r() * u(6), y + u(8) - r() * u(3), u(3.9), sp[2], r()],
                [x + u(2) + r() * u(5), y - u(9) + r() * u(3), u(2.6), sp[0], r()]];
  s += ART.opt("sparks") === "points" ? sparkPoints(x, y, own2, t.seed)
     : star.map(a => twinkle.apply(null, a)).join("");
  const nf = r() < 0.42 ? 2 : 1;              // wild folk — presentation, see OP-18
  for (let i = 0; i < nf; i++) {
   const px = x + u(1.5 + i * 5.5 + r() * 3), py = y + u(7.5 - r() * 2.5),
         ph = u(0.9 + r() * 0.25);
   if (!ART.omits("person")) s += person(px, py, ph, COL[t.own], t.own);
  }
 }
 return s;
}

// Boundaries drawn once per contiguous group of one owner's ground, rather than
// around every tile. The blessing/farmland edge is carried by the fill.
const DIR = {
 0: [[1, 0, 0], [0, 1, 1], [-1, 1, 2], [-1, 0, 3], [-1, -1, 4], [0, -1, 5]],   // even rows
 1: [[1, 0, 0], [1, 1, 1], [0, 1, 2], [-1, 0, 3], [0, -1, 4], [1, -1, 5]]      // odd rows
};
function boundaries(G) {
 const owner = t => t.set ? t.set.own : (t.st === "wild" ? null : t.own);
 const segs = {};
 G.T.forEach(t => {
  const o = owner(t); if (o === null) return;
  const [x, y] = px(t.c, t.r), v = verts(x, y, SZ - u(1.2));
  DIR[t.r & 1].forEach(([dc, dr, edge]) => {
   const nc = t.c + dc, nr = t.r + dr;
   const nb = (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) ? G.T[nr * COLS + nc] : null;
   if (nb && owner(nb) === o) return;                       // interior edge
   const a = v[edge], b = v[(edge + 1) % 6];
   segs[o] = (segs[o] || "") + `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  });
 });
 let out = "";
 Object.keys(segs).forEach(o => {
  const col = COL[o];
  out += `<g transform="translate(0,${u(1.6).toFixed(1)})" opacity=".55"><path d="${segs[o]}" fill="none"
      stroke="#1A1508" stroke-width="${u(3.4).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/></g>`
   + `<path d="${segs[o]}" fill="none" stroke="${shift(col, -.3)}" stroke-width="${u(3.4).toFixed(1)}"
      stroke-linecap="round" stroke-linejoin="round"/>`
   + `<path d="${segs[o]}" fill="none" stroke="${shift(col, .25)}" stroke-width="${u(1.5).toFixed(1)}"
      stroke-linecap="round" stroke-linejoin="round"/>`;
 });
 return out;
}

function newGame() {
 ARM = null; ARMACT = null; ARMHERD = null;
 SEAT = 0;
 LAND = {key: null, html: ""};      // a new board is always a new land layer
 const doc = $("doc").value, human = doc === "human";
 FG.HANDICAP = $("even").checked ? 1 : 0;
 FG.createGame({them: human ? null : doc, pvp: human});
 $("done").innerHTML = "";
 render();
}

// The end of a seat's year. In a single-player game that is the end of the
// year outright. In a two-player game the first seat hands over and the world
// does not move until the second has finished too.
function endTurn() {
 if (FG.G.over) return;
 ARM = null; ARMACT = null; ARMHERD = null;
 if (pvp() && SEAT === 0) { SEAT = 1; render(); return; }
 if (FG.endYear()) finish();
 SEAT = 0;
 render();
}

// OP-21's condition, and it is deliberately not "everything is used". Waiting
// for movement, act and intervention all to be spent hangs forever whenever a
// player has no legal intervention or does not want to walk their last tile. A
// player who has acted and has nothing left to call has finished their year in
// every sense that matters, so movement does not gate it.
function canStillIntervene(seat) {
 const G = FG.G;
 if (G.p[seat].cast || G.over) return false;
 if (FG.R2.teaching && FG.TEACH.some(s => targets(s.id, seat).length)) return true;
 const lostN = lostCount(seat);
 if (DIVINE.some((s, i) => i >= lostN && targets(s.id, seat).length)) return true;
 const open = civicOpen(seat);
 return CIVIC.some(s => open.includes(s.id) && targets(s.id, seat).length);
}
const nothingFurther = seat => FG.G.p[seat].acted && !canStillIntervene(seat);

// Called at the end of every input handler rather than from render(), which
// would recurse.
function maybeHandOver() {
 if (AUTOPASS && !FG.G.over && nothingFurther(SEAT)) endTurn();
}

function render() {
 // Sprites are measured in game units, so they need to be told what a unit is
 // worth in screen pixels before anything asks for one. Told rather than
 // assumed, because U is derived from SZ and SZ is allowed to change - the
 // same reason the interface asks the engine for numbers instead of keeping
 // its own copies.
 ART.unit(U);
 const G = FG.G, TUNE = FG.TUNE, ME = SEAT, THEM = other(SEAT);
 const R = reach(ME), S = score(), walk = Object.keys(R).length - 1;
 // 1.19. Where the herds are, and where the one you have picked up can walk to.
 // `herdReach` is a flood fill through `herdBlocked`, which is the whole third
 // movement rule made visible — farmland open, the other power's quiet shut.
 const myHerds = FG.R2.herds ? FG.herdsOf(ME) : [];
 const herdReach = () => {
  const h = ARMHERD, s = new Set(), q = [h.at];
  s.add(h.at);
  while (q.length) FG.NB[q.shift()].forEach(x => {
   if (s.has(x) || FG.herdBlocked(x, ME)) return;
   s.add(x); q.push(x);
  });
  s.delete(h.at);
  return s;
 };
 const tg = ARM ? new Set(targets(ARM, ME))
   : ARMACT === "split" ? new Set(FG.splitTargets(G.p[ME].pos, ME))
   : ARMHERD === "pick" ? new Set(myHerds.map(h => h.at))
   : ARMHERD ? herdReach() : null;
 const isCivic = ARM && CIVIC.some(c => c.id === ARM);
 // 1.16 / 1.17. Which of the outlined tiles are out past your hearing and will
 // take a piece of you. Drawn rather than written: a solid outline is a thing
 // you do, a dashed one is a thing you say. It has to be visible *before* the
 // tile is chosen, because the toll is permanent and the year is spent on the
 // tap — the whole point of the mechanic is that it is a decision, and a cost
 // you only learn about in the chronicle afterwards is not a decision.
 const toll = ARM ? new Set([...(tg || [])].filter(k => FG.tolled(ARM, k, ME))) : new Set();
 const threat = G.armies.some(a => a.own === THEM);

 // Whose year it is, in that seat's own colour, across the whole width of the
 // board. On a shared screen this is the only thing standing between one
 // player and somebody else's year, so it is not a label in a side panel.
 const tb = $("turnbar");
 if (pvp() && !G.over) {
  tb.style.display = "block";
  tb.style.background = COL[ME];
  tb.innerHTML = `<span>${SEATNAME[ME]}</span><span class="yr">year ${G.turn}</span>`;
 } else tb.style.display = "none";
 $("map").style.borderColor = pvp() && !G.over ? COL[ME] : "";
 $("map").style.borderWidth = pvp() && !G.over ? "3px" : "";

 $("bar").innerHTML = `
 <div class="c"><div class="l">year</div><div class="v">${G.turn}<span style="font-size:13px;color:var(--faint)"> / ${TUNE.turns.v}</span></div></div>
 <div class="c"><div class="l">moves</div><div class="v ${G.p[ME].mp ? "" : "r"}">${G.p[ME].mp}</div></div>`
 // OP-14. What is left of you. Only shown when there is something that can take
 // it — with the toll off, this is always 100% and is noise in the bar.
 + (FG.R2.fade ? `<div class="c"><div class="l">of you</div><div class="v ${
     FG.manifest(ME) <= 0.35 ? "r" : FG.manifest(ME) < 1 ? "u" : ""
   }">${Math.round(FG.manifest(ME) * 100)}<span style="font-size:13px;color:var(--faint)">%</span></div></div>` : "")
 // 1.20 / 1.21. A second number about the stones, and it is the other half of the
 // same object: what is still answering, and what is only relaying now. A player
 // who has never read OP-13 should be able to watch a stone go from the first
 // count to the second and work out for themselves what happened to it.
 + (FG.R2.deadOrders && FG.deadStones(ME).length
    ? `<div class="c"><div class="l">relays</div><div class="v u">${FG.deadStones(ME).length}</div></div>` : "")
 + `
 <div class="c"><div class="l">can walk to</div><div class="v ${walk <= 5 ? "r" : "m"}">${walk}</div></div>
 <div class="c"><div class="l">blessed</div><div class="v h">${S[ME].h}</div></div>
 <div class="c"><div class="l">farmland</div><div class="v u">${S[ME].c}</div></div>
 <div class="c"><div class="l">${pvp() ? SEATNAME[ME] : "you"}</div>
  <div class="v" style="color:${COL[ME]}">${S[ME].tot}</div></div>
 <div class="c"><div class="l">${pvp() ? SEATNAME[THEM] : "them"}</div>
  <div class="v ${threat ? "r" : ""}" style="${threat ? "" : "color:" + COL[THEM]}">${S[THEM].tot}</div></div>`;

 // The land and its borders are 3,400-odd nodes and change only when the board
 // does — not when you move your token or arm an intervention, which is most of
 // what a click is. Cached against everything tileArt and boundaries actually
 // read, so this stays a pure function of state and owns no rules.
 let over = "", scrim = "";
 // The art mode belongs in this key for exactly the reason everything else
 // does: `tileArt` reads it. Leave it out and switching sets appears to do
 // nothing at all until the board next changes on its own, which reads as a
 // broken switch rather than as a stale cache and costs an hour to find.
 const key = ART.mode() + "|" + G.T.map(t => t.t + t.st + (t.own === null ? "-" : t.own)
   + (t.set ? "s" + t.set.own + Math.round(t.set.pop) + (t.set.taught ? "T" : "")
              + (t.set.tabu ? "X" : "") + (t.set.ring ? "R" + t.set.ring.by : "") : "")).join("")
   + "|" + G.stones.map(a => a.join(",")).join("/");
 const landStale = key !== LAND.key;
 if (landStale) {
  let art = "";
  G.T.forEach((t, k) => { art += tileArt(t, k); });
  LAND = {key, html: art + boundaries(G)};
 }
 G.T.forEach((t, k) => {
  const [x, y] = px(t.c, t.r);
  const go = tg ? tg.has(k) : (R[k] !== undefined && k !== G.p[ME].pos);
  if (!go) scrim += `<path d="${hexPath(x, y)}" fill="#0B0E08" opacity="${tg ? ".34" : ".2"}" pointer-events="none"/>`;
  if (go && tg) over += `<path d="${hexPath(x, y, SZ - u(3))}" fill="none"
    stroke="${isCivic ? "#F0C060" : "#FFFFFF"}" stroke-width="${u(1.8)}" opacity=".95"
    ${toll.has(k) ? `stroke-dasharray="${u(5).toFixed(1)} ${u(4).toFixed(1)}"` : ""} pointer-events="none"/>`;
 });

 // settlements — the complex says what stage it is
 G.T.forEach((t, k) => {
  if (!t.set) return;
  const [x, y] = px(t.c, t.r), b = band(t.set.pop)[1];
  // 1.9. The siege, drawn before the buildings so the buildings sit inside it.
  // A closing ring is the one thing on this board that happens *to* a place
  // over more than one year, and a player who cannot see it coming cannot
  // relieve it — which is the only counter the rule has.
  if (t.set.ring) over += `<path d="${hexPath(x, y, SZ - u(2))}" fill="none"
    stroke="${COL[t.set.ring.by]}" stroke-width="${u(2.6)}" opacity=".85"
    stroke-dasharray="${u(6).toFixed(1)} ${u(4).toFixed(1)}" pointer-events="none"/>`;
  // A forbidden place: a closed ring, and no fields, ever again.
  if (t.set.tabu) over += `<path d="${hexPath(x, y, SZ - u(6))}" fill="none"
    stroke="${P.ink}" stroke-width="${u(1.4)}" opacity=".5" pointer-events="none"/>`;
  over += `<g pointer-events="none">${temple(x, y - u(2), b, COL[t.set.own], t.seed, t.set.own)}
   <text x="${x}" y="${y + SZ - u(3.5)}" text-anchor="middle" font-family="IBM Plex Sans Condensed,sans-serif"
   font-size="${u(10).toFixed(1)}" font-weight="600" fill="${P.ink}" stroke="#000"
   stroke-width="${u(2.4)}" paint-order="stroke" stroke-opacity=".6">${Math.round(t.set.pop)}</text></g>`;
 });

 // stones — pale while they still answer, leaning and cracked when they do not
 [0, 1].forEach(who => G.stones[who].forEach(sk => {
  const t = T(sk), [x, y] = px(t.c, t.r);
  over += `<g pointer-events="none">${stoneGroup(x, y, sk, who, region(sk, who).length,
    FG.stoneWorks(sk, who), FG.R2.stonesGrow ? FG.courses(sk) : 0)}</g>`;
 }));

 // marching columns
 G.armies.forEach(a => {
  const t = T(a.at), [x, y] = px(t.c, t.r), d = T(a.to), [dx, dy] = px(d.c, d.r);
  const col = a.own === 0 ? shift(COL[0], -.15) : "#C4443A";
  over += `<g pointer-events="none"><line x1="${x}" y1="${y}" x2="${dx}" y2="${dy}" stroke="${col}"
   stroke-width="${u(1.2)}" stroke-dasharray="${u(3)} ${u(4)}" opacity=".6"/>
   <path d="M${x} ${y - u(9)} l${u(7.5)} ${u(13)} l${u(-15)} 0 Z" fill="${col}" stroke="#000" stroke-width="${u(0.8)}"/>
   <text x="${x}" y="${y + u(2)}" text-anchor="middle" font-family="IBM Plex Sans Condensed,sans-serif"
   font-size="${u(8).toFixed(1)}" font-weight="700" fill="#12181A">${Math.round(a.n)}</text></g>`;
 });
 G.refugees.forEach(f => {
  const t = T(f.at), [x, y] = px(t.c, t.r), d = T(f.to), [dx, dy] = px(d.c, d.r);
  const col = SPARK[f.own][1];
  over += `<g pointer-events="none"><line x1="${x}" y1="${y}" x2="${dx}" y2="${dy}" stroke="${col}"
   stroke-width="${u(1.2)}" stroke-dasharray="${u(1)} ${u(5)}" opacity=".55"/>
   <circle cx="${x}" cy="${y - u(3)}" r="${u(7.4)}" fill="${col}" stroke="#000" stroke-width="${u(0.8)}"/>
   <text x="${x}" y="${y - u(1)}" text-anchor="middle" font-family="IBM Plex Sans Condensed,sans-serif"
   font-size="${u(8).toFixed(1)}" font-weight="700" fill="#12181A">${Math.round(f.n)}</text></g>`;
 });

 // 1.19. Roaming peoples. Drawn as a ring of beasts rather than a column's
 // wedge, because they are not marching anywhere in the sense a levy is — the
 // line to where they are going is dotted much more loosely than an army's, and
 // a herd that has arrived has no line at all.
 G.herds.forEach(h => {
  const t = T(h.at), [x, y] = px(t.c, t.r), col = h.own === 0 ? shift(COL[0], .1) : shift(COL[1], .1);
  if (h.to !== h.at) {
   const d = T(h.to), [dx, dy] = px(d.c, d.r);
   over += `<line x1="${x}" y1="${y}" x2="${dx}" y2="${dy}" stroke="${col}" pointer-events="none"
    stroke-width="${u(1.1)}" stroke-dasharray="${u(1.4)} ${u(6)}" stroke-linecap="round" opacity=".5"/>`;
  }
  // The beasts switch; the count, the held-here mark and the dotted line do
  // not. Anything carrying a number stays vector in every mode - a sprite
  // cannot hold a digit that changes every year.
  const beasts = ART.sprite("herd." + h.own, x, y) || `
   <ellipse cx="${x}" cy="${y + u(9.6)}" rx="${u(8)}" ry="${u(2.2)}" fill="#000" opacity=".28"/>
   <path d="M${x - u(9)} ${y + u(3)} q${u(3)} ${u(-11)} ${u(9)} ${u(-8)} q${u(6)} ${u(-3)} ${u(9)} ${u(8)} Z"
    fill="${col}" stroke="#000" stroke-width="${u(0.9)}"/>
   <path d="M${x - u(7)} ${y - u(5)} q${u(-3)} ${u(-4)} ${u(1)} ${u(-5)}" fill="none" stroke="#000"
    stroke-width="${u(1.1)}" stroke-linecap="round" opacity=".8"/>
   <path d="M${x + u(7)} ${y - u(5)} q${u(3)} ${u(-4)} ${u(-1)} ${u(-5)}" fill="none" stroke="#000"
    stroke-width="${u(1.1)}" stroke-linecap="round" opacity=".8"/>`;
  over += `<g pointer-events="none">${beasts}
   ${h.held > 0 ? `<circle cx="${x}" cy="${y - u(12)}" r="${u(3)}" fill="${P.ink}" opacity=".8"/>` : ""}
   <text x="${x}" y="${y + u(1)}" text-anchor="middle" font-family="IBM Plex Sans Condensed,sans-serif"
   font-size="${u(8).toFixed(1)}" font-weight="700" fill="#12181A">${Math.round(h.n)}</text></g>`;
 });

 // 1.12. Ground that will not take a furrow yet. A short scatter of dashes
 // rather than a fill, because the tile is *wild* — it is already drawn as
 // thorn, and this says only that it is thorn nothing can plough back under.
 // It comes off on its own after three years and nothing announces it, which is
 // right: the settled player finds out by trying.
 G.T.forEach((t, k) => {
  if (!FG.barren(t)) return;
  const [x, y] = px(t.c, t.r);
  over += `<path d="${hexPath(x, y, SZ - u(7))}" fill="none" stroke="${P.ink}" opacity=".33"
   stroke-width="${u(1.3)}" stroke-dasharray="${u(2)} ${u(5)}" pointer-events="none"/>`;
 });

 // 1.19. Kurgans. A mound in a field: the ground stays farmland and stays
 // theirs, and this sits on top of it. Nothing about it is a stone any more —
 // the stone layer above draws it cracked and leaning, and this is the earth
 // heaped over that.
 // Drawn as a barrow and not as a bump, because the first version was a bump and
 // a bump is already taken twice over: the hill glyph is a brown hump at the top
 // of a tile, and a herd is a bright hump with horns. Measured by looking at it
 // — three humps on one board is one hump. So: wide and low, in earth rather
 // than in a power's colour, with kerb stones round the foot, and the colour
 // reduced to a line over the crest saying whose memory it is.
 G.T.forEach((t, k) => {
  if (t.kur === undefined || t.kur === null) return;
  const [x, y] = px(t.c, t.r), col = COL[t.kur];
  const kerb = [-13, -7.5, 7.5, 13].map(dx =>
   `<rect x="${x + u(dx) - u(1.6)}" y="${y + u(3.4)}" width="${u(3.2)}" height="${u(4.4)}"
     rx="${u(0.8)}" fill="#2A2420" stroke="#000" stroke-width="${u(0.6)}"/>`).join("");
  over += `<g pointer-events="none">${ART.sprite("kurgan." + t.kur, x, y) || `
   <ellipse cx="${x}" cy="${y + u(7)}" rx="${u(15)}" ry="${u(3)}" fill="#000" opacity=".3"/>
   <path d="M${x - u(15)} ${y + u(6)} q${u(15)} ${u(-15)} ${u(30)} 0 Z" fill="#4A3E30"
    stroke="#000" stroke-width="${u(1)}"/>
   <path d="M${x - u(11)} ${y + u(2.5)} q${u(11)} ${u(-8)} ${u(22)} 0" fill="none" stroke="${col}"
    stroke-width="${u(1.6)}" opacity=".9" stroke-linecap="round"/>
   ${kerb}`}</g>`;
 });

 // 1.25. Cairns, and the footprint they committed.
 //
 // The footprint is drawn first and drawn as *ground*, because it is ground: a
 // committed tile is still farmland, still scores, and still belongs to whoever
 // holds it. What has changed about it is that nobody will ever break it again,
 // so it gets a hatch across the furrows and a thin edge in the builder's
 // colour. OP-28 is the whole reason this is on the board at all — the cost of a
 // cairn is a future, and a future subtracted out of sight is weather.
 //
 // Then the cairn itself, as a stepped barrow: one slab a course, riding up on
 // what has been built to it, the same language the stone courses use in 1.20.
 // The crest carries the builder's colour, and the sole tallest in the valley —
 // the only one holding anything back — carries it doubled.
 G.T.forEach((t, k) => {
  if (t.cmt === undefined || t.cmt === null) return;
  const m = FG.T(t.cmt) && FG.T(t.cmt).mnd;
  if (!m) return;
  const [x, y] = px(t.c, t.r), col = COL[m.own];
  over += `<g pointer-events="none" opacity=".55">${
   [-8, 0, 8].map(dy =>
    `<path d="M${x - u(13)} ${y + u(dy)} l${u(26)} 0" stroke="${col}" stroke-width="${u(0.9)}"
      stroke-dasharray="${u(2.5)} ${u(3.5)}" fill="none"/>`).join("")}</g>`;
 });

 G.T.forEach((t, k) => {
  if (!t.mnd) return;
  const [x, y] = px(t.c, t.r), col = COL[t.mnd.own];
  const h = t.mnd.h, sole = FG.soleTallest(t.mnd.own) && FG.tallestCairn() === h;
  // One slab a course, narrowing as it goes up. Height is footprint, so the
  // drawing says how much country is underneath it.
  const steps = [];
  for (let i = 0; i < h; i++) {
   const w = 15 - i * 1.7, yy = 6 - i * 2.6;
   steps.push(`<rect x="${x - u(w)}" y="${y + u(yy - 2.6)}" width="${u(w * 2)}" height="${u(2.8)}"
     rx="${u(0.7)}" fill="#4A3E30" stroke="#000" stroke-width="${u(0.7)}"/>`);
  }
  over += `<g pointer-events="none">
   <ellipse cx="${x}" cy="${y + u(7)}" rx="${u(16)}" ry="${u(3)}" fill="#000" opacity=".35"/>
   ${steps.join("")}
   <path d="M${x - u(15 - (h - 1) * 1.7)} ${y + u(6 - (h - 1) * 2.6 - 2.6)} l${u((15 - (h - 1) * 1.7) * 2)} 0"
    stroke="${col}" stroke-width="${u(sole ? 2.6 : 1.4)}" opacity="${sole ? 1 : .75}" stroke-linecap="round"/>
   </g>`;
 });

 // the two powers, as figures
 //
 // 1.23 / OP-14. And they thin as they are spent. This is half of that rule and
 // the half that is not arithmetic: the bar has always been able to say *34% of
 // you* and a number in a corner is not a thing you feel. Both powers, because
 // both pay the tolls and watching the other one go transparent is how you learn
 // what the tolls are doing to them.
 //
 // Not behind `zeroSpent` — it is a drawing of `fade`'s stock and belongs
 // wherever that stock exists. The shadow goes first and fastest, because a thing
 // with no body casts nothing; at the bottom what is left is an outline standing
 // in a field.
 [0, 1].forEach(w => {
  const t = T(G.p[w].pos), [x, y] = px(t.c, t.r), col = COL[w];
  const m = FG.R2.fade ? FG.manifest(w) : 1;
  const op = (0.12 + 0.88 * m).toFixed(2);      // 100% -> 1.00, 10% -> 0.21, 0 -> 0.12
  const sh = (0.3 * m * m).toFixed(2);          // the shadow goes first
  over += `<g pointer-events="none" opacity="${op}">
   <circle cx="${x}" cy="${y}" r="${u(17)}" fill="none" stroke="#000" stroke-width="${u(3.6)}" opacity="${(0.35 * m).toFixed(2)}"/>
   <circle cx="${x}" cy="${y}" r="${u(17)}" fill="none" stroke="${col}" stroke-width="${u(1.9)}"
    stroke-dasharray="${u(5)} ${u(3.4)}" opacity=".95"/>
   <ellipse cx="${x}" cy="${y + u(9.6)}" rx="${u(7.5)}" ry="${u(2.2)}" fill="#000" opacity="${sh}"/>
   ${ART.sprite("figure." + w, x, y) || (w === 0 ? figureF(x, y, col) : figureM(x, y, col))}</g>`;
 });

 // Three layers, written independently. Replacing the land is ~3,400 nodes for
 // the browser to parse; the scrim and the tokens are a few dozen. Moving your
 // token or arming an intervention touches only the cheap two.
 const m = $("map");
 if (landStale) {
  // The sprite definitions are written on the same occasions the land is, which
  // is exactly when they can go stale — a change of art mode is in that cache
  // key. They sit as a direct child of the <svg> rather than inside the land's
  // <g>: legal either way, but defs nested in a group is the unusual shape, and
  // every layer above references them by id, so the conventional place is the
  // one least likely to meet a renderer that disagrees.
  m.innerHTML = '<title>The contested valley</title><desc>Hex map with marching columns.</desc>'
    + ART.defs()
    + `<g>${LAND.html}</g><g id="mscrim"></g><g id="mover"></g>`;
 }
 $("mscrim").innerHTML = scrim;
 $("mover").innerHTML = over;
 // The handler reads SEAT at click time rather than closing over it, so the
 // cached land layer can outlive a hand-over.
 if (landStale) m.querySelectorAll(".hx").forEach(e => {
  e.onclick = () => {
   const k = +e.dataset.k;
   if (FG.G.over) return;
   if (ARM) {
    if (!targets(ARM, SEAT).includes(k)) return;
    if (doIntervene(ARM, k, SEAT)) { FG.G.p[SEAT].cast = true; ARM = null; }
    render(); maybeHandOver(); return;
   }
   // 1.6. The act's target, chosen the same way an intervention's is, so a
   // tablet learns one gesture rather than two.
   if (ARMACT) {
    if (!FG.splitTargets(FG.G.p[SEAT].pos, SEAT).includes(k)) return;
    if (doAct(ARMACT, SEAT, k)) { FG.G.p[SEAT].acted = true; ARMACT = null; }
    render(); maybeHandOver(); return;
   }
   // 1.19. Sending the herds: pick one, then say where. Neither click spends
   // anything — no act, no intervention, no toll — so there is no
   // maybeHandOver() here and no `acted` set. A herd never stops hearing you.
   if (ARMHERD) {
    if (ARMHERD === "pick") {
     const h = FG.G.herds.find(x => x.at === k && x.own === SEAT);
     if (h) ARMHERD = h;
     render(); return;
    }
    if (k === ARMHERD.at || FG.herdBlocked(k, SEAT)) return;
    // Refuse a destination with no road rather than accepting it and having the
    // herd stand still for forty years wondering. The reach set drawn on the
    // board is the same test, so this only catches a mis-tap.
    if (FG.herdStep(ARMHERD.at, k, SEAT) === undefined) return;
    ARMHERD.to = k; ARMHERD = null;
    render(); return;
   }
   const RR = reach(SEAT);
   if (RR[k] === undefined || k === FG.G.p[SEAT].pos) return;
   FG.G.p[SEAT].mp -= RR[k]; FG.G.p[SEAT].pos = k; render();
  };
 });

 // What used to stand in a column beside the board — who is marching, which
 // stones are yours, which settlements are largest — is gone, and gone rather
 // than hidden. Every one of those lists was a second telling of something the
 // map already draws: a levy is a wedge on the road it is walking, a herd is a
 // ring of beasts with its count on it, a settlement carries its own population,
 // and a stone is a stone. The board is the instrument; a panel that repeats it
 // costs the board the height it is drawn in. See the note on .play.

 // interventions
 const lostN = lostCount(ME), bg = bigCount(ME), hg = hugeCount(ME),
       wk = working(ME).length, cs = civicStrength(ME);
 // 1.18. `strength` and `past 800` came out. Neither gates anything any more —
 // the works read `taughtCount` now — and a number on the status line that no
 // rule consults is worse than absent, because it reads as a thing to aim at.
 // Dropping them is also what lets the tally sit on the works row rather than
 // taking a fifth line of its own.
 const gates = FG.R2.taughtGates && FG.R2.teaching;
 $("tally").textContent =
  (FG.R2.taughtLoss ? `${FG.taughtCount(ME)} taught to till` : `${bg} past 150`)
  + (gates ? "" : ` · ${hg} past 800 · strength ${cs}`)
  + ` · ${wk} working stone${wk === 1 ? "" : "s"}`
  + (FG.R2.fade ? ` · ${Math.round(FG.manifest(ME) * 100)}% of you left` : "")
  + (G.p[ME].cast ? " · intervened" : "");

 // OP-23. One chip each, in three groups, and nothing is ever removed from the
 // row: a lost wonder keeps its place struck through and a work that has not
 // opened keeps its place dim. That is the point of the row rather than a
 // consequence of it — see the note in index.html.
 //
 // Off by class rather than by the disabled attribute, because a disabled
 // button fires no pointer events and a chip that cannot be used still has to
 // be able to say why. That is also what makes this work on a tablet with no
 // tooltips: arming was always two-step, so the description arrives in the step
 // where the target is chosen, before anything has been spent.
 const spent = G.p[ME].cast || G.over || FG.spent(ME);
 const nothingLeft = FG.spent(ME) ? "There is nothing left of you. You may only watch." : null;
 const chip = (s, kind, live, n, why, gone) =>
  `<button class="chip ${kind}${live ? "" : " off"}${gone ? " gone" : ""}${ARM === s.id ? " on" : ""}"`
  + ` data-iv="${s.id}" data-why="${why.replace(/"/g, "&quot;")}">${s.n}`
  + (live && n ? `<sup>${n}</sup>` : "") + "</button>";
 const busy = nothingLeft || "You have already intervened this year.";

 // OP-19. The teachings — neither wonders nor works, and only there at all when
 // the rule is on. First in the row, because they are what the batch is about.
 $("rowteach").style.display = FG.R2.teaching ? "" : "none";
 // 1.19. The third teaching is only in the row when its rule is on. It would
 // otherwise sit there permanently dark saying *none of yours is in reach*,
 // which advertises a rule that is not running and gives the wrong reason for
 // it being unavailable.
 $("teach").innerHTML = !FG.R2.teaching ? "" :
  FG.TEACH.filter(s => s.id !== "herd" || FG.R2.herds).map(s => {
  const n = targets(s.id, ME).length;
  // And when it *is* on, the reason it is dark is usually not reach at all.
  // Herding needs the plough to exist somewhere first, and a player who has not
  // seen a furrow yet should be told that rather than told to walk further.
  const why = s.id === "herd" && !FG.ploughed()
    ? "Nobody has broken ground anywhere yet. There is nothing to keep herds instead of."
    : "None of yours is in reach.";
  return chip(s, "tch", !spent && !!n, n, spent ? busy : n ? "" : why, false);
 }).join("");

 const open = civicOpen(ME);
 $("divine").innerHTML = DIVINE.map((s, i) => {
  const gone = i < lostN, n = gone ? 0 : targets(s.id, ME).length;
  return chip(s, "div", !gone && !spent && !!n, n,
   gone ? "Gone, and it does not come back." : spent ? busy : n ? "" : "Nothing in reach.", gone);
 }).join("");

 $("civic").innerHTML = CIVIC.map((s, i) => {
  const need = [TUNE.t1.v, TUNE.t2.v, TUNE.t3.v][i], ok = open.includes(s.id);
  const n = ok ? targets(s.id, ME).length : 0;
  // 1.18. The reason a work is locked names the thing the rule actually reads,
   // and the engine is asked which that is rather than the interface assuming.
   return chip(s, "civ", ok && !spent && !!n, n,
   !ok ? "Not yet — this needs " + need + " " + FG.civicNeed(ME) + "." : spent ? busy : n ? "" : "Nothing in range.", false);
 }).join("");

 const IV = {};
 [].concat(FG.TEACH, DIVINE, CIVIC).forEach(s => { IV[s.id] = s; });
 document.querySelectorAll("[data-iv]").forEach(b => {
  const s = IV[b.dataset.iv], live = !b.classList.contains("off");
  const say = () => showHint(live ? s.d : (b.dataset.why || s.d));
  b.onclick = () => {
   if (!live) { say(); return; }
   ARM = ARM === b.dataset.iv ? null : b.dataset.iv; render();
  };
  b.onmouseenter = say; b.onfocus = say;
  b.onmouseleave = () => showHint(); b.onblur = () => showHint();
 });
 // Arming an intervention that has exactly one target still needs the tile
 // chosen, so hand-over is checked after the target is taken, not here.

 // the chart
 if (G.hist.length > 1) {
  const H = G.hist;
  const mx = Math.max(...H.map(o => Math.max(o.s[0].tot, o.s[1].tot)), 10);
  const mr = Math.max(...H.map(o => o.r), 1), n = TUNE.turns.v;
  const X = i => 6 + (i / (n - 1)) * 288, Y = v => 124 - (v / mx) * 116, YR = v => 124 - (v / mr) * 116;
  const p = f => H.map((o, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + f(o).toFixed(1)).join(" ");
  // The acting seat's line goes on top, so the chart reads for whoever is
  // holding the board.
  $("chart").innerHTML =
   `<title>Score over time</title><desc>Both totals, and how far the acting seat can walk.</desc>
    <path d="${p(o => YR(o.r))}" fill="none" stroke="#C9A24A" stroke-width="1.3" opacity=".75"/>
    <path d="${p(o => Y(o.s[THEM].tot))}" fill="none" stroke="${COL[THEM]}" stroke-width="1.8"/>
    <path d="${p(o => Y(o.s[ME].tot))}" fill="none" stroke="${COL[ME]}" stroke-width="1.8"/>`;
 }
 $("ckey").innerHTML =
  `<span><i style="background:${COL[ME]}"></i>${pvp() ? SEATNAME[ME] : "you"}</span>
   <span><i style="background:${COL[THEM]}"></i>${pvp() ? SEATNAME[THEM] : "them"}</span>
   <span><i style="background:#C9A24A"></i>where you can walk</span>`;


 // The chronicle is written from the left-hand seat and says "you" about it.
 // In a two-player game that is somebody else's chronicle half the time, so it
 // is labelled and folded away rather than presented as yours. Two properly
 // addressed logs means changing every say() in actions.js and tick.js, which
 // is a larger and separate piece of work — see OP-21.
 const L = $("log");
 L.innerHTML = G.log.slice(-45).map(l => `<p class="${l.cls}"><b>y${l.t}</b>${l.x}</p>`).join("");
 L.scrollTop = L.scrollHeight;
 // Behind a door now rather than folded into the sidebar, so what is written
 // from here is the dialog's heading. Still labelled in a two-player game,
 // because the chronicle says "you" about the left hand either way — see OP-21.
 $("chrontitle").textContent = pvp() ? "what happened · told from the left hand" : "what happened";

 // 1.23 / OP-14. Nothing left of you: no move, no act, no intervention, for the
 // rest of the game. `a` is what every button in the action row already reads, so
 // folding it in here stops all four of them and the pass button with one word.
 // The chips are stopped by `spent` a few lines down, on the same principle.
 const gone = FG.spent(ME);
 const k = G.p[ME].pos, a = G.p[ME].acted || G.over || gone;
 $("bless").disabled = a || !!ARM || !blessGain(k, ME);
 $("stone").disabled = a || !!ARM || !canStone(k, ME);
 $("found").disabled = a || !!ARM || !canFound(k, ME);
 $("split").disabled = a || !!ARM || !canSplit(k, ME);
 $("split").classList.toggle("armed", ARMACT === "split");

 // 1.19. The three herd buttons come and go rather than sitting there dark, and
 // that is a layout decision as much as a teaching one. Measured in a browser:
 // nine buttons wrap the action row onto a second line, and the four labelled
 // rows are the layout. So Send appears once you have a people walking, and Stop
 // and Raise a mound appear when you are standing on them — which is also when
 // each of the three is the thing you might want, so the row says what is
 // possible here rather than what is possible in general.
 //
 // Stop and Mound show *dark* when you are on a herd and the act is not legal,
 // because "you may not stop beside another settlement" is worth learning and a
 // button that vanishes teaches nobody anything.
 //
 // 1.24. And under the roaming flag all three go for good, which is the rule
 // stated in the interface: once you have said the word there is no button that
 // does anything to them ever again. Hidden rather than disabled for the same
 // reason as above — a row of permanently dead buttons teaches the wrong thing.
 const hand = FG.R2.herds && !FG.R2.roam;
 const mine = hand ? (FG.herdAt(k) && FG.herdAt(k).own === ME ? FG.herdAt(k) : null) : null;
 const showHerd = (id, on) => { $(id).style.display = on ? "" : "none"; };
 showHerd("drive", hand && (myHerds.length > 0 || !!ARMHERD));
 showHerd("stopherd", !!mine);
 showHerd("mound", !!mine);
 if (hand) {
  // Send is not an act, so it stays live after you have acted — the only button
  // in this row of which that is true, and it is true on purpose.
  // Send is not an act, so it stays live after you have acted — but 1.23 stops it
  // like everything else. Steering costs nothing, and there is nobody left to do
  // the steering.
  $("drive").disabled = G.over || gone || !!ARM || !!ARMACT;
  $("drive").classList.toggle("armed", !!ARMHERD);
  $("stopherd").disabled = a || !!ARM || !!ARMACT || !!ARMHERD || !FG.canStop(mine);
  $("mound").disabled   = a || !!ARM || !!ARMACT || !!ARMHERD || !FG.canMound(mine);
 }
 $("pass").disabled = a || !!ARM || !!ARMACT || !!ARMHERD;
 $("end").disabled = G.over;
 $("end").textContent = !pvp() ? "End year"
  : SEAT === 0 ? "Hand to the right" : "End the year";

 const hint = $("hint");
 hint.className = "hintline" + (ARM || ARMACT || ARMHERD ? " arm" : "");
 const sb = stoneBlock(k, ME), fb = foundBlock(k, ME);
 // The armed chip says what it is as well as what to do with it, so a player on
 // a tablet who has never hovered anything still reads the description once,
 // before the target is chosen and the year is spent.
 const armed = ARM ? [].concat(FG.TEACH, DIVINE, CIVIC).find(s => s.id === ARM) : null;
 // 1.16 / 1.17. Name the price beside the instruction, and only when some tile
 // on the board actually carries it — a warning that is always there is read as
 // decoration within about three years.
 const dash = ARM && toll.size
   ? "  ·  A dashed tile is beyond your hearing: " + Math.round(FG.R2TUNE.dreamToll * 100)
     + "% of you, for good."
   : "";
 HINT = G.over ? "" : ARMACT === "split"
    ? "Half of them go over the rise. Choose the blessed tile they stop at, or press Split again to put it down."
  : ARMHERD === "pick"
    ? "Choose which herd. This costs you nothing — they never stop hearing you."
  : ARMHERD
    ? "Say where they are to go. They walk a tile a year, over fields and through your own country, and not into anyone else's blessing."
  : ARM ? (armed ? armed.d + "  ·  " : "")
    + "Choose an outlined tile, or press the chip again to put it down." + dash
  : gone ? "There is nothing left of you. The years still turn and the ground still changes hands, and you have no part in it now. End the year."
  : a ? (pvp() && SEAT === 0 ? "Acted this year. You may still intervene, then hand over."
                             : "Acted this year. You may still intervene, then end the year.")
  : walk === 0 ? "There is nowhere you can walk from here."
  : (fb && fb.indexOf("%") > 0 ? "Cannot found here: " + fb + "."
   : sb && sb.indexOf("connected") > 0 ? "No stone here: " + sb + "." : fb ? "Cannot found here: " + fb + "." : "");
 showHint();
}

function finish() {
 const G = FG.G, S = score(), H = G.hist;
 const two = pvp();
 const mt = G.T.filter(t => t.t === "mount").length;
 const line = who => {
  let peak = 0, pt = 0;
  H.forEach((o, i) => { if (o.s[who].h > peak) { peak = o.s[who].h; pt = i + 1; } });
  return `<p><b style="color:${COL[who]}">${two ? SEATNAME[who] : (who === 0 ? "you" : "them")}</b> —
   ${S[who].tot} points: ${S[who].h} blessed, ${S[who].c} farmland, ${S[who].s} settled.
   Blessing peaked at ${peak} in year ${pt}. Ended with ${DIVINE.length - lostCount(who)} of six
   wonders${FG.R2.taughtLoss ? ", " + FG.taughtCount(who) + " taught to till" : ""}
   and ${civicOpen(who).length} of ${CIVIC.length} works.</p>`;
 };

 if (two) {
  const w = S[0].tot > S[1].tot ? 0 : S[1].tot > S[0].tot ? 1 : null;
  $("done").innerHTML = `<div class="done">
  <h3>${w === null ? "level" : SEATNAME[w] + " holds more"}</h3>
  ${line(0)}${line(1)}
  ${mt ? `<p>${mt} tiles of the valley are mountain that was not there when either of you came.</p>` : ""}
  <p style="color:var(--faint);font-size:14px;margin-top:12px">The question OP-21 was opened for,
  and the one nothing in the harness can ask: did either of you ever <i>decline</i> to teach a
  settlement to till — knowing what it would have been worth, and what it would have cost to
  hear?</p></div>`;
  return;
 }

 const walk = Object.keys(reach(0)).length - 1;
 const doc = {cities:"Cities", bands:"Bands", mixed:"Mixed", haunt:"Haunt", passive:"Passive"}[G.p[1].doc];
 $("done").innerHTML = `<div class="done">
 <h3>${S[0].tot > S[1].tot ? "you hold more" : S[0].tot === S[1].tot ? "level" : "they hold more"}</h3>
 <p>${S[0].tot} to ${S[1].tot} against <b>${doc}</b>. ${S[0].h} blessed, ${S[0].c} farmland,
 ${S[0].s} settled. Your blessing peaked at ${H.reduce((m, o, i) => o.s[0].h > m[0] ? [o.s[0].h, i + 1] : m, [0, 0])[0]}
 in year ${H.reduce((m, o, i) => o.s[0].h > m[0] ? [o.s[0].h, i + 1] : m, [0, 0])[1]}.
 You ended with ${DIVINE.length - lostCount(0)} of six wonders and ${civicOpen(0).length} of ${CIVIC.length} works.
 ${mt ? mt + " tiles of the valley are mountain that was not there when you came. " : ""}
 There ${walk === 1 ? "was one tile" : "were " + walk + " tiles"} you could still walk into.</p>
 <p style="color:var(--faint);font-size:14px;margin-top:12px">The question: when a levy was on the
 road, did you ever choose to empty the town rather than wall the road — knowing where those people
 would end up, and what their arrival would cost you?</p></div>`;
}

// --- knobs and wiring ---------------------------------------------------
const tw = $("tune");
Object.keys(FG.TUNE).forEach(k => {
 const o = FG.TUNE[k], l = document.createElement("label");
 l.innerHTML = `<span>${o.l}</span><input type="range" min="${o.min}" max="${o.max}" value="${o.v}"><output>${o.v}${o.s}</output>`;
 const i = l.querySelector("input"), ot = l.querySelector("output");
 i.oninput = () => { o.v = +i.value; ot.textContent = o.v + o.s; if (FG.G) render(); };
 tw.appendChild(l);
});
const cbl = document.createElement("label");
cbl.className = "cb";
cbl.innerHTML = `<input type="checkbox" id="sf"><span>walls are slow going, not impassable</span>`;
tw.appendChild(cbl);
cbl.querySelector("input").onchange = e => { FG.SOFT = e.target.checked; render(); };

// --- which rules ---------------------------------------------------------
// FG.R2, the August 2026 batch. All off is the game design/rules.md describes,
// and the two sets can be compared on the same map because changing a flag
// restarts from the same seed. Flags that are declared but not yet implemented
// are shown and marked, rather than hidden — a switch that does nothing is less
// confusing than a rule nobody can find.
// A-16. This used to be a second copy of the list in constants.js, and it had
// drifted: `taughtGates` — the largest tuning lever in the project — was missing
// from it, so the panel showed that rule as *not built* and the "whole batch"
// button switched it off. The engine owns the list now and the interface asks.
const R2BUILT = FG.R2BUILT;
const R2LABEL = {
 stonesGrow:"a stone grows while the small ones are near it",
 deadOrders:"a stone that has gone quiet still carries orders",
 wildFolk:"a founding is as big as the country round it",
 zeroSpent:"spent to nothing, you may only watch",
 logistic:"growth is logistic; terrain sets the ceiling", teaching:"tilling and killing are taught",
 taughtLoss:"a wonder goes on teaching, not at 150", audible77:"under seventy-seven, they bless the ground",
 split2:"split reaches two tiles, to your blessing", fade:"you may walk the fields, at 10% of you a year",
 unmake:"taking their blessing returns it to wild, not to you",
 encircle:"a ring of blessing takes a place, and forbids it",
 taughtGates:"the works open on teachings, not on numbers",
 landGates:"works open on tilled land, not on numbers", pathFrac:"distance is measured by road",
 barren3:"withered ground stays barren three years", exitLane:"the fields never quite close over",
 herds:"a people may be taught to keep herds, and then they walk",
 roam:"herds go where they will, and no hand reaches them",
 cairn:"the settled raise monuments, and pay for them in furrows",
 dreamTeach:"you may teach where you are heard, at 10% of you", 
 dreamWorks:"a work beyond your hearing costs 10% of you"
};
const r2w = $("r2"), R2SEED = {v: 1};
Object.keys(FG.R2).forEach(k => {
 const built = R2BUILT.includes(k), l = document.createElement("label");
 l.className = built ? "" : "off";
 l.innerHTML = `<input type="checkbox" data-r2="${k}"${built ? "" : " disabled"}>`
  + `<span style="color:${built ? "var(--dim)" : "var(--faint)"}">${R2LABEL[k]}${built ? "" : " · not built"}</span>`;
 r2w.appendChild(l);
});
function r2sync() {
 r2w.querySelectorAll("[data-r2]").forEach(i => { i.checked = FG.R2[i.dataset.r2]; });
 const on = R2BUILT.filter(k => FG.R2[k]).length;
 $("r2state").textContent = on === 0 ? "the old game — design/rules.md before the batch"
  : on === R2BUILT.length ? "every rule there is — this is the game"
  : on + " of " + R2BUILT.length + " built rules on";
}
// Same seed, so the only difference between two runs is the rules.
function r2restart() { r2sync(); ARM = null; ARMACT = null; ARMHERD = null; SEAT = 0; LAND = {key:null, html:""};
 const doc = $("doc").value, human = doc === "human";
 FG.HANDICAP = $("even").checked ? 1 : 0;
 FG.createGame({them: human ? null : doc, pvp: human, seed: R2SEED.v});
 $("done").innerHTML = ""; render(); }
r2w.querySelectorAll("[data-r2]").forEach(i => {
 i.onchange = () => { FG.R2[i.dataset.r2] = i.checked; r2restart(); };
});
// ------------------------------------------------------------- the art switch
//
// Deliberately not a restart. Every other control in this dialog changes what a
// year *is* and therefore has to start one; this one changes nothing the engine
// can see, and the entire point of it is that you can flip between two looks
// with the same stones on the same ground in the same year. A comparison where
// the board moves is not a comparison.
const artw = $("artmode");
function artsync() {
 artw.querySelectorAll("[data-art]").forEach(i => { i.checked = i.dataset.art === ART.mode(); });
 const r = ART.res();
 $("artnote").textContent = ART.note(ART.mode())
  + (r ? "  ·  " + r + (r === 1 ? " source pixel" : " source pixels") + " to a game unit." : "");
 crispApply();
}
// The thing that decides whether this reads as 1994 or as a blurry upscale.
// The board is `width:100%` over a fixed viewBox, so its scale is whatever the
// window gives it and almost never a whole number - which means one source
// pixel covers 2.37 screen pixels, `pixelated` rounds each one on its own, and
// you get a grid where some pixels are three across and their neighbours are
// two. Still, that is sloppy; moving, it crawls. So this offers to give up a
// little width in exchange for a whole-number scale.
//
// Off by default, and it must stay off by default: on a narrow window the
// snapped width is a large step down, and a slightly soft board that fills the
// screen is the better trade there. It is a choice, like AUTOPASS.
function crispApply() {
 const m = $("map"), on = $("crisp") && $("crisp").checked;
 if (!on) { m.style.maxWidth = ""; return; }
 const natural = m.parentElement.clientWidth || BW;
 const w = ART.crispWidth(natural, BW, SZ, 24);
 m.style.maxWidth = w ? w + "px" : "";
}
ART.modes().forEach(k => {
 const l = document.createElement("label");
 l.innerHTML = `<input type="radio" name="artmode" data-art="${k}">`
  + `<span style="color:var(--dim)">${ART.label(k)}</span>`;
 artw.appendChild(l);
});
artw.querySelectorAll("[data-art]").forEach(i => {
 i.onchange = () => { ART.mode(i.dataset.art); artsync(); render(); };
});
if ($("crisp")) $("crisp").onchange = crispApply;
addEventListener("resize", crispApply);
artsync();

$("r2off").onclick = () => { FG.R2all(false); r2restart(); };
// A-16 again. `R2reset` is the thing that says *the game*, and since August 2026
// the game is every built rule on — so this asks the engine for the set rather
// than reconstructing it, which is how the interface's copy drifted last time.
$("r2on").onclick  = () => { FG.R2reset(); r2restart(); };
r2sync();

["bless", "stone", "found"].forEach(a => {
 $(a).onclick = () => {
  if (FG.G.p[SEAT].acted || FG.G.over || ARM || ARMACT) return;
  if (doAct(a, SEAT)) { FG.G.p[SEAT].acted = true; render(); maybeHandOver(); }
 };
});
// 1.6. Split arms and waits for the tile, and pressing it again puts it down.
$("split").onclick = () => {
 if (FG.G.p[SEAT].acted || FG.G.over || ARM) return;
 ARMACT = ARMACT === "split" ? null : "split";
 render();
};
// 1.19. Send arms the two-stage herd gesture and — unlike every other button in
// this row — does not check `acted`, because steering costs nothing.
$("drive").onclick = () => {
 if (FG.G.over || ARM || ARMACT) return;
 ARMHERD = ARMHERD ? null : "pick";
 // One herd and no choice to make: skip straight to asking where.
 const mine = FG.R2.herds ? FG.herdsOf(SEAT) : [];
 if (ARMHERD === "pick" && mine.length === 1) ARMHERD = mine[0];
 render();
};
// Stop and Raise a mound are acts, and both are done standing on the herd, so
// they fire immediately like Bless rather than arming like Split.
["stopherd", "mound"].forEach(id => {
 $(id).onclick = () => {
  if (FG.G.p[SEAT].acted || FG.G.over || ARM || ARMACT || ARMHERD) return;
  if (doAct(id === "stopherd" ? "stop" : "mound", SEAT)) {
   FG.G.p[SEAT].acted = true; render(); maybeHandOver();
  }
 };
});
$("pass").onclick = () => { FG.G.p[SEAT].acted = true; render(); maybeHandOver(); };
$("end").onclick = endTurn;
$("restart").onclick = newGame;

// Choosing a second person changes the shape of a year rather than the strength
// of an opponent, so it restarts. Picking one machine doctrine over another does
// not, and never has.
$("doc").onchange = () => {
 const v = $("doc").value;
 if (v === "human" || pvp()) { if ($("even").checked !== (v === "human")) $("even").checked = v === "human";
  newGame(); return; }
 if (FG.G) FG.G.p[1].doc = v;
};
$("even").onchange = () => { FG.HANDICAP = $("even").checked ? 1 : 0; newGame(); };
$("autopass").onchange = e => { AUTOPASS = e.target.checked; };

// OP-23. The doors. showModal() gives the backdrop and Escape for nothing, and
// the fallback is there because jsdom does not implement <dialog> — sim/smoke.js
// clicks #restart and reads #tune, and both now live inside one.
const openDlg = d => { if (d.showModal) d.showModal(); else d.setAttribute("open", ""); };
$("aboutopen").onclick = () => openDlg($("about"));
$("termsopen").onclick = () => openDlg($("terms"));
// The chronicle scrolls to the bottom when it is opened rather than on every
// frame — it is only on screen when somebody asked for it.
$("chronopen").onclick = () => { openDlg($("chron"));
 const L = $("log"); L.scrollTop = L.scrollHeight; };

// The map's own viewBox, so the geometry above is the single source of it.
$("map").setAttribute("viewBox", `0 0 ${BW.toFixed(0)} ${BH.toFixed(0)}`);

newGame();
})();
