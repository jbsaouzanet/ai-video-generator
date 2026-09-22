# Shots

A Shot is a registered `{component, schema, metadata}` triple (`registry.ts`) that a `Clip.shot` string in the
`VideoProject` model resolves against. `blocks.ts` registers the 6 shots that already exist in production,
unchanged, as `src/blocks/Blocks.tsx` components — this folder adds discoverability (a schema + short
description per shot), not new behavior.

## Available shots

| id | component | PURPOSE | WHEN TO USE | WHEN NOT TO | RECOMMENDED DURATION |
|---|---|---|---|---|---|
| `title` | `TitleBlock` | Hook/section title: optional kicker + 1-2 headline lines. | Opening a film or a new chapter. | Mid-scene emphasis — use `end-lockup` or plain text instead. | 1.5-4s |
| `step-list` | `StepListBlock` | Numbered how-to steps, each optionally a key-combo, checks off at a frame. | "Turn it on" / setup instructions. | More than ~5 steps — split into two beats instead of cramming rows. | 3-8s |
| `chip-flow` | `ChipFlowBlock` | A chain of dim/bad(struck)/good chips joined by arrows. | Showing a causal chain or a rejected-then-accepted flow ("GAME UPDATE -> WAIT -> YOU UPDATE IT"). | A straight two-way comparison — use `compare` instead. | 2-5s |
| `tune-gauge` | `TuneGaugeBlock` | Live-tune value gauge + key-combo readout. | Demonstrating a hold-and-adjust interaction in real time. | Anything without a numeric value to show. | 3-7s |
| `compare` | `CompareBlock` | Dim "old way" label fades as a lit "new way" row list takes over. | The category-vs-per-item argument that opens every topic so far. | More than ~4 rows — it reads as a list, not an argument, past that. | 3-7s |
| `end-lockup` | `EndLockupBlock` | Brand title + optional tagline, optional text scrim. | Closing beat of a film. | Anywhere but the very end. | 2-4s |

## Adding a shot

Only add one when a real topic needs it — per the mission's own rule (section 23: "only create something
when we have an actual use case") and this repo's own prior practice (the Xbox topic's Tolerance meter, a
genuinely new visual, was built once, when it was actually needed — not guessed at ahead of time). A new
Shot needs: the component (wherever it already lives, e.g. `src/blocks/Blocks.tsx` if it's a general-purpose
one), a Zod schema for its props, and a `registerShot()` call with `metadata` filled in the shape of the table
above.
