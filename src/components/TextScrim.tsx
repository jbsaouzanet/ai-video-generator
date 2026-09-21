import React from 'react';

/** Soft dark pool behind a text block so the photo's cable / bright details never fight the typography. */
export const TextScrim: React.FC<{x: number; y: number; rx: number; ry: number; opacity?: number}> = ({x, y, rx, ry, opacity = 1}) => (
	<div
		style={{
			position: 'absolute',
			left: x - rx,
			top: y - ry,
			width: rx * 2,
			height: ry * 2,
			opacity,
			background: 'radial-gradient(closest-side, rgba(2,5,10,0.8) 0%, rgba(2,5,10,0.62) 50%, transparent 100%)',
			pointerEvents: 'none',
		}}
	/>
);
