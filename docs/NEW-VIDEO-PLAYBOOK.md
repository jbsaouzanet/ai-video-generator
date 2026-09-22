# New video playbook

A checklist to ship a new topic (a new platform of an existing mode, or a brand-new mode) with the least
back-and-forth. Every topic is registered as one `topics/<slug>/topic.json` (step 3) read by
`render.mjs`/`attach-clips.mjs`/`RootCovers.tsx` — adding a topic no longer means hand-editing those scripts.
Two tiers of reuse on top of that:

- **Same family, new platform/doc** (e.g. Per Weapon on Xbox, Per Profile on Xbox, "PC" = PS5-controller-on-PC
  or Xbox-controller-on-PC): the shot list, pacing and pipeline commands below reuse almost everything —
  mostly new *facts* (button names, screen text, menu quirks) into an existing scene shape.
- **A genuinely new mode** (Rapid Fire, or anything outside `weapon-detect`): the audio/render/assembly/publish
  machinery below still applies as-is, but the visual scenes (chapters, diagrams, UI callouts) are new
  React/TS work — this playbook removes the boilerplate around that work, it does not remove the work itself.

## 0. Ground the facts before writing a single word of script

1. Get the real doc URL from the user or the site map (`https://rocketmod.org/sitemap.xml`, filter `<loc>` for
   the feature family). The rendered page is a JS app; always fetch the **raw markdown** instead:
   `https://rocketmod.org/docs/<same path after documentation/>.md` (e.g.
   `.../documentation/weapon-detect/xbox-per-weapon` -> `.../docs/weapon-detect/xbox-per-weapon.md`).
   `curl`/`WebFetch` are blocked in this environment; fetch with `mcp__context-compress__execute` (node
   `https.get`), not the sandboxed `fetch_and_index` summarizer, so you get the exact wording, not a lossy
   summary.
2. Write `docs/SOURCE-<topic>.md`, same shape as `docs/SOURCE.md`: only facts from that page, one line each,
   nothing invented. Call out anything that **breaks an assumption carried over from the reference video**
   (button names, step counts, slot counts, a setting that doesn't exist on the other platform, a reliability
   caveat the docs themselves state). This file is what stops a copy-paste mistake from becoming a factual
   claim in a published video.
3. If the topic's marketing claims (pitch wording, cover copy) were written for a *different* platform/mode,
   re-check each claim against the new facts before reusing it. Concretely: the PS5 Per Weapon pitch says
   "perfect anti-recoil" and "no other script does this" — **do not reuse that confidence for Xbox** without
   checking; RocketMod's own Xbox doc calls its detection "a less precise signal whose real-world behavior is
   still being confirmed" (vibration-based, no adaptive-trigger sensor on Xbox). Soften or caveat instead of
   copying.

## 1. Voice script

`audio/voice.<topic>.script.json` (+ `-short.script.json` for a short). Same shape as the existing scripts:
`{"engine":"kokoro","voice":"am_onyx=0.3,am_michael=0.7","speed":<1.05-1.15>,"vc":{"src":"audio/voiceprints/kokoro-onyx30-michael70.se.pth","tgt":"audio/voiceprints/user.se.pth","alpha":1,"tau":0.3},"lines":[{"id":"a1","start":0.35,"text":"..."},{"id":"a2","gap":0.45,"text":"..."}]}`.
One line per beat; `gap` = silence before this line starts (seconds after the previous line ends). Env needed:
`KOKORO_PYTHON`, `OPENVOICE_DIR`, `OPENVOICE_CKPT` (see DEV-NOTES "Voice engines" / "Voice conversion").

## 2. Visuals — reuse the closest existing scene file as a template

Pick the nearest sibling and copy its shape, don't start from a blank file:

- New platform of **Per Weapon** -> copy `src/perweapon/chapters1.tsx` / `chapters2.tsx` / `tl.ts` /
  `src/perweapon/short/PWShort.tsx` (for a short). Swap: `KeyCap` labels (PS5 `L2`/`Circle`/`Triangle`/`Cross`
  -> Xbox `LT`/`B`/`Y`/`A`, see the button map fetched for the topic), OLED screen text/values (from
  `docs/SOURCE-<topic>.md`, never invented), slot counts, and any setting that only exists on one platform
  (e.g. Xbox's **Tolerance** row has no PS5 equivalent — new small UI, reuse `Gauge` from `src/components/ui.tsx`
  the way the Per Weapon short's tuning scene does).
- New platform of **Per Profile** -> copy `src/RocketModWeaponDetectionLong.tsx` / `src/long/ChaptersNew.tsx`
  the same way.
- A **new mode outside weapon-detect** (Rapid Fire, etc.) -> check the doc's own content against
  `src/video/patterns/feature-explanation.ts` first (hook / why-compare / turn-it-on / first-use / teach /
  live-tune / edge-case / escape-hatch / platform-caveat / outro-facts / end-lockup — extracted from all 3
  shipped weapon-detect topics, see that file's README for the raw comparison). It may or may not fit a
  topic from a different product family — that's a hypothesis to check against the real doc, not an
  assumption — but if it does, reuse `src/video/shots/` (title/compare/step-list/tune-gauge/chip-flow/
  end-lockup) for whichever beats it covers instead of hand-rolling scene JSX from scratch, following the
  `src/xboxpw/Film.tsx` + `src/video/projects/per-weapon-xbox.json` pairing as the reference (voice-word
  driven, `W(line, word)` timing helper, beats now expressible as data). Only build bespoke scene components
  for beats the existing shots genuinely don't cover — same as Xbox's Tolerance meter.

Wire the local-frame-from-word-time pattern (`lf`/`W` helpers keyed to the voice timeline) rather than hand
timing frames — it is what keeps every scene change re-syncing for free when a line of the script changes.

## 3. Register the topic — one JSON file, not five hand-edits

Every topic is `topics/<slug>/topic.json` (see `docs/DEV-NOTES.md` "Topic registry" for the exact shape:
`youtubeTitle`, `pitchMode`, `formats.{short,long}` with `comp`/`entry`/`base`/`w`/`h`/`seconds`/`captions`,
and `cover`). `scripts/render.mjs`, `scripts/attach-clips.mjs` and `src/covers/RootCovers.tsx` all read it —
you no longer hand-edit `TARGETS`/`pitchMode`/`SRT_FOR` tables or a `CoverMode` union per topic. The **one**
extra hand-edit left is adding one `import`+push line to `topics/index.ts` (Remotion's bundle can't scan a
directory at runtime the way the Node scripts can — see the comment at the top of that file).

`pitchMode` picks an existing `pw`/`pp` pitch to reuse; a genuinely new mode needs its own mode added to
`src/pitch/PitchScene.tsx` (`PitchMode` union + `COPY` entry) — the intro/outro stay feature-family-level and
need no change either way.

## 4. Subtitles, soundtrack, render, assemble

```bash
node scripts/audio/voice.mjs audio/voice.<topic>.script.json audio/build/<topic>
cp audio/build/<topic>/voice.timeline.json src/<wherever the scene imports it>.json
node scripts/audio/subtitles.mjs audio/build/<topic>/voice.timeline.json src/subtitles/<topic>.json <32|58> audio/subtitles/<topic>.en.srt
# write scripts/audio/profiles/<topic>.mjs (copy the closest existing profile, SFX keyed to the same W() word times)
node scripts/audio/soundtrack.mjs <topic> && node scripts/audio/finalize.mjs audio/build/<topic>/soundtrack.raw.wav public/audio/<topic>.wav <seconds>
node scripts/render.mjs <slug>-<short|long> --concurrency=2   # target name = <topic.json slug>-<short|long>
node scripts/attach-clips.mjs out/<raw film>.mp4 --intro warp --pitch --outro --new-version
```

## 5. Cover / thumbnail

The `cover` block already lives in `topics/<slug>/topic.json` (kicker/head/chips/pill/screen/backgroundLabel/
headSize) — add it there, nothing to touch in `src/covers/Covers.tsx` itself unless the topic needs a visual
idea the six existing blocks don't cover. Render + export exactly as documented in DEV-NOTES "Covers / thumbnails".

## 6. Publish package

Same generators, new topic name: YouTube titles/description/tags/chapters (`Koofr\RocketAIM\youtube\`), a
Patreon Quip + members' post if it's a launch-worthy feature (`Koofr\RocketAIM\patreon\`), a Discord
announcement once the user gives you the live link (`Koofr\RocketAIM\youtube\discord-announce-<topic>.txt`).
Keep the same rules: no "undetectable/no ban" claims, "use at your own risk" disclaimer, tick the AI-voice
disclosure box, real chapter timestamps computed from the final assembled file (not the raw render). The
**YouTube title always starts `Cronus Zen - RocketAIM - <topic.json youtubeTitle>`** — that field is what
YouTube's own algorithm reads, not the local filename.

## 7. Deliver

`node scripts/attach-clips.mjs ... --new-version` already versions and copies to Koofr. When a new final
supersedes an old one, move the old `<name>-vN-*.mp4` (+ `.en.srt`) into `Koofr\RocketAIM\anciennes-versions\`,
keep only the latest of each name at the root (see DEV-NOTES "Video delivery" / the `video-delivery-koofr`
memory note) — never delete. Then `node scripts/export-for-upload.mjs <slug> <short|long>` copies that latest
file + its captions + its cover into `Koofr\RocketAIM\youtube\ready-to-upload\`, named
`Cronus Zen - RocketAIM - <topic.json youtubeTitle>` (filesystem-illegal characters like `:` are swapped for
`-` in the FILENAME only; the real title, written into the `.metadata.json` sidecar, keeps them) — this is
what you'll eventually drag into YouTube Studio, or what a future direct-upload script will read
(`docs/DEV-NOTES.md` "Direct YouTube upload (planned)").

## Topics shipped so far

| Topic (`topics/<slug>/`) | Doc | Status |
|---|---|---|
| `per-profile` | `weapon-detect/ps5-per-profile` | long + short shipped |
| `per-weapon` | `weapon-detect/ps5-per-weapon` | long + short shipped |
| `per-weapon-xbox` | `weapon-detect/xbox-per-weapon` | long shipped (`docs/SOURCE-xbox-per-weapon.md`); short not built |

## Related doc pages seen but not yet used (site map, 2026-09-22)

Under `weapon-detect`: `xbox-per-profile`, `ps5-twin-swap`, `ps5-twin-guess`, `teach-weapon` (mode-agnostic),
`full-script-guide`. **"PC" has no separate doc, and no separate mechanism**: it's about which *Device*
setting matches the pad in hand, confirmed by the user. **Device: PS5** = adaptive-trigger method, needs a
real DualSense with adaptive-trigger effects on in-game (PS5 console, or PC with that feature active) — no
fallback, confirmed nothing is detected without it. **Device: Xbox** = vibration method (`docs/SOURCE-
xbox-per-weapon.md`), works with ANY pad — a real Xbox controller, or a DualSense on PC without adaptive
triggers. So "Per Weapon for PC" content should frame it as "pick Device: PS5 or Xbox based on what your
pad can do", not as its own platform.

Rapid Fire lives in a **different product family**, not under `weapon-detect`:
`https://rocketmod.org/documentation/rocket-aim-cod/rapid-fire`. Fetch it fresh when actually building that
video — the only confirmed link to weapon-detect so far is one cross-reference ("Rapid Fire -> Only Gun reads
the last detected weapon").
