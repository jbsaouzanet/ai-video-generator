/**
 * Exact OLED main-screen text, verified against the RocketAIM source
 * (rocketaim repo, checked 2026-09-20). Used by timeline.ts (EV, profileLearned)
 * and Scene3Detect.tsx (WEAPONS).
 *
 * Screen format: title line = profile name, second line = "CATEGORY - WEAPON"
 *   (oled-render.gpc, getWeaponCategoryStringAddr / getWeaponNameStringAddr)
 *   + " ?" suffix when the signature is shared by several weapons
 *   (WEAPONAMBIGUOUS[], weapon-patterns.gpc).
 *
 * When "NA - NA" really shows (weapon-detect.gpc:164-188, profile.gpc:265-307):
 *   - boot, nothing detected yet
 *   - a swap (SWITCHWEAPON_BTN, blind toggle) onto a slot that was NEVER bound
 *   - Per Profile only: a split/ambiguous signature after an unconfirmed swap
 * It is NOT a "waiting for detection" state after every weapon change.
 * Once BOTH slots are bound, a swap shows the remembered "CAT - NAME"
 * immediately; the next shot only confirms/corrects it.
 *
 * Demo flow (see EV in timeline.ts):
 *   f318  fire AR      -> Primary / AR - MXR-17
 *   f376  swap         -> Secondary / NA - NA   (slot never bound)
 *   f420  fire SMG     -> Secondary / SMG - Dravec 45
 *   f518  swap + fire  -> Primary / AR - MXR-17 (both slots bound: no NA - NA)
 *   f890  end loop     -> Primary / AR - MXR-17
 */

// Unambiguous weapons (WEAPONAMBIGUOUS[row] === 0): no "?" on screen.
// Do NOT use M15 Mod 0 (row 0) or RK-9 (row 12): both are flagged "?".
export const DEMO_PRIMARY = {category: 'AR', name: 'MXR-17'}; // row 7
export const DEMO_SECONDARY = {category: 'SMG', name: 'Dravec 45'}; // row 14

// Not used in the video. Reference for a possible "what does ? mean" beat:
// RK-9 shares its signature with MPC-25; the docs page (§4) shows this case as `SMG - RK-9 ?`.
export const DEMO_AMBIGUOUS = {category: 'SMG', name: 'RK-9', suffix: ' ?'}; // row 12

export const line = (w: {category: string; name: string}, ambiguous = false) =>
	`${w.category} - ${w.name}${ambiguous ? ' ?' : ''}`;

export const NA_LINE = 'NA - NA';
