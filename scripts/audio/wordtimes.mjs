// Real word timing from Piper's phoneme alignment.
// Piper phonemizes with espeak: words are separated by ' ' tokens, sentences start with '^' and end with '$', and
// punctuation ('.' ',' '?' '!' ':' ';') is a token carrying the pause. A written word can be SEVERAL spoken groups
// ("L2" -> "el two", "PS5" -> "p-s five", "D-pad" -> "dee pad"), so words are matched to groups with punctuation as anchors.

const PUNCT = new Set(['.', ',', '?', '!', ':', ';']);

/** phonemes -> spoken groups [{t0, t1, end: '.'|','|...|''}] with the punctuation pause split off */
export function groupsOf(phonemes) {
	const groups = [];
	let cur = null;
	for (const ph of phonemes) {
		if (ph.p === '^') continue;
		if (ph.p === '$') {
			cur = null;
			continue;
		}
		if (ph.p === ' ') {
			cur = null;
			continue;
		}
		if (PUNCT.has(ph.p)) {
			if (cur) cur.end = ph.p; // pause belongs after the word, not inside it
			continue;
		}
		if (!cur) {
			cur = {t0: ph.t0, t1: ph.t1, end: '', n: 0};
			groups.push(cur);
		} else cur.t1 = ph.t1;
		if (!'ˈˌː'.includes(ph.p)) cur.n++; // count real phonemes, not stress / length marks
	}
	return groups;
}

const trailing = (w) => /[.?!]$/.test(w) ? 's' : /[,;:]$/.test(w) ? 'c' : '';
const groupTrail = (g) => (/[.?!]/.test(g.end) ? 's' : /[,;:]/.test(g.end) ? 'c' : '');
/** written words that are spoken as several groups */
const isMulti = (w) => /\d/.test(w) || /[A-Z].*[A-Z]/.test(w.replace(/^[^A-Za-z0-9]+/, '')) || /[a-z]-[a-z]/i.test(w);
const weight = (w) => w.replace(/[^\w']/g, '').length + 1;

/** rough number of phonemes a written word is spoken with (digits are spoken as words: "2" = "two") */
const expectedPhonemes = (w) => {
	const letters = (w.match(/[A-Za-z']/g) || []).length;
	const digits = (w.match(/\d/g) || []).length;
	return Math.max(1, Math.round(letters * 0.85) + digits * 3);
};

/**
 * espeak may speak one written word as several groups ("L2" = "el two") or glue two short words into one group
 * ("in the" -> "ɪnðə", "for a" -> "fɚɹə"). Choose the mapping words <-> groups of a segment with the least length
 * mismatch: 1:1, 1 word -> 2..3 groups, or 2 words -> 1 group (the group's time is then split by letter count).
 * Returns null when no mapping exists.
 */
function alignSegment(segW, segG) {
	const W = segW.length;
	const G = segG.length;
	const E = segW.map(expectedPhonemes);
	const P = segG.map((g) => g.n);
	const diff = (e, p) => Math.abs(e - p) / Math.max(e, p, 1);
	const INF = 1e9;
	const cost = Array.from({length: W + 1}, () => new Array(G + 1).fill(INF));
	const from = Array.from({length: W + 1}, () => new Array(G + 1).fill(null));
	cost[0][0] = 0;
	const relax = (i, j, ni, nj, c, kind) => {
		if (ni > W || nj > G) return;
		if (cost[i][j] + c < cost[ni][nj]) {
			cost[ni][nj] = cost[i][j] + c;
			from[ni][nj] = {i, j, kind};
		}
	};
	for (let i = 0; i < W; i++) {
		for (let j = 0; j < G; j++) {
			if (cost[i][j] >= INF) continue;
			relax(i, j, i + 1, j + 1, diff(E[i], P[j]), 'one'); // 1 word -> 1 group
			for (const k of [2, 3]) {
				if (j + k > G) continue;
				const sum = P.slice(j, j + k).reduce((a, b) => a + b, 0);
				relax(i, j, i + 1, j + k, diff(E[i], sum) + (isMulti(segW[i]) ? 0.05 : 0.5), 'split' + k); // 1 word -> k groups
			}
			if (i + 2 <= W) relax(i, j, i + 2, j + 1, diff(E[i] + E[i + 1], P[j]) + 0.12, 'merge2'); // 2 words -> 1 group
		}
	}
	if (cost[W][G] >= INF) return null;
	// backtrack
	const plan = new Array(W);
	let i = W;
	let j = G;
	while (i > 0) {
		const f = from[i][j];
		if (f.kind === 'one') plan[i - 1] = {a: f.j, b: f.j, share: [0, 1]};
		else if (f.kind.startsWith('split')) plan[i - 1] = {a: f.j, b: j - 1, share: [0, 1]};
		else {
			const e0 = E[i - 2];
			const e1 = E[i - 1];
			const cut = e0 / (e0 + e1);
			plan[i - 2] = {a: f.j, b: f.j, share: [0, cut]};
			plan[i - 1] = {a: f.j, b: f.j, share: [cut, 1]};
		}
		i = f.i;
		j = f.j;
	}
	return plan;
}

/**
 * words: written words (with punctuation)   groups: spoken groups from groupsOf()
 * returns [{t, from, to}] in seconds on the wav timeline, plus a `quality` note.
 */
export function timeWords(words, groups, wavSeconds) {
	if (!groups.length) return {words: null, quality: 'no-groups'};
	const out = new Array(words.length);
	let quality = 'exact';

	// segment boundaries: a word and a group that both end a sentence/clause are anchors
	let wi = 0;
	let gi = 0;
	while (wi < words.length) {
		// find the next anchor pair
		let we = wi;
		while (we < words.length - 1 && !trailing(words[we])) we++;
		const kind = trailing(words[we]);
		let ge = gi;
		if (kind) {
			while (ge < groups.length - 1 && groupTrail(groups[ge]) !== kind) ge++;
			if (groupTrail(groups[ge]) !== kind) ge = groups.length - 1; // anchor missing: take the rest
		} else ge = groups.length - 1;
		const segW = words.slice(wi, we + 1);
		const segG = groups.slice(gi, ge + 1);

		let plan = null; // per word: {a, b, share: [lo, hi]} = groups a..b, and for a merged group the slice of it that belongs to this word
		if (segG.length === segW.length) plan = segW.map((_, i) => ({a: i, b: i, share: [0, 1]}));
		else {
			plan = alignSegment(segW, segG);
			if (plan) quality = quality === 'exact' ? 'aligned' : quality;
			else quality = 'segment-proportional';
		}

		if (plan) {
			segW.forEach((w, i) => {
				const p = plan[i];
				const ga = segG[p.a];
				const gb = segG[p.b];
				if (p.a === p.b) {
					const len = ga.t1 - ga.t0;
					out[wi + i] = {t: w, from: ga.t0 + p.share[0] * len, to: ga.t0 + p.share[1] * len};
				} else out[wi + i] = {t: w, from: ga.t0, to: gb.t1};
			});
		} else {
			const t0 = segG[0].t0;
			const t1 = segG[segG.length - 1].t1;
			const tot = segW.reduce((s, w) => s + weight(w), 0);
			let acc = 0;
			segW.forEach((w, i) => {
				out[wi + i] = {t: w, from: t0 + (acc / tot) * (t1 - t0), to: t0 + ((acc + weight(w)) / tot) * (t1 - t0)};
				acc += weight(w);
			});
		}
		wi = we + 1;
		gi = ge + 1;
		if (gi >= groups.length && wi < words.length) {
			// out of groups: the remaining words share the tail
			const last = groups[groups.length - 1];
			for (let k = wi; k < words.length; k++) out[k] = {t: words[k], from: last.t1, to: Math.min(wavSeconds, last.t1 + 0.05)};
			quality = 'incomplete';
			break;
		}
	}
	return {words: out.map((w) => ({t: w.t, from: +w.from.toFixed(3), to: +w.to.toFixed(3)})), quality};
}

const normTok = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');

/**
 * Caption text can differ from the spoken text (spoken "Rocket Mod dot org", shown "rocketmod.org").
 * Keep the exact times where the words are identical (common start / common end) and give the differing middle part of the
 * caption the time span of the spoken middle part.
 */
export function captionWords(spoken, caption) {
	let p = 0;
	while (p < spoken.length && p < caption.length && normTok(spoken[p].t) === normTok(caption[p])) p++;
	let s = 0;
	while (s < spoken.length - p && s < caption.length - p && normTok(spoken[spoken.length - 1 - s].t) === normTok(caption[caption.length - 1 - s])) s++;
	const out = [];
	for (let i = 0; i < p; i++) out.push({t: caption[i], from: spoken[i].from, to: spoken[i].to});
	const sm = spoken.slice(p, spoken.length - s);
	const cm = caption.slice(p, caption.length - s);
	if (cm.length) {
		if (!sm.length) throw new Error(`caption words with no spoken counterpart: ${cm.join(' ')}`);
		const from = sm[0].from;
		const to = sm[sm.length - 1].to;
		const tot = cm.reduce((a, w) => a + w.length, 0);
		let acc = 0;
		for (const w of cm) {
			out.push({t: w, from: +(from + (acc / tot) * (to - from)).toFixed(3), to: +(from + ((acc + w.length) / tot) * (to - from)).toFixed(3)});
			acc += w.length;
		}
	}
	for (let i = s; i > 0; i--) out.push({t: caption[caption.length - i], from: spoken[spoken.length - i].from, to: spoken[spoken.length - i].to});
	return out;
}
