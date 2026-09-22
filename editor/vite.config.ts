import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Phase 3 read-only preview (docs/ARCHITECTURE.md "First vertical slice", step 5): a separate, minimal Vite
// app, not part of the Remotion CLI bundle — @remotion/player runs in an ordinary React page, not inside a
// Remotion composition. Shares this repo's node_modules/tsconfig; nothing here touches the render pipeline.
export default defineConfig({
	root: __dirname,
	plugins: [react()],
	resolve: {
		alias: {
			'@src': path.resolve(__dirname, '../src'),
		},
	},
	// staticFile()'d assets (audio/*.wav, cronus-*.jpg, ...) live in the Remotion project's public/, normally
	// served by Remotion Studio's own dev server — Vite needs pointing at the same folder or every
	// staticFile() reference 404s (and Player retries forever, spamming the console).
	publicDir: path.resolve(__dirname, '../public'),
	server: {port: 3210},
});
