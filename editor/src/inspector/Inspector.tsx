import React from 'react';
import type {PositionedClip} from '../timeline/Timeline';

const row = (label: string, value: React.ReactNode) => (
	<div style={{display: 'flex', gap: 12, padding: '4px 0', borderBottom: '1px solid #1e2632'}}>
		<div style={{width: 90, color: '#8892a6', flexShrink: 0}}>{label}</div>
		<div style={{color: '#e8edf5', wordBreak: 'break-word'}}>{value}</div>
	</div>
);

/** Read-only clip inspector (docs/ARCHITECTURE.md Phase 3). Shows the selected clip's resolved data — no
 * editing of these fields yet (that needs a persistence story: write back to the project JSON on disk, or
 * to a store with its own save path — not attempted here). */
export const Inspector: React.FC<{clip: PositionedClip | null}> = ({clip}) => (
	<div style={{width: 300, flexShrink: 0, background: '#141a24', borderRadius: 8, padding: 16, fontSize: 13, fontFamily: 'ui-monospace, monospace'}}>
		<div style={{fontSize: 12, color: '#8892a6', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'system-ui, sans-serif'}}>Inspector</div>
		{!clip ? (
			<div style={{color: '#5a6478'}}>Select a clip on the timeline.</div>
		) : (
			<>
				{row('id', clip.id)}
				{row('shot', clip.shot)}
				{row('window', `${clip.startSeconds.toFixed(2)}s → ${clip.endSeconds.toFixed(2)}s`)}
				{row('timing', clip.timing.kind)}
				{clip.timing.kind === 'beat' && (
					<>
						{row('lineId', clip.timing.lineId)}
						{row('anchor', clip.timing.atLineStart ? 'line start' : `"${clip.timing.word}"${clip.timing.nth ? ` (#${clip.timing.nth})` : ''}`)}
						{clip.timing.offsetSeconds !== 0 && row('offset', `${clip.timing.offsetSeconds}s`)}
					</>
				)}
				{clip.timing.kind === 'hard' && row('start', `${clip.timing.start}s`)}
				{Object.keys(clip.props).length > 0 && row('props', <pre style={{margin: 0, whiteSpace: 'pre-wrap'}}>{JSON.stringify(clip.props, null, 2)}</pre>)}
			</>
		)}
	</div>
);
