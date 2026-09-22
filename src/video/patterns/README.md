# Patterns

A Pattern is a checklist of beat *purposes* (structure) plus a few pacing constraints already proven across
shipped films — not a rigid template, and not something a topic's clips are generated from automatically. It
exists so a new topic (human- or AI-planned) can be checked against "does this cover what a topic like this
usually needs to say" before its `VideoProject` is authored, using `src/video/shots/` for the actual clips.

## `feature-explanation` — the raw comparison behind it

Extracted by grepping each shipped topic's own scene/chapter comments, not guessed:

| Beat purpose | per-profile (`src/long/ChaptersNew.tsx`) | per-weapon PS5 (`src/perweapon/chapters1\|2.tsx`) | per-weapon-xbox (`src/xboxpw/Film.tsx`) |
|---|---|---|---|
| hook | `intro` (Scene1Hook) | `1 · hook` | `hook` |
| why / compare | `intro` (Scene2Profiles) | `2 · why: profiles vs slots` | `why` |
| turn it on | `before` + `turnon` | `3 · turn it on` | `setup` |
| first use / baseline | `detect` (Scene3Detect) | `4 · first shot` | `first` |
| teach / configure *(optional)* | — (nothing to teach) | `7 · teach weapon` | `teach` |
| live tune | — (folded into `detect`) | `5 · live tuning` | `tune` |
| edge case | `unsure` | `6 · ambiguity + slot list` | `ambig` |
| escape hatch *(optional)* | `fix` | `8 · edit + delete` | — (see platform-caveat below) |
| platform caveat *(optional)* | — | — | `tolerance` (Xbox-only Tolerance meter) |
| outro facts | `outro` (Scene4Auto/Scene5Docs) | `9 · cheat sheet` | `outro` |
| end lockup | `outro` (Scene6End) | `10 · end` | end-lockup clip |

Two things worth being honest about, not smoothing over:
- **Beat order isn't fixed.** `teach` comes *before* `live-tune` on Xbox but *after* it on PS5. The pattern
  records the beats, not a mandated sequence.
- **Two different transition mechanisms are both in real use**, and the pattern doesn't prefer either:
  chapter cross-dissolve (`OV` = 10 frames, per-profile and per-weapon PS5) vs. flat self-gating scenes with
  a light-streak at the cut (`beatWindow()` edge = 0.27s, per-weapon-xbox). A new topic picks whichever
  matches its own visual shape.

## On Rapid Fire / Aim Assist (or any topic outside weapon-detect)

`feature-explanation` was extracted **only** from `weapon-detect` topics. Per `docs/NEW-VIDEO-PLAYBOOK.md`,
Rapid Fire lives in a different product family (`rocket-aim-cod`) with its own doc, fetched fresh, not yet
read in depth. It may well fit this pattern — "explain a feature: what it replaces, how to turn it on, how it
behaves" is a generic enough shape — but that's a hypothesis, not a fact, until that topic's real doc content
is checked against it the same way this pattern itself was built: from real content, not assumed in advance
(mission section 23; also `docs/NEW-VIDEO-PLAYBOOK.md`'s own step 0, "ground the facts before writing a
single word"). If Rapid Fire's actual structure doesn't fit, the right move is a second Pattern, not bending
this one — or bending `feature-explanation` itself if the fit is close but not exact, updating this table with
the new evidence.

## Using a Pattern today

There's no `pattern-resolver.ts` yet — patterns are consumed by *reading* them (this file, or
`getPattern('feature-explanation')`) while authoring a new topic's `VideoProject` JSON by hand, the same way
`per-weapon-xbox.json` was authored. Automating "given a Pattern + a topic's facts, draft a VideoProject" is
real future work, not attempted here — see `docs/ARCHITECTURE.md`'s Phase 4 (semantic AI editing tools).
