// Dumps the board in every art mode, at the same year, on the same map.
//
// Same discipline as the rest of concept/art-direction/: the boards are not
// mocked up. This loads game/index.html into jsdom exactly as sim/smoke.js
// does, plays a fixed seed forward a fixed number of years through the build's
// own click handlers, then writes out the map once per mode without touching
// the game in between. If a board looks odd, the game produced it.
//
//     node shoot.js [year] [seed] [--peaks]
//
// `--peaks` raises three ranges through the *raise mountains* wonder before
// dumping. Mountains are never generated onto a map — they exist only where
// that wonder has put them — so without this no shot of any seed contains one,
// and the cut peaks go unseen. Raised through `doIntervene` rather than by
// writing "mount" onto tiles, because a board the game cannot produce is not
// evidence about the game.
//
// Writes board-<mode>.svg beside this file. Render them however you like;
// they are self-contained, because the sprites are base64 inside the markup.

const fs = require("fs"), path = require("path");
const {JSDOM} = require("jsdom");

const YEAR = +(process.argv[2] || 27), SEED = +(process.argv[3] || 6);
const PEAKS = process.argv.includes("--peaks");
const ROOT = path.join(__dirname, "..", "..", "..");
const file = path.join(ROOT, "game", "index.html");

const dom = new JSDOM(fs.readFileSync(file, "utf8"), {
 runScripts: "dangerously",
 url: "file://" + file.replace(/\\/g, "/"),
 beforeParse(win) { win.__load = p => win.eval(fs.readFileSync(path.join(ROOT, p), "utf8")); }
});
const win = dom.window, doc = win.document;

// The script list comes off the page, for the reason sim/smoke.js gives.
[...doc.querySelectorAll("script[src]")]
 .map(s => s.getAttribute("src").replace(/^\.\.\//, "").replace(/^(?!engine\/)/, "game/"))
 .forEach(p => win.__load(p));

win.FG.createGame({them: "cities", seed: SEED});
for (let y = 1; y < YEAR; y++) {
 const bless = doc.getElementById("bless");
 if (!bless.disabled) bless.click(); else doc.getElementById("pass").click();
 const end = doc.getElementById("end");
 if (end.disabled) break;
 end.click();
}

if (PEAKS) [30, 58, 86].forEach(k => win.FG.doIntervene("mountains", k, 0));

const map = doc.getElementById("map");
const vb = map.getAttribute("viewBox");
const radios = doc.getElementById("artmode").querySelectorAll("[data-art]");

win.FGART.modes().forEach(m => {
 const r = [...radios].find(x => x.dataset.art === m);
 r.checked = true; r.onchange();
 const out = path.join(__dirname, `board-${m}.svg`);
 fs.writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`
  + ` viewBox="${vb}" width="${vb.split(" ")[2]}" height="${vb.split(" ")[3]}">`
  + `<rect width="100%" height="100%" fill="#16202B"/>${map.innerHTML}</svg>`);
 console.log(`${path.relative(ROOT, out)}  year ${win.FG.G.turn}  seed ${SEED}`);
});
