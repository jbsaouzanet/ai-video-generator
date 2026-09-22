import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {saveProjectPlugin} from './vite-plugin-save-project';

// A separate, minimal Vite app — @remotion/player runs in an ordinary React page, not inside the Remotion
// CLI bundle. Shares this repo's node_modules/tsconfig; nothing here touches the render pipeline itself.
export default defineConfig({
	root: __dirname,
	plugins: [react(), saveProjectPlugin()],
	resolve: {
		alias: {
			'@src': path.resolve(__dirname, '../src'),
		},
	},
	// staticFile()'d assets (audio/*.wav, cronus-*.jpg, ...) live in the Remotion project's public/, normally
	// served by Remotion Studio's own dev server — Vite needs pointing at the same folder or every
	// staticFile() reference 404s (and Player retries forever, spamming the console).
	publicDir: path.resolve(__dirname, '../public'),
	server: {
		port: 3210,
		// allows a Cloudflare quick tunnel (a fresh random *.trycloudflare.com host each run) or LAN access to
		// reach the dev server — Vite's default host check rejects any hostname it doesn't already know about.
		// Fine for this local, no-auth preview tool; do not carry this into anything actually deployed.
		allowedHosts: true,
		watch: {
			// the save endpoint (vite-plugin-save-project.ts) writes straight to src/video/projects/*.json —
			// the same files the client statically imports. Without this, every save is its own file-change
			// event, Vite hot-reloads the importing modules, and the reload wipes the in-memory zundo undo
			// history (found by testing: Undo appeared to do nothing after a save). The client's store, not
			// the file on disk, is the source of truth for an open editing session — the file only needs to
			// pick up the client's OWN writes on a fresh page load, not react to them mid-session.
			ignored: ['**/src/video/projects/**'],
		},
	},
});
