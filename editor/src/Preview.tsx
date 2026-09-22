import React, {useMemo} from 'react';
import {Player} from '@remotion/player';
import {VideoProjectSchema} from '@src/video/model/schemas';
import {resolveTimingStartSeconds} from '@src/video/engine/timing-resolver';
import type {VoiceLine} from '@src/video/primitives/timing';
import {XboxPerWeaponFilmFromProject} from '@src/xboxpw/FilmFromProject';
import {xboxPwFrames} from '@src/xboxpw/Film';
import '@src/video/shots/blocks';
import '@src/video/shots/xboxpw';
import projectData from '@src/video/projects/per-weapon-xbox.json';
import timelineData from '@src/xboxpw/timeline.json';

const project = VideoProjectSchema.parse(projectData);
const LINES = timelineData as unknown as VoiceLine[];

/**
 * Phase 3 "First vertical slice", step 5 (docs/ARCHITECTURE.md): a READ-ONLY preview. Remotion Player loads
 * the same VideoProject rendered by src/xboxpw/FilmFromProject.tsx; the strip below shows each clip's
 * resolved position on the timeline. No drag, no trim, no selection yet — that's Phase 3's next step, once
 * this is confirmed working.
 */
export const Preview: React.FC = () => {
	const fps = project.settings.fps;
	const totalFrames = xboxPwFrames();
	const totalSeconds = totalFrames / fps;

	const clips = project.tracks.flatMap((t) => t.clips.map((c) => ({...c, trackName: t.name})));
	const positioned = useMemo(
		() =>
			clips.map((c, i) => {
				const startSeconds = resolveTimingStartSeconds(c.timing, LINES);
				const nextStart = i + 1 < clips.length ? resolveTimingStartSeconds(clips[i + 1].timing, LINES) : totalSeconds;
				return {...c, startSeconds, endSeconds: Math.max(startSeconds, nextStart)};
			}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	return (
		<div style={{fontFamily: 'system-ui, sans-serif', color: '#e8edf5', padding: 24, maxWidth: 1100, margin: '0 auto'}}>
			<h1 style={{fontSize: 20, fontWeight: 600, marginBottom: 4}}>{project.name}</h1>
			<p style={{fontSize: 13, color: '#8892a6', marginTop: 0, marginBottom: 20}}>
				Read-only preview — <code>src/video/projects/per-weapon-xbox.json</code>. {clips.length} clips, {totalSeconds.toFixed(1)}s.
			</p>

			<Player component={XboxPerWeaponFilmFromProject} durationInFrames={totalFrames} compositionWidth={project.settings.width} compositionHeight={project.settings.height} fps={fps} controls style={{width: '100%', aspectRatio: `${project.settings.width} / ${project.settings.height}`}} />

			<div style={{marginTop: 24}}>
				<div style={{fontSize: 12, color: '#8892a6', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Scenes</div>
				<div style={{position: 'relative', height: 56, background: '#141a24', borderRadius: 8, overflow: 'hidden'}}>
					{positioned.map((c) => {
						const leftPct = (c.startSeconds / totalSeconds) * 100;
						const widthPct = ((c.endSeconds - c.startSeconds) / totalSeconds) * 100;
						return (
							<div
								key={c.id}
								title={`${c.shot} · ${c.startSeconds.toFixed(2)}s - ${c.endSeconds.toFixed(2)}s`}
								style={{
									position: 'absolute',
									left: `${leftPct}%`,
									width: `${Math.max(widthPct, 0.5)}%`,
									top: 4,
									bottom: 4,
									background: 'rgba(47,139,255,0.22)',
									border: '1px solid rgba(47,139,255,0.55)',
									borderRadius: 4,
									display: 'flex',
									alignItems: 'center',
									padding: '0 8px',
									fontSize: 11,
									color: '#cfe0ff',
									overflow: 'hidden',
									whiteSpace: 'nowrap',
								}}
							>
								{c.id}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
