import React from 'react';
import type {Clip} from '@src/video/model/clip';

export type PositionedClip = Clip & {startSeconds: number; endSeconds: number};

/**
 * Phase 3 "Editor MVP" (docs/ARCHITECTURE.md): now interactive — click a clip to select it (shows in
 * Inspector), click anywhere on the strip to seek the Player, a live playhead tracks playback. Still no
 * drag/trim/move — those write back to the project and need a persistence story this doesn't have yet.
 */
export const Timeline: React.FC<{
	clips: PositionedClip[];
	totalSeconds: number;
	currentFrame: number;
	fps: number;
	selectedClipId: string | null;
	onSelectClip: (id: string) => void;
	onSeek: (frame: number) => void;
}> = ({clips, totalSeconds, currentFrame, fps, selectedClipId, onSelectClip, onSeek}) => {
	const playheadPct = (currentFrame / fps / totalSeconds) * 100;

	const handleStripClick = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
		onSeek(Math.round(pct * totalSeconds * fps));
	};

	return (
		<div style={{marginTop: 24}}>
			<div style={{fontSize: 12, color: '#8892a6', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Scenes — click to select, click strip to seek</div>
			<div onClick={handleStripClick} style={{position: 'relative', height: 56, background: '#141a24', borderRadius: 8, overflow: 'hidden', cursor: 'pointer'}}>
				{clips.map((c) => {
					const leftPct = (c.startSeconds / totalSeconds) * 100;
					const widthPct = ((c.endSeconds - c.startSeconds) / totalSeconds) * 100;
					const selected = c.id === selectedClipId;
					return (
						<div
							key={c.id}
							onClick={(e) => {
								// clicking a clip both selects it and seeks the playhead to its start — with
								// clips covering the strip contiguously (by design, matching the original
								// scenes end to end), there is no empty strip area to click for seek-only
								e.stopPropagation();
								onSelectClip(c.id);
								onSeek(Math.round(c.startSeconds * fps));
							}}
							title={`${c.shot} · ${c.startSeconds.toFixed(2)}s - ${c.endSeconds.toFixed(2)}s`}
							style={{
								position: 'absolute',
								left: `${leftPct}%`,
								width: `${Math.max(widthPct, 0.5)}%`,
								top: 4,
								bottom: 4,
								background: selected ? 'rgba(47,139,255,0.5)' : 'rgba(47,139,255,0.22)',
								border: selected ? '1.5px solid #fff' : '1px solid rgba(47,139,255,0.55)',
								borderRadius: 4,
								display: 'flex',
								alignItems: 'center',
								padding: '0 8px',
								fontSize: 11,
								color: '#cfe0ff',
								overflow: 'hidden',
								whiteSpace: 'nowrap',
								boxSizing: 'border-box',
								zIndex: 1,
							}}
						>
							{c.id}
						</div>
					);
				})}
				{/* playhead */}
				<div style={{position: 'absolute', left: `${playheadPct}%`, top: 0, bottom: 0, width: 2, background: '#ff6b7a', boxShadow: '0 0 8px rgba(255,107,122,0.8)', zIndex: 2, pointerEvents: 'none'}} />
			</div>
		</div>
	);
};
