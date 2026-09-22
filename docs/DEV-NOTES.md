# RocketMod video: developer notes

Cuts of the same story, one code base:

| Composition | Format | Length | Category | Render |
|---|---|---|---|---|
| `RocketModWeaponDetectionShort` | 1080x1920 (9:16) | 33.5 s | **short** | `npm run render:short` |
| `RocketModWeaponDetectionLong` | 1920x1080 | 90 s | **long** | `npm run render:long` |
| `RocketModPerWeapon` (own entry `src/index-perweapon.ts`) | 1920x1080 | ~117 s | **long** | `npm run render:perweapon` |
| `RocketModWeaponDetection` | 1920x1080 | 33.5 s | none: draft | `npm run render:draft` (`out/drafts/`, not delivered) |

**Deliverable rules** (enforced by `scripts/render.mjs` before and after each render): **short = always vertical 9:16**; **long = always horizontal and at least 70 s (1 min 10)**. A 16:9 cut of 33 s is neither, so it is only a draft. A render that breaks a rule is moved to `out/rejected/` and not delivered.

**Renders never overwrite**: `scripts/render.mjs` writes a new file each time, named `rocketmod-<per-profile|per-weapon>[-9x16]-vN-<long|short>.mp4` (N = next free number for that name), e.g. `out/rocketmod-per-profile-9x16-v3-short.mp4`. After each rule-compliant render the file is also copied to `~/Koofr/RocketAIM` (override `DELIVERY_DIR`, disable `DELIVERY_DIR=none`; never overwrites). Older files are never touched.
Source of truth for copy/behaviour: <https://rocketmod.org/documentation/weapon-detect/ps5-per-profile>
(notes on what the docs say and where the video deviates from the brief: [`docs/SOURCE.md`](docs/SOURCE.md))

## Commands

```bash
npm run assets      # assets/cronus-v2.png -> public/cronus-plate.jpg (2x upscale) + public/cronus-backdrop.jpg (blurred fill)
npm run dev         # Remotion Studio
npm run render:short | render:long | render:perweapon   # deliverables (rules enforced), see the table above
npm run render:draft   # 16:9 33 s working draft -> out/drafts/rocketmod-per-profile-16x9-draft-vN.mp4 (not delivered)
npm run preview     # ffmpeg: 00:02 00:06 00:11 00:17 00:23 00:29 00:32 -> out/preview/frame_MM-SS.png
node scripts/stills.mjs 120 340 560   # quick PNG stills of given frames -> out/preview/dev/
npm run typecheck
```

## Architecture

One continuous camera. The Cronus is **not** part of any scene: `CronusHero` is rendered once at the stage
level and driven by `poseAt(frame)` (keyframes in `src/timeline.ts`). Scenes only own the graphics around it.

```
src/
  RocketModWeaponDetection.tsx   stage: background · profile cards · Cronus · scenes · light FX · fade
  timeline.ts                    ALL timing: scene ranges, camera keyframes, OLED text events, pulses, profile layout
  theme.ts                       colours + fonts (Rajdhani / Inter = rocketmod.org's fonts)
  config/cronus.ts               photo geometry: device body box, OLED rect, logo, line anchors (native photo px)
  lib/anim.ts                    easing, prog(), keyed() keyframes, springIn(), bump()
  components/
    CronusHero      the photo plate + spotlight scrim, glint sweep, logo light, OLED projected on the real screen,
                    HUD brackets, pulse rings, directional motion blur (SVG filter)
    OledContent     what the Cronus screen shows (strings taken from the docs)
    ScreenCallout   magnified OLED so text stays readable when the device is small
    ProfileCard     PRIMARY / SECONDARY (LED green / white per docs); big in scene 2, compact in scene 3
    ProfileStack    the two cards as a global layer (they travel left -> right between scenes 2 and 3)
    WeaponSelector  weapon cards with R2 signature bars
    TriggerWave     R2 resistance trace + "match"
    SignalLine      HUD connector with travelling pulse (+ elbow() path helper)
    PipelineNode    scene 4 nodes
    FeatureTitle    masked line reveal (spring + blur + tracking)
    DocumentationPanel  browser view of the docs page: scroll, marker highlights, cursor, key caps, mini OLEDs
    SceneTransition scene graphics dissolve in/out
    Glow · Background · LightSweep (TransitionStreak, LightBeam)
  scenes/Scene1Hook … Scene6End
scripts/  prepare-assets.mjs · stills.mjs · extract-frames.mjs
```

## Editing recipes

| Want to… | Edit |
|---|---|
| retime a scene | `SCENES` + the frame numbers inside that scene file (they are global frames: `gf`) |
| move the Cronus | `P` poses and `POSE_KEYS` in `timeline.ts` |
| change what the Cronus screen says | `EV` in `timeline.ts`, strings/weapon names in `src/oledText.ts` (verified against the RocketAIM source); `SCREEN_PULSES` = ring pulses |
| swap the device photo | replace `assets/cronus-v2.png`, `npm run assets`, then re-measure `device`, `screen` (+`rot`), `logo`, `anchors` in `config/cronus.ts` (native photo px; zoom crops with sharp) and check where the cable/connector falls behind text (`TextScrim`) |
| change copy | scene files; only use wording that exists in the docs |

The device pixels are never repainted: only alpha is computed (`prepare-assets.mjs`); everything else is transform, mask, light and overlay.

## Audio (voice-over + music + sfx)

Everything is generated by code: no samples, no licences. Composition plays `public/audio/soundtrack.wav` via `<Audio>`,
so a fresh `npm run render` already has sound. The silent master of the first render is `out/rocketmod-weapon-detection.silent.mp4`.

```bash
npm run audio:voice   # Piper (local TTS) -> audio/build/voice/*.wav + voice.timeline.json   (needs PIPER_PYTHON + PIPER_VOICES, see scripts/audio/voice.mjs)
npm run audio         # music + sfx + voice mix -> mastered -16 LUFS -> public/audio/soundtrack.wav, then a level report
npm run mux           # put the soundtrack on an already-rendered SILENT mp4 in ~2 s (no frame re-render)
```

| Want to… | Edit |
|---|---|
| change the words / their timing | `audio/voice.script.json` (`start` in seconds), then `npm run audio:voice && npm run audio` |
| change music | `CHORDS`, `*_G` gain curves, `kicks` in `scripts/audio/soundtrack.mjs` (120 bpm, A minor, 4 s per chord) |
| re-sync sound effects after a timeline change | `buildSfx()` in `soundtrack.mjs`: every event carries its frame number in a comment |
| voice louder/quieter vs bed | `musicDuck` / `sfxDuck` / `MUSIC_TRIM` in `soundtrack.mjs`; `npm run audio:report` prints voice-over-bed margin per line |

Stems for debugging: `audio/build/stems/{music,sfx,voice}.wav`.
One-time Piper setup: `uv venv --python 3.11 tts-venv && uv pip install --python tts-venv/Scripts/python.exe piper-tts onnx && tts-venv/Scripts/python.exe -m piper.download_voices en_US-ryan-high --data-dir voices`.

## Formats and the 90 s cut

- **Timeline packs** (`src/tl.tsx`): everything time-dependent (camera path, OLED events, pulses, profile-card layout) comes from a `TL` object supplied by context, so the same components (`CronusHero`, `ProfileStack`, the scenes) serve every cut. `WIDE33` = original, `TALL33` (`src/tall.ts`) = Short, chapter packs in `src/long/tl.ts`.
- **Short**: `src/scenes/tall/*`, same frame timing as the wide cut (so the same soundtrack), vertical layout (title, cards, Cronus), safe area y 120..1600. Cards render *above* the photo there.
- **Long**: seven chapters cross-dissolved (`CHAPTERS` in `RocketModWeaponDetectionLong.tsx`): intro (hook + profiles), before you start, turn it on, detection, when unsure (`?` + PICK WEAPON), wrong profile (gestures + lock), outro (pipeline, docs, ending). Reused scenes keep their original frame numbers (`orig`); new chapters live in `src/long/ChaptersNew.tsx`. The first/last camera pose of each chapter matches its neighbours so the dissolve is invisible.
- **Audio per cut**: `node scripts/audio/soundtrack.mjs wide33|long90` (profiles in `scripts/audio/profiles/`); voice scripts `audio/voice.script.json` and `audio/voice.long.script.json`. Long: `node scripts/audio/voice.mjs audio/voice.long.script.json audio/build/long && node scripts/audio/soundtrack.mjs long90 && node scripts/audio/finalize.mjs audio/build/long/soundtrack.raw.wav public/audio/soundtrack-long.wav 90`.

## Subtitles

Burned-in captions follow the voice-over word by word (the spoken word lights up). Source of truth = the voice timeline, so they stay in sync when the script changes:

```bash
node scripts/audio/voice.mjs audio/voice.script.json audio/build          # (Piper env) also writes audio/build/voice.timeline.json
node scripts/audio/subtitles.mjs audio/build/voice.timeline.json src/subtitles/wide33.json 58 audio/subtitles/wide33.en.srt
node scripts/audio/subtitles.mjs audio/build/voice.timeline.json src/subtitles/tall33.json 32 audio/subtitles/short.en.srt
node scripts/audio/subtitles.mjs audio/build/long/voice.timeline.json src/subtitles/long90.json 58 audio/subtitles/long90.en.srt
```

`audio/subtitles/*.en.srt` can be uploaded to YouTube as a caption track (the videos then don't need burned-in captions).
A `caption` field in the voice scripts overrides the spoken text (e.g. spoken "Rocket Mod dot org", shown "rocketmod.org").

**Word timing is measured, not estimated.** `voice.mjs` gets the exact phoneme durations from Piper (`piper_align.py`, needs the `onnx` package) and `wordtimes.mjs` maps them onto the written words: punctuation pauses are anchors, and a small dynamic-programming alignment handles words spoken in several parts ("L2" = "el two") or glued together by espeak ("in the" = one group). Lines are trimmed by that alignment (never by loudness) with 100 ms of natural tail + a 50 ms fade, so a word can't be chopped. Estimating from character counts had been off by up to 0.7 s (subtitles/highlight jumped ahead of the voice). A cue never ends before its last word does; `voice.timeline.json` carries `words` for every line, and `pw-cues.mjs` (Per Weapon film) reads them too.

## Per Weapon film (docs: /documentation/weapon-detect/ps5-per-weapon)

Built voice-first: `audio/voice.pw.script.json` (lines sequenced by `gap`, no hand timing) -> `voice.mjs` -> `scripts/audio/pw-cues.mjs` turns the spoken words into a cue sheet (`src/perweapon/cues.json`: chapter frames + ~90 named cue times) -> visuals (`src/perweapon/chapters1|2.tsx`, camera + OLED in `tl.ts`), sound effects (`scripts/audio/profiles/pw.mjs`) and subtitles all read that sheet. Change a sentence and re-run the chain: everything re-syncs.

```bash
node scripts/audio/voice.mjs audio/voice.pw.script.json audio/build/pw     # (Piper env)
node scripts/audio/pw-cues.mjs                                              # cue sheet + chapter frames
node scripts/audio/subtitles.mjs audio/build/pw/voice.timeline.json src/subtitles/perweapon.json 58 audio/subtitles/perweapon.en.srt
node scripts/audio/soundtrack.mjs pw && node scripts/audio/finalize.mjs audio/build/pw/soundtrack.raw.wav public/audio/soundtrack-pw.wav 117.1
npm run render:perweapon
```

## Intro (1.5 s, YouTube + TikTok)

Animated logo sting placed in front of every video. Source image: `assets/intro-v2.png` (1254x1254 neon logo on pure black, spelling fixed: "AIM ASSIST ENHANCER"). The first logo (on white, with a typo) is `assets/intro.jpg`, kept for reference.

```bash
npm run intro:assets   # black -> alpha cutout -> public/intro-logo.png (+ pixelated copies px96/48/24/12 for the "pixel" variant)
npm run intro:audio    # one synthesized sting per variant -> public/audio/intro-<id>.wav (-16 LUFS)
npm run intro:render   # every variant x 2 formats -> out/intro/intro-<id>-<16x9|9x16>-vN.mp4 (new file each time)
node scripts/intro-sheet.mjs      # preview sheet of all variants -> out/intro/_apercu-variantes.png
node scripts/publish-intro.mjs    # organise the delivery folder: <delivery>/intro/variantes/ (+ archive-ancien-logo/)
npm run intro:deliver <id>        # a VALIDATED variant (both formats) -> <delivery>/intro/
```

- **Variants**: single list in `src/intro/variants.json` (id, frames, title, description): glitch, lockon, launch, scan, pixel, matrix, neon, slam, warp, minimal (1.2 s). All are 45 frames (1.5 s) @ 30 fps except minimal (36), and end with a short zoom + fade to black (the videos start dark).
- Code: `src/intro/IntroScene.tsx` (one component, `tall` switches 16:9 / 9:16, one branch per variant), entry `src/index-intro.ts`, compositions generated from the list in `src/intro/RootIntro.tsx`. Sounds: `scripts/audio/intro-sting.mjs`, one block per variant, hit times matching the animation.
- Add a variant: add it to variants.json, add its branch in IntroScene.tsx (and HIT frame) and in intro-sting.mjs, then `intro:audio`, `intro:render`.
- Intro clips are assets, not deliverables (neither short nor long): they are not auto-copied like the videos. They live in `<delivery>/intro/`.
- Attaching to a video WITHOUT touching its timings (voice, subtitles, sfx stay as they are): stream-copy concat, same codec settings. Trim the intro's audio first (AAC padding makes it 57 ms longer than the picture): `ffmpeg -i intro.mp4 -t 1.5 -c copy intro-trim.mp4`, then `ffmpeg -f concat -safe 0 -i list.txt -c copy out.mp4`. On Windows/Git Bash give ffmpeg `cygpath -m` paths. Tested: video 35.01 s = 1.5 s + 33.5 s, sync kept.
- Logo note: the source logo itself says "EST. 2024" bottom right; the small HUD texts are decoration.

## Outro / end card (12.3 s, YouTube + TikTok)
- Two clips, 16:9 and 9:16, English voice-over (Piper, same voice as the films), music + SFX hung on the spoken words, word-synced subtitles. Script: `audio/voice.outro.script.json` (thanks, like, subscribe, join the Discord, community helps, see you next time).
- Code: `src/outro/OutroScene.tsx` (`tall` switches format), `src/outro/RootOutro.tsx`, entry `src/index-outro.ts`, audio profile `scripts/audio/profiles/outro.mjs`, timings `src/outro/timeline.json` (copy of `audio/build/outro/voice.timeline.json`). Length = last spoken word + `OUTRO_TAIL` (2 s).
- Links shown: Discord `discord.gg/AeU3rYZTQ8`, YouTube `@CronusZenRocketMod`, TikTok `@rocketmod25` (brand logos in `public/logos/`). No Instagram: no account known. 16:9 keeps an empty 560x315 "WATCH NEXT" frame (1240,330) for a YouTube end-screen element.
- Render: `node scripts/render-outro.mjs [16x9|9x16] [--concurrency=2]` -> `out/outro/outro-<fmt>-vN.mp4` (never overwrites). Publish: `node scripts/publish-outro.mjs` -> `<delivery>/outro/`. Assets, not deliverables (like the intro): not auto-copied by render.
- Attach at the end of a video with the same stream-copy concat as the intro (video first, outro second); trim nothing on the video, the outro clip has its own audio padding of ~62 ms (trim with `-t 12.333` before concat).
- Measured: -15.9 LUFS integrated (whole clip incl. silence-ish tail), voice >= 7.1 dB over the music bed.

## Voice engines (Piper / Kokoro)
- `voice.mjs` reads `"engine"` in the voice script: `piper` (default, robotic but stable) or `kokoro` (neural, natural; `"voice":"am_michael"` or a blend `"am_michael,am_adam"`, `"speed":1.0`). Same output (`voice.timeline.json`), so subtitles / cues / SFX code is unchanged.
- Kokoro setup (one time): `uv venv --python 3.11 kokoro-venv && uv pip install --python kokoro-venv/Scripts/python.exe kokoro soundfile "misaki[en]" pip`, then `KOKORO_PYTHON=<kokoro-venv>/Scripts/python.exe node scripts/audio/voice.mjs <script> <build dir>`. Model weights download from Hugging Face on first run (~330 MB, CPU is enough).
- Word times: Kokoro's token times are predictions and can be 60-300 ms off next to pauses (the last word is the worst). `snapToSilences()` in voice.mjs detects real silences (>= 0.12 s) in the audio and snaps word edges to them; the last word ends when the trailing silence starts. Verified against silencedetect on the trimmed files.
- Listening samples of every male US voice on the end-card text: `KOKORO_PYTHON=... node scripts/audio/voice-sample.mjs <outDir> am_michael am_adam ...` (voice@speed and blends allowed). Available male voices: am_adam am_echo am_eric am_fenrir am_liam am_michael am_onyx am_puck am_santa (US), bm_daniel bm_fable bm_george bm_lewis (UK).
- Changing the voice = re-run voice.mjs for the 4 scripts, rebuild soundtracks, re-render (timings change).

## Final assembly: intro + film (+ outro)
Renders (`render:short|long|perweapon`) are the RAW films. What gets delivered is the film with the validated intro in front and, for long videos, the end card after it:
```bash
DELIVERY_DIR=<local staging dir> npm run render:long -- --concurrency=2     # optional: keep raw renders out of the delivery folder
node scripts/attach-clips.mjs out/rocketmod-per-profile-9x16-v3-short.mp4 --intro warp             # short: intro only
node scripts/attach-clips.mjs out/rocketmod-per-profile-v2-long.mp4 --intro warp --outro           # long: intro + outro
node scripts/attach-clips.mjs out/archive/rocketmod-per-weapon-v2-long.mp4 --intro warp --outro    # per-weapon raw renders are in out/archive/
```
- Stream-copy concat (no re-encode): the film's own timings do not move. The script refuses if intro/outro encoding differs from the film, if a target file already exists (never overwrites), or if the result breaks the rules (short 9:16; long horizontal and >= 70 s).
- Output: `<delivery>/<same name>.mp4` + `<same name>.en.srt` (captions shifted by the intro length, end-card captions appended) + `out/final/<same name>.mp4`.
- Current choice: intro `warp` on everything; outro only on long videos (13.5 s on a 33 s short felt too heavy: not attached, ask before changing).
- Voice for all films: Kokoro blend `am_onyx=0.3,am_michael=0.7` (see "Voice engines"); short/long scripts carry per-line `speed` (1.15 base, up to 1.8 on one-word lines) so every line fits its fixed slot.

## Voice conversion (your voice) and AI presenter (avatar)
**Your voice**: `scripts/audio/ov_convert.py` (OpenVoice V2, local CPU) swaps the TIMBRE of the Kokoro lines for yours: same words, rhythm and length, so word timings stay valid. Enabled per voice script with `"vc": {"src": "audio/voiceprints/kokoro-onyx30-michael70.se.pth", "tgt": "audio/voiceprints/user.se.pth", "alpha": 1, "tau": 0.3}` (alpha = share of your timbre, 0..1; the voiceprints are kept local and git-ignored). Env: `KOKORO_PYTHON`, `OPENVOICE_DIR` (git checkout of myshell-ai/OpenVoice, two patches: `librosa_mel_fn(sr=..., n_fft=..., n_mels=..., fmin=..., fmax=...)` keyword arguments in `mel_processing.py`; `enable_watermark = kwargs.pop('enable_watermark', True)` before `super().__init__` in `api.py`), `OPENVOICE_CKPT` (HF `myshell-ai/OpenVoiceV2`: `converter/config.json` + `converter/checkpoint.pth`). pip extras next to Kokoro: `librosa scipy`. To use another voice as the source, re-extract its voiceprint: `python ov_convert.py se <ckpt> <out.pth> <clean wav files>`.

**Avatar** (personal portrait in `assets/`, git-ignored): SadTalker (local, GTX 1650 OK, ~20 s of compute per video second) animates the face from the film's voice track; `scripts/avatar/body_motion.py` adds breathing / shoulder lift (follows voice loudness) / slow drift. Head stays still on purpose: a tilting head over a static neck looked like a snake. Motion is one rigid block plus breathing on the SIDES of the shoulders only (the neck column is never stretched); the mic and boom arm are excluded via the person matte (`scripts/avatar/person_matte.py`, DeepLabV3).
```bash
# one-time: SadTalker checkout + venv (py3.10, torch cu121, numpy 1.23.4, librosa 0.9.2, face_alignment 1.3.5, ..., setuptools<70), checkpoints from OpenTalker/SadTalker release v0.0.2-rc
# patch src/utils/face_enhancer.py: make `from gfpgan import GFPGANer` optional (try/except ImportError)
export SADTALKER_DIR=... SADTALKER_PYTHON=.../sadtalker-venv/Scripts/python.exe AVATAR_SRC=$PWD/assets/<portrait-512>.png AVATAR_MATTE=$PWD/assets/<matte-512>.png AVATAR_WORK=<scratch dir>
node scripts/avatar/make-avatar.mjs short audio/build/stems/voice.wav audio/build/voice.timeline.json 1.4   # -> out/avatar/avatar-short-vN.mp4 (last arg = body motion strength)
node scripts/avatar/make-avatar.mjs long  audio/build/long/stems/voice.wav audio/build/long/voice.timeline.json 1.4
node scripts/avatar/make-avatar.mjs pw    audio/build/pw/stems/voice.wav audio/build/pw/voice.timeline.json 1.4
# then: copy the clip to public/avatar/ and set its path in src/config/avatar.ts (short | long | perweapon), re-render the film
```
Placement (`src/components/AvatarPip.tsx`): 300 px rounded frame, bottom-right (16:9) / right above the subtitle band (9:16). The clip has no audio; it starts at film frame 0, so any voice change means regenerating it. Publish note: YouTube / TikTok ask to flag realistic AI-generated content.

## Per Weapon SHORT (9:16, ~33 s)
Voice first, like the Per Weapon long: `audio/voice.pw-short.script.json` (7 lines, Kokoro + your timbre) -> `voice.mjs` -> every animation hangs on a spoken word (`W(line, word)` in `src/perweapon/short/PWShort.tsx`, sound effects in `scripts/audio/profiles/pwshort.mjs`). Scenes: hook, two profiles vs 64 weapon slots, turn it on (3 steps), fire once (slot claimed), live tuning (L2 + Up/Down, permanent), end lockup. Text/values come from the same docs as the long film.
```bash
node scripts/audio/voice.mjs audio/voice.pw-short.script.json audio/build/pwshort          # (Kokoro + OpenVoice env)
cp audio/build/pwshort/voice.timeline.json src/perweapon/short/timeline.json
node scripts/audio/subtitles.mjs audio/build/pwshort/voice.timeline.json src/subtitles/pwshort.json 32 audio/subtitles/pwshort.en.srt
node scripts/audio/soundtrack.mjs pwshort && node scripts/audio/finalize.mjs audio/build/pwshort/soundtrack.raw.wav public/audio/soundtrack-pwshort.wav 33.07
npm run render:perweaponshort        # -> out/rocketmod-per-weapon-9x16-vN-short.mp4
node scripts/attach-clips.mjs out/rocketmod-per-weapon-9x16-vN-short.mp4 --intro warp --outro   # short end card (outro-short-9x16)
```
Decision log: the AI avatar (SadTalker + body motion, `src/config/avatar.ts`) was tried and dropped by the user ("le visage fait vraiment artificiel"): all films render without it (`AVATAR.* = null`). Realistic options offered instead: filmed presenter (recommended), online avatar service, rented GPU model.

## Sales pitch (after the intro of every film): one per mode, long and short
The message (user's words, 2026-09-21): most scripts tie a weapon to a CATEGORY and give the category one anti-recoil, which is not precise. RocketMod **Per Profile** assigns the weapon to Profile 1 or Profile 2, each with its own precise anti-recoil. **Per Weapon** assigns an anti-recoil to EACH WEAPON, not to a category (the user says no script ever did that). Game updated? No problem: you update the script yourself, without waiting for RocketMod.
- Per Profile films use the `pp` pitch, Per Weapon films the `pw` pitch; long films `full` (~17 s), short films `short` (~14 s). Voice scripts `audio/voice.pitch-<pp|pp-short|pw|pw-short>.script.json` (lines a1 problem, a2 RocketMod, a3 update, optional a4 "Perfect anti-recoil. Perfect aim assist." = currently left out for clarity), scene `src/pitch/PitchScene.tsx` (mode + variant, every animation on a spoken word), root `src/pitch/RootPitch.tsx` (6 compositions), entry `src/index-pitch.ts`, sound `scripts/audio/profiles/pitch-common.mjs` (+ 4 tiny profile files).
```bash
for k in pp pp-short pw pw-short; do node scripts/audio/voice.mjs audio/voice.pitch-$k.script.json audio/build/pitch-$k && cp audio/build/pitch-$k/voice.timeline.json src/pitch/timeline-$k.json; done
node scripts/audio/subtitles.mjs audio/build/pitch-pp/voice.timeline.json src/subtitles/pitch-pp-16x9.json 58 audio/subtitles/pitch-pp.en.srt   # + pitch-pp-9x16.json (32), pitch-pp-short-9x16.json (32, pitch-pp-short.en.srt); same for pw
node scripts/audio/soundtrack.mjs pitch-pp && node scripts/audio/finalize.mjs audio/build/pitch-pp/soundtrack.raw.wav public/audio/pitch-pp.wav <seconds>   # each of the 4 versions
node scripts/render-pitch.mjs --concurrency=2     # -> out/pitch/pitch-<pp|pw>-<16x9|9x16|short-9x16>-vN.mp4
node scripts/attach-clips.mjs <raw film.mp4> --intro warp --pitch --outro --new-version   # picks pp or pw from the file name
```
Claims to keep honest: "no script has done that" (Per Weapon) is the user's claim; "update it yourself" is backed by the docs (Per Weapon: Teach Weapon, live tuning, editable slots; Per Profile: wipe and re-learn). Because the pitch is a separate clip, changing its wording never requires re-rendering the films.

## Transitions between the clips of a final video
`attach-clips.mjs` joins intro, pitch, film and end card with a 0.6 s **vertical slide up + blur peak** (ffmpeg `xfade=slideup` on the last/first 18 frames of neighbouring clips, plus a gaussian-blur pulse blended in by a triangle in time) and an audio crossfade. Everything is one x264 pass (crf 15, AAC 192k, ~2 min for a 2-minute film) where the expensive filters only see the 18 frames of a transition; running xfade + blend over a whole film took ~25 min. Each join overlaps 0.6 s, so the total is `sum - 3 x 0.6 s` and the `.en.srt` is computed from the real clip start times. `--no-transitions` = the old hard cuts by stream copy. Other styles tried on a real join: hblur (horizontal streaks), smoothup, wipeup, vuslice, squeezev, zoomin (pixelated: ugly), fadegrays.

## Covers / thumbnails (one per video)
`src/covers/Covers.tsx` (`<Cover slug tall>`, Cronus photo + punchy claim + struck-out chip; copy comes from `topics/<slug>/topic.json`'s `cover` field, see "Topic registry" below), root `src/covers/RootCovers.tsx` (iterates `topics/index.ts`), entry `src/index-covers.ts`. Composition ids are `Cover-<slug>-<16x9|9x16>`. Still frames, render at frame 100:
```bash
npx remotion still src/index-covers.ts Cover-per-weapon-xbox-16x9 out/covers/cover-per-weapon-xbox-16x9.png --frame=100
ffmpeg -i out/covers/cover-per-weapon-xbox-16x9.png -vf scale=1280:720 -q:v 2 <name>-cover.jpg      # long: YouTube 1280x720 (< 2 MB); shorts stay 1080x1920
```
Delivered to Koofr `RocketAIM\covers\<final video name>-cover.jpg` (+ full-size PNG in `covers\png\`). A one-off variant that reuses a topic's cover with a different top line (e.g. the Patreon Quip announcement) passes `kickerOverride` instead of getting its own topic — see `Cover-per-weapon-patreon-16x9` in `RootCovers.tsx`.

## Platform badges on covers
Every cover shows PS5 / Xbox / PC badges, top-right (opposite the logo): `public/logos/{playstation,xbox,pc}.svg` (Simple Icons, CC0), `Mark`/`PlatformRow` in `src/covers/Covers.tsx`. Note: the weapon-detect docs only describe DualSense (PS5) support; Xbox/PC compatibility for this feature was asserted by the user, not verified against a doc.

## Cover copy (2026-09-22)
The Per Weapon cover no longer reads "1 WEAPON = 1 ANTI-RECOIL" as a headline: the user's point is that RocketMod is an ANTI-RECOIL DETECTION SYSTEM, and "each weapon gets its own anti-recoil" is a consequence of that, not the whole story. Headline "ANTI-RECOIL DETECTION SYSTEM" + 3 chips (✗ ONE PER CATEGORY, ✓ ONE PER WEAPON, ✓ RUNS BY ITSELF). Per Profile cover keeps its headline but gained a third chip and a new bottom pill ("SET IT ONCE. NOTHING ELSE TO DO") to make the "nothing to do after setup" point explicit on both covers, per the user's follow-up. `COPY.chips` is now a list (was two hardcoded bad/good fields) and `HEAD_SIZE` holds the wide/tall headline font sizes per mode explicitly (was a scattered ternary) so the two are easy to tell apart and re-tune.

## Reusable blocks + Xbox Per Weapon (the first topic built on them)
`src/lib/beats.ts` (word-driven timing: `wordAt`, `beatWindow`, `filmFrames`, `fr` — factored out of the ad hoc
helpers first written in `PWShort.tsx`/`PitchScene.tsx`), `src/config/platforms.ts` (button-label maps per
Device: `PLATFORMS.ps5` / `.xbox`), `src/blocks/Blocks.tsx` (`TitleBlock`, `StepListBlock`, `ChipFlowBlock`,
`TuneGaugeBlock`, `CompareBlock`, `EndLockupBlock` — data-driven, no topic-specific text baked in). A new topic
composes a scene from these instead of writing bespoke layout/animation code each time; see
`docs/NEW-VIDEO-PLAYBOOK.md` for the end-to-end recipe.

`src/xboxpw/Film.tsx` (entry `src/index-xboxpw.ts`, target `perweaponxbox`) is the first film built this way:
facts from `docs/SOURCE-xbox-per-weapon.md`, voice `audio/voice.pw-xbox.script.json`, sound
`scripts/audio/profiles/pw-xbox.mjs`. Cover mode `pwx` in `src/covers/Covers.tsx`. Reuses the `pw` pitch as-is
(its claims — "no other script does this", "update it yourself" — hold on Xbox too; no platform-specific
pitch variant was needed).

**Bug found while building it, fixed everywhere:** `src/components/Background.tsx` had the bottom-left corner
watermark **hardcoded** to `"PS5 · PER PROFILE"`, wrong for every other film. It is now a `label` prop
(defaults to the old string so nothing regresses silently); every caller now passes the right one
(`RocketModWeaponDetectionLong`/`Stage33` keep the default, `perweapon/Film.tsx` and
`perweapon/short/PWShort.tsx` now pass `"PS5 · PER WEAPON"`, `xboxpw/Film.tsx` passes
`"XBOX · PER WEAPON"`, `covers/Covers.tsx` now reads it from each topic's `cover.backgroundLabel`). **The
already-published PS5 Per Weapon video (long, live on YouTube) still has the wrong corner text** —
re-render + re-deliver only if the user asks, never silently. (Decision, 2026-09-22: left as is.)

## Topic registry (`topics/<slug>/topic.json`)
Single source of truth per topic, read by three places instead of five hardcoded tables:
- `scripts/topics.mjs` — `loadTopics()` scans `topics/*/topic.json` (Node-side: `render.mjs`,
  `attach-clips.mjs`, `export-for-upload.mjs` all use this; safe to add topics here with zero other edits).
- `topics/index.ts` — the one hand-maintained list (`import` + push) for code that runs **inside the Remotion
  bundle** (`src/covers/RootCovers.tsx`/`Covers.tsx`): a browser context can't `fs.readdirSync` a directory at
  render time, so this file is the one unavoidable extra line per topic on that side.
- Shape: `{slug, youtubeTitle, pitchMode: 'pw'|'pp', formats: {short: <Format>|null, long: <Format>|null},
  cover: {...}}`. `Format = {comp, entry?, base, w, h, seconds, captions}` — the exact fields `render.mjs`'s
  old hardcoded `TARGETS` entries and `attach-clips.mjs`'s old `SRT_FOR` map used to carry. `cover` carries
  what used to be `Covers.tsx`'s per-mode `COPY`/`HEAD_SIZE` entries verbatim (`kicker`, `head` (2 lines),
  `chips`, `pill`, `screen: {title, line}`, `backgroundLabel`, `headSize: {wide, tall}`).
- `render.mjs` target names become `<slug>-<short|long>` (e.g. `per-weapon-xbox-long`); the old short-hand
  names (`short`, `long`, `perweapon`, `perweaponshort`, `perweaponxbox`) still work as `ALIASES` in that file.
- Verified behaviour-preserving when built (2026-09-22): re-ran `attach-clips.mjs` on the already-shipped Xbox
  film through the new topic lookup into a scratch delivery dir — identical 139.10 s output and identical 61
  captions; re-rendered all 5 shipped covers under their new `Cover-<slug>-*` ids and diffed pixel-for-pixel
  against the delivered files (`sharp`, raw buffer diff) — mean/max abs difference 0 (PNG) on every one.
- See `docs/NEW-VIDEO-PLAYBOOK.md` step 3 for how to add a new topic.

## Direct YouTube upload (planned, not built)
`scripts/export-for-upload.mjs <slug> <short|long>` copies the latest Koofr-delivered file for a topic + its
`.srt` + its cover into `Koofr\RocketAIM\youtube\ready-to-upload\`, named `Cronus Zen - RocketAIM -
<topic.json youtubeTitle>` (filesystem-illegal characters — `: * ? " < > |` — are swapped for `-` in the
**filename only**; a bare `:` in a Windows filename silently truncates everything after it and corrupts the
copy, caught and fixed while building this). It also writes a `<name>.metadata.json` sidecar (title incl. the
real `:`, categoryId, `privacyStatus: "private"`, `containsSyntheticMedia: true`, empty
`description`/`tags`/`chapters` to fill in) for a future upload script to read without parsing the prose
`youtube/*.txt` package.

Not yet built: `scripts/youtube-auth.mjs` (one-time OAuth consent, needs the user to first create a Google
Cloud project + YouTube Data API v3 + an OAuth "Desktop app" client — that part can't be done from here) and
`scripts/youtube-upload.mjs <slug> <format>` (resumable `videos.insert` + `captions.insert` + `thumbnails.set`
from the exported files + metadata.json). Always uploads `privacyStatus: private`; going public stays a
separate, explicit action, same as every other outward-facing step in this project. Full plan:
`C:\Users\jbsao\.claude\plans\synchronous-cooking-wilkinson.md`.
