// Registers the 7 existing per-profile chapters (src/RocketModWeaponDetectionLong.tsx's CHAPTERS) as Shots,
// unchanged, under the perprofile/* namespace — third instance of the "wrap an existing opaque component"
// path (xboxpw.tsx, perweapon.tsx). Each shot reproduces that file's own `Layers` inner-content logic
// (ProfileStack when cards, CronusHero always, Custom component when set, reused Scene components via their
// own virtual-frame <Sequence> when set) exactly, but WITHOUT that file's own fade wrapper — this project's
// track uses crossDissolveSymmetric: false, so GenericChapterScenes' ChapterFade already applies the real
// (fade-in-only) transition; wrapping twice would double it.
import React from 'react';
import {Sequence, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {ProfileStack} from '../../components/ProfileStack';
import {CronusHero} from '../../components/CronusHero';
import {TLProvider} from '../../tl';
import {SCENES, dur} from '../../timeline';
import {TL_BEFORE, TL_DETECT, TL_FIX, TL_INTRO, TL_OUTRO, TL_TURNON, TL_UNSURE} from '../../long/tl';
import {ChapterBefore, ChapterFix, ChapterTurnOn, ChapterUnsure} from '../../long/ChaptersNew';
import {Scene1Hook} from '../../scenes/Scene1Hook';
import {Scene2Profiles} from '../../scenes/Scene2Profiles';
import {Scene3Detect} from '../../scenes/Scene3Detect';
import {Scene4Auto} from '../../scenes/Scene4Auto';
import {Scene5Docs} from '../../scenes/Scene5Docs';
import {Scene6End} from '../../scenes/Scene6End';
import {registerShot} from './registry';

const emptySchema = z.object({});

/** virtual-frame reuse: a scene keeps its ORIGINAL frame numbers (written once, shared by other topics that
 * also reuse it) by living inside a <Sequence from={-orig}> that shifts the chapter's local frame 0 back to
 * that scene's own frame 0 — exactly src/RocketModWeaponDetectionLong.tsx's `Layers`. */
const wrapChapter = (id: string, opts: {tl: import('../../tl').TL; cards?: boolean; custom?: React.FC; orig?: number; scenes?: {range: {from: number; to: number}; C: React.FC}[]}, description: string) => {
	const {tl, cards, custom: Custom, orig, scenes} = opts;
	// two components, not one — matches the original's Chapter/Layers split exactly. useCurrentFrame() must
	// be called BY a component that's already inside the -orig-shifted <Sequence>, not by Wrapped itself
	// (which sits outside it): calling it too early was a real bug caught by the pixel-diff, not a style
	// choice — it fed ProfileStack/CronusHero the pre-shift frame, wrong for any non-zero orig (detect,
	// outro; invisible for intro, whose orig is 0, which is why that one alone looked fine).
	const Inner: React.FC = () => {
		const vf = useCurrentFrame();
		return (
			<>
				{cards && <ProfileStack frame={vf} />}
				<CronusHero frame={vf} />
				{Custom && <Custom />}
				{scenes?.map((s, i) => (
					<Sequence key={i} from={s.range.from} durationInFrames={dur(s.range)}>
						<s.C />
					</Sequence>
				))}
			</>
		);
	};
	const Wrapped: React.FC = () => (
		<TLProvider tl={tl}>
			<Sequence from={-(orig ?? 0)}>
				<Inner />
			</Sequence>
		</TLProvider>
	);
	registerShot({id, component: Wrapped, schema: emptySchema, metadata: {description, tags: ['perprofile', 'chapter']}});
};

wrapChapter('perprofile/intro', {tl: TL_INTRO, orig: 0, cards: true, scenes: [{range: SCENES.hook, C: Scene1Hook}, {range: SCENES.profiles, C: Scene2Profiles}]}, 'Hook + category-vs-2-profiles compare.');
wrapChapter('perprofile/before', {tl: TL_BEFORE, custom: ChapterBefore}, 'DualSense + adaptive triggers required.');
wrapChapter('perprofile/turnon', {tl: TL_TURNON, custom: ChapterTurnOn}, '"Turn it on" step list.');
wrapChapter('perprofile/detect', {tl: TL_DETECT, orig: 240, cards: true, scenes: [{range: SCENES.detect, C: Scene3Detect}]}, 'How it detects and assigns automatically.');
wrapChapter('perprofile/unsure', {tl: TL_UNSURE, custom: ChapterUnsure}, 'Ambiguous-weapon edge case.');
wrapChapter('perprofile/fix', {tl: TL_FIX, custom: ChapterFix}, 'Troubleshooting / fallback.');
wrapChapter('perprofile/outro', {tl: TL_OUTRO, orig: 456, scenes: [{range: SCENES.auto, C: Scene4Auto}, {range: SCENES.docs, C: Scene5Docs}, {range: SCENES.end, C: Scene6End}]}, 'Facts + docs + end lockup.');
