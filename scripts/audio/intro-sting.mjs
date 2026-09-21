// Sound stings for the 1.5 s intro (one per animation variant). Synthesized, no samples, no licences.
// Hit times match src/intro/IntroScene.tsx (frame / 30): glitch hit f9 = 0.30 s, lock-on impact f14 = 0.47 s, launch pop f26 = 0.87 s.
// usage: node scripts/audio/intro-sting.mjs [<variant id from src/intro/variants.json>|all]   -> public/audio/intro-<variant>.wav (mastered)
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {Stereo, SR, clamp, curve, lerp, midi, reverb, rng, secs, smooth, svf, writeWav} from './dsp.mjs';

const DUR = 1.5;
const N = secs(DUR + 0.4);
const TAU = Math.PI * 2;

const make = (variant) => {
	const D = variant === 'minimal' ? 1.2 : DUR; // clip length of this variant
	const rnd = rng(variant.length * 977 + 13);
	const noise = (n) => Float32Array.from({length: n}, () => rnd() * 2 - 1);
	const bus = new Stereo(N);
	const wet = new Float32Array(N);
	const put = (x, at, g = 1, pan = 0, send = 0) => {
		bus.addMono(x, at, g, pan);
		if (send) {
			const o = secs(at);
			for (let i = 0; i < x.length && o + i < N; i++) wet[o + i] += x[i] * send * g;
		}
	};
	const env = (t, a, tau) => (t < a ? t / a : 1) * Math.exp(-Math.max(0, t - a) / tau);
	const osc = (dur, freq, {wave = 'sin', a = 0.002, tau = 0.1, tone = 0} = {}) => {
		const n = secs(dur);
		const out = new Float32Array(n);
		let ph = 0;
		for (let i = 0; i < n; i++) {
			const t = i / SR;
			ph += (typeof freq === 'function' ? freq(t, i / n) : freq) / SR;
			const s = wave === 'sin' ? Math.sin(TAU * ph) : wave === 'sq' ? Math.tanh(4 * Math.sin(TAU * ph)) : 2 * (ph - Math.floor(ph)) - 1;
			out[i] = (s + tone * Math.sin(TAU * ph * 2)) * env(t, a, tau);
		}
		return out;
	};
	const bell = (i, n) => Math.sin(Math.PI * (i / n)) ** 1.6;

	const boom = (t, g = 1, long = 1) => {
		put(osc(1.2 * long, (tt) => 40 + 100 * Math.exp(-tt / 0.13), {tau: 0.45 * long, a: 0.003}), t, g * 0.9, 0, 0.1);
		const crash = svf(noise(secs(0.9 * long)), 1600, 0.7, 'low');
		for (let i = 0; i < crash.length; i++) crash[i] *= env(i / SR, 0.002, 0.22 * long);
		put(crash, t, g * 0.35, 0, 0.6);
		const air = svf(noise(secs(1 * long)), 5200, 0.7, 'high');
		for (let i = 0; i < air.length; i++) air[i] *= env(i / SR, 0.008, 0.3 * long);
		put(air, t, g * 0.16, 0, 0.7);
	};
	const glitch = (t, dur, g = 0.4, crush = 24) => {
		// bit/sample-rate crushed noise, chopped into short random bursts, with a falling chirp underneath
		const n = secs(dur);
		const x = noise(n);
		let hold = 0;
		for (let i = 0; i < n; i++) {
			if (i % crush === 0) hold = x[i];
			x[i] = Math.round(hold * 6) / 6;
		}
		const seg = secs(0.007);
		for (let i = 0; i < n; i += seg) {
			const on = rnd() > 0.42 ? 1 : 0;
			for (let k = i; k < Math.min(n, i + seg); k++) x[k] *= on * (1 - (i / n) * 0.8);
		}
		put(svf(x, 5200, 0.7, 'low'), t, g, (rnd() - 0.5) * 0.8, 0.2);
		put(osc(dur, (tt, u) => 1500 * 0.18 ** u, {wave: 'sq', a: 0.002, tau: 9999}), t, g * 0.25, 0, 0.2);
	};
	const tick = (t, f = 1400, g = 0.22, pan = 0) => put(osc(0.07, f, {tau: 0.018, a: 0.001}), t, g, pan, 0.25);
	const riser = (t0, t1, g = 0.4) => {
		const dur = t1 - t0;
		const n = secs(dur);
		const r = svf(noise(n), (i) => 300 * 30 ** ((i / n) ** 1.3), 1.5, 'band');
		for (let i = 0; i < n; i++) r[i] *= (i / n) ** 2;
		put(r, t0, g, 0, 0.3);
		const s = svf(osc(dur, (tt, u) => 180 * 9 ** (u ** 1.5), {wave: 'saw', a: dur * 0.5, tau: 9999}), 2600, 0.8, 'low');
		for (let i = 0; i < s.length; i++) s[i] *= (i / s.length) ** 2.2 * 0.5;
		put(s, t0, g * 0.4, 0, 0.3);
	};
	const whoosh = (t, dur, g = 0.35, dir = 1) => {
		const n = secs(dur);
		const y = svf(noise(n), (i) => (dir > 0 ? 300 * 25 ** (i / n) ** 1.6 : 7500 * 0.04 ** (i / n) ** 1.6), 1.2, 'band');
		for (let i = 0; i < n; i++) y[i] *= bell(i, n);
		for (let i = 0; i < n; i++) {
			const pan = lerp(-0.6, 0.6, i / n) * dir;
			const o = secs(t) + i;
			if (o >= N) break;
			bus.l[o] += y[i] * Math.cos(((pan + 1) * Math.PI) / 4) * g;
			bus.r[o] += y[i] * Math.sin(((pan + 1) * Math.PI) / 4) * g;
			wet[o] += y[i] * 0.3 * g;
		}
	};
	const chime = (t, g = 0.3, root = 81) => [0, 3, 7].forEach((s, k) => put(osc(1.0, midi(root + s), {tau: 0.3, a: 0.003, tone: 0.28}), t + k * 0.045, g * (1 - k * 0.12), (k - 1) * 0.25, 0.8));

	if (variant === 'glitch') {
		[0.05, 0.11, 0.15].forEach((t) => tick(t, 2400, 0.08, 0.3));
		glitch(0.17, 0.13, 0.32, 40);
		glitch(0.25, 0.05, 0.4, 16);
		boom(0.3, 0.95);
		glitch(0.3, 0.32, 0.36, 22);
		chime(0.72, 0.26, 84);
		whoosh(0.73, 0.4, 0.3);
		glitch(1.26, 0.06, 0.3, 30);
		whoosh(1.3, 0.2, 0.22, -1);
	} else if (variant === 'lockon') {
		[0.02, 0.1, 0.17, 0.23, 0.29, 0.34, 0.38, 0.42, 0.45].forEach((t, i) => tick(t, 900 + i * 190, 0.2, (i % 2 ? 0.4 : -0.4)));
		riser(0.05, 0.47, 0.34);
		boom(0.467, 1.0, 1.15);
		whoosh(0.467, 0.4, 0.32, -1);
		glitch(0.467, 0.2, 0.3, 26);
		chime(0.52, 0.32, 81);
		whoosh(0.83, 0.36, 0.26);
		whoosh(1.3, 0.2, 0.2, -1);
	} else if (variant === 'launch') {
		const dur = 0.67;
		const engine = svf(osc(dur, (t, u) => 55 * 8 ** (u ** 1.3), {wave: 'saw', a: 0.05, tau: 9999}), (i) => 250 + 3200 * (i / secs(dur)) ** 1.5, 0.9, 'low');
		for (let i = 0; i < engine.length; i++) engine[i] *= (i / engine.length) ** 1.5 * 0.7;
		put(engine, 0.2, 0.55, 0, 0.3);
		riser(0.2, 0.87, 0.3);
		glitch(0.86, 0.14, 0.34, 28);
		boom(0.87, 0.7, 0.9);
		chime(0.9, 0.3, 88);
		whoosh(0.97, 0.36, 0.28);
		whoosh(1.3, 0.2, 0.2, -1);
	} else if (variant === 'scan') {
		const bar = svf(osc(0.6, (t, u) => 300 * 5 ** (u ** 1.2), {wave: 'saw', a: 0.02, tau: 9999}), 2400, 0.8, 'low');
		for (let i = 0; i < bar.length; i++) bar[i] *= bell(i, bar.length) * 0.5;
		put(bar, 0.13, 0.4, 0, 0.3);
		for (let i = 0; i < 10; i++) tick(0.14 + i * 0.058, 1100 + i * 140, 0.14, i % 2 ? 0.3 : -0.3); // read-out counting
		glitch(0.733, 0.12, 0.32, 26);
		boom(0.733, 0.85);
		chime(0.78, 0.28, 84);
		whoosh(0.9, 0.34, 0.26);
		whoosh(1.3, 0.2, 0.2, -1);
	} else if (variant === 'pixel') {
		[[0.1, 60], [0.167, 44], [0.267, 30], [0.367, 18], [0.467, 10]].forEach(([t, c], i) => {
			glitch(t, 0.07, 0.28, c);
			tick(t, 700 + i * 260, 0.16, i % 2 ? 0.4 : -0.4);
		});
		boom(0.467, 0.9);
		chime(0.5, 0.3, 84);
		whoosh(0.8, 0.34, 0.26);
		whoosh(1.3, 0.2, 0.2, -1);
	} else if (variant === 'matrix') {
		for (let i = 0; i < 34; i++) tick(0.02 + rnd() * 0.62, 1800 + rnd() * 2600, 0.05 + rnd() * 0.05, (rnd() - 0.5) * 1.4);
		riser(0.05, 0.667, 0.28);
		glitch(0.667, 0.16, 0.3, 30);
		boom(0.667, 0.85);
		chime(0.72, 0.28, 81);
		whoosh(0.93, 0.34, 0.26);
		whoosh(1.3, 0.2, 0.2, -1);
	} else if (variant === 'neon') {
		// sputter: one zap per "on" frame of the animation (frames 4..23)
		[0.13, 0.23, 0.3, 0.33, 0.4, 0.47, 0.5, 0.57, 0.63, 0.7, 0.73, 0.77].forEach((t) => {
			put(osc(0.05, 100, {wave: 'saw', a: 0.002, tau: 0.03}), t, 0.3, 0, 0.1);
			put(svf(noise(secs(0.05)), 4200, 1.2, 'band'), t, 0.25, (rnd() - 0.5) * 0.6, 0.15);
		});
		put(osc(0.7, 120, {wave: 'saw', a: 0.02, tau: 0.5, tone: 0.5}), 0.8, 0.22, 0, 0.1); // hum after the surge
		put(osc(0.4, (t) => 300 + 2400 * Math.min(1, t / 0.08), {tau: 0.08, a: 0.002}), 0.8, 0.3, 0, 0.5);
		boom(0.8, 0.55, 0.8);
		chime(0.86, 0.3, 88);
		whoosh(1.3, 0.2, 0.2, -1);
	} else if (variant === 'slam') {
		riser(0.1, 0.367, 0.42);
		whoosh(0.15, 0.22, 0.36);
		boom(0.367, 1.15, 1.35);
		put(osc(0.6, (t) => 32 + 30 * Math.exp(-t / 0.2), {tau: 0.35, a: 0.004}), 0.367, 0.6, 0, 0.1);
		glitch(0.367, 0.2, 0.34, 20);
		[0.42, 0.48, 0.55, 0.6, 0.68].forEach((t, i) => tick(t, 2800 - i * 300, 0.1, i % 2 ? 0.6 : -0.6)); // debris
		chime(0.62, 0.24, 76);
		whoosh(0.87, 0.34, 0.26);
		whoosh(1.3, 0.2, 0.2, -1);
	} else if (variant === 'warp') {
		riser(0, 0.5, 0.5);
		whoosh(0.05, 0.42, 0.34);
		put(osc(0.5, (t, u) => 90 * 6 ** (u ** 1.4), {wave: 'saw', a: 0.05, tau: 9999}), 0, 0.18, 0, 0.3);
		boom(0.5, 0.95, 1.1);
		glitch(0.5, 0.14, 0.3, 26);
		chime(0.55, 0.3, 84);
		whoosh(0.87, 0.34, 0.26);
		whoosh(1.3, 0.2, 0.2, -1);
	} else {
		// minimal (1.2 s): soft
		whoosh(0, 0.32, 0.22);
		chime(0.33, 0.3, 84);
		whoosh(0.34, 0.5, 0.18);
		put(osc(0.5, 1320, {tau: 0.12, a: 0.005}), 0.34, 0.12, 0.3, 0.6);
	}

	const rv = reverb(wet, {room: 0.8, damp: 0.4, gain: 0.03});
	const F = secs(D);
	const L = new Float32Array(F);
	const R = new Float32Array(F);
	for (let i = 0; i < F; i++) {
		const t = i / SR;
		const m = smooth(t / 0.01) * smooth((D - t) / 0.08); // clean edges: the clip is glued to the video
		L[i] = (bus.l[i] + rv.l[i] * 0.8) * m;
		R[i] = (bus.r[i] + rv.r[i] * 0.8) * m;
	}
	let peak = 0;
	for (let i = 0; i < F; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
	for (let i = 0; i < F; i++) {
		L[i] *= 0.7 / peak;
		R[i] *= 0.7 / peak;
	}
	writeWav(`audio/build/intro/${variant}.raw.wav`, L, R);
	const r = spawnSync('node', ['scripts/audio/finalize.mjs', `audio/build/intro/${variant}.raw.wav`, `public/audio/intro-${variant}.wav`, String(D)], {encoding: 'utf8'});
	if (r.status !== 0) throw new Error(r.stderr || r.stdout);
	const line = r.stdout.split('\n').filter((l) => /I:|Peak:/.test(l)).map((l) => l.trim()).join(' | ');
	console.log(variant.padEnd(7), line);
};

const arg = process.argv[2] || 'all';
const ids = JSON.parse(fs.readFileSync('src/intro/variants.json', 'utf8')).variants.map((v) => v.id);
for (const v of ids) if (arg === 'all' || arg === v) make(v);
