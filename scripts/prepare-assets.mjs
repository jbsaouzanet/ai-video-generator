// Prepares the Cronus lifestyle photo (assets/cronus-v2.png, 939x1676) for the video.
//   public/cronus-plate.jpg     2x Lanczos upscale + light sharpen, so camera push-ins stay crisp
//   public/cronus-backdrop.jpg  1920x1080 heavily blurred + darkened crop of the same photo (fills the frame around the plate)
//   public/cronus-backdrop-tall.jpg  same for the 1080x1920 vertical Short
// The device pixels are never repainted. Coordinates in src/config/cronus.ts stay in the ORIGINAL 939x1676 space.
// (The previous white-background cutout pipeline is kept in scripts/legacy/.)
import sharp from 'sharp';
import fs from 'node:fs';

const SRC = 'assets/cronus-v2.png';
const meta = await sharp(SRC).metadata();
fs.mkdirSync('public', {recursive: true});

await sharp(SRC)
	.resize(meta.width * 2, meta.height * 2, {kernel: 'lanczos3'})
	.sharpen({sigma: 0.9, m1: 0.6, m2: 1.2})
	.jpeg({quality: 93, chromaSubsampling: '4:4:4'})
	.toFile('public/cronus-plate.jpg');

// backdrop: scale photo to 1920 wide, take a 1080 window around the device, blur + darken
const scale = 1920 / meta.width;
const deviceCy = 866 * scale;
const top = Math.max(0, Math.min(Math.round(meta.height * scale) - 1080, Math.round(deviceCy - 540)));
await sharp(SRC)
	.resize(1920, Math.round(meta.height * scale), {kernel: 'lanczos3'})
	.extract({left: 0, top, width: 1920, height: 1080})
	.blur(26)
	.modulate({brightness: 0.55, saturation: 0.95})
	.jpeg({quality: 88})
	.toFile('public/cronus-backdrop.jpg');

// vertical (Short) backdrop: the portrait photo almost exactly fills 1080x1920
const sT = 1080 / meta.width;
const topT = Math.max(0, Math.min(Math.round(meta.height * sT) - 1920, Math.round(866 * sT - 990)));
await sharp(SRC)
	.resize(1080, Math.round(meta.height * sT), {kernel: 'lanczos3'})
	.extract({left: 0, top: topT, width: 1080, height: 1920})
	.blur(26)
	.modulate({brightness: 0.55, saturation: 0.95})
	.jpeg({quality: 88})
	.toFile('public/cronus-backdrop-tall.jpg');

console.log('plate + backdrops written');
