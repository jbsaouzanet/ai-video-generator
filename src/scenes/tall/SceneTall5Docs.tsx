import React from 'react';
import {C, FONT} from '../../theme';
import {E, prog} from '../../lib/anim';
import {FeatureTitle} from '../../components/FeatureTitle';
import {DocumentationPanel} from '../../components/DocumentationPanel';
import {SceneTransition} from '../../components/SceneTransition';
import {SCENES, dur} from '../../timeline';
import {useScene} from '../../lib/useScene';

// Tall panel: 1000 px wide, content zoomed 1.2x so the copy stays readable on a phone. Scroll offsets are in
// CONTENT px (pre-zoom); tuned on stills because the narrower column wraps differently from the wide layout.
const SCROLL = [
	{f: 0, v: {y: 0}},
	{f: 56, v: {y: 0}},
	{f: 78, v: {y: 470}, e: E.inOut},
	{f: 106, v: {y: 470}},
	{f: 130, v: {y: 778}, e: E.inOut},
	{f: 400, v: {y: 778}},
];
const CURSOR = [
	{f: 0, v: {x: 800, y: 700}},
	{f: 24, v: {x: 800, y: 700}},
	{f: 38, v: {x: 520, y: 262}, e: E.inOutSoft},
	{f: 56, v: {x: 290, y: 396}, e: E.inOutSoft},
	{f: 84, v: {x: 700, y: 300}, e: E.inOutSoft},
	{f: 100, v: {x: 420, y: 288}, e: E.inOutSoft},
	{f: 118, v: {x: 700, y: 560}, e: E.inOutSoft},
	{f: 138, v: {x: 330, y: 132}, e: E.inOutSoft},
	{f: 152, v: {x: 430, y: 212}, e: E.inOutSoft},
	{f: 166, v: {x: 300, y: 480}, e: E.inOutSoft},
	{f: 178, v: {x: 700, y: 700}, e: E.inOutSoft},
	{f: 400, v: {x: 700, y: 700}},
];

/** Vertical scene 5: title on top, tall browser panel, the Cronus peeking in from the bottom. */
export const SceneTall5Docs: React.FC = () => {
	const {lf} = useScene(SCENES.docs.from);
	const total = dur(SCENES.docs);
	const enter = prog(lf, 4, 30, E.out);
	const chips = prog(lf, 44, 16);
	return (
		<SceneTransition total={total} inFrames={4} outFrames={16} drift={0}>
			<FeatureTitle x={540} y={100} width={1040} align="center" delay={14} lines={[{text: 'FULL SETUP GUIDE', size: 92, gradient: true, glow: 'rgba(47,139,255,.35)'}]} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 218, textAlign: 'center', opacity: chips, transform: `translateY(${(1 - chips) * 12}px)`, fontFamily: FONT.mono, fontSize: 19, letterSpacing: '0.18em', color: C.dim}}>
				STEP-BY-STEP · SHORTCUTS · TROUBLESHOOTING
			</div>
			<DocumentationPanel lf={lf} x={40} y={290} w={1000} h={940} zoom={1.22} enter={enter} exit={0} scrollKeys={SCROLL} cursorKeys={CURSOR} />
		</SceneTransition>
	);
};
