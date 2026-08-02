# What this game is

## The premise

You are an old power, long-lived where others are not, and fading. You walk among
people and fewer of them can see you every generation, because the world is
getting louder. In the first hour you point at a hillside and it is done. In the
last hour there is a great deal of country and almost none of it you can enter.

Nothing takes your power away. People build enough instruments that they stop
needing to ask, and then stop being able to hear.

You want to be remembered. The only thing capable of remembering you at scale is
the same thing that makes you inaudible.

## The one sentence

> **You can only be remembered by the thing that deafens you.**

Every strategic decision in the game is a position on that line. If a proposed
mechanic does not sit somewhere on it, it probably belongs in `registers/ideas.md`
rather than in the game.

## What it is not

- Not a 4X. There is no economy to manage, no city screen, no tech menu.
- Not a war game. There is no combat resolution — an army arrives or it does not.
- Not a tragedy on rails. The fading is caused by choices, including yours, and a
  well-played game can hold a great deal of it off.
- Not melancholy without teeth. Competition is the point, not a concession.

## Sources

**Julian Jaynes**, *The Origin of Consciousness in the Breakdown of the Bicameral
Mind* — not for its historical claims but for the mechanical insight underneath
them: that under bicameral organisation there is no deliberation, the command
simply arrives and is executed. That is what "the god is heard" cashes out as in
gameplay, and everything built afterwards costs you some of it.

**A Brief History of the World** (Ragnar Brothers) — for the sweep. Few decisions,
each visible on the map three hours later.

**Civilization** — for the thing the design keeps having to be pulled back toward:
additive growth, exploration, settling new ground. Every subtractive mechanic
tried here has failed in playtest.

**King of Dragon Pass / Six Ages** — for the mythic register, and as a warning
about how much text is too much.

---

# Look and feel

## The governing rule

**Fill is the land. Border is who holds it.**

This one decision did more for legibility than any other visual change. A tile's
fill says what kind of place it is — woodland, blessed woodland, farmland,
mountain, settlement — and its border says whose it is, or nothing at all if it is
open country. It reads as a place rather than a control map, and it makes the
difference between blessed forest and reckoned farmland immediately obvious as a
difference *in kind*.

## Palette

Cold, dark, northern. Not parchment, not fantasy gold-on-brown.

| Role | Hex | Used for |
|---|---|---|
| Ground | `#12181A` | Page background |
| Panel | `#1A2123` | Raised surfaces |
| Ink | `#D9DACE` | Primary text — pale lichen, not white |
| Dim / faint | `#99A096` / `#69706A` | Secondary, labels |
| Gold | `#C8B37E` | You. Your border, your token, your holdings. |
| Blessed violet | `#9A7BC8` | Blessing, wonders, omens |
| Reckoned ochre | `#C79A52` | Farmland, works of the settled |
| Rival teal | `#5FA0A8` | The other power |
| Rust | `#9B4A44` | Loss, threat, marching levies |
| Moss | `#7E9166` | Where you can still walk |

Land fills: woodland `#1F2C1E`, blessed woodland `#232E38`, plain `#2C332B`,
hill `#363A35`, farmland `#6B5A2E`, mountain `#514F52`, settlement `#4A4238`.

## Type

- **Spectral**, light weight, for prose and the chronicle. A screen-native serif
  with some severity to it — not a parchment face.
- **IBM Plex Sans Condensed** for every number, label, and button. Narrow and
  administrative.

The pairing carries the theme: the serif is what is being lost, the condensed sans
is what replaces it. Numbers should always be in the sans. Anything the world says
about itself should be in the serif.

## Texture

Small hand-drawn marks rather than fills: three little conifers on woodland, a
ridge line on hills, three plough furrows on farmland, sparks scattered on blessed
ground, roofs that multiply as a settlement grows from band to city. All drawn as
SVG paths at low opacity. No gradients, no shadows, no glow.

## Voice

The log is written as a chronicle, in short declarative sentences, past tense,
without adjectives where they can be avoided.

> *The wells turned and the children sickened first.*
> *A stone stands in ground that no longer answers. It is only a stone now.*
> *They keep the Seventy-Seven. Half go over the rise.*
> *The column comes in at last. The town is fuller than it was, and louder.*

Never explain a mechanic in the log. Describe what happened and let the player
work out what it cost them.

## What the interface should do over forty years

The long-term ambition, only partly implemented: the interface itself should
become more administrative as the game proceeds. Early, you point at ground and it
happens. Late, you are reading numbers about places you cannot go. The player
should never be told this is happening.
