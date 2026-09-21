import {loadFont as loadRajdhani} from '@remotion/google-fonts/Rajdhani';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as loadPixel} from '@remotion/google-fonts/VT323';

// Rajdhani + Inter are the fonts rocketmod.org itself preloads.
const raj = loadRajdhani('normal', {weights: ['500', '600', '700'], subsets: ['latin']});
const inter = loadInter('normal', {weights: ['400', '500', '600'], subsets: ['latin']});
const mono = loadMono('normal', {weights: ['400', '500', '700'], subsets: ['latin']});
const pixel = loadPixel('normal', {weights: ['400'], subsets: ['latin']});

export const FONT = {
	display: raj.fontFamily,
	body: inter.fontFamily,
	mono: mono.fontFamily,
	pixel: pixel.fontFamily,
};

export const C = {
	bg: '#04060a',
	bg2: '#0a0f17',
	panel: '#0c121c',
	panel2: '#101826',
	line: 'rgba(120,170,255,0.18)',
	lineHi: 'rgba(109,182,255,0.55)',
	blue: '#2f8bff',
	blueHi: '#6db6ff',
	blueGlow: 'rgba(47,139,255,0.55)',
	ice: '#d6eaff',
	text: '#f2f7ff',
	dim: '#7d8ba1',
	dim2: '#4a566a',
	// LED colours straight from the docs: green = Primary, white = Secondary
	ledPrimary: '#39f5a4',
	ledSecondary: '#ffffff',
};
