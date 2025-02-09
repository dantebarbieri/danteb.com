import * as docker from '$lib/docker.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const container = await docker.container(params.slug);

	if (!container) error(404);

	return {
		container
	};
};
