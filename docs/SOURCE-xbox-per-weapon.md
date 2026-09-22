# Source of truth: Weapon Detection, Xbox, Per Weapon mode

https://rocketmod.org/documentation/weapon-detect/xbox-per-weapon
(raw markdown: https://rocketmod.org/docs/weapon-detect/xbox-per-weapon.md)

## Critical difference from the PS5 film — read before writing any script/pitch for this topic

- **Mechanism is different and weaker.** PS5 reads the DualSense adaptive-trigger resistance (a precise, purpose-built sensor). Xbox controllers don't have that sensor: the script reads controller **vibration** instead — RocketMod's own doc calls this "a less precise signal whose real-world behavior is still being confirmed."
- **No out-of-the-box recognition.** Unlike PS5 (which ships with some weapons pre-known), on Xbox **every weapon must be taught** via the Teach Weapon wizard before Per Weapon does anything for it. Until taught, firing shows `NA - NA` and the weapon just uses the active profile's manual setting (Weapon Detect effectively off for it).
- Consequence for marketing copy: do NOT reuse the PS5 pitch's confident claims ("perfect", "no other script does this") verbatim for an Xbox video without softening them — RocketMod's own docs hedge on reliability here. Safer framing: "works like Per Weapon on PS5, using vibration instead of trigger resistance" + mention Tolerance as the tool to dial in reliability, rather than claiming it's flawless.

## Facts (nothing else)

- Buttons (Xbox-style): `RT`=fire, `LT`=aim, `A`=confirm, `B`=back/crouch, `Y`=switch weapon, `X`=reload, `Menu`=opens the Cronus menu.
- Before you start: Xbox controller, **vibration enabled** (console/PC AND game) — the Xbox equivalent of PS5's "adaptive triggers ON".
- Turn on: Menu → COMBAT → WEAPON DETECT → A (enable via Dpad-Right if needed) → A again → **Device = Xbox**, Down → **Type = Per Weapon** (2nd of 2 options on Xbox) → two new rows appear: **Teach Weapon** and **Tolerance** → exit with B repeatedly, auto-save.
- Without teaching anything: firing shows `Per Weapon` / `NA - NA` (no automatic slot, unlike PS5).
- Once taught: firing shows e.g. `Per Weapon` / `S3  SMG Custom 3`.
- Live tuning while firing: **LT + Up/Down (Dpad)** = vertical, permanent for that weapon (PS5 equivalent: L2 + Up/Down).
- Two taught weapons confused: **LT + Left/Right** switches candidate, no menu (PS5: L2 + Left/Right).
- Force/fix: **LT + B + Down (Dpad)** opens the full slot list (PS5: L2 + Circle + Down).
- **48 personal slots** (PS5 has 64). Kept after power-off and reflash.
- Teach Weapon wizard (required, section 6): Menu → COMBAT → WEAPON DETECT → A → scroll to **Teach Weapon** → A → pick a slot (Up/Down, A; A again on a filled slot to re-register, B to cancel) → fire 2-3 times in-game, screen shows live vibration values (**2 values, one per motor** — fewer than PS5's 4) → values stable → A → pick category (AR/LMG/SMG/Pistol/Sniper/Shotgun) → A → optional name or `No Name`/`Custom N` → A → `SLOT SAVED`.
  - Collision: signature already used by another slot → `SAME AS SLOT` warning, A saves anyway / B cancels. **No "SAME AS BUILT-IN" warning on Xbox** (no built-in comparison table, unlike PS5).
  - During step 4 firing, only A/B are neutralised; controller not otherwise blocked.
  - **X** in the slot list or detail screen deletes a slot (confirm A / cancel B).
- **Tolerance (Xbox-only, 1-20):** margin of error for a vibration reading to still match a taught weapon (vibration drifts shot to shot more than PS5's trigger). Prefer a lower/tighter value: too tight = just not recognized (harmless, falls back to manual profile); too loose = confidently recognizes the WRONG taught weapon and applies mismatched Anti-Recoil (looks like a bug, harder to spot). Raise gradually only if a well-taught weapon isn't reliably recognized.
- Anti-Recoil switch: same as PS5, one ON/OFF for all personal weapons in Per Weapon mode (AIM → ANTI RECOIL).
- Escape hatch: **View + Y**, held 1s = fall back to Primary profile's manual preset (drops the active custom weapon); **View + B**, held 1s = same for Secondary. (PS5 equivalent: Share/Touchpad + Triangle/Circle, 1s.)
- Related settings: **FIELD MODE** (UTILITY) if the game uses a held press of Y for something else (e.g. an armor plate); **RAPID FIRE → Only Gun** (COMBAT) auto-adjusts cadence for a taught Pistol — "works on Xbox as well as PS5".
- Troubleshooting: nothing happens → check vibration enabled, Device=Xbox, Type=Per Weapon, re-teach checking values are stable across 2-3 shots. Wrong weapon's setting applied → lower Tolerance.

## PC

There is **no separate PC doc page**. On PC, weapon detection follows whichever controller is plugged in:
an Xbox controller on PC uses the **Xbox** docs/mechanism above (vibration) — the Xbox doc already says so
("vibration enabled (console/PC AND game)"). A DualSense on PC uses the **PS5** docs/mechanism (adaptive
triggers) **when adaptive-trigger effects are ON in-game**.

**Clarified by the user (2026-09-22):** "Device: Xbox" in the Cronus menu means the vibration detection
method, not literally "you must own an Xbox controller" — it works with ANY pad, including a DualSense on PC
that doesn't have adaptive-trigger effects active. There is no contradiction with the PS5 pages: those are
specifically about the "Device: PS5" / adaptive-trigger path, which genuinely has no fallback (confirmed
above, "nothing will ever be detected" without it) — a DualSense-without-adaptive-triggers user simply picks
"Device: Xbox" instead and gets the mechanism described in this file. So: **for a PC video, "Device: Xbox"
covers PC regardless of the physical pad** (real Xbox controller, or a DualSense with adaptive triggers off /
unavailable); "Device: PS5" covers PC only with a DualSense that has adaptive-trigger effects on. Frame PC
content around picking the right *Device* setting for the pad in hand, not around "PC" as its own platform.

## Other weapon-detect pages that exist (site map, 2026-09-22) — for future videos

- `/documentation/weapon-detect/xbox-per-profile` — Xbox equivalent of the existing PS5 Per Profile film. Not yet fetched/used.
- `/documentation/weapon-detect/ps5-twin-swap` and `/ps5-twin-guess` — not yet fetched; likely a "two weapons of the same category" sub-topic. Not yet used in any video.
- `/documentation/weapon-detect/teach-weapon` — a dedicated, mode-agnostic guide to the Teach Weapon wizard.
- `/documentation/weapon-detect/full-script-guide` — likely a full menu reference.

## Rapid Fire (the "tomorrow" topic) — different product family, not under weapon-detect

https://rocketmod.org/documentation/rocket-aim-cod/rapid-fire
This lives under `rocket-aim-cod` (the RocketAIM COD script), a **different feature family** from weapon-detect, cross-referenced only ("RAPID FIRE → Only Gun reads last detected weapon" — see xbox/ps5 per-weapon docs section 10/similar). Not fetched yet: fetch this page fresh when actually building that video, don't assume it reuses weapon-detect facts beyond that one cross-reference.
