# Architecture — repository audit, target architecture, migration strategy

Phase 0 deliverable (see `docs/OPEN_SOURCE_RESEARCH.md` for the reuse matrix this depends on). No
implementation happens until this is reviewed — per the mission's own instruction.

## 1. Repository audit

### Current architecture

This is a **code-first, script/JSON-driven Remotion video generator**, not an editor. There is no timeline
UI, no clip/track data model, no drag/drop, no undo/redo — every video is a hand-authored `.tsx` composition
whose timing is computed from a voice script, not placed by hand on a timeline.

**Pipeline, end to end** (see `docs/NEW-VIDEO-PLAYBOOK.md` for the human-facing version):

1. **Voice script** (`audio/voice.<topic>.script.json`) → Kokoro TTS + OpenVoice voice-cloning
   (`scripts/audio/voice.mjs`) → a `voice.timeline.json` with **real per-word timestamps** measured on the
   synthesized audio (not estimated).
2. **Visuals** (`src/<topic>/Film.tsx` or `chapters*.tsx`) import that timeline statically at build time and
   anchor every scene change to a spoken word via `wordAt`/`beatWindow`/`filmFrames`
   (`src/lib/beats.ts`) — "the 3rd time the word 'weapon' is said in line `hook`" instead of a hand-picked
   frame number. Editing a sentence re-times the whole film for free.
3. **Scenes** are built from six reusable presentation components (`src/blocks/Blocks.tsx`:
   `TitleBlock`, `CompareBlock`, `StepListBlock`, `TuneGaugeBlock`, `ChipFlowBlock`, `EndLockupBlock`) over one
   **continuous, interpolated 3D camera pose** (`{x, y, h, rz, rx, ry}` keyframed per scene) — there are no
   hard cuts inside a film; the camera itself is the transition. This is the actual visual differentiator:
   nothing here looks like clips cut together.
4. **Captions**: `scripts/audio/subtitles.mjs` chunks the timeline into cue-sized groups and (as of this
   session) emits the official `@remotion/captions` `Caption[]` shape; `src/components/Subtitles.tsx`
   reconstructs pages with `createTikTokStyleCaptions` and re-applies lead-in/hold/no-overlap display timing.
5. **Render**: `scripts/render.mjs` reads every `topics/<slug>/topic.json` (the one registry — see below),
   enforces deliverable rules (short = 9:16, long ≥ 70 s horizontal) both before and after render, versions
   output files (`-vN-`), never overwrites, copies to a Koofr delivery folder.
6. **Assembly**: `scripts/attach-clips.mjs` stitches intro + sales-pitch + film + outro — each rendered as a
   **separate** Remotion composition — together with `ffmpeg xfade`/`acrossfade` in one pass (a documented,
   deliberate perf decision: applying blur/xfade filters to 18 frames of transition instead of the whole film
   cut render time from ~25 min to ~1 min). This is post-render compositing, not a Remotion
   `<TransitionSeries>` — the codebase has zero uses of `@remotion/transitions` today despite it being a
   dependency (removed as dead weight this session).
7. **Covers/thumbnails**: `src/covers/Covers.tsx` + `RootCovers.tsx`, rendered with `npx remotion still`
   (idiomatic), copy comes from each topic's `cover` field.
8. **Delivery/publish**: `scripts/export-for-upload.mjs` names the final file
   `Cronus Zen - RocketAIM - <youtubeTitle>` and writes a `metadata.json` sidecar (title/description/
   tags/chapters/pinned comment) for a not-yet-built direct-upload script.

**Topic registry** (`topics/<slug>/topic.json`, read by `scripts/topics.mjs`'s `loadTopics()`): the single
source of truth for a topic's render targets, pitch/outro/caption wiring, and cover copy. Added this session,
replacing five previously-hardcoded per-topic tables across `render.mjs`/`attach-clips.mjs`/`Covers.tsx`.
Three topics live here today: `per-profile`, `per-weapon`, `per-weapon-xbox`.

**State/persistence**: none, in the editor sense. The "project" for a given video is the union of its voice
script JSON, its generated timeline/subtitle JSON, and its `.tsx` scene files — reloadable and diffable via
git, but there is no single serialized `VideoProject` object, no schema, no validation layer.

**Asset management**: files under `public/`, referenced by `staticFile()` per Remotion convention. No asset
registry/library concept.

### What is good (keep this)

- The **word-anchored beat system** (`src/lib/beats.ts`) is genuinely novel relative to everything found in
  the open-source research — no timeline library models this. It is the thing that makes re-timing a video
  free when a script changes, and it should become the project's `primitives/timing` layer verbatim, not be
  redesigned.
- The **continuous-camera, no-hard-cuts visual language** (one interpolated 3D pose across a whole film) is
  the actual product differentiator and exactly what the mission's own `EDITING_GUIDE.md` goals (section 15)
  ask for: "intentional... restrained transitions," "not generic motion graphics." Anything built on top must
  preserve the ability to author this, not force everything into a cut-clips-on-tracks model.
- **`Blocks.tsx`**'s six components are already, structurally, Shots (section 13) in miniature — each has an
  implicit purpose, a duration range that works, and a documented reuse pattern
  (`docs/NEW-VIDEO-PLAYBOOK.md` step 2 already tells a human/AI which existing scene file to copy for a new
  platform). Formalizing this with `schema.ts` + `README.md` per Shot is incremental work, not new design.
- **The topic registry + verification discipline.** Every refactor this session (topic registry migration,
  captions migration) was done with an explicit round-trip/pixel-diff equivalence check before trusting the
  result (documented in `docs/DEV-NOTES.md`'s "Topic registry" section, and in this session's captions
  migration). That discipline should extend to the new model: a `VideoProject` schema change should be
  provably equivalent on existing shipped topics before anything is deleted.
- **The delivery/publish discipline** (never overwrite, explicit versioning, real chapter timestamps computed
  from the *assembled* file not the raw render, AI-voice disclosure, no over-claiming) is real, working
  product process, unrelated to the editor question, and out of scope for this migration.

### Technical debt

- **No serialized project model.** A "video" is implicit in the union of several files + a `.tsx` component;
  nothing can inspect "what does this edit currently contain" without reading and mentally executing code.
  This is the core gap the mission is asking to close.
- **Per-topic `.tsx` film files duplicate structure.** `src/perweapon/Film.tsx` and `src/xboxpw/Film.tsx` are
  each a hand-written ~300-line file that repeats the same pattern (import timeline, define `POSE` map, define
  `W()`/beat helpers, lay out `<Sequence>`s of `Blocks.tsx` components). `docs/NEW-VIDEO-PLAYBOOK.md` already
  documents this as "copy the closest sibling" — i.e. the team already knows this should be data-driven, and
  deliberately deferred building that (a "Phase 2: declarative scenes / `GenericFilm.tsx`" was planned earlier
  this session and explicitly postponed until a second real topic could validate the design against real
  content instead of guessing abstractly). **This mission's `shots`/`patterns`/`registry` layers are that
  deferred work, just with a more complete vocabulary** — worth doing now under this larger design instead of
  the smaller one.
- **`topics/index.ts` is a manually-duplicated list** (Remotion's browser bundle can't `fs.readdirSync` at
  render time, so this file re-lists every topic that `scripts/topics.mjs` already scans from disk). A future
  build-time codegen step could eliminate this, low priority.
- **No asset registry.** Images/fonts under `public/` are referenced by path string, not tracked as first-class
  `Asset` entities with metadata (dimensions, duration for video/audio, etc.).

### Missing foundations (what blocks becoming the target editor)

1. No `VideoProject`/`Timeline`/`Track`/`Clip`/`Asset` types, no schema, no validation, no (de)serialization.
2. No adapter boundary — Remotion composition props ARE the data model today; there's no layer between "what
   the AI/human wants to express" and "literal Remotion JSX," which is precisely the coupling section 8/9 of
   the mission asks to avoid.
3. No registry — Shots/Blocks are imported by file path, not discoverable by an agent inspecting available
   capabilities.
4. No editor UI at all (expected — this was never an editor).
5. No semantic command layer (`addClip`, `trimClip`, etc.) — the only way to change a video today is editing
   `.tsx`/`.json` source directly.

## 2. Gap analysis: current vs. target

| | Current | Target |
|---|---|---|
| Source of truth | `.tsx` files + scattered JSON per topic | One serialized, schema-validated `VideoProject` |
| Timing model | Word-anchored beats (`beats.ts`) — real, keep | Same, generalized: a `Clip` can be beat-anchored OR hard-timed |
| Visual authoring | Hand-written `Film.tsx` per topic, camera pose maps by hand | Declarative `scenes`/Shots resolved by a `shot-resolver`, camera auto-interpolated unless overridden (this is literally the previously-deferred "Phase 2 GenericFilm" idea) |
| Editing surface | None (edit source code) | Visual timeline (new, built on `@dnd-kit` + `wavesurfer.js`) AND semantic AI commands, same model |
| AI's authoring surface | Arbitrary `.tsx`/prose edits via a human relaying instructions | Typed semantic operations (`addClip`, `setCameraPreset`, ...) validated before they touch the project |
| Components | `Blocks.tsx` (6), `components/*` (9) | Same components, catalogued in a registry with schema + usage docs per section 13/17 |
| Render | `render.mjs` reading `topics/*/topic.json` | Same script, now reading a compiled view of `VideoProject` instead of hand-written `topic.json` (topic.json becomes generated output of the model, or a thin compatibility shim) |
| Undo/redo | None | `zustand` + `zundo` |

**Nothing here recommends discarding the pipeline** (voice → beats → blocks → render → assemble → deliver).
The gap is entirely: *there is no data model between "a human/AI's editing intent" and "the literal `.tsx`
that pipeline consumes."* That's what Phase 1 builds.

## 3. Recommended foundation

**Retain the current app. Compose targeted libraries. Build the integration layer (`VideoProject` model +
adapters + a new thin timeline UI) on top.** Reject forking a full editor shell (`openvideodev/react-video-editor`
or similar) wholesale.

Why not fork a full editor: every candidate found (see `OPEN_SOURCE_RESEARCH.md`) models "arbitrary trimmed
media clips on tracks" — a CapCut/Canva-shaped primitive. RocketMod's actual differentiator (voice-word-anchored
procedural scenes, one continuous interpolated camera, zero hard cuts) is a different, more specific primitive
that none of them express. Adapting an existing clip-track editor's *data model* to carry beat-anchors and
continuous-camera state as a bolted-on special case would fight the foundation constantly, and risks exactly
the failure mode section 15 warns against — videos that read as generic template output. The *interaction
mechanics* (drag, trim handles, snapping) are commodity and get reused (`@dnd-kit`); the *data model* does not.

Why not build everything from scratch either: state/undo (`zustand`+`zundo`), waveform (`wavesurfer.js`),
drag physics (`@dnd-kit`), transitions (`@remotion/transitions`, already a dependency), captions
(`@remotion/captions`, already migrated) are all solved, permissively licensed, and actively maintained. Build
only the two things that are genuinely specific to this product: the `Clip.beat` anchor type, and the
shot/pattern registry that expresses "what a RocketMod video is allowed to say," per section 15's
human-editing-feel rules.

## 4. Target architecture

Mapping the mission's suggested `src/video/` tree onto what already exists (right column = current location,
"NEW" = genuinely new work):

```text
src/video/
  model/                       NEW — Phase 1
    project.ts                 NEW: VideoProject
    timeline.ts                NEW: Timeline, Track
    clip.ts                    NEW: Clip (discriminated union; a Clip.timing is EITHER
                                {start,duration} (hard) OR {beat:{lineId,word,nth,edge}} (anchored) —
                                beatWindow() from src/lib/beats.ts resolves the latter)
    asset.ts                   NEW: Asset (wraps today's implicit public/ file references)
    schemas.ts                 NEW: Zod schemas mirroring the above

  engine/                      NEW — Phase 1/2
    shot-resolver.ts           NEW: Clip.shot -> registered component + resolved props
    pattern-resolver.ts        NEW: applies a Pattern's structure/constraints (section 14)
    renderer.ts                THIN WRAPPER around existing scripts/render.mjs / scripts/topics.mjs

  adapters/
    remotion/                  THIN WRAPPER around existing Composition/Root setup (topics/index.ts, Root*.tsx)
    timeline/                  NEW: @dnd-kit-based drag/trim/snap interaction, Phase 3
    transitions/               THIN WRAPPER around @remotion/transitions (dependency already present, unused
                                today — becomes relevant once real video/gameplay clips, not just procedural
                                graphics, enter tracks)
    captions/                  = src/components/Subtitles.tsx + scripts/audio/subtitles.mjs, AS-IS (already
                                on @remotion/captions as of this session)
    audio/                     = scripts/audio/{voice,soundtrack,finalize,subtitles}.mjs, AS-IS

  primitives/
    motion/                    = src/lib/anim.ts (prog, E, keyed, springIn, bump, lerp, clamp), AS-IS
    camera/                    = the POSE-map + interpolation pattern used in every Film.tsx today,
                                extracted once a second real topic validates the shape (see "Phase 2" note
                                in the audit above — this was already the plan before this mission arrived)
    timing/                    = src/lib/beats.ts (wordAt, beatWindow, filmFrames, lineStart, lineEnd), AS-IS
                                — this is the one deliberate BUILD in the whole reuse matrix, already built

  components/
    typography/                = FeatureTitle, ui.tsx (Glass, Tag), Subtitles — reorganize, don't rewrite
    annotations/                (new components as real Shots need them — none exist yet, don't build blind)
    media/                     = CronusHero, DocumentationPanel, ProfileStack, Background, AvatarPip
    branding/                  = intro/IntroScene.tsx, outro/OutroScene.tsx (RocketMod-specific; must move to
                                presets/brands/rocketmod/ per section 18, NOT stay generic)

  shots/                       NEW registry wrapper around EXISTING Blocks.tsx entries first:
    TitleBlock/, CompareBlock/, StepListBlock/, TuneGaugeBlock/, ChipFlowBlock/, EndLockupBlock/
                                (schema.ts + README.md added per shot; component code unchanged)
    (mission's suggested GameplayDemo/DocumentationDemo/etc. — build ONLY when a real topic needs one,
                                per the mission's own section 23 "only create something when we have an
                                actual use case," echoing this repo's own earlier Phase-2 deferral reasoning)

  patterns/                    NEW — first pattern extracted from lived practice, not invented: the shape
                                already documented informally in docs/NEW-VIDEO-PLAYBOOK.md ("hook, what it
                                does, before you start, turn it on, how it behaves, troubleshooting, end")
                                becomes patterns/FeatureExplanation/ (name TBD)

  transitions/                 = @remotion/transitions usage, once real clip tracks exist

  captions/                    = adapters/captions, see above

  audio/                       = adapters/audio, see above

  presets/
    brands/rocketmod/          NEW location for src/theme.ts, intro/outro, cover copy tables, caption style
    pacing/                    NEW (durations/edge constants currently hardcoded per scene)
    social/                    NEW (short vs. long format constraints — currently enforced ad hoc in
                                scripts/render.mjs's violations())

  registry/                    NEW — Phase 1, thin (register Shots, later Patterns)

  compositions/                = topics/<slug>/topic.json + topics/index.ts + Root*.tsx, AS-IS (already
                                exactly this layer, just not renamed/relocated)

editor/                        100% NEW, Phase 3 — timeline/preview/inspector/assets/controls,
                                built on Remotion Player + @dnd-kit + wavesurfer.js + zustand/zundo
```

**The headline finding: most of the target tree already exists under different names.** The genuinely new
work is `model/`, the `editor/` UI, the semantic command layer (section 22), and the registry wiring. That is
a much smaller lift than "build an editor," and is exactly why forking a full external editor app is *less*
attractive here than it might look at first glance — this repo already has more of the target architecture
than a fresh fork would give it, just not organized as such.

## 5. Migration strategy

No big-bang rewrite. Order matters because each step is independently shippable and testable against the 3
already-shipped topics:

1. **Move, don't rewrite**, `src/lib/anim.ts` → `primitives/motion`, `src/lib/beats.ts` → `primitives/timing`
   (re-export from the old path for one deprecation window so in-flight work doesn't break; every current
   import already goes through named exports, so this is a path change, not an API change).
2. **Define `model/` types + Zod schemas** (Phase 1). Do NOT touch any existing `Film.tsx` yet.
3. **Write one read-only adapter**: given a `topics/<slug>/topic.json` + its `Film.tsx`, produce the
   equivalent `VideoProject` JSON *by hand, for the 3 existing topics*, and diff-verify that
   `engine/renderer.ts` driven by that `VideoProject` reproduces the exact same rendered frames as
   `render.mjs` does today (same pixel-diff discipline already used for the topic-registry and captions
   migrations this session). This proves the model before anything depends on it.
4. **Wrap `Blocks.tsx`'s 6 components in the `shots/` registry** (schema + README per shot), still consumed
   exactly as today by existing `Film.tsx` files — no behavior change, just discoverability.
5. **Build the `engine/shot-resolver.ts` + `engine/pattern-resolver.ts`** and re-implement ONE existing film
   (`per-weapon-xbox`, the newest/simplest) as declarative `scenes` data instead of hand-written `.tsx`,
   verified pixel-identical against the currently-delivered file. This is the previously-deferred "Phase 2
   GenericFilm" work, now done under the bigger model instead of a bespoke one.
6. **Only then** start `editor/` (Phase 3) — preview via Remotion Player against the now-real
   `VideoProject`, read-only first (render the timeline, no editing yet), then add selection → trim → move
   with `@dnd-kit`, then undo/redo.
7. **Semantic command layer** (Phase 4) last — it's the AI-facing surface, and should be built against a
   `VideoProject` shape that's already been exercised by both the existing render pipeline and a working (even
   if minimal) human editor UI, not designed first and adapted to both afterward.

Nothing existing gets deleted until its replacement has passed the same equivalence check this session used
twice already (topic registry, captions). `topics/<slug>/topic.json` can remain the on-disk format for a long
time — it can be treated as a compiled/exported view of a `VideoProject` rather than replaced outright.

## 6. First vertical slice

Smallest thing that proves `Human ↔ VideoProject ↔ Claude ↓ Remotion`:

1. `model/`: `VideoProject`, `Track`, `Clip` (hard-timed only at first — beat-anchoring plugs in once
   `primitives/timing` is relocated), Zod schemas.
2. One hand-written `VideoProject` JSON that describes the **already-shipped `per-weapon-xbox` long film**
   scene-by-scene (this film was chosen because it's the newest, smallest, and already fully beat-driven —
   the best-understood case in the repo right now).
3. `engine/renderer.ts`: reads that JSON, resolves each scene via the `shots/` registry (wrapping the
   existing `Blocks.tsx` components unchanged), renders through the existing Remotion Composition unchanged.
4. Verification: render both the current `Film.tsx`-driven version and the new `VideoProject`-driven version,
   pixel-diff every frame (or a representative sample — same technique already used for `Covers.tsx` this
   session: `sharp`, raw buffer diff, mean/max abs difference must be 0 or explainably ~0).
5. A **read-only** `editor/preview` page: Remotion Player loads that same `VideoProject`, shows the timeline
   as static (non-interactive) blocks per track. No editing yet.
6. Stop. Evaluate before adding drag/trim/undo or any AI command — per the mission's own section 28.

This slice deliberately excludes: the editor's interactivity, the AI command layer, and any NEW Shot/Pattern
— it only has to prove the model is real and lossless against something already shipped.

## 7. Risks

- **License drift risk**: this repo already depends on Remotion under its custom "free below a company-size
  threshold" license. Nothing in this plan adds a second incompatible license — `dnd-kit`/`wavesurfer.js`/
  `zustand`/`zundo`/Zod are all MIT/BSD. Re-check `openvideodev/react-video-editor`'s terms before copying
  even reference code from it (its license explicitly forbids "copying or modifying OpenVideo code for the
  purpose of selling... your own derivative of OpenVideo" — reading its architecture for ideas is fine, lifting
  its source is not, for a business built partly on paid scripts).
- **Scope creep into "build a timeline library."** The mission itself warns about this (Rule 10). The
  `adapters/timeline/` layer must stay a thin wrapper over `@dnd-kit` interaction primitives, not grow into a
  competing general-purpose timeline component.
- **Losing the continuous-camera differentiator.** If `Clip`/`Track` modeling gravitates toward "everything is
  a cut on a track" because that's what `@dnd-kit`-based UIs make easiest to build, the videos start looking
  like every other AI-generated template output — the exact failure mode section 15 names. The camera-pose
  primitive needs to stay a first-class citizen of the model (a `Clip` can own a camera pose override), not an
  afterthought bolted onto a clip-cut UI.
- **`@remotion/transitions` currently unused.** Low risk, just a note: real value only appears once actual
  video/gameplay/screen-recording clips (not procedural graphics) enter tracks — until then it stays inert,
  which is fine.
- **Maintenance risk on small libraries.** `charkour/zundo` (892★, last push Jan 2026 — 8 months quiet) is a
  tiny, stable-scope utility; quiet is normal for it, not a red flag, but worth a health check before Phase 3.
- **Performance risk, not yet measured.** No current topic exercises a real multi-track, many-clip editor
  scenario; `render.mjs`'s render times (documented: ~1 min per film today thanks to the narrow-filter-window
  ffmpeg trick) could regress if `engine/renderer.ts` naively re-renders more than it needs to. Needs a real
  benchmark once the vertical slice exists, not a guess now.
- **Team-of-one bandwidth.** This is a multi-phase mission (research → model → shots/patterns → editor MVP →
  AI commands → advanced editor). Section 27's phase gating exists for a reason — the risk is starting Phase 3
  (editor UI, the most visible/exciting part) before Phase 1's model has been proven on real content, which
  would repeat the exact mistake this repo already caught itself making once this session (the original
  "Phase 2 GenericFilm" was deliberately deferred until a second real topic could validate it — same
  discipline applies here, at a larger scale).
