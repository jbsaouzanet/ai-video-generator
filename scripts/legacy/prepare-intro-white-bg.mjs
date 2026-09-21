// Prepares the intro logo: assets/intro.jpg (1024x1024, logo on white) -> public/intro-logo.png (transparent, 2x, trimmed)
// + src/config/intro.generated.json (size of the trimmed logo) + out/preview/_intro-cutout-check.png (dark background QA).
// Only the ALPHA is computed; the logo pixels are never repainted.
//   - white is removed by flooding from the frame border, so white INSIDE the logo (letters, ring gaps) survives
//   - light grey scribbles floating in the white are dropped (largest connected component + opening)
import sharp from 'sharp';
import fs from 'node:fs';

const SRC = 'assets/intro.jpg';
const WHITE_MIN = Number(process.env.WHITE_MIN || 226); // min(r,g,b) >= this counts as background
const UP = 2;

const {data, info} = await sharp(SRC).removeAlpha().raw().toBuffer({resolveWithObject: true});
const W = info.width;
const H = info.height;
const isWhite = (p) => Math.min(data[p * 3], data[p * 3 + 1], data[p * 3 + 2]) >= WHITE_MIN;

// 1. background = white connected to the border
const bg = new Uint8Array(W * H);
const stack = [];
const seed = (x, y) => {
	const p = y * W + x;
	if (!bg[p] && isWhite(p)) {
		bg[p] = 1;
		stack.push(p);
	}
};
for (let x = 0; x < W; x++) {seed(x, 0); seed(x, H - 1);}
for (let y = 0; y < H; y++) {seed(0, y); seed(W - 1, y);}
while (stack.length) {
	const p = stack.pop();
	const x = p % W;
	const y = (p / W) | 0;
	if (x > 0) seed(x - 1, y);
	if (x < W - 1) seed(x + 1, y);
	if (y > 0) seed(x, y - 1);
	if (y < H - 1) seed(x, y + 1);
}

// 2. subject mask, then opening (drops thin scribbles) and the largest component only
let mask = new Uint8Array(W * H);
for (let p = 0; p < W * H; p++) mask[p] = bg[p] ? 0 : 255;
const morph = async (m, op, r) => {
	// erode/dilate with a box via blur+threshold (fast, good enough for a mask)
	const img = sharp(Buffer.from(m), {raw: {width: W, height: H, channels: 1}}).blur(r * 0.9 + 0.3);
	const {data: o, info: oi} = await (op === 'erode' ? img.threshold(250) : img.threshold(6)).raw().toBuffer({resolveWithObject: true});
	if (oi.channels === 1) return o;
	const out = new Uint8Array(W * H); // sharp may hand back several channels: keep the first
	for (let p = 0; p < W * H; p++) out[p] = o[p * oi.channels];
	return out;
};
mask = await morph(await morph(mask, 'erode', 2), 'dilate', 2);

const label = new Int32Array(W * H);
const sizes = [0];
let n = 0;
for (let p0 = 0; p0 < W * H; p0++) {
	if (!mask[p0] || label[p0]) continue;
	n++;
	let size = 0;
	const st = [p0];
	label[p0] = n;
	while (st.length) {
		const p = st.pop();
		size++;
		const x = p % W;
		const y = (p / W) | 0;
		for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
			if (q >= 0 && mask[q] && !label[q]) {
				label[q] = n;
				st.push(q);
			}
		}
	}
	sizes.push(size);
}
const keep = sizes.indexOf(Math.max(...sizes.slice(1)));
for (let p = 0; p < W * H; p++) mask[p] = label[p] === keep ? 255 : 0;
console.log(`components: ${n}, kept the largest (${sizes[keep]} px)`);

// 3. soft edge: 1 px shrink (kills the white JPEG fringe) + light feather
const {data: softRaw, info: softInfo} = await sharp(await morph(mask, 'erode', 1), {raw: {width: W, height: H, channels: 1}}).blur(0.8).raw().toBuffer({resolveWithObject: true});
const soft = new Uint8Array(W * H); // one value per pixel whatever channel count sharp returns
for (let p = 0; p < W * H; p++) soft[p] = softRaw[p * softInfo.channels];

// 4. compose RGBA at native size, trim, upscale (RGB and alpha are upscaled together with lanczos)
const rgba = Buffer.alloc(W * H * 4);
for (let p = 0; p < W * H; p++) {
	rgba[p * 4] = data[p * 3];
	rgba[p * 4 + 1] = data[p * 3 + 1];
	rgba[p * 4 + 2] = data[p * 3 + 2];
	rgba[p * 4 + 3] = soft[p];
}
let x0 = W, y0 = H, x1 = 0, y1 = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (soft[y * W + x] > 8) {x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);}
const pad = 6;
x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
const TW = x1 - x0 + 1;
const TH = y1 - y0 + 1;

fs.mkdirSync('public', {recursive: true});
await sharp(rgba, {raw: {width: W, height: H, channels: 4}})
	.extract({left: x0, top: y0, width: TW, height: TH})
	.resize(TW * UP, TH * UP, {kernel: 'lanczos3'})
	.png()
	.toFile('public/intro-logo.png');
fs.mkdirSync('src/config', {recursive: true});
fs.writeFileSync('src/config/intro.generated.json', JSON.stringify({w: TW * UP, h: TH * UP, srcTrim: {x: x0, y: y0, w: TW, h: TH}}, null, 2));

// 4b. pixelated copies for the 'pixel' variant: same size, coarser and coarser cells (area-average down, nearest up)
for (const cell of [96, 48, 24, 12]) {
	const sw = Math.max(1, Math.round((TW * UP) / cell));
	const sh = Math.max(1, Math.round((TH * UP) / cell));
	const small = await sharp('public/intro-logo.png').resize(sw, sh, {kernel: 'lanczos3', fit: 'fill'}).toBuffer();
	await sharp(small).resize(TW * UP, TH * UP, {kernel: 'nearest', fit: 'fill'}).png().toFile();
}

// 5. QA on dark backgrounds
fs.mkdirSync('out/preview', {recursive: true});
await sharp({create: {width: TW * UP, height: TH * UP, channels: 3, background: '#070b12'}}).composite([{input: 'public/intro-logo.png'}]).png().toFile('out/preview/_intro-cutout-check.png');
console.log(`logo ${TW * UP}x${TH * UP} -> public/intro-logo.png`);
