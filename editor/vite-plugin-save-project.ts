import type {Plugin} from 'vite';
import type {IncomingMessage} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {VideoProjectSchema} from '../src/video/model/schemas';

const PROJECTS_DIR = path.resolve(__dirname, '../src/video/projects');
const SLUG_RE = /^[a-z0-9-]+$/;

const readBody = (req: IncomingMessage): Promise<string> =>
	new Promise((resolve, reject) => {
		let body = '';
		req.on('data', (chunk) => (body += chunk));
		req.on('end', () => resolve(body));
		req.on('error', reject);
	});

/**
 * Persistence for the editor (docs/ARCHITECTURE.md Phase 1 gap: no write-back existed). Dev-server-only
 * middleware — writes straight to src/video/projects/<slug>.json on the machine running `npm run editor:dev`,
 * same file the render pipeline and the Player both already read. Not meant to survive a real deployment:
 * this is a local editing tool, and the write target is this repo's own source tree.
 *   POST /api/projects/:slug  body: a full VideoProject JSON  -> validates, writes, replies {ok:true}
 */
export const saveProjectPlugin = (): Plugin => ({
	name: 'save-project',
	configureServer(server) {
		server.middlewares.use(async (req, res, next) => {
			const match = /^\/api\/projects\/([^/]+)$/.exec(req.url ?? '');
			if (!match || req.method !== 'POST') return next();
			const slug = match[1];
			if (!SLUG_RE.test(slug)) {
				res.statusCode = 400;
				res.end(JSON.stringify({ok: false, error: `invalid slug "${slug}"`}));
				return;
			}
			try {
				const raw = await readBody(req);
				const parsed = VideoProjectSchema.parse(JSON.parse(raw));
				if (parsed.id !== slug) throw new Error(`project.id "${parsed.id}" does not match URL slug "${slug}"`);
				const file = path.join(PROJECTS_DIR, `${slug}.json`);
				fs.writeFileSync(file, `${JSON.stringify(parsed, null, '\t')}\n`);
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify({ok: true, file: path.relative(path.resolve(__dirname, '..'), file)}));
			} catch (e) {
				res.statusCode = 400;
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify({ok: false, error: e instanceof Error ? e.message : String(e)}));
			}
		});
	},
});
