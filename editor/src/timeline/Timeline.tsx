import React, {useRef, useState} from 'react';
import type {Clip} from '@src/video/model/clip';

export type PositionedClip = Clip & {
	startSeconds: number;
	endSeconds: number;
	trackId: string;
	/** only true for a clip on a 'sequence'-mode track with 'hard' timing — the only case where
	 * GenericChapterScenes actually reads timing.start/duration, so dragging has a real effect on the
	 * render. A 'self-gating' scene (e.g. xboxpw) still decides its own on/off window internally; dragging
	 * its timing here would silently do nothing to the video, so it's not offered. */
	draggable: boolean;
};

const MIN_DURATION = 0.15;
const HANDLE_PX = 10;

type DragMode = 'move' | 'trim-left' | 'trim-right';

export const Timeline: React.FC<{
	clips: PositionedClip[];
	totalSeconds: number;
	currentFrame: number;
	fps: number;
	selectedClipId: string | null;
	onSelectClip: (id: string) => void;
	onSeek: (frame: number) => void;
	onCommitTiming: (trackId: string, clipId: string, patch: {start?: number; duration?: number}) => void;
}> = ({clips, totalSeconds, currentFrame, fps, selectedClipId, onSelectClip, onSeek, onCommitTiming}) => {
	const stripRef = useRef<HTMLDivElement>(null);
	const [drag, setDrag] = useState<{clipId: string; trackId: string; mode: DragMode; startX: number; origStart: number; origDuration: number; previewStart: number; previewDuration: number} | null>(null);
	const playheadPct = (currentFrame / fps / totalSeconds) * 100;

	const pxToSeconds = (px: number) => (stripRef.current ? (px / stripRef.current.getBoundingClientRect().width) * totalSeconds : 0);

	const beginDrag = (e: React.PointerEvent, clip: PositionedClip, mode: DragMode) => {
		e.stopPropagation();
		e.preventDefault();
		onSelectClip(clip.id);
		const origStart = clip.startSeconds;
		const origDuration = clip.endSeconds - clip.startSeconds;
		// tracked outside React state too — onUp reads this directly rather than pulling the value back out
		// of a setState updater, which must stay pure (calling onCommitTiming from inside one, as a side
		// effect, is exactly what produced React's "Cannot update a component while rendering a different
		// component" warning — found by testing, not by inspection).
		let latest = {previewStart: origStart, previewDuration: origDuration};
		setDrag({clipId: clip.id, trackId: clip.trackId, mode, startX: e.clientX, origStart, origDuration, previewStart: origStart, previewDuration: origDuration});

		const onMove = (ev: PointerEvent) => {
			const deltaSeconds = pxToSeconds(ev.clientX - e.clientX);
			let newStart = origStart;
			let newDuration = origDuration;
			if (mode === 'move') {
				newStart = Math.max(0, origStart + deltaSeconds);
			} else if (mode === 'trim-left') {
				const end = origStart + origDuration;
				newStart = Math.min(end - MIN_DURATION, Math.max(0, origStart + deltaSeconds));
				newDuration = end - newStart;
			} else {
				newDuration = Math.max(MIN_DURATION, origDuration + deltaSeconds);
			}
			latest = {previewStart: newStart, previewDuration: newDuration};
			setDrag((d) => (d ? {...d, ...latest} : d));
		};
		const onUp = () => {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			onCommitTiming(clip.trackId, clip.id, mode === 'trim-right' ? {duration: latest.previewDuration} : mode === 'trim-left' ? {start: latest.previewStart, duration: latest.previewDuration} : {start: latest.previewStart});
			setDrag(null);
		};
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	};

	const handleStripClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (drag) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
		onSeek(Math.round(pct * totalSeconds * fps));
	};

	return (
		<div style={{marginTop: 24}}>
			<div style={{fontSize: 12, color: '#8892a6', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Scenes — click to select/seek, drag edges to trim where draggable</div>
			<div ref={stripRef} onClick={handleStripClick} style={{position: 'relative', height: 56, background: '#141a24', borderRadius: 8, overflow: 'hidden', cursor: 'pointer'}}>
				{clips.map((c) => {
					const isDragging = drag?.clipId === c.id;
					const startSeconds = isDragging ? drag.previewStart : c.startSeconds;
					const endSeconds = isDragging ? drag.previewStart + drag.previewDuration : c.endSeconds;
					const leftPct = (startSeconds / totalSeconds) * 100;
					const widthPct = ((endSeconds - startSeconds) / totalSeconds) * 100;
					const selected = c.id === selectedClipId;
					return (
						<div
							key={c.id}
							onClick={(e) => {
								e.stopPropagation();
								onSelectClip(c.id);
							}}
							onPointerDown={c.draggable ? (e) => beginDrag(e, c, 'move') : undefined}
							title={`${c.shot} · ${startSeconds.toFixed(2)}s - ${endSeconds.toFixed(2)}s${c.draggable ? '' : ' (descriptive only, not draggable)'}`}
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
								zIndex: isDragging ? 3 : 1,
								cursor: c.draggable ? 'grab' : 'pointer',
								opacity: c.draggable ? 1 : 0.7,
							}}
						>
							{c.draggable && <div onPointerDown={(e) => beginDrag(e, c, 'trim-left')} style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: HANDLE_PX, cursor: 'ew-resize'}} />}
							<span style={{pointerEvents: 'none'}}>{c.id}</span>
							{c.draggable && <div onPointerDown={(e) => beginDrag(e, c, 'trim-right')} style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: HANDLE_PX, cursor: 'ew-resize'}} />}
						</div>
					);
				})}
				{/* playhead */}
				<div style={{position: 'absolute', left: `${playheadPct}%`, top: 0, bottom: 0, width: 2, background: '#ff6b7a', boxShadow: '0 0 8px rgba(255,107,122,0.8)', zIndex: 2, pointerEvents: 'none'}} />
			</div>
		</div>
	);
};
