// AI presenter (talking head) laid over each film, in a corner. null = no avatar (the film renders exactly as before).
// Clips are made by scripts/avatar/make-avatar.mjs (out/avatar/avatar-<name>-vN.mp4, no audio, same length as the film)
// and must be copied to public/avatar/ so Remotion can serve them.
export const AVATAR: Record<'short' | 'long' | 'perweapon', string | null> = {
	short: null,
	long: null,
	perweapon: null,
};
