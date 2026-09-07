// Fading Gods — the art switch. Owns no rules, and owns no drawing either.
//
// This file exists so that `ui.js` can ask "is there a sprite for this mark?"
// at every place it currently draws one, and get `null` back in the mode the
// game has always shipped in. Nothing here changes what is drawn, only what
// draws it. If a rule appears in this file it is in the wrong file twice over.
//
// ---------------------------------------------------------------- what is a
// sprite, here
//
// A sprite is measured in **game units** — the 24px-hex space every mark in
// `ui.js` is authored against, via `u()` — and never in screen pixels. That is
// the whole reason a sprite can be dropped in beside a vector mark and land in
// the same place: both are told where the ground is in the same units, and
// both scale with `SZ`. A sprite recorded in screen pixels would be correct at
// one hex size and wrong at every other, which is how this kind of thing
// usually rots.
//
//   w, h   the sprite's size in game units
//   by     where the baseline sits, relative to the y the mark was called with.
//          A tree is called on its base (by 0); a temple is called near its
//          middle and stands on ground about nine units lower (by 9). This is
//          the only field that differs meaningfully between marks, and getting
//          it wrong is the difference between a temple in a field and a temple
//          hovering over one.
//   src    a base64 PNG. Not a path: `game/index.html` has to keep working
//          when it is double-clicked, and a loose file beside an inline
//          <image> over file:// is one more thing that can fail. Same
//          reasoning as the classic script tags.
//
// ---------------------------------------------------------------- what this
// deliberately does not do
//
// **The land is not sprited, and should not be.** The hex fill and the
// embossed boundaries carry `concept.md`'s one load-bearing visual rule — fill
// is the land, border is who holds it — and the art-direction README has
// measured luminance numbers for those fills that a PNG would throw away. Only
// the *marks* are switchable: trees, hills, mountains, stones, temples,
// figures, people, herds, mounds. Everything with a number on it, everything
// that animates, and everything derived from a count stays vector.
//
// **Faction colour has to be baked in.** `ui.js` fills its figures with
// COL[own] and gets the two powers apart for free. A PNG is whatever colour it
// was drawn in, so every mark that belongs to somebody is a separate sprite per
// seat, and the build script tints cut art onto the faction ramp. This is the
// real cost of sprites in this game and it is worth knowing before commissioning
// forty of them.
//
// The `(function (root) { root.X = ... })(globalThis)` wrapper is the engine's
// idiom, copied deliberately rather than reinvented: a bare `var` at the top
// of a file reaches the page when a browser loads it and does *not* reach the
// page when `sim/smoke.js` evaluates the same file into jsdom, so the build
// works and the check that the build works does not. One idiom, both loaders.
(function (root) {
"use strict";

const SETS = {};          // id -> {label, note, res, s:{key:{w,h,by,src}}}
let MODE = "svg";         // "svg" is not a set; it is the absence of one
let U = 1;                // screen px per game unit, handed over by ui.js

// -------------------------------------------------------------- registration
// Called by the generated sprites-*.js files, which load after this one.
//
// The build opens in the first set that registers, and falls back to `svg` only
// when none does. `svg` stays the honest baseline for the comparison — it is
// still one click away and still what a missing sprite falls through to — but
// it is no longer what a player meets first, because the sprite board is now
// the one being made rather than the one being tried out.
function set(id, def) {
 const first = !Object.keys(SETS).length;
 SETS[id] = def;
 if (first && MODE === "svg") MODE = id;
}

function modes() { return ["svg"].concat(Object.keys(SETS)); }

function label(m) {
 return m === "svg" ? "as built — vector marks"
      : (SETS[m] && SETS[m].label) || m;
}
function note(m) {
 return m === "svg"
  ? "The renderer as it stands. Every mark is drawn from state, tinted from "
    + "COL, and scales to any hex size without a resampling step."
  : (SETS[m] && SETS[m].note) || "";
}

// Source pixels per game unit for the active set. `null` in svg mode, because
// vectors have no native resolution — which is the point of comparing them.
function res() { return MODE === "svg" ? null : (SETS[MODE] && SETS[MODE].res) || 1; }

function mode(m) {
 if (m !== undefined && (m === "svg" || SETS[m])) MODE = m;
 return MODE;
}

// ui.js hands this over on every render, because U is derived from SZ and SZ
// is allowed to change. Asking rather than assuming is the same discipline the
// interface uses with the engine.
function unit(n) { U = n; }

// ------------------------------------------------------------------- lookup
function has(key) { const s = SETS[MODE]; return !!(s && s.s[key]); }

// A mark may hold several cut variants — `mount.0`, `mount.1`, … — so that a
// range of hills is a range and not one peak stamped nine times. `t` is a
// number in 0..1 and the caller supplies it, because the caller is the only
// thing that knows what it should be derived from: in `ui.js` it comes off the
// *tile seed*, so a mountain keeps its shape across every redraw, every
// intervention, and every reload. A variant picked from Math.random would
// reshuffle the whole range on any repaint, which is the sort of thing that
// looks like a rendering bug and is impossible to screenshot.
//
// Falls back to the unnumbered key, so a set may hold one mountain or four
// without either the caller or the other sets caring.
function variantKey(base, t) {
 const s = SETS[MODE];
 if (!s) return base;
 let n = 0;
 while (s.s[base + "." + n]) n++;
 if (!n) return base;
 const i = Math.min(n - 1, Math.max(0, Math.floor(t * n)));
 return base + "." + i;
}

// The one function ui.js calls. Returns an <image> element, or null — and
// `null` is the contract that makes this safe: every call site is written
// `ART.sprite(...) || theVectorMark(...)`, so an unregistered key, a
// half-finished set, or svg mode all fall through to the drawing that has
// always been there. A missing sprite is never a hole in the board.
//
//   scale  multiplies the sprite's authored size — for marks like conifers
//          that ui.js already draws at three different heights per tile
//   dx,dy  nudge in game units, for marks that place themselves off-centre
//   flip   mirror horizontally, for the field hands
// Each sprite is defined once, in `defs()`, and every place it appears is a
// `<use>` pointing at that definition.
//
// The first version inlined the base64 at the point of use, which is correct
// and does not scale: a board with forty-five farms on it repeated the same
// five-kilobyte string forty-five times, and every one of those farms is
// re-serialised each time the land layer is rebuilt. The board is drawn from
// strings, so markup size is not cosmetic here — it is parse time, on every
// redraw, in the browser as much as in the checks.
//
// `<symbol>` rather than a bare `<image>` in defs because `<use>` only honours
// width and height against a symbol or an svg element. Marks that ask for a
// scale — conifers come at three heights a tile — need that.
const id = key => "fg-" + key.replace(/\./g, "-");

function sprite(key, x, y, opt) {
 const s = SETS[MODE];
 if (!s) return null;
 const sp = s.s[key];
 if (!sp || sp.tex) return null;   // a texture is a fill; ask `texture()` for it
 opt = opt || {};
 const k = opt.scale === undefined ? 1 : opt.scale;
 const w = sp.w * U * k, h = sp.h * U * k;
 const bx = x - w / 2 + (opt.dx || 0) * U;
 const by = y + sp.by * U * k - h + (opt.dy || 0) * U;
 // Both spellings of the reference. `href` is SVG2 and is what every current
 // browser wants; `xlink:href` is SVG1.1 and is what several still need, and
 // what some static renderers understand exclusively. They cost nine bytes and
 // they are the difference between a board and an empty board — this file can
 // only be checked here against a DOM that does not paint and a rasteriser
 // that is not a browser, so where the two specifications disagree it emits
 // both rather than betting on one.
 const ref = `href="#${id(key)}" xlink:href="#${id(key)}"`;
 const use = `<use ${ref} x="${bx.toFixed(1)}" y="${by.toFixed(1)}"`
  + ` width="${w.toFixed(1)}" height="${h.toFixed(1)}"/>`;
 if (!opt.flip) return use;
 return `<g transform="translate(${(2 * x).toFixed(1)},0) scale(-1,1)">${use}</g>`;
}

// Every sprite in the active set, defined once. Emitted with the land layer,
// which is rebuilt whenever the art mode changes — the mode is in that cache
// key — so the definitions can never be for a set the board is no longer using.
//
// All of them rather than only the ones this board happens to need: the land is
// cached and the token layers are not, so a "used" set collected during a land
// rebuild would be missing whatever the overlay drew afterwards. Forty
// definitions is a fixed cost paid once; getting it wrong is a mark that
// silently fails to appear.
//
// preserveAspectRatio="none" because the box is computed from the sprite's own
// authored aspect — any difference can only be a rounding one, and letting the
// browser letterbox instead would shift the baseline off the ground.
// Set-level choices that are not pictures: what a set deliberately leaves out,
// and how it wants the marks that stay drawn-in-code to look. Undefined in svg
// mode, which is what keeps the vector renderer the untouched baseline.
function opt(name) {
 const s = SETS[MODE];
 return s ? s[name] : undefined;
}

// Whether this set means "draw nothing here" rather than "I have no art here".
//
// The two are opposite instructions and the difference matters. Everywhere else
// a missing sprite falls through to the vector mark, which is what lets a
// half-finished set be useful. But a set that has no people yet does not want
// the vector people drawn on top of its ground — it wants an empty field until
// the art exists. So omission has to be said out loud rather than inferred from
// a key that is not there.
function omits(mark) {
 const o = opt("omit");
 return !!o && o.indexOf(mark) >= 0;
}

// Ground textures are fills, not marks, so they are asked for by fill value
// rather than drawn. Returns a `url(#…)` for `<path fill=…>`, or null.
function texture(name) {
 const s = SETS[MODE];
 if (!s) return null;
 const t = s.s["tex." + name];
 return t ? `url(#${id("tex." + name)})` : null;
}

function defs() {
 const s = SETS[MODE];
 if (!s) return "";
 let out = "<defs>";
 for (const key in s.s) {
  const sp = s.s[key];
  // A texture becomes a pattern in *board* coordinates — userSpaceOnUse, not
  // objectBoundingBox. That is the whole trick against patterning: the ground
  // is one continuous field that the hexes cut windows into, so neighbouring
  // tiles of the same terrain show different parts of it and no two are the
  // same crop. Per-hex jitter would do something similar and worse, because it
  // leaves a seam at every hex edge where the offset jumps.
  if (sp.tex) {
   const n = sp.span * U;
   out += `<pattern id="${id(key)}" patternUnits="userSpaceOnUse"`
    + ` width="${n.toFixed(1)}" height="${n.toFixed(1)}">`
    + `<image width="${n.toFixed(1)}" height="${n.toFixed(1)}" href="${sp.src}"`
    + ` preserveAspectRatio="none"`
    + ` style="image-rendering:pixelated;image-rendering:crisp-edges"/></pattern>`;
   continue;
  }
  out += `<symbol id="${id(key)}" viewBox="0 0 ${sp.w} ${sp.h}" preserveAspectRatio="none">`
   // `href` only here, not both: on a <use> the second spelling is nine bytes,
   // but on an <image> it would duplicate the whole data URI and double the
   // page. Support for the two is the same generation of browser anyway.
   + `<image width="${sp.w}" height="${sp.h}" href="${sp.src}"`
   + ` preserveAspectRatio="none"`
   + ` style="image-rendering:pixelated;image-rendering:crisp-edges"/></symbol>`;
 }
 return out + "</defs>";
}

// ----------------------------------------------------------------- crispness
//
// The thing that decides whether this reads as 1994 or as a blurry upscale.
//
// The board is an SVG with a fixed viewBox and `width:100%`, so its scale is
// whatever the window gives it — almost never a whole number. A sprite pixel
// then covers 2.37 screen pixels, `pixelated` rounds each one independently,
// and the result is a grid where some pixels are three across and their
// neighbours are two. On a still that reads as sloppy; in motion it crawls.
//
// So: given the board's natural width, return the nearest width at or below it
// where one source pixel lands on a whole number of screen pixels. The caller
// decides whether to use it — responsive and slightly soft is a defensible
// choice, and on a phone it is the only one.
//
// Returns null when there is nothing to snap to (svg mode, or a board so
// narrow that snapping would halve it).
function crispWidth(natural, viewBoxW, hexPx, unitsPerHex) {
 const r = res();
 if (!r) return null;
 // screen px per source pixel, at the natural width
 const perUnit = (natural / viewBoxW) * (hexPx / unitsPerHex);
 const perSrc = perUnit / r;
 const snapped = Math.floor(perSrc);
 if (snapped < 1) return null;
 const w = natural * (snapped / perSrc);
 return w < natural * 0.6 ? null : Math.round(w);
}

root.FGART = {set, modes, mode, label, note, res, unit, has, sprite, defs,
              texture, opt, omits, variantKey, crispWidth};
})(typeof globalThis !== "undefined" ? globalThis : this);
