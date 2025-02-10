import type { RequestHandler } from '@sveltejs/kit';
import { containerStream } from '$lib/api/sse/docker';

export const GET: RequestHandler = ({ params }) => {
	return containerStream(params.slug!);
};