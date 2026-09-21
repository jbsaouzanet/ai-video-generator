// Isolates the Cronus from its white studio background.
// Input : assets/cronus.jpg
// Output: assets/cronus-transparent.png (trimmed) + public/cronus.png + src/config/cronus.generated.json
// The device pixels are never repainted: only the alpha channel is computed.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'assets/cronus.jpg';
const OUT = 'assets/cronus-transparent.png';
const WHITE_MIN = 242; // min(r,g,b) >= this counts as studio white
const ERODE = 1; // px eaten off the cut edge to kill the white halo
const FEATHER = 0.8; // px alpha blur for a smooth edge

const {data, info} = await sharp(SRC).removeAlpha().raw().toBuffer({resolveWithObject: true});
const {width: W, height: H} = info;
const at = (x, y) => (y * W + x) * 3;
const isWhite = (i) => Math.min(data[i], data[i + 1], data[i + 2]) >= WHITE_MIN;

// 1. flood fill studio white from the image border (4-connected)
const bg = new Uint8Array(W * H);
const stack = [];
const push = (x, y) => {
	if (x < 0 || y < 0 || x >= W || y >= H) return;
	const p = y * W + x;
	if (bg[p] || !isWhite(p * 3)) return;
	bg[p] = 1;
	stack.push(p);
};
for (let x = 0; x < W; x++) {push(x, 0); push(x, H - 1);}
for (let y = 0; y < H; y++) {push(0, y); push(W - 1, y);}
while (stack.length) {
	const p = stack.pop();
	const x = p % W, y = (p / W) | 0;
	push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
}

// 2. alpha = 255 for device, 0 for bg
let alpha = Buffer.alloc(W * H);
for (let p = 0; p < W * H; p++) alpha[p] = bg[p] ? 0 : 255;

// 3. erode + feather (blur -> hard threshold shrinks the mask, second blur softens the edge)
const toGray = async (img) => {
	const {data: d, info: i} = await img.toColourspace('b-w').raw().toBuffer({resolveWithObject: true});
	if (i.channels === 1) return d;
	const out = Buffer.alloc(W * H);
	for (let p = 0; p < W * H; p++) out[p] = d[p * i.channels];
	return out;
};
let a = sharp(alpha, {raw: {width: W, height: H, channels: 1}});
if (ERODE > 0) a = a.blur(ERODE * 0.8 + 0.3).threshold(200);
a = a.blur(FEATHER);
alpha = await toGray(a);

// 4. compose RGBA
const rgba = Buffer.alloc(W * H * 4);
for (let p = 0; p < W * H; p++) {
	rgba[p * 4] = data[p * 3];
	rgba[p * 4 + 1] = data[p * 3 + 1];
	rgba[p * 4 + 2] = data[p * 3 + 2];
	rgba[p * 4 + 3] = alpha[p];
}

// 5. trim to bbox
let x0 = W, y0 = H, x1 = 0, y1 = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
	if (alpha[y * W + x] > 8) {x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);}
}
const pad = 4;
x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
const TW = x1 - x0 + 1, TH = y1 - y0 + 1;

fs.mkdirSync('public', {recursive: true});
await sharp(rgba, {raw: {width: W, height: H, channels: 4}})
	.extract({left: x0, top: y0, width: TW, height: TH})
	.png()
	.toFile(OUT);
fs.copyFileSync(OUT, 'public/cronus.png');

// 6. locate the OLED screen: the big pure-black rectangle in the upper-middle of the device
const isBlack = (x, y) => Math.max(data[at(x, y)], data[at(x, y) + 1], data[at(x, y) + 2]) <= 9;
const sx0 = Math.round(W * 0.3), sx1 = Math.round(W * 0.72), sy0 = Math.round(H * 0.16), sy1 = Math.round(H * 0.42);
const colCount = new Array(W).fill(0), rowCount = new Array(H).fill(0);
for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) if (isBlack(x, y)) {colCount[x]++; rowCount[y]++;}
const colThr = (sy1 - sy0) * 0.35, rowThr = (sx1 - sx0) * 0.35;
let cx0 = -1, cx1 = -1, ry0 = -1, ry1 = -1;
for (let x = sx0; x < sx1; x++) if (colCount[x] > colThr) {if (cx0 < 0) cx0 = x; cx1 = x;}
for (let y = sy0; y < sy1; y++) if (rowCount[y] > rowThr) {if (ry0 < 0) ry0 = y; ry1 = y;}

const meta = {
	source: {width: W, height: H},
	trim: {x: x0, y: y0, width: TW, height: TH},
	// screen rect as fractions of the TRIMMED image
	screen: {x: (cx0 - x0) / TW, y: (ry0 - y0) / TH, w: (cx1 - cx0 + 1) / TW, h: (ry1 - ry0 + 1) / TH},
	screenPx: {x: cx0, y: ry0, w: cx1 - cx0 + 1, h: ry1 - ry0 + 1},
};
fs.mkdirSync('src/config', {recursive: true});
fs.writeFileSync('src/config/cronus.generated.json', JSON.stringify(meta, null, 2));
console.log(JSON.stringify(meta, null, 2));

// 7. QA composite on graphite so halos are visible
await sharp({create: {width: TW, height: TH, channels: 3, background: '#0b0f16'}})
	.composite([{input: OUT}])
	.png()
	.toFile(path.join('out', 'preview', '_cutout-check.png'));
