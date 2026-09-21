import {useCurrentFrame} from 'remotion';

/** Local frame inside a <Sequence> plus the matching GLOBAL frame. */
export const useScene = (from: number) => {
	const lf = useCurrentFrame();
	return {lf, gf: lf + from};
};
