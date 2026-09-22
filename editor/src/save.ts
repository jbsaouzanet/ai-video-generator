import type {VideoProject} from '@src/video/model/schemas';

export type SaveResult = {ok: true; file: string} | {ok: false; error: string};

/** POSTs to the dev-server-only save endpoint (editor/vite-plugin-save-project.ts) — writes straight to
 * src/video/projects/<slug>.json on the machine running the dev server. */
export const saveProject = async (project: VideoProject): Promise<SaveResult> => {
	try {
		const res = await fetch(`/api/projects/${project.id}`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify(project),
		});
		const body = (await res.json()) as SaveResult;
		return body;
	} catch (e) {
		return {ok: false, error: e instanceof Error ? e.message : String(e)};
	}
};
