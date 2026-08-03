# Speech bubbles — register

Lines spoken by figures on the map. One row per line, so the table can be pasted
into a spreadsheet, hand-edited, or parsed straight into an array at build time.

Suggested home: `registers/speech-bubbles.md`.

`[god]` is substituted with the player's name at render time.

---

## Selection

One or two bubbles a year, never more. A bubble should read as an event, not as
wallpaper.

Each eligible line gets a score, and the year's bubbles are drawn from the top of
a weighted shuffle:

```
score = weight × proximity_factor × relevance × novelty
```

- **proximity_factor** — see the proximity column. `reach` lines score 1.0 when the
  tile is within current reach and 0 otherwise. `any` lines score 1.0 regardless of
  reach; they are the ones that carry across the valley.
- **relevance** — multiply up when the line refers to something that happened this
  turn (a tile flipped, an army arrived, a wonder was lost last year). This is what
  makes the corpus feel responsive rather than randomised.
- **novelty** — decay a line's score for N years after it fires, so the same words
  don't come round twice in a row. Suggested: 0 for 3 years, then ramping back.

**Bias the pair.** If two bubbles fire in a year, prefer one near and one far — one
thing you could act on, one you couldn't.

---

## Columns

| Column | Meaning |
|---|---|
| `id` | Stable key. Prefix by actor so groups stay together when sorted. |
| `actor` | Who is speaking. Drives bubble styling as well as eligibility. |
| `condition` | Must be true of the tile/unit for the line to be eligible. `always` means no gate beyond actor. |
| `prox` | `reach` = only audible within current reach. `any` = audible anywhere. |
| `w` | Base weight. Higher is more common. |
| `line` | The text. Keep under ~30 characters where possible. |

---

## Blessed ground

They still hear you. Register is gratitude, and it thins as the world grows.

| id | actor | condition | prox | w | line |
|---|---|---|---|---|---|
| bl-01 | blessed | always | reach | 3 | Thank you, [god]. |
| bl-02 | blessed | always | reach | 3 | Bless you, [god]. |
| bl-03 | blessed | always | reach | 2 | You walked here. |
| bl-04 | blessed | always | reach | 2 | The hedgerow knows you. |
| bl-05 | blessed | always | 	reach | 2 | Again this year. |
| bl-06 | blessed | always | reach | 1 | The ground is kind here. |
| bl-07 | blessed | blessed_years > 20 | reach | 2 | Our grandmothers saw you too. |
| bl-08 | blessed | adjacent_to_player | reach | 3 | You are close. We can tell. |
| bl-09 | blessed | quickened_this_turn | reach | 4 | It spread overnight. |

## Wild folk

The only ones who still address you as someone who might arrive. That expectation
is the point, and it should be seen to fade.

| id | actor | condition | prox | w | line |
|---|---|---|---|---|---|
| wf-01 | wild | flipped_this_turn | any | 5 | [god], strangers entered our lands! |
| wf-02 | wild | flipped_this_turn | any | 4 | Strangers on the ridge, [god]. |
| wf-03 | wild | flipped_this_turn | any | 4 | They cut the hedge. |
| wf-04 | wild | flipped_this_turn | any | 3 | Whose people are these? |
| wf-05 | wild | flipped_this_turn | any | 3 | We are still yours. |
| wf-06 | wild | flipped_this_turn && years_unanswered > 15 | any | 4 | They came again. Nobody stopped them. |
| wf-07 | wild | years_unanswered > 25 | any | 2 | She used to walk here, they say. |
| wf-08 | wild | years_unanswered > 30 | any | 2 | Say it to the stone, not the sky. |

## Settlements — small

Petition. They expect an answer and phrase things as questions.

| id | actor | condition | prox | w | line |
|---|---|---|---|---|---|
| ss-01 | settlement | pop < 150 | reach | 3 | Please hear us, [god]. |
| ss-02 | settlement | pop < 150 | reach | 3 | Give us an omen. |
| ss-03 | settlement | pop < 150 | reach | 2 | Was that you? |
| ss-04 | settlement | pop < 150 | reach | 2 | Speak plainly. |
| ss-05 | settlement | pop < 150 | reach | 2 | We kept the fires. |
| ss-06 | settlement | pop < 150 && founded_this_turn | reach | 4 | We have begun. |
| ss-07 | settlement | pop < 150 && shrinking | reach | 3 | Have we done something? |

## Settlements — large

Liturgy, then policing the silence. Note the drift from address to third person:
they stop talking to you and start talking about you.

| id | actor | condition | prox | w | line |
|---|---|---|---|---|---|
| sl-01 | settlement | pop >= 150 | reach | 3 | Silence in the temple! |
| sl-02 | settlement | pop >= 150 | reach | 3 | The god is in the stone. |
| sl-03 | settlement | pop >= 150 | reach | 2 | The rite is kept. |
| sl-04 | settlement | pop >= 150 | reach | 2 | Nothing was said. |
| sl-05 | settlement | pop >= 800 | reach | 3 | Who last heard the voice? |
| sl-06 | settlement | pop >= 800 | reach | 3 | The record is complete. |
| sl-07 | settlement | pop >= 800 | reach | 2 | We do not need an omen. |
| sl-08 | settlement | pop >= 800 && crossed_threshold | reach | 4 | The town is fuller than it was. |

## Temples

Break the proximity rule on purpose. Audible from anywhere — reach falls, ambient
chatter thins, and the pleas keep arriving at full volume from places you can't
get to.

**Weight toward wonders you have already lost.** A temple asking for the hill the
year after Raise mountains goes is a readout of your own decay, spoken by someone
who doesn't know it happened.

Keep a small share answerable (`wonder_held`), or the unanswerable ones become
noise the player learns to skip.

| id | actor | condition | prox | w | line |
|---|---|---|---|---|---|
| tp-01 | temple | wonder_lost: mountains | any | 5 | Move the hill for us. |
| tp-02 | temple | wonder_lost: drown | any | 5 | Send the water back. |
| tp-03 | temple | wonder_lost: blight | any | 4 | Strike them, as you did before. |
| tp-04 | temple | wonder_lost: omen | any | 4 | Tell us when to go. |
| tp-05 | temple | wonder_lost: wither | any | 4 | Take the furrows back. |
| tp-06 | temple | wonder_lost: quicken | any | 4 | Make it green again. |
| tp-07 | temple | wonder_held: any | any | 3 | You have done it before. Do it. |
| tp-08 | temple | always | any | 2 | We are still asking. |
| tp-09 | temple | always | any | 2 | The door is sealed. Speak through it. |
| tp-10 | temple | years_unanswered > 20 | any | 3 | Read the old answer aloud again. |

## Armies

Mortals. They do not address you at all — which is itself information, since your
movement rules don't apply to them either.

| id | actor | condition | prox | w | line |
|---|---|---|---|---|---|
| ar-01 | army | marching | reach | 3 | Whose ground is this? |
| ar-02 | army | marching | reach | 2 | It was ordered. |
| ar-03 | army | adjacent_to_target | reach | 4 | Walls, then. |
| ar-04 | army | blocked | reach | 4 | The road is gone. |
| ar-05 | army | disbanding | any | 5 | There is nowhere to go. |
| ar-06 | army | crossing_blessed | reach | 3 | Nothing happened when we crossed. |

## Refugee columns

| id | actor | condition | prox | w | line |
|---|---|---|---|---|---|
| rf-01 | refugees | marching | any | 4 | There is nothing behind us. |
| rf-02 | refugees | marching | any | 3 | How far? |
| rf-03 | refugees | marching | any | 3 | We were told to walk. |
| rf-04 | refugees | marching | any | 2 | Somewhere fuller. |
| rf-05 | refugees | arriving | any | 5 | We are here. There are many of us. |

## Stones

Stones speak in your register, not theirs — a fragment of the intervention that
raised them. A dead stone shows an empty bubble.

| id | actor | condition | prox | w | line |
|---|---|---|---|---|---|
| st-01 | stone | power >= 6 | any | 2 | *(fragment of the intervention that raised it)* |
| st-02 | stone | power >= 6 | any | 2 | I came down on this side of the valley. |
| st-03 | stone | power >= 6 && reach_extended | any | 3 | From here, further. |
| st-04 | stone | power < 6 | any | 4 | … |

---

## Open questions

- Does the wild folk's drift into silence (`wf-07`, `wf-08`) read as designed, or
  just as the corpus running dry? Needs playing.
- Whether stone bubbles should quote the actual logged intervention text rather
  than a written line. More work, better payoff.
- Character limit. Anything over ~30 characters may not fit a hex at current zoom.
- Whether a bubble should ever be *clickable* — i.e. becomes a way to select that
  tile — or whether interaction breaks the one-way-ness the whole feature is for.
