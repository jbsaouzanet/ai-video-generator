// Tiny offline DSP toolkit (no dependencies). All buffers are Float32Array @ 44.1 kHz.
import fs from 'node:fs';

export const SR = 44100;
export const secs = (s) => Math.round(s * SR);
export const midi = (m) => 440 * 2 ** ((m - 69) / 12);
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smooth = (t) => {
	const x = clamp(t);
	return x * x * (3 - 2 * x);
};

/** piecewise-linear curve through [t, v] points, clamped at the ends */
export const curve = (t, pts) => {
	if (t <= pts[0][0]) return pts[0][1];
	for (let i = 1; i < pts.length; i++) {
		if (t <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
	}
	return pts[pts.length - 1][1];
};

export const rng = (seed) => {
	let s = seed >>> 0 || 1;
	return () => {
		s ^= s << 13; s >>>= 0;
		s ^= s >>> 17;
		s ^= s << 5; s >>>= 0;
		return s / 4294967296;
	};
};

export class Stereo {
	constructor(n) {
		this.n = n;
		this.l = new Float32Array(n);
		this.r = new Float32Array(n);
	}
	/** mix another Stereo-like {l,r} in at time `at` (s) */
	add(src, at = 0, gain = 1) {
		const o = secs(at);
		const len = Math.min(src.l.length, this.n - o);
		for (let i = 0; i < len; i++) {
			if (o + i < 0) continue;
			this.l[o + i] += src.l[i] * gain;
			this.r[o + i] += src.r[i] * gain;
		}
	}
	/** add a mono buffer with equal-power pan (-1..1) */
	addMono(x, at = 0, gain = 1, pan = 0) {
		const a = ((pan + 1) * Math.PI) / 4;
		const gl = Math.cos(a) * gain;
		const gr = Math.sin(a) * gain;
		const o = secs(at);
		const len = Math.min(x.length, this.n - o);
		for (let i = 0; i < len; i++) {
			if (o + i < 0) continue;
			this.l[o + i] += x[i] * gl;
			this.r[o + i] += x[i] * gr;
		}
	}
}

/** TPT state-variable filter. fc: number | (i)=>Hz. mode: low | high | band. Returns a new buffer. */
export function svf(x, fc, q = 0.7, mode = 'low') {
	const out = new Float32Array(x.length);
	const k = 1 / q;
	let ic1 = 0;
	let ic2 = 0;
	const fixed = typeof fc === 'number';
	let g = fixed ? Math.tan((Math.PI * Math.min(fc, SR * 0.45)) / SR) : 0;
	for (let i = 0; i < x.length; i++) {
		if (!fixed) g = Math.tan((Math.PI * Math.min(fc(i), SR * 0.45)) / SR);
		const a1 = 1 / (1 + g * (g + k));
		const a2 = g * a1;
		const a3 = g * a2;
		const v3 = x[i] - ic2;
		const v1 = a1 * ic1 + a2 * v3;
		const v2 = ic2 + a2 * ic1 + a3 * v3;
		ic1 = 2 * v1 - ic1;
		ic2 = 2 * v2 - ic2;
		out[i] = mode === 'low' ? v2 : mode === 'band' ? v1 : x[i] - k * v1 - v2;
	}
	return out;
}

class Comb {
	constructor(size, damp, fb) {
		this.buf = new Float32Array(size);
		this.i = 0;
		this.s = 0;
		this.d1 = damp;
		this.d2 = 1 - damp;
		this.fb = fb;
	}
	p(x) {
		const o = this.buf[this.i];
		this.s = o * this.d2 + this.s * this.d1;
		this.buf[this.i] = x + this.s * this.fb;
		if (++this.i >= this.buf.length) this.i = 0;
		return o;
	}
}
class Allpass {
	constructor(size) {
		this.buf = new Float32Array(size);
		this.i = 0;
	}
	p(x) {
		const b = this.buf[this.i];
		const o = -x + b;
		this.buf[this.i] = x + b * 0.5;
		if (++this.i >= this.buf.length) this.i = 0;
		return o;
	}
}

/** Freeverb-style stereo reverb from a mono send. */
export function reverb(mono, {room = 0.86, damp = 0.32, gain = 0.03} = {}) {
	const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
	const apT = [556, 441, 341, 225];
	const spread = 23;
	const mk = (off) => ({
		c: combT.map((t) => new Comb(t + off, damp, room)),
		a: apT.map((t) => new Allpass(t + off)),
	});
	const L = mk(0);
	const R = mk(spread);
	const out = new Stereo(mono.length);
	for (let i = 0; i < mono.length; i++) {
		const x = mono[i] * gain;
		let sl = 0;
		let sr = 0;
		for (const c of L.c) sl += c.p(x);
		for (const c of R.c) sr += c.p(x);
		for (const a of L.a) sl = a.p(sl);
		for (const a of R.a) sr = a.p(sr);
		out.l[i] = sl;
		out.r[i] = sr;
	}
	return out;
}

/** ping-pong echo, in place on a Stereo bus */
export function pingPong(bus, {time = 0.375, feedback = 0.38, mix = 0.3, lp = 3200} = {}) {
	const d = secs(time);
	const bl = new Float32Array(d);
	const br = new Float32Array(d);
	const a = Math.exp((-2 * Math.PI * lp) / SR);
	let sl = 0;
	let sr = 0;
	let idx = 0;
	for (let i = 0; i < bus.n; i++) {
		const ol = bl[idx];
		const or = br[idx];
		sl = ol * (1 - a) + sl * a;
		sr = or * (1 - a) + sr * a;
		bl[idx] = bus.l[i] + sr * feedback;
		br[idx] = bus.r[i] + sl * feedback;
		bus.l[i] += ol * mix;
		bus.r[i] += or * mix;
		if (++idx >= d) idx = 0;
	}
}

export function readWav(file) {
	const b = fs.readFileSync(file);
	let p = 12;
	let fmt = null;
	let data = null;
	while (p + 8 <= b.length) {
		const id = b.toString('ascii', p, p + 4);
		const sz = b.readUInt32LE(p + 4);
		if (id === 'fmt ') fmt = {ch: b.readUInt16LE(p + 10), sr: b.readUInt32LE(p + 12), bits: b.readUInt16LE(p + 22)};
		if (id === 'data') data = b.subarray(p + 8, p + 8 + Math.min(sz, b.length - p - 8));
		p += 8 + sz + (sz & 1);
	}
	if (!fmt || !data || fmt.bits !== 16) throw new Error(`unsupported wav ${file}`);
	const n = data.length / (2 * fmt.ch);
	const l = new Float32Array(n);
	const r = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		l[i] = data.readInt16LE(i * 2 * fmt.ch) / 32768;
		r[i] = data.readInt16LE(i * 2 * fmt.ch + (fmt.ch > 1 ? 2 : 0)) / 32768;
	}
	return {l, r, sr: fmt.sr, n};
}

export function writeWav(file, l, r, n = l.length) {
	const buf = Buffer.alloc(44 + n * 4);
	buf.write('RIFF', 0);
	buf.writeUInt32LE(36 + n * 4, 4);
	buf.write('WAVEfmt ', 8);
	buf.writeUInt32LE(16, 16);
	buf.writeUInt16LE(1, 20);
	buf.writeUInt16LE(2, 22);
	buf.writeUInt32LE(SR, 24);
	buf.writeUInt32LE(SR * 4, 28);
	buf.writeUInt16LE(4, 32);
	buf.writeUInt16LE(16, 34);
	buf.write('data', 36);
	buf.writeUInt32LE(n * 4, 40);
	for (let i = 0; i < n; i++) {
		buf.writeInt16LE(Math.round(clamp(l[i], -1, 1) * 32767), 44 + i * 4);
		buf.writeInt16LE(Math.round(clamp(r[i], -1, 1) * 32767), 46 + i * 4);
	}
	fs.mkdirSync(file.replace(/[\\/][^\\/]+$/, ''), {recursive: true});
	fs.writeFileSync(file, buf);
}
