// Controller button maps, one per detection "Device" setting (Cronus menu). Any topic that shows key combos
// should read labels from here instead of hardcoding PS5 glyphs, so the SAME scene code works for every
// platform: pass a PlatformId (or a ButtonMap) down and every StepListBlock / TuneGaugeBlock label follows.
export type PlatformId = 'ps5' | 'xbox';

export type ButtonMap = {
	fire: string; // trigger the weapon
	aim: string; // held for live-tune / candidate-switch combos (L2 on PS5, LT on Xbox)
	confirm: string; // A / Cross
	back: string; // B / Circle
	switchWeapon: string; // Y / Triangle
	reload: string; // X / Square
	menu: string; // Options / Menu
	extra: string; // Share/Touchpad (PS5) or View (Xbox): the escape-hatch modifier
};

export type Platform = {
	id: PlatformId;
	deviceLabel: string; // exact "Device" value shown on the Cronus OLED
	name: string; // display name ("PS5", "Xbox")
	buttons: ButtonMap;
	slots: number; // personal Teach Weapon slots
	requirement: string; // the "before you start" one-liner
};

export const PLATFORMS: Record<PlatformId, Platform> = {
	ps5: {
		id: 'ps5',
		deviceLabel: 'PS5',
		name: 'PS5',
		buttons: {fire: 'R2', aim: 'L2', confirm: 'Cross', back: 'Circle', switchWeapon: 'Triangle', reload: 'Square', menu: 'Options', extra: 'Share'},
		slots: 64,
		requirement: 'DualSense · adaptive triggers ON',
	},
	xbox: {
		id: 'xbox',
		deviceLabel: 'Xbox',
		name: 'Xbox',
		buttons: {fire: 'RT', aim: 'LT', confirm: 'A', back: 'B', switchWeapon: 'Y', reload: 'X', menu: 'Menu', extra: 'View'},
		slots: 48,
		requirement: 'Vibration enabled · any pad, PS5 or Xbox',
	},
};
