// The hero is a lifestyle PHOTO ("plate"): assets/cronus-v2.png. All coordinates are in the photo's
// ORIGINAL pixel space (939 x 1676). Measured on 3x/8x zooms of the photo; re-measure if the photo changes.
// (The old white-background cutout config is in scripts/legacy/.)
export const CRONUS = {
	plate: {file: 'cronus-plate.jpg', backdrop: 'cronus-backdrop.jpg', backdropTall: 'cronus-backdrop-tall.jpg', w: 939, h: 1676},
	// body of the Cronus (cables excluded)
	device: {x0: 278, y0: 661, x1: 658, y1: 1070},
	// OLED window (black glass). rot = the photo is ~1 deg off level here.
	screen: {x: 400, y: 749, w: 139, h: 70, rot: 0.9},
	// alien-head logo: eyes centre
	logo: {x: 465, y: 1015},
	// where signal lines attach to the body
	anchors: {left: {x: 282, y: 915}, right: {x: 654, y: 915}},
};

export const DEVICE = {
	cx: (CRONUS.device.x0 + CRONUS.device.x1) / 2,
	cy: (CRONUS.device.y0 + CRONUS.device.y1) / 2,
	w: CRONUS.device.x1 - CRONUS.device.x0,
	h: CRONUS.device.y1 - CRONUS.device.y0,
};
