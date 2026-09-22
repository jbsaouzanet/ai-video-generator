# Commands

The write surface for `VideoProject` (mission section 22, docs/ARCHITECTURE.md Phase 4). Every command:

- takes a `VideoProject` and returns a **new** one wrapped in `{ok: true, project} | {ok: false, error}` — never
  throws, never mutates its input;
- re-validates the whole project through `VideoProjectSchema` before returning `ok: true` — a command can't
  produce a project the model itself considers invalid;
- is what `editor/src/store/projectStore.ts` calls too, not a parallel path — a human dragging a clip in the
  browser and an AI calling `trimClip()` go through the exact same function (mission Rule 6: "Human and AI
  editing MUST operate on the same project model").

## Implemented

| Command | Maps to (mission's list) | Notes |
|---|---|---|
| `trimClip(project, trackId, clipId, {start?, duration?})` | `trimClip` | 'sequence'-track clips with 'hard' timing only — refused elsewhere, not silently inert (see below) |
| `moveClip(project, trackId, clipId, newStart)` | `moveClip` | `trimClip` with duration held fixed |
| `addClip(project, trackId, clip)` | `addClip` | validates props against the shot's own schema before touching anything |
| `removeClip(project, trackId, clipId)` | `removeClip` | |
| `splitClip(project, trackId, clipId, atSeconds, secondHalfId)` | `splitClip` | both halves keep the original shot/props; re-point one via `setClipShot` after if that's the actual intent |
| `setClipShot(project, trackId, clipId, shotId, props)` | `changeShot` | needs the new shot's full prop set, not a patch — different shots take different props |
| `setClipProps(project, trackId, clipId, props)` | — (not in the mission's list, added because `changeShot` alone can't adjust props without also swapping shots) | **full replace, not a merge** — pass every prop the shot needs, not just the one changing (confirmed by testing: passing one field alone fails validation, listing every other field as missing) |
| `setTrackTransition(project, trackId, {crossDissolveFrames?, crossDissolveSymmetric?})` | `setTransition` | maps onto the real `Track` fields (src/video/model/track.ts) |
| `upsertAsset(project, asset)` / `removeAsset(project, assetId)` | `replaceAsset` | generalized to insert-or-replace; no clip in any shipped topic references an Asset yet (device visuals are hardcoded components, not `staticFile()`'d media) — real model surface, not yet exercised |

## Deliberately not implemented

`setCameraPreset`, `addAnnotation`, `addCaption`, `changePacing` are in the mission's own command list but
have no model concept to operate on yet:

- **no camera-preset registry** — camera choreography is still hand-written per shot/chapter (`TL_HOOK`,
  `TL_WHY`, ... in `src/xboxpw/Film.tsx`, `src/perweapon/tl.ts`, `src/long/tl.ts`), deliberately deferred
  (docs/ARCHITECTURE.md's `primitives/camera` note — "extracted once a second real topic validates the
  shape," and even after 2 more topics it stayed genuinely different each time: continuous project-wide pose
  vs. per-chapter pose vs. a static neutral pose. A `setCameraPreset` command would need something real to
  set a preset ON first.
- **no annotation shot type** — nothing in `src/video/shots/` is an annotation/callout in the mission's
  sense (`ScreenCallout` exists as a component but isn't a registered Shot).
- **no caption track in the model** — every topic's captions are a hardcoded `<Subtitles captions={...}>` in
  the wrapper `FilmFromProject.tsx`, reading a static JSON import, entirely outside `VideoProject`. `addCaption`
  would need a `captions`-kind track actually wired to something, not stubbed.
- **no pacing/preset system** — `docs/ARCHITECTURE.md`'s `presets/pacing/` folder doesn't exist yet.

Per the mission's own rule ("only create something when we have an actual use case"), these stay unbuilt
until a real edit needs one — a stub that always fails, or a fake no-op, would be worse than the command not
existing.

## Using from the terminal (no dev server needed)

`scripts/video-command.mjs` is the CLI wrapper — reads `src/video/projects/<slug>.json`, applies one command,
writes it back (validated), same file the editor and the render pipeline both read:

```bash
# args after the command name are one JSON array = the command's own arguments after `project`
node scripts/video-command.mjs per-weapon trimClip '["chapters", "turn", {"duration": 22}]'
node scripts/video-command.mjs per-weapon-xbox setClipProps '["scenes", "end-lockup", {"title":"ROCKETMOD","x":960,"y":220,"width":1500,"titleSize":190,"delayF":3058}]'
node scripts/video-command.mjs per-weapon setTrackTransition '["chapters", {"crossDissolveFrames": 15}]' --dry-run
```

`--dry-run` prints the resulting project instead of writing it.
