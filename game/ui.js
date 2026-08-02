// Fading Gods — renderer and input. Owns no rules.
//
// Everything this file knows about the game it asks the engine for. If a rule
// appears in here, it is in the wrong file and the simulator will not see it.
"use strict";
(function () {
const {COLS, ROWS, DIVINE, CIVIC, T, ring, reach, score, targets, region,
       stoneRange, working, bigCount, hugeCount, civicStrength, lostCount,
       civicOpen, band, blessGain, canStone, canFound, canSplit, stoneBlock,
       foundBlock, impassable, walkStep, doAct, doIntervene} = FG;

const SZ = 24, W = Math.sqrt(3) * SZ, VS = 1.5 * SZ;
let ARM = null;   // the intervention currently armed, awaiting a target

const $ = id => document.getElementById(id);
function px(c, r) { return [W * (c + 0.5 * (r & 1)) + W / 2 + 4, VS * r + SZ + 4]; }
function hexPath(x, y, s) {
 s = s || SZ; let p = "";
 for (let i = 0; i < 6; i++) {
  const a = Math.PI / 180 * (60 * i - 30);
  p += (i ? "L" : "M") + (x + s * Math.cos(a)).toFixed(1) + " " + (y + s * Math.sin(a)).toFixed(1);
 }
 return p + "Z";
}

// Fill is the land. Border is who holds it.
const FILL = {water:"#0D1517", plain:"#2C332B", forest:"#1F2C1E", hill:"#363A35", mount:"#514F52"};
const BFILL = {plain:"#2E3040", forest:"#232E38", hill:"#383A46"};

function newGame() {
 ARM = null;
 FG.createGame({them: $("doc").value});
 $("done").innerHTML = "";
 render();
}

function endTurn() {
 if (FG.G.over) return;
 ARM = null;
 if (FG.endYear()) finish();
 render();
}

function render() {
 const G = FG.G, TUNE = FG.TUNE;
 const R = reach(0), S = score(), walk = Object.keys(R).length - 1;
 const tg = ARM ? new Set(targets(ARM, 0)) : null;
 const isCivic = ARM && CIVIC.some(c => c.id === ARM);
 const threat = G.armies.some(a => a.own === 1);

 $("bar").innerHTML = `
 <div class="c"><div class="l">year</div><div class="v">${G.turn}<span style="font-size:13px;color:var(--faint)"> / ${TUNE.turns.v}</span></div></div>
 <div class="c"><div class="l">moves</div><div class="v ${G.p[0].mp ? "" : "r"}">${G.p[0].mp}</div></div>
 <div class="c"><div class="l">can walk to</div><div class="v ${walk <= 5 ? "r" : "m"}">${walk}</div></div>
 <div class="c"><div class="l">blessed</div><div class="v h">${S[0].h}</div></div>
 <div class="c"><div class="l">farmland</div><div class="v u">${S[0].c}</div></div>
 <div class="c"><div class="l">you</div><div class="v g">${S[0].tot}</div></div>
 <div class="c"><div class="l">them</div><div class="v ${threat ? "r" : "rv"}">${S[1].tot}</div></div>`;

 let h = "", over = "";
 G.T.forEach((t, k) => {
  const [x, y] = px(t.c, t.r);
  let fill = FILL[t.t];
  if (t.st === "bless" && !impassable(t)) fill = BFILL[t.t];
  if (t.st === "reck") fill = "#6B5A2E";
  if (t.set) fill = "#4A4238";
  const owner = t.set ? t.set.own : (t.st === "wild" ? null : t.own);
  const stroke = owner === 0 ? "#C8B37E" : owner === 1 ? "#5FA0A8" : "#2A3530";
  const sw = owner === null ? 0.8 : 2;
  const go = tg ? tg.has(k) : (R[k] !== undefined && k !== G.p[0].pos);
  h += `<path class="hx${go ? "" : " no"}" d="${hexPath(x, y)}" fill="${fill}"
   stroke="${stroke}" stroke-width="${sw}" opacity="${impassable(t) ? 1 : (go || tg ? 1 : .88)}" data-k="${k}"/>`;

  if (t.t === "mount")
   over += `<path d="M${x - 11} ${y + 7} l6 -12 l4 6 l3 -5 l6 11 Z" fill="#7A767C" opacity=".85"
    stroke="#918C94" stroke-width=".8" pointer-events="none"/>`;
  if (t.t === "forest" && t.st !== "reck" && !t.set) {
   const c1 = t.seed * 6;
   over += `<path d="M${x - 7 + c1} ${y + 5} l3.5 -9 l3.5 9 Z M${x + 2 + c1 * 0.4} ${y + 7} l3 -7.5 l3 7.5 Z"
    fill="${t.st === "bless" ? "#6E7FA8" : "#3A4A36"}" opacity=".65" pointer-events="none"/>`;
  }
  if (t.t === "hill" && t.st !== "reck" && !t.set)
   over += `<path d="M${x - 8} ${y + 5} l5 -6 l4 4 l4 -5 l5 7 Z" fill="${t.st === "bless" ? "#6E7FA8" : "#4A4E48"}"
    opacity=".55" pointer-events="none"/>`;
  if (t.st === "bless" && !t.set) {
   const s = t.seed;
   over += `<g opacity=".9" pointer-events="none" fill="${t.own === 0 ? "#B79AE0" : "#7FC2CA"}">
    <circle cx="${x - 9 + s * 4}" cy="${y - 8 + s * 3}" r="1.3"/><circle cx="${x + 7 - s * 5}" cy="${y - 3 + s * 4}" r="1"/>
    <circle cx="${x - 2 + s * 6}" cy="${y + 9 - s * 3}" r="1.2"/></g>`;
  }
  if (t.st === "reck" && !t.set)
   over += `<g opacity=".35" stroke="${t.own === 0 ? "#8A7440" : "#7A6A50"}" stroke-width="1" pointer-events="none">
    <line x1="${x - 10}" y1="${y - 4}" x2="${x + 10}" y2="${y - 4}"/>
    <line x1="${x - 10}" y1="${y + 1}" x2="${x + 10}" y2="${y + 1}"/>
    <line x1="${x - 10}" y1="${y + 6}" x2="${x + 10}" y2="${y + 6}"/></g>`;
  if (go && !tg) over += `<circle cx="${x}" cy="${y}" r="2.2" fill="#C8B37E" opacity=".4" pointer-events="none"/>`;
  if (go && tg) over += `<path d="${hexPath(x, y, SZ - 3)}" fill="none" stroke="${isCivic ? "#C79A52" : "#9A7BC8"}"
   stroke-width="1.6" opacity=".9" pointer-events="none"/>`;
 });

 // settlements — roofs multiply as the place grows
 G.T.forEach((t, k) => {
  if (!t.set) return;
  const [x, y] = px(t.c, t.r), b = band(t.set.pop)[1];
  const col = t.set.own === 0 ? "#C8B37E" : "#5FA0A8";
  let roofs = "";
  for (let i = 0; i < Math.min(b + 1, 5); i++) {
   const ax = x - 9 + i * 4.6, ay = y + 4 - (i % 2) * 4;
   roofs += `<path d="M${ax} ${ay} l3 -4 l3 4 Z" fill="${col}" opacity=".92"/>`;
  }
  over += `<g pointer-events="none">${roofs}
   <text x="${x}" y="${y + SZ - 4}" text-anchor="middle" font-family="IBM Plex Sans Condensed,sans-serif"
   font-size="10" fill="#D9DACE" opacity=".75">${Math.round(t.set.pop)}</text></g>`;
 });

 // stones — pale while they still answer, grey when they do not
 [0, 1].forEach(who => G.stones[who].forEach(sk => {
  const t = T(sk), [x, y] = px(t.c, t.r), P = region(sk, who).length;
  const live = P >= 6, col = who === 0 ? (live ? "#E4D5A8" : "#6A716A") : (live ? "#A8D6DC" : "#6A716A");
  over += `<path d="M${x - 4} ${y + 9} L${x - 3} ${y - 10} L${x + 3} ${y - 11} L${x + 4} ${y + 9} Z"
   fill="${col}" opacity="${live ? .98 : .55}" pointer-events="none"/>`;
 }));

 // marching columns
 G.armies.forEach(a => {
  const t = T(a.at), [x, y] = px(t.c, t.r), d = T(a.to), [dx, dy] = px(d.c, d.r);
  const col = a.own === 0 ? "#C8B37E" : "#9B4A44";
  over += `<line x1="${x}" y1="${y}" x2="${dx}" y2="${dy}" stroke="${col}" stroke-width="1"
   stroke-dasharray="3 4" opacity=".55" pointer-events="none"/>
   <g pointer-events="none"><path d="M${x} ${y - 9} l7 12 l-14 0 Z" fill="${col}" opacity=".95"/>
   <text x="${x}" y="${y + 2}" text-anchor="middle" font-family="IBM Plex Sans Condensed,sans-serif"
   font-size="8" font-weight="600" fill="#12181A">${Math.round(a.n)}</text></g>`;
 });
 G.refugees.forEach(f => {
  const t = T(f.at), [x, y] = px(t.c, t.r), d = T(f.to), [dx, dy] = px(d.c, d.r);
  const col = f.own === 0 ? "#B79AE0" : "#7FC2CA";
  over += `<line x1="${x}" y1="${y}" x2="${dx}" y2="${dy}" stroke="${col}" stroke-width="1"
   stroke-dasharray="1 5" opacity=".5" pointer-events="none"/>
   <g pointer-events="none"><circle cx="${x}" cy="${y - 3}" r="7" fill="${col}" opacity=".9"/>
   <text x="${x}" y="${y - 1}" text-anchor="middle" font-family="IBM Plex Sans Condensed,sans-serif"
   font-size="8" font-weight="600" fill="#12181A">${Math.round(f.n)}</text></g>`;
 });

 // the two powers
 [0, 1].forEach(w => {
  const t = T(G.p[w].pos), [x, y] = px(t.c, t.r), col = w === 0 ? "#C8B37E" : "#5FA0A8";
  over += `<circle cx="${x}" cy="${y}" r="16" fill="none" stroke="${col}" stroke-width="1.7"
   opacity=".9" pointer-events="none"/><circle cx="${x}" cy="${y}" r="3.4" fill="${col}" pointer-events="none"/>`;
 });

 const m = $("map");
 m.innerHTML = '<title>The contested valley</title><desc>Hex map with marching columns.</desc>' + h + over;
 m.querySelectorAll(".hx").forEach(e => {
  e.onclick = () => {
   const k = +e.dataset.k;
   if (FG.G.over) return;
   if (ARM) {
    if (!targets(ARM, 0).includes(k)) return;
    if (doIntervene(ARM, k, 0)) { FG.G.p[0].cast = true; ARM = null; }
    render(); return;
   }
   const RR = reach(0);
   if (RR[k] === undefined || k === FG.G.p[0].pos) return;
   FG.G.p[0].mp -= RR[k]; FG.G.p[0].pos = k; render();
  };
 });

 // on the road
 const road = [];
 G.armies.forEach(a => {
  const steps = (() => {
   let c = a.at, n = 0;
   while (c !== a.to && n < 40) { const s = walkStep(c, a.to); if (s === undefined) return null; c = s; n++; }
   return n;
  })();
  road.push(`<li><span class="${a.own === 0 ? "b1" : "warn"}">${a.own === 0 ? "your levy" : "their levy"} · ${Math.round(a.n)} strong</span>
   <span>${steps === null ? "no road" : steps + " year" + (steps === 1 ? "" : "s") + " away"}</span></li>`);
 });
 G.refugees.forEach(f => road.push(`<li><span class="b2">${f.own === 0 ? "your people on the road" : "their people"} · ${Math.round(f.n)}</span>
   <span>${f.at === f.to ? "arriving" : "walking"}</span></li>`));
 $("march").innerHTML = road.join("") || '<li style="color:var(--faint);border:none">nobody is marching</li>';

 // interventions
 const lostN = lostCount(0), bg = bigCount(0), hg = hugeCount(0), wk = working(0).length, cs = civicStrength(0);
 $("tally").textContent =
  `${bg} past 150 · ${hg} past 800 · ${wk} working stone${wk === 1 ? "" : "s"} · strength ${cs}`
  + (G.p[0].cast ? " · intervened" : "");
 const open = civicOpen(0);
 $("divine").innerHTML = DIVINE.map((s, i) => {
  const gone = i < lostN, n = gone ? 0 : targets(s.id, 0).length;
  return `<li class="${gone ? "gone" : ""}"><span class="nm">${s.n}</span><span class="ds">${s.d}</span>
   ${gone ? "" : `<button style="margin-top:5px" class="${ARM === s.id ? "arm" : ""}"
    ${(G.p[0].cast || G.over || !n) ? "disabled" : ""} data-iv="${s.id}">
    ${ARM === s.id ? "choose a tile" : (n ? "call · " + n : "nothing in reach")}</button>`}</li>`;
 }).join("");
 $("civic").innerHTML = CIVIC.map((s, i) => {
  const need = [TUNE.t1.v, TUNE.t2.v, TUNE.t3.v][i], ok = open.includes(s.id);
  const n = ok ? targets(s.id, 0).length : 0;
  return `<li class="${ok ? "" : "gone"}"><span class="nm">${s.n}</span><span class="ds">${s.d}</span>
   ${ok ? `<button style="margin-top:5px" class="${ARM === s.id ? "armc" : ""}"
    ${(G.p[0].cast || G.over || !n) ? "disabled" : ""} data-iv="${s.id}">
    ${ARM === s.id ? "choose a tile" : (n ? "do it · " + n : "nothing in range")}</button>`
   : `<span class="ds" style="color:var(--faint)">needs strength ${need}</span>`}</li>`;
 }).join("");
 document.querySelectorAll("[data-iv]").forEach(b => {
  b.onclick = () => { ARM = ARM === b.dataset.iv ? null : b.dataset.iv; render(); };
 });

 // the chart
 if (G.hist.length > 1) {
  const H = G.hist;
  const mx = Math.max(...H.map(o => Math.max(o.s[0].tot, o.s[1].tot)), 10);
  const mr = Math.max(...H.map(o => o.r), 1), n = TUNE.turns.v;
  const X = i => 6 + (i / (n - 1)) * 288, Y = v => 124 - (v / mx) * 116, YR = v => 124 - (v / mr) * 116;
  const p = f => H.map((o, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + f(o).toFixed(1)).join(" ");
  $("chart").innerHTML =
   `<title>Score over time</title><desc>Your total, their total, and how far you can walk.</desc>
    <path d="${p(o => YR(o.r))}" fill="none" stroke="#7E9166" stroke-width="1.3" opacity=".75"/>
    <path d="${p(o => Y(o.s[1].tot))}" fill="none" stroke="#5FA0A8" stroke-width="1.8"/>
    <path d="${p(o => Y(o.s[0].tot))}" fill="none" stroke="#C8B37E" stroke-width="1.8"/>`;
 }

 $("st").innerHTML = G.stones[0].map((k, i) => {
  const P = region(k, 0).length;
  return `<li><span class="${P < 6 ? "dead" : "b1"}">stone ${i + 1} — ${P < 6 ? "gone quiet" : "holds one back"}</span>
   <span>${P} tiles · reach ${P < 6 ? 0 : stoneRange(P)}</span></li>`;
 }).join("") || '<li style="color:var(--faint);border:none">none raised</li>';

 $("sl").innerHTML = G.T.filter(t => t.set).sort((a, b) => b.set.pop - a.set.pop)
  .slice(0, 10).map(t => {
   const [n, b] = band(t.set.pop);
   return `<li><span class="b${b}">${t.set.own === 0 ? "" : "their "}${n}${t.set.done ? " · spent" : ""}</span><span>${Math.round(t.set.pop)}</span></li>`;
  }).join("") || '<li style="color:var(--faint);border:none">none yet</li>';

 const L = $("log");
 L.innerHTML = G.log.slice(-45).map(l => `<p class="${l.cls}"><b>y${l.t}</b>${l.x}</p>`).join("");
 L.scrollTop = L.scrollHeight;

 const k = G.p[0].pos, a = G.p[0].acted || G.over;
 $("bless").disabled = a || !!ARM || !blessGain(k, 0);
 $("stone").disabled = a || !!ARM || !canStone(k, 0);
 $("found").disabled = a || !!ARM || !canFound(k, 0);
 $("split").disabled = a || !!ARM || !canSplit(k, 0);
 $("pass").disabled = a || !!ARM;
 $("end").disabled = G.over;

 const hint = $("hint");
 hint.className = "hintline" + (ARM ? " arm" : "");
 const sb = stoneBlock(k, 0), fb = foundBlock(k, 0);
 hint.textContent = G.over ? "" : ARM ? "Choose an outlined tile, or press the button again to put it down."
  : a ? "Acted this year. You may still intervene, then end the year."
  : walk === 0 ? "There is nowhere you can walk from here."
  : (fb && fb.indexOf("%") > 0 ? "Cannot found here: " + fb + "."
   : sb && sb.indexOf("connected") > 0 ? "No stone here: " + sb + "." : fb ? "Cannot found here: " + fb + "." : "");
}

function finish() {
 const G = FG.G, S = score(), H = G.hist;
 let peak = 0, pt = 0;
 H.forEach((o, i) => { if (o.s[0].h > peak) { peak = o.s[0].h; pt = i + 1; } });
 const lostN = lostCount(0), open = civicOpen(0), walk = Object.keys(reach(0)).length - 1;
 const mt = G.T.filter(t => t.t === "mount").length;
 const doc = {cities:"Cities", bands:"Bands", mixed:"Mixed", haunt:"Haunt", passive:"Passive"}[G.p[1].doc];
 $("done").innerHTML = `<div class="done">
 <h3>${S[0].tot > S[1].tot ? "you hold more" : S[0].tot === S[1].tot ? "level" : "they hold more"}</h3>
 <p>${S[0].tot} to ${S[1].tot} against <b>${doc}</b>. ${S[0].h} blessed, ${S[0].c} farmland,
 ${S[0].s} settled. Your blessing peaked at ${peak} in year ${pt}.
 You ended with ${DIVINE.length - lostN} of six wonders and ${open.length} of three works.
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

["bless", "stone", "found", "split"].forEach(a => {
 $(a).onclick = () => {
  if (FG.G.p[0].acted || FG.G.over || ARM) return;
  if (doAct(a, 0)) { FG.G.p[0].acted = true; render(); }
 };
});
$("pass").onclick = () => { FG.G.p[0].acted = true; render(); };
$("end").onclick = endTurn;
$("restart").onclick = newGame;
$("doc").onchange = () => { if (FG.G) FG.G.p[1].doc = $("doc").value; };

newGame();
})();
