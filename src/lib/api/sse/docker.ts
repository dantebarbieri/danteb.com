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

type NoDifference = { kind: 'nodifference' };
type Difference<T> = { kind: 'difference'; contents: T };
type DifferenceError = { kind: 'error'; error: string };
type DifferenceResult<T> = NoDifference | Difference<T> | DifferenceError;

export type Message<T> = ErrorMessage | LoadingMessage | TransmittingMessage<T>;
export type ContainersMessage = Message<ContainerInfo[]>;
export type ContainerMessage = Message<ContainerInspectInfo>;

/**
 * Helper to send a message over the controller in SSE format.
 */
function send<T>(controller: ReadableStreamDefaultController<string>, message: Message<T>) {
	controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
}

/**
 * Converts an unknown error to a string message.
 */
function getErrorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	if (typeof err === 'string') return err;
	return JSON.stringify(err);
}

/**
 * Attempts to send a message. If the controller is in an invalid state,
 * marks cancellation and clears the interval.
 */
function safeSend<T>(
	controller: ReadableStreamDefaultController<string>,
	message: Message<T>,
	cancel: () => void
) {
	try {
		send(controller, message);
	} catch (err: unknown) {
		if (err instanceof TypeError && (err as { code?: string }).code === 'ERR_INVALID_STATE') {
			cancel();
		} else {
			controller.error(err);
		}
	}
}

/**
 * Creates a ReadableStream that polls for changes using the provided function.
 */
function createSSEStream<T>(
	pollFn: () => Promise<DifferenceResult<T>>,
	pollInterval: number
): ReadableStream {
	let intervalId: NodeJS.Timeout;
	let cancelled = false;

	// A helper to mark cancellation and clear the interval.
	const cancelPolling = () => {
		cancelled = true;
		clearInterval(intervalId);
	};

	return new ReadableStream({
		async start(controller) {
			// Immediately inform the client that we are loading.
			safeSend(controller, { status: 'loading' } as LoadingMessage, cancelPolling);

			// The polling function.
			const poll = async () => {
				if (cancelled) return;
				try {
					const result = await pollFn();
					if (result.kind === 'difference') {
						const message: TransmittingMessage<T> = {
							contents: result.contents,
							status: 'transmitting'
						};
						safeSend(controller, message, cancelPolling);
					} else if (result.kind === 'error') {
						const message: ErrorMessage = {
							error: result.error,
							status: 'error'
						};
						safeSend(controller, message, cancelPolling);
					}
				} catch (err: unknown) {
					console.error('Error during poll:', err);
					const message: ErrorMessage = {
						error: getErrorMessage(err),
						status: 'error'
					};
					safeSend(controller, message, cancelPolling);
				}
			};

			intervalId = setInterval(poll, pollInterval);
		},
		cancel() {
			cancelled = true;
			clearInterval(intervalId);
		}
	});
}

/**
 * Returns a Response wrapping the provided polling function as an SSE stream.
 */
function respondWithStream<T>(
	pollFn: () => Promise<DifferenceResult<T>>,
	pollInterval = 500 /*ms*/
): Response {
	const headers = {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		Connection: 'keep-alive'
	};

	const stream = createSSEStream(pollFn, pollInterval);
	return new Response(stream, { headers });
}

/**
 * Streams Docker container information for all containers.
 */
export function containersStream(): Response {
	const docker = new Docker();
	let previousContainersJSON = '';

	return respondWithStream(async (): Promise<Difference<ContainerInfo[]> | NoDifference> => {
		const containers = await docker.listContainers({ all: true });
		const containersJSON = JSON.stringify(containers);
		if (containersJSON !== previousContainersJSON) {
			previousContainersJSON = containersJSON;
			return { kind: 'difference', contents: containers };
		}
		return { kind: 'nodifference' };
	});
}

/**
 * Streams Docker container details for a specific container.
 */
export function containerStream(containerName: string): Response {
	const docker = new Docker();
	let previousContainerJSON = '';

	let containerId: string;

	return respondWithStream(async (): Promise<DifferenceResult<ContainerInspectInfo>> => {
		if (!containerId) {
			const containers = await docker.listContainers({
				all: true,
				filters: { name: [containerName] }
			});
			const container = containers.find(
				(c) => containerName === c.Names.map((name) => name.replace(/^\//, '')).join(', ')
			);
			if (!container) {
				return { kind: 'error', error: `Container ${containerName} not found.` };
			}
			containerId = container.Id;
		}

		try {
			const container = await docker
				.getContainer(containerId)
				.inspect({ abortSignal: AbortSignal.timeout(1000 /*ms*/) });
			const containerJSON = JSON.stringify(container);
			if (containerJSON !== previousContainerJSON) {
				previousContainerJSON = containerJSON;
				return { kind: 'difference', contents: container };
			}
			return { kind: 'nodifference' };
		} catch (err: unknown) {
			// If it is a timeout error, return a DifferenceError; otherwise rethrow.
			if (err instanceof Error && err.name === 'TimeoutError') {
				return { kind: 'error', error: err.message };
			}
			throw err;
		}
	});
}
