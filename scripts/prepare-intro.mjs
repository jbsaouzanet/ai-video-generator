// Prepares the intro logo: assets/intro-v2.png (1254x1254 neon logo on a pure BLACK background)
//   -> public/intro-logo.png (transparent, trimmed) + public/intro-logo-px<cell>.png (pixelated copies for the 'pixel' variant)
//   -> src/config/intro.generated.json (size of the trimmed logo) + out/preview/_intro-cutout-check.png (QA)
// Black -> alpha: alpha = brightest channel, colour = channel / alpha. Neon glows stay glowing (translucent), pure black disappears,
// so the logo sits on ANY dark background without a black box. Logo pixels are never repainted.
// (The first logo, on white with a typo, used the flood-fill method: scripts/legacy/prepare-intro-white-bg.mjs)
import sharp from 'sharp';
import fs from 'node:fs';

const SRC = process.env.INTRO_SRC || 'assets/intro-v2.png';
const FLOOR = 5; // brightest channel <= this is treated as black (kills compression noise)
const GAIN = 1.0;

const {data, info} = await sharp(SRC).removeAlpha().raw().toBuffer({resolveWithObject: true});
const W = info.width;
const H = info.height;
const rgba = Buffer.alloc(W * H * 4);
for (let p = 0; p < W * H; p++) {
	const r = data[p * 3];
	const g = data[p * 3 + 1];
	const b = data[p * 3 + 2];
	const m = Math.max(r, g, b);
	if (m <= FLOOR) continue; // stays 0,0,0,0
	const a = Math.min(1, (m / 255) * GAIN);
	rgba[p * 4] = Math.min(255, Math.round(r / a));
	rgba[p * 4 + 1] = Math.min(255, Math.round(g / a));
	rgba[p * 4 + 2] = Math.min(255, Math.round(b / a));
	rgba[p * 4 + 3] = Math.round(a * 255);
}

// trim to what is visibly lit
let x0 = W, y0 = H, x1 = 0, y1 = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rgba[(y * W + x) * 4 + 3] > 30) {x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);}
const pad = 8;
x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
const TW = x1 - x0 + 1;
const TH = y1 - y0 + 1;

fs.mkdirSync('public', {recursive: true});
await sharp(rgba, {raw: {width: W, height: H, channels: 4}}).extract({left: x0, top: y0, width: TW, height: TH}).png().toFile('public/intro-logo.png');
fs.mkdirSync('src/config', {recursive: true});
fs.writeFileSync('src/config/intro.generated.json', JSON.stringify({w: TW, h: TH, srcTrim: {x: x0, y: y0, w: TW, h: TH}}, null, 2));

// pixelated copies: same size, coarser and coarser cells (area-average down, nearest up)
for (const cell of [96, 48, 24, 12]) {
	const sw = Math.max(1, Math.round(TW / cell));
	const sh = Math.max(1, Math.round(TH / cell));
	const small = await sharp('public/intro-logo.png').resize(sw, sh, {kernel: 'lanczos3', fit: 'fill'}).toBuffer();
	await sharp(small).resize(TW, TH, {kernel: 'nearest', fit: 'fill'}).png().toFile(`public/intro-logo-px${cell}.png`);
}

// QA: over the intro background colour and over a mid grey (halo check)
fs.mkdirSync('out/preview', {recursive: true});
await sharp({create: {width: TW, height: TH, channels: 3, background: '#070b12'}}).composite([{input: 'public/intro-logo.png'}]).png().toFile('out/preview/_intro-cutout-check.png');
console.log(`logo ${TW}x${TH} (from ${W}x${H}) -> public/intro-logo.png (+ px96/48/24/12)`);
