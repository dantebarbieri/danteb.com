import * as docker from '$lib/docker.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		summaries: (await docker.containers()).map((container) => ({
			slug: container.Id,
			title: container.Names[0].replace(/^\//, ''),
			status: container.Status
		}))
	};
};
