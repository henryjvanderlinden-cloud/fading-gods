# Builds

`index.html` is the current game — open it in a browser, no build step.

It holds markup, CSS and nine script tags. The rules live in `engine/`, one
directory up, and are shared with `sim/`. `ui.js` is the renderer and the input
handling, and owns no rules: if a rule appears in it, the simulator cannot see it
and the balance numbers stop meaning anything.

The script tags are classic scripts rather than ES modules on purpose. Modules
will not load over `file://`, and double-clicking has to keep working. Load order
matters.

`previous/` holds earlier prototypes. They are kept because each one tests a
different question and several contain mechanics not in the current build.

| File | Tests | Notable |
|---|---|---|
| `works-and-wonders.html` | The wonder/work ladder without marching armies | Simpler; useful for isolating the ladder |
| `the-walls-close.html` | Hard movement walls at 40 turns, before spells | The "can walk to" gauge originates here |
| `blessed-ground.html` | Sacred stones as passive engines, 20 turns | The shortest playable version |
| `the-founding.html` | Whether watching a seeded settlement run 200 years is compelling | Contains the writing-distortion mechanic, which exists nowhere else and is worth reviving |
