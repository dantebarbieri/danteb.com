import Docker, { type ContainerInfo, type ContainerInspectInfo } from 'dockerode';

interface ErrorMessage {
	error: string;
	status: 'error';
}

interface LoadingMessage {
	status: 'loading';
}

interface TransmittingMessage<T> {
	contents: T;
	status: 'transmitting';
}

export type Message<T> = ErrorMessage | LoadingMessage | TransmittingMessage<T>;

export type ContainersMessage = Message<ContainerInfo[]>;

export type ContainerMessage = Message<ContainerInspectInfo>;

function send<T>(controller: ReadableStreamDefaultController<string>, message: Message<T>) {
	controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
}

function createSSEStream<T>(pollFn: () => Promise<T | null>, pollInterval = 500): ReadableStream {
	let intervalId: NodeJS.Timeout;
	let cancelled = false;

	return new ReadableStream({
		async start(controller) {
			async function poll() {
				if (cancelled) return;

				try {
					const contents = await pollFn();
					if (contents) {
						const message: Message<T> = { contents: contents, status: 'transmitting' };
						try {
							send(controller, message);
						} catch (err) {
							if (
								err instanceof TypeError &&
								(err as unknown as { code: string }).code === 'ERR_INVALID_STATE'
                            ) {
								cancelled = true;
								clearInterval(intervalId);
                            } else {
								controller.error(err);
							}
						}
					}
				} catch (err) {
					console.error('Error during poll:', err);
					let reason = JSON.stringify(err);
					if (err instanceof Error) {
						reason = err.message;
					} else if (typeof err === 'string') {
						reason = err;
					}
					if (!cancelled) {
						try {
							const message: Message<T> = {
								error: reason,
								status: 'error'
							};
							send(controller, message);
						} catch (innerErr) {
							if (
								innerErr instanceof TypeError &&
								(innerErr as unknown as { code: string }).code === 'ERR_INVALID_STATE'
							) {
								cancelled = true;
								clearInterval(intervalId);
							} else {
								controller.error(innerErr);
							}
						}
					}
				}
			}

			const message: Message<T> = { status: 'loading' };
			send(controller, message);
			intervalId = setInterval(poll, pollInterval);
		},
		cancel() {
			cancelled = true;
			clearInterval(intervalId);
		}
	});
}

export function containersStream(): Response {
	const headers = {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		Connection: 'keep-alive'
	};

	const docker = new Docker();
	let previousContainersJSON = '';

	const pollFn = async (): Promise<ContainerInfo[] | null> => {
		const containers = await docker.listContainers({ all: true });
		const containersJSON = JSON.stringify(containers);
		if (containersJSON !== previousContainersJSON) {
			previousContainersJSON = containersJSON;
			return containers;
		}
		return null;
	};

	const stream = createSSEStream(pollFn, 1000);
	return new Response(stream, { headers });
}

export function containerStream(containerId: string): Response {
	const headers = {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		Connection: 'keep-alive'
	};

	const docker = new Docker();
	let previousContainerJSON = '';

	const pollFn = async (): Promise<ContainerInspectInfo | null> => {
		const container = await docker.getContainer(containerId).inspect();
		const containerJSON = JSON.stringify(container);
		if (containerJSON !== previousContainerJSON) {
			previousContainerJSON = containerJSON;
			return container;
		}
		return null;
	};

	const stream = createSSEStream(pollFn, 1000);
	return new Response(stream, { headers });
}
