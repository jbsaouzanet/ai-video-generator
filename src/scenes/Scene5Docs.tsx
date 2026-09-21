import React from 'react';
import {C, FONT} from '../theme';
import {E, prog} from '../lib/anim';
import {FeatureTitle} from '../components/FeatureTitle';
import {DocumentationPanel} from '../components/DocumentationPanel';
import {SceneTransition} from '../components/SceneTransition';
import {SCENES, dur} from '../timeline';
import {useScene} from '../lib/useScene';

/** 21.2–27.4 s. The written guide, as a live browser view. */
export const Scene5Docs: React.FC = () => {
	const {lf} = useScene(SCENES.docs.from);
	const total = dur(SCENES.docs);
	const enter = prog(lf, 4, 30, E.out);
	const chips = prog(lf, 44, 16);
	return (
		<SceneTransition total={total} inFrames={4} outFrames={16} drift={0}>
			<DocumentationPanel lf={lf} x={96} y={148} enter={enter} exit={0} />

			<FeatureTitle
				x={1210}
				y={132}
				width={480}
				delay={14}
				stagger={8}
				lines={[
					{text: 'FULL', size: 92, gradient: true, glow: 'rgba(47,139,255,.35)'},
					{text: 'SETUP GUIDE', size: 92, color: C.blueHi, glow: 'rgba(47,139,255,.6)'},
				]}
			/>
			<div style={{position: 'absolute', left: 1216, top: 372, opacity: chips, transform: `translateY(${(1 - chips) * 12}px)`, fontFamily: FONT.mono, fontSize: 17, letterSpacing: '0.2em', color: C.dim, lineHeight: 1.9}}>
				STEP-BY-STEP
				<br />
				SHORTCUTS
				<br />
				TROUBLESHOOTING
				<br />
				<span style={{color: C.blueHi}}>rocketmod.org/documentation</span>
			</div>
		</SceneTransition>
	);
};
