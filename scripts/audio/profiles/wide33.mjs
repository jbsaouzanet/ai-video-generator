// Sound-effect script of the 33 s video, one function per scene. Times are ORIGINAL seconds (frame/30);
// the long version replays these with an offset. api = primitives from soundtrack.mjs.
export const scenes = {
	hook(a) {
		const {whoosh, riser, boom, slam, blip, tick, click, swish, chime, zip, scan, powerOn, pop, shimmer, midi, FPS} = a;
		riser(0.15, 1.0, 0.5); // rise into the title (f30)
		whoosh(0.85, 0.7, 0.4);
		boom(2.55, 0.95, 1.2); // Cronus lands (f80)
		swish(1.45, 0.14);
	},
	profiles(a) {
		const {whoosh, riser, boom, slam, blip, tick, click, swish, chime, zip, scan, powerOn, pop, shimmer, midi, FPS} = a;
		whoosh(3.15, 0.7, 0.42, -1); // f100 streak
		blip(3.73, 660, 0.24, -0.4); // PRIMARY card (f112)
		powerOn(3.93, 0.28); // OLED on (f118)
		blip(4.27, 880, 0.24, -0.4); // SECONDARY card (f128)
		zip(6.13, 0.75, 0.16, 1); // pulse card 1 -> screen (f184)
		zip(6.6, 0.75, 0.16, 1); // f198
		tick(6.93, 1800, 0.18); // 3RD CATEGORY rule (f208)
	},
	detect(a) {
		const {whoosh, riser, boom, slam, blip, tick, click, swish, chime, zip, scan, powerOn, pop, shimmer, midi, FPS} = a;
		whoosh(8.0, 0.75, 0.4); // f240/f246 hand-off
		blip(8.25, 520, 0.2, -0.6);
		blip(8.55, 520, 0.2, -0.6);
		click(8.73); // AR in hand (f262)
		scan(9.0, 0.6); // R2 trace A (f270-288)
		blip(9.6, 1180, 0.2, -0.3); // MATCH (f288)
		zip(9.87, 0.75, 0.24, 1); // weapon -> Cronus (f296-318)
		chime(10.6, 0.34); // Primary / AR (f318)
		zip(10.7, 0.8, 0.2, -1); // Cronus -> profile (f320-344)
		tick(11.53, 1500, 0.16, 0.5);
		click(12.4); // Triangle (f372)
		blip(12.42, 440, 0.2, -0.3);
		scan(12.73, 0.5); // R2 trace B (f382-398)
		blip(13.27, 1180, 0.2, -0.3);
		zip(13.27, 0.75, 0.24, 1);
		chime(14.0, 0.34, 84); // Secondary / SMG (f420), one third higher
		zip(14.07, 0.8, 0.2, -1);
	},
	auto(a) {
		const {whoosh, riser, boom, slam, blip, tick, click, swish, chime, zip, scan, powerOn, pop, shimmer, midi, FPS} = a;
		whoosh(15.2, 0.75, 0.4); // f456/f462
		[69, 72, 76, 79, 81].forEach((m, i) => blip(15.8 + i * (14 / FPS), midi(m), 0.2, -0.5 + i * 0.05)); // nodes f474.. every 14 f
		chime(17.27, 0.28, 76); // f518 profile applied
		riser(17.9, 18.87, 0.5); // -> NO MANUAL SWITCHING (f566)
		whoosh(18.4, 0.6, 0.35, -1); // nodes collapse (f552)
		boom(18.87, 0.95, 0.8);
	},
	docs(a) {
		const {whoosh, riser, boom, slam, blip, tick, click, swish, chime, zip, scan, powerOn, pop, shimmer, midi, FPS} = a;
		whoosh(21.2, 0.7, 0.4); // f636/f642
		swish(21.55, 0.16); // panel in
		swish(22.3, 0.2); // marker: "which weapon you're holding" (f34 local -> f670)
		swish(22.8, 0.2); // "switches automatically"
		click(23.07);
		swish(24.1, 0.2); // adaptive trigger line
		pop(24.35, 0.22); // "#1 CAUSE"
		click(24.53);
		blip(25.6, 1320, 0.16, 0.3); // L2 / Options keys lit (f768)
		swish(25.7, 0.18);
		click(25.8);
		blip(26.07, 660, 0.18, -0.2); // Device = PS5 (f782)
		blip(26.5, 880, 0.18, 0.2); // Type = Per Profile (f794)
		click(26.73);
		pop(26.93, 0.3); // SAVED (f808)
		chime(26.98, 0.26, 88);
	},
	end(a) {
		const {whoosh, riser, boom, slam, blip, tick, click, swish, chime, zip, scan, powerOn, pop, shimmer, midi, FPS} = a;
		whoosh(27.15, 0.65, 0.4); // f818
		boom(27.5, 0.35, 0.9); // SET IT ONCE (f824)
		slam(28.52, 0.5, 62); // PLAY. (f856)
		slam(29.13, 0.55, 58); // SWITCH. (f874)
		slam(29.85, 0.62, 55); // DETECTED. (f896)
		chime(29.88, 0.1);
		riser(30.2, 30.55, 0.12);
		boom(30.55, 1.05, 0.85); // logo lock-up (f916)
		shimmer(30.7, 0.1);
		whoosh(31.2, 1.2, 0.42); // light beam (f936-972)
	},
};

export default {
	name: 'wide33',
	frames: 1005,
	// music energy curves (seconds)
	padFc: [[0, 260], [2.6, 420], [3.4, 700], [8, 1100], [12, 1700], [15.2, 2200], [19, 1500], [21.2, 900], [24, 1100], [27, 1500], [27.5, 2600], [31, 3200], [33.5, 2000]],
	padG: [[0, 0], [0.7, 0.2], [2.6, 0.42], [8, 0.46], [21, 0.5], [21.2, 0.42], [27, 0.46], [27.5, 0.6], [32.5, 0.55], [34, 0.2]],
	bassG: [[0, 0], [0.5, 0.1], [2.5, 0.22], [2.7, 0.5], [21.2, 0.5], [21.3, 0.34], [27.3, 0.34], [27.5, 0.55], [33, 0.5], [34, 0]],
	arpG: [[0, 0], [3.2, 0], [3.4, 0.22], [8, 0.3], [8.2, 0.5], [15, 0.55], [18.4, 0.42], [18.6, 0], [19.0, 0], [19.1, 0.5], [21.2, 0.5], [21.4, 0.16], [27.0, 0.16], [27.5, 0.6], [30.5, 0.72], [32.5, 0.5], [33.5, 0]],
	// [start, end, gain] on the 0.5 s beat grid
	kickWindows: [[8.0, 18.4, 0.62], [19.0, 21.0, 0.62], [27.5, 32.6, 0.85]],
	hatWindows: [[15.25, 18.4, 0.16], [19.25, 21.0, 0.16], [27.75, 32.6, 0.19]],
	hat16Windows: [[30.6, 32.4, 0.08]],
	arpHalf: [[21.2, 27.3]],
	voiceTimeline: 'audio/build/voice.timeline.json',
	rawOut: 'audio/build/soundtrack.raw.wav',
	stemsDir: 'audio/build/stems',
	buildSfx(a) {
		for (const k of ['hook', 'profiles', 'detect', 'auto', 'docs', 'end']) scenes[k](a);
	},
};
