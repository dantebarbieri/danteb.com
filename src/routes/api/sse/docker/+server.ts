import type { RequestHandler } from '@sveltejs/kit';
import { containersStream } from '$lib/api/sse/docker';

export const GET: RequestHandler = () => {
	return containersStream();
};
