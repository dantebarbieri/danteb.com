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

type NoDifference = { kind: "nodifference" };

type Difference<T> = { kind: "difference"; contents: T };

type DifferenceError = { kind: "error"; error: string };

type DifferenceResult<T> = NoDifference | Difference<T> | DifferenceError;

export type Message<T> = ErrorMessage | LoadingMessage | TransmittingMessage<T>;

export type ContainersMessage = Message<ContainerInfo[]>;

export type ContainerMessage = Message<ContainerInspectInfo>;

function send<T>(controller: ReadableStreamDefaultController<string>, message: Message<T>) {
	controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
}

function createSSEStream<T>(pollFn: () => Promise<DifferenceResult<T>>, pollInterval = 500): ReadableStream {
	let intervalId: NodeJS.Timeout;
	let cancelled = false;

	return new ReadableStream({
		async start(controller) {
			async function poll() {
				if (cancelled) return;

				try {
					const result = await pollFn();
					if (result.kind === "difference") {
						const message: Message<T> = { contents: result.contents, status: 'transmitting' };
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
					} else if (result.kind === "error") {
						const message: Message<T> = {
							error: result.error,
							status: 'error'
						};
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

function respondWithStream<T>(pollFn: () => Promise<DifferenceResult<T>>, pollInterval = 500): Response {
	const headers = {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		Connection: 'keep-alive'
	};

	const stream = createSSEStream(pollFn, pollInterval);

	return new Response(stream, { headers });
}

export function containersStream(): Response {
	const docker = new Docker();
	let previousContainersJSON = '';

	return respondWithStream(
		async (): Promise<Difference<ContainerInfo[]> | NoDifference> => {
			const containers = await docker.listContainers({ all: true });
			const containersJSON = JSON.stringify(containers);
			if (containersJSON !== previousContainersJSON) {
				previousContainersJSON = containersJSON;
				return { kind: "difference", contents: containers };
			}
			return { kind: "nodifference" };
		},
		500
	);
}

export function containerStream(containerId: string): Response {
	const docker = new Docker();
	let previousContainerJSON = '';

	return respondWithStream(
		async (): Promise<DifferenceResult<ContainerInspectInfo>> => {
			try {
				const container = await docker.getContainer(containerId).inspect({ abortSignal: AbortSignal.timeout(1000) });
				const containerJSON = JSON.stringify(container);
				if (containerJSON !== previousContainerJSON) {
					previousContainerJSON = containerJSON;
					return { kind: "difference", contents: container };
				}
				return { kind: "nodifference" };
			} catch (err) {
				if (err instanceof Error && err.name === "TimeoutError") {
					return { kind: "error", error: err.message };
				}
				throw err;
			}
		},
		500
	);
}
