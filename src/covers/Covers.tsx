import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import gen from '../config/intro.generated.json';
import {C, FONT} from '../theme';
import {K, Pose, ScreenEvent} from '../timeline';
import {FormatProvider, TALL, TLProvider, WIDE, makeTL} from '../tl';
import {Background} from '../components/Background';
import {CronusHero} from '../components/CronusHero';
import {Tag} from '../components/ui';
import {Topic, topicBySlug} from '../../topics';

// ── Covers (thumbnails): one per video, copy driven by topics/<slug>/topic.json's `cover` field ──
// (see topics/index.ts). Still frames, render at frame 100 (everything settled).

const RED = '#ff5468';
const LOGO = {w: gen.w, h: gen.h};

const POSE_WIDE: Pose = {x: 1440, y: 600, h: 820, rz: -2, rx: 5, ry: -10};
const POSE_TALL: Pose = {x: 540, y: 1580, h: 800, rz: 0, rx: 5, ry: -5};

const mkTL = (pose: Pose, screen: Pick<ScreenEvent, 'title' | 'line'>) =>
	makeTL({poseKeys: [K(0, pose), K(99999, pose)], events: [{f: 0, on: 1, ...screen}], pulses: [], highlight: () => 0.9, opacity: () => 1});

/** brand mark painted with a CSS mask, so any single colour works (same trick as the outro's socials) */
const Mark: React.FC<{file: string; size: number; color: string}> = ({file, size, color}) => (
	<div style={{width: size, height: size, background: color, WebkitMaskImage: `url("${staticFile(`logos/${file}.svg`)}")`, maskImage: `url("${staticFile(`logos/${file}.svg`)}")`, WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center'}} />
);

const PLATFORMS = [
	{file: 'playstation', label: 'PS5'},
	{file: 'xbox', label: 'XBOX'},
	{file: 'pc', label: 'PC'},
];

/** "works on" strip: one glass chip per platform (icon + code), opposite corner from the logo */
const PlatformRow: React.FC<{tall: boolean}> = ({tall}) => {
	const icon = tall ? 34 : 38;
	const pad = tall ? 16 : 18;
	const font = tall ? 20 : 22;
	return (
		<div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10}}>
			<div style={{display: 'flex', gap: tall ? 10 : 12}}>
				{PLATFORMS.map((p) => (
					<div key={p.file} style={{width: icon + pad * 2, height: icon + pad * 2, borderRadius: (icon + pad * 2) * 0.28, background: 'rgba(8,14,22,.72)', border: '1.5px solid rgba(109,182,255,.4)', boxShadow: '0 0 24px rgba(47,139,255,.25), 0 10px 26px rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
						<Mark file={p.file} size={icon} color="#eaf4ff" />
					</div>
				))}
			</div>
			<div style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: font, letterSpacing: '0.18em', color: C.ice, textShadow: '0 2px 10px rgba(0,0,0,.6)'}}>PS5 · XBOX · PC</div>
		</div>
	);
};

const Chip: React.FC<{label: string; kind: 'bad' | 'good'; size: number}> = ({label, kind, size}) => (
	<div style={{position: 'relative', display: 'inline-block', padding: `${size * 0.3}px ${size * 0.62}px`, borderRadius: size * 0.3, background: kind === 'good' ? 'rgba(47,139,255,.22)' : 'rgba(255,84,104,.12)', border: `${Math.max(2, size * 0.06)}px solid ${kind === 'good' ? C.blueHi : RED}`, boxShadow: kind === 'good' ? '0 0 44px rgba(47,139,255,.55)' : undefined, fontFamily: FONT.display, fontWeight: 700, fontSize: size, color: kind === 'good' ? C.blueHi : RED, letterSpacing: '0.03em', whiteSpace: 'nowrap'}}>
		{kind === 'good' ? '✓ ' : '✗ '}
		{label}
		{kind === 'bad' && <div style={{position: 'absolute', left: '5%', right: '5%', top: '52%', height: Math.max(4, size * 0.09), borderRadius: 3, background: RED, boxShadow: '0 0 16px rgba(255,84,104,.9)'}} />}
	</div>
);

/**
 * `slug` picks the topic (and its `cover` copy) from topics/index.ts. `kickerOverride` lets a one-off variant
 * (e.g. the Patreon Quip announcement) reuse a topic's whole cover with just a different top-left line,
 * instead of needing its own topic entry.
 */
export const Cover: React.FC<{slug: string; tall: boolean; kickerOverride?: string}> = ({slug, tall, kickerOverride}) => {
	const frame = useCurrentFrame();
	const topic = topicBySlug(slug) as Topic | undefined;
	if (!topic) throw new Error(`Cover: unknown topic slug "${slug}" (check topics/index.ts)`);
	const copy = topic.cover;
	const [h0, h1] = tall ? copy.headSize.tall : copy.headSize.wide;
	const tl = React.useMemo(() => mkTL(tall ? POSE_TALL : POSE_WIDE, copy.screen), [tall, slug]);
	const pose = tl.poseAt(frame);
	const logoH = tall ? 210 : 190;
	const logoW = (LOGO.w / LOGO.h) * logoH;
	const glow = 'drop-shadow(0 0 30px rgba(95,227,255,.35)) drop-shadow(0 0 26px rgba(255,95,210,.28))';
	const headStyle = (size: number, gradient: boolean): React.CSSProperties => ({fontFamily: FONT.display, fontWeight: 800, fontSize: size, lineHeight: 0.96, letterSpacing: '0.01em', whiteSpace: 'nowrap', ...(gradient ? {background: 'linear-gradient(180deg,#ffffff 0%,#9fd0ff 100%)', WebkitBackgroundClip: 'text', color: 'transparent'} : {color: '#fff'}), filter: 'drop-shadow(0 6px 30px rgba(47,139,255,.55))'});
	// the second headline is only "hot" (gradient) when the whole two-line title reads as one continuous
	// phrase without a punchy first line (matches the old per-mode behaviour: only Per Profile's headline did this)
	const head1Gradient = slug === 'per-profile';
	return (
		<FormatProvider format={tall ? TALL : WIDE}>
			<TLProvider tl={tl}>
				<AbsoluteFill style={{background: '#000'}}>
					<Background frame={frame} pose={pose} power={1} hud={0.5} label={copy.backgroundLabel} />
					<CronusHero frame={frame} />
					<AbsoluteFill style={{background: tall ? 'linear-gradient(180deg, rgba(3,6,12,.86) 0%, rgba(3,6,12,.5) 32%, rgba(3,6,12,0) 52%)' : 'linear-gradient(90deg, rgba(3,6,12,.92) 0%, rgba(3,6,12,.65) 42%, rgba(3,6,12,0) 66%)'}} />
					<div style={{position: 'absolute', left: tall ? 60 : 90, top: tall ? 60 : 70, display: 'flex', alignItems: 'center', gap: 28}}>
						<Img src={staticFile('intro-logo.png')} style={{width: logoW, height: logoH, filter: glow}} />
					</div>
					<div style={{position: 'absolute', right: tall ? 60 : 90, top: tall ? 60 : 70}}>
						<PlatformRow tall={tall} />
					</div>
					{tall ? (
						<div style={{position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center'}}>
							<div style={{fontFamily: FONT.mono, fontSize: 34, letterSpacing: '0.3em', color: C.blueHi, marginBottom: 18}}>{kickerOverride ?? copy.kicker}</div>
							<div style={headStyle(h0, true)}>{copy.head[0]}</div>
							<div style={headStyle(h1, head1Gradient)}>{copy.head[1]}</div>
							<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, marginTop: 28}}>
								{copy.chips.map((c) => <Chip key={c.label} label={c.label} kind={c.kind} size={48} />)}
							</div>
						</div>
					) : (
						<div style={{position: 'absolute', left: 90, top: 300}}>
							<div style={{fontFamily: FONT.mono, fontSize: 32, letterSpacing: '0.3em', color: C.blueHi, marginBottom: 16}}>{kickerOverride ?? copy.kicker}</div>
							<div style={headStyle(h0, true)}>{copy.head[0]}</div>
							<div style={headStyle(h1, head1Gradient)}>{copy.head[1]}</div>
							<div style={{display: 'flex', gap: 20, marginTop: 44, flexWrap: 'wrap', maxWidth: 1600}}>
								{copy.chips.map((c) => <Chip key={c.label} label={c.label} kind={c.kind} size={40} />)}
							</div>
						</div>
					)}
					<div style={{position: 'absolute', left: tall ? 0 : 90, right: tall ? 0 : undefined, ...(tall ? {top: 1075} : {bottom: 70}), display: 'flex', justifyContent: tall ? 'center' : 'flex-start'}}>
						<Tag hot size={tall ? 38 : 40}>{copy.pill}</Tag>
					</div>
				</AbsoluteFill>
			</TLProvider>
		</FormatProvider>
	);
};
