# Open-source research — AI-native video editor

Phase 0 deliverable. Every repo below was checked live via `gh api repos/<owner>/<repo>` (stars, license,
`pushed_at`, archived flag) on 2026-09-22, not recalled from training data or taken at face value from search
snippets — two of the names that came up in search (`rrh1441/remotion-ui`) turned out to be 404s, which is
exactly why. Sources are GitHub API responses; anything not verified this way is marked "unverified" below.

## Reuse matrix

| Capability | Existing solution | Repo | License | Stars / last push | Fit | Decision |
|---|---|---|---|---|---|---|
| Render + preview engine | Remotion + Remotion Player | `remotion-dev/remotion` | Custom (free ≤ small co., paid company license) | 60,000 / 2026-09-22 (today) | Already the core dependency of this repo | **REUSE** (already in place) |
| Transitions | `@remotion/transitions` | `remotion-dev/remotion` | same as above | — | Already a dependency, currently unused (scene continuity is hand-rolled camera-pose interpolation, not cuts) | **REUSE** — becomes relevant once real video/gameplay clips (not procedural graphics) enter the model |
| Captions | `@remotion/captions` | `remotion-dev/remotion` | same as above | — | Already migrated onto this in this session (`Caption[]` + `createTikTokStyleCaptions`) | **REUSE** (done) |
| Full editor shell (timeline+tracks+clips+drag/trim/split/snap+canvas preview, built on Remotion) | OpenVideo | `openvideodev/react-video-editor` | Custom "OpenVideo License" — free for individuals / for-profits ≤3 employees, paid company license above that (same shape as Remotion's own license, text pulled and read in full) | 1,796 ★ / 2026-06-30 | Strongest full-editor candidate found. Its data model is almost certainly "arbitrary trimmed media clips on tracks" (CapCut/Canva-shaped) — RocketMod's actual differentiator is voice-word-anchored procedural scenes with one continuous interpolated 3D camera pose, not cut clips. Forking the whole app risks flattening exactly that. | **ADAPT** — read its timeline/clip TS types and canvas-preview technique as reference architecture; do not fork the app |
| Full editor shell (alt.) | Free React Video Editor | `reactvideoeditor/free-react-video-editor` | MIT | 136 ★ / 2025-02-15 (stale, 19 mo) | Sample/marketing arm of a paid SaaS (reactvideoeditor.com). Stale, thin. | Skip |
| Full editor shell (alt.) | a-react-video-editor | `sambowenhughes/a-react-video-editor` | MIT | 159 ★ / 2024-12-05 (stale, 22 mo) | Learning project, thin foundation | Skip |
| Timeline component (standalone) | react-video-timeline-editor | `Ektie/react-video-timeline-editor` | **AGPL-3.0** | 0 ★ / pushed yesterday (brand new, unproven) | Copyleft license — depending on it as a linked library risks forcing this whole (commercial, paid-script-adjacent) product's source open. Zero track record besides. | **Reject** — license risk alone disqualifies it regardless of quality |
| Timeline component (standalone) | `@cyca/react-timeline-editor` | (npm) | unverified | v0.2.1-alpha, last publish ~6 mo ago | Alpha, thin adoption signal | Skip for now, re-check later |
| Timeline interaction mechanics (drag, resize, snap, keyboard nudge) | dnd-kit | `clauderic/dnd-kit` | MIT | 17,659 ★ / 2026-09-12 | Gold standard, framework-agnostic, accessible, ~6 KB core, 2.8M weekly downloads (npm), the thing the React ecosystem consolidated around after `react-beautiful-dnd` went unmaintained | **REUSE** — build our own thin timeline UI on top of this, don't build drag/resize physics ourselves |
| Audio waveform | wavesurfer.js | `katspaugh/wavesurfer.js` | BSD-3-Clause | 10,418 ★ / 2026-09-21 | Mature, huge, permissive, actively pushed yesterday. No reason to build this. | **REUSE** |
| State + undo/redo | zustand + zundo | `pmndrs/zustand` + `charkour/zundo` | MIT / MIT | zundo: 892 ★ / 2026-01-30 | Plain-object store, trivially both React-bindable (for the UI) and directly readable/mutable (for an AI tool layer) — a good fit for "human and AI manipulate the same model," which a component-tree-coupled state manager (e.g. Redux-Toolkit-with-slices-per-feature) would fight harder | **REUSE** |
| Runtime schema validation | Zod | (already a documented pattern in the installed `remotion-markup/parameters.md` skill) | MIT | — | Directly matches the user's own instruction ("Use Zod where runtime validation is useful") and Remotion's own `Composition schema` prop pattern | **REUSE** |
| Remotion component libraries | Remotion Bits | `av/remotion-bits` | **No LICENSE file found** (`license: null` via API, no file matching `*license*` in repo root) | 474 ★ / 2026-09-15 | Active, well-starred — but no license means all-rights-reserved by default; cannot legally depend on or vendor code from it without asking the author | Skip until license is clarified (or ask the author) |
| Remotion component libraries | remotion-ui | `riaz37/remotion-ui` | MIT | 60 ★ / 2026-09-21 | Small but real, MIT, registry-style `npx remotion-ui add <component>` distribution (source-you-own, same idea as shadcn/ui) — safe to pull specific components from | **ADAPT** — cherry-pick components as needed, don't take a blanket dependency |
| Remotion component libraries | remotion-ui (different repo, same name) | `rrh1441/remotion-ui` | — | **404 — repo does not exist** | A search-result title, not a real thing | Discard (this is exactly the kind of claim this doc exists to catch before it gets acted on) |
| Remotion component libraries | remotion-kit | `seblavoie/remotion-kit` | **No LICENSE file** | 17 ★ / 2026-02-03 | Small, unlicensed | Skip |
| Existing components in THIS repo | `src/blocks/Blocks.tsx` (TitleBlock, CompareBlock, StepListBlock, TuneGaugeBlock, ChipFlowBlock, EndLockupBlock) + `src/components/*` (Subtitles, ui.tsx, FeatureTitle, LightSweep, CronusHero, ProfileStack, AvatarPip, Background, DocumentationPanel) | this repo | MIT (this repo's own license) | proven across 2 shipped topics (Per Weapon PS5 + Xbox) | This is already a working, opinionated component library that produces videos that don't look like generic template output — the actual product differentiator | **REUSE as the seed of `components/`** — do not replace with a generic library |
| Voice-anchored timing | `src/lib/beats.ts` (`wordAt`, `beatWindow`, `filmFrames`) + `src/lib/anim.ts` (`prog`, `E`, `keyed`, `springIn`, `bump`) | this repo | — | proven, shipped | No external equivalent exists — every timeline/editor library found models "clips with arbitrary in/out points," none model "a beat anchored to the Nth occurrence of a spoken word." This is genuinely novel | **REUSE as `primitives/timing` + `primitives/motion`** (this is the one deliberate `BUILD` in the whole matrix, and it's already built — see justification below) |
| AI-agent video generation workflow pattern | claude-code-video-toolkit | `digitalsamba/claude-code-video-toolkit` | MIT | 2,107 ★ / 2026-09-21 (very active) | A Claude Code skill/command workspace (`/setup`, `/video`) that generates *raw assets* (TTS via Qwen3-TTS, images via FLUX.2, music via ACE-Step) on a rented cloud GPU, then assembles with moviepy/Remotion. Different problem from ours (asset generation vs. editing an existing authored timeline) — no timeline/project data model in it. | **ADAPT the UX pattern** (slash-command-driven workflow: `/setup`, `/video`) for a future `/video-edit`-shaped command set; not a code dependency |
| Remotion-for-coding-agents reference | remotion-agent-catalog | `victorsodre/remotion-agent-catalog` | MIT | 12 ★ / 2026-09-07 | Small, purpose-built as "component catalog + documented limitations for coding agents" — same spirit as section 17's registry idea | Worth reading as one more data point; too small to depend on | **Skip as dependency, note as prior art** |
| Official Remotion skills for this exact stack | `remotion-dev/skills` (12 skills: best-practices, captions, create, docs, interactivity, maps, markup, multimedia, render, saas, studio, upgrade) | `remotion-dev/skills` | — | official, installed this session | Already installed as Claude Code skills in this project's session | **REUSE** (done — see `~/.claude/skills/remotion-*`) |

## `BUILD` justification (the one deliberate build)

Per the mission's own rule, `BUILD` is last resort and must be justified. The only thing in this matrix that's
genuinely `BUILD` — and it's already built, proven, shipped — is **word-anchored beat timing**
(`src/lib/beats.ts`): resolving a scene's on/off window from "the Nth time this exact word is spoken in voice
line X" rather than a hand-picked frame number or a clip's arbitrary trim points. No timeline/editor library
surveyed (OpenVideo, react-video-timeline-editor, `@cyca/react-timeline-editor`) models a beat this way —
they all model **clips**: a span of source media with in/out points on a track. That's a different, more
general primitive, and it's *also* worth having (real gameplay/screen-recording footage needs it) — but it
doesn't replace beat-anchoring, it sits alongside it. The target model (docs/ARCHITECTURE.md) keeps both:
a `Clip` can carry either a hard `{start, duration}` (classic NLE clip) or a `beat: {lineId, word, edge}`
anchor that resolves to one at render/preview time.

## What this rules out

- **Forking `openvideodev/react-video-editor` wholesale.** Good reference, wrong primitive for this product's
  actual differentiator. Read it, don't become it.
- **`Ektie/react-video-timeline-editor`.** AGPL-3.0 + zero track record. Hard no regardless of technical merit.
- **`av/remotion-bits`, `seblavoie/remotion-kit`.** No LICENSE file = all-rights-reserved by default. Can't
  depend on either without asking the author first.
- **Building our own drag/resize/snap physics, our own waveform renderer, our own undo/redo stack, our own
  transition library.** All commodity, all solved, all available under permissive licenses already checked
  above.

## Sources

- [openvideodev/react-video-editor](https://github.com/openvideodev/react-video-editor)
- [reactvideoeditor/free-react-video-editor](https://github.com/reactvideoeditor/free-react-video-editor)
- [sambowenhughes/a-react-video-editor](https://github.com/sambowenhughes/a-react-video-editor)
- [Ektie/react-video-timeline-editor](https://github.com/Ektie/react-video-timeline-editor)
- [clauderic/dnd-kit](https://github.com/clauderic/dnd-kit)
- [katspaugh/wavesurfer.js](https://github.com/katspaugh/wavesurfer.js)
- [charkour/zundo](https://github.com/charkour/zundo)
- [remotion-dev/remotion](https://github.com/remotion-dev/remotion)
- [av/remotion-bits](https://github.com/av/remotion-bits)
- [riaz37/remotion-ui](https://github.com/riaz37/remotion-ui)
- [seblavoie/remotion-kit](https://github.com/seblavoie/remotion-kit)
- [digitalsamba/claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit)
- [victorsodre/remotion-agent-catalog](https://github.com/victorsodre/remotion-agent-catalog)
- [Remotion resources list](https://www.remotion.dev/docs/resources)
- [Remotion Editor Starter (paid official template)](https://www.remotion.dev/docs/editor-starter)
