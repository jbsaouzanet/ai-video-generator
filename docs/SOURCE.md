# Source of truth

https://rocketmod.org/documentation/weapon-detect/ps5-per-profile
(raw markdown: https://rocketmod.org/docs/weapon-detect/ps5-per-profile.md — page is an SPA, fetch the .md)

## Facts the video may use (nothing else)

- DualSense (PS5) only. Adaptive trigger effects must be ON in-game (#1 cause of "not working").
- Script infers held weapon from the R2 trigger resistance "signature".
- Once recognised -> auto-switch to matching Anti-Recoil profile (Primary / Secondary). No manual switching.
- Per Profile = default, safest mode. Never guesses; asks once if ambiguous.
- Setup: hold L2, release Options -> COMBAT -> WEAPON DETECT (enable w/ Dpad Right) -> Cross -> Device = PS5, Type = Per Profile -> Circle out -> "SAVED".
- First shot: fire once. Cronus screen shows e.g. `Primary` / `AR - M15 Mod 0` (docs example; the video uses MXR-17, see below). LED: green = Primary, white = Secondary.
- Ambiguous signature: screen shows `?` (e.g. `SMG - RK-9 ?`). Hold L2+Circle+Down -> PICK WEAPON (RK-9 / MPC-25) -> Cross. Remembered for the session.
- Triangle (switch weapon): screen briefly `Secondary` / `NA - NA` until next shot.
- 2 profiles: 1st category fired -> Primary, 2nd different category -> Secondary, 3rd replaces least recently used.
- Fix wrong profile: L2+Left (short = restore Primary, long ~0.4s = wipe+relearn); L2+Right for Secondary. Hold (ms) 100-1000, default 400.
- Related: RAPID FIRE -> Only Gun reads last detected weapon; FIELD MODE for held-Triangle games.

## Storyboard deviations (docs win)

- 4 profiles (AR/SMG/SNIPER/SHOTGUN) in brief -> docs say 2 profiles. Video uses PRIMARY / SECONDARY.
- Weapon names on screen: `AR - MXR-17` and `SMG - Dravec 45`, taken from the RocketAIM source (src/oledText.ts), NOT from the docs page. The docs examples `M15 Mod 0` / `RK-9` are flagged ambiguous (`?`) in the script, so the video avoids them. `NA - NA` shows only once (swap onto a never-bound slot).
- Pipeline nodes follow the real mechanism: SWITCH WEAPON -> FIRE ONCE -> READ R2 SIGNATURE -> MATCH PROFILE -> APPLY ANTI-RECOIL.

## Visual asset

Hero = assets/cronus-v2.png (lifestyle photo, 939x1676). v1 (assets/cronus.jpg packshot on white, cutout) is archived: out/archive/rocketmod-v1-packshot.mp4, scripts/legacy/.

## 90 s cut: what each chapter takes from the docs

- before you start: section 2 (DualSense required, adaptive trigger effects ON = #1 cause)
- turn it on: section 3 steps 1-5 (Device PS5 / Type Per Profile / SAVED screens)
- detection: sections 1, 4 case A, 5 (Triangle then fire once)
- when unsure: section 4 case B (? and PICK WEAPON RK-9 / MPC-25, L2+Circle+Down, remembered for the session)
- wrong profile: sections 6 and 9 (L2+Left/Right short/long, Share+Triangle/Circle 1 s, L2+Circle+Left lock, Hold (ms) 100-1000 default 400)

## Per Weapon film: facts used (ps5-per-weapon.md)

- Each individual weapon gets its own slot + Anti-Recoil setting; the script never switches Primary/Secondary on its own in this mode. 64 personal slots, kept after power-off and re-flash.
- Setup: same menu path; Type = Per Weapon; a new row TEACH WEAPON appears (hidden in other modes); Circle out = auto-save.
- First shot: known weapon -> real name/category (screen "AR - M15 Mod 0" in the docs; the video uses MXR-17 per oledText.ts); unknown -> "Custom N" (docs: "S12 AR - Custom 12").
- Live tuning: L2 + Up/Down while firing changes the active weapon's vertical, permanently for that weapon.
- Ambiguity: "?" screen; L2 + Left/Right (no Circle) switches to the other candidate (docs example RK-9 -> MPC-25); L2 + Left/Right no longer switches profiles in this mode.
- Force/fix: hold L2 + Circle + Down -> SELECT WEAPON list of the 64 slots (Up/Down, Cross, Circle cancel).
- Teach Weapon: pick slot, fire 2-3 times (CAPTURING shows LOW/MID/FREQ/HIGH values, docs example LOW 176 FREQ 12 / MID 109 HIGH 27), Cross, category (AR, LMG, SMG, Pistol, Sniper, Shotgun), optional name, SLOT SAVED. Warnings SAME AS SLOT / SAME AS BUILT-IN: Cross saves anyway, Circle cancels.
- Edit: SLOT CONTENTS (CAT, NAME, VERT, HORIZ), Up/Down row, Left/Right value, Square deletes with confirmation.
- One Anti-Recoil ON/OFF switch for all weapons (AIM -> ANTI RECOIL). Share/Touchpad + Triangle/Circle 1 s = fall back to Primary/Secondary manual preset.
- Video-only names: MXR-17, Dravec 45, S1..S3, HG 1911 are demo values (oledText.ts); AN-94 is the docs' own SLOT SAVED example; RK-9/MPC-25 are the docs' ambiguity example.
