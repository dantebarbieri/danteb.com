import Docker from 'dockerode';

function createSSEStream(pollFn: () => Promise<string>, pollInterval = 1000): ReadableStream {
    let intervalId: NodeJS.Timer;
    let cancelled = false;

    return new ReadableStream({
        async start(controller) {
            async function poll() {
                if (cancelled) return;

                try {
                    const message = await pollFn();
                    if (message) {
                        try {
                            controller.enqueue(message);
                        } catch (err: any) {
                            if (err.code === 'ERR_INVALID_STATE') {
                                cancelled = true;
                                // @ts-ignore
                                clearInterval(intervalId);
                            } else {
                                throw err;
                            }
                        }
                    }
                } catch (err: any) {
                    console.error('Error during poll:', err);
                    if (!cancelled) {
                        try {
                            controller.enqueue(`data: ${JSON.stringify({ error: err.message })}\n\n`);
                        } catch (innerErr) {
                            // If the controller is closed, just ignore.
                        }
                    }
                }
            }

            await poll();
            intervalId = setInterval(poll, pollInterval);
        },
        cancel() {
            cancelled = true;
            // @ts-ignore
            clearInterval(intervalId);
        }
    });
}

export function containersStream(): Response {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    };

    const docker = new Docker();
    let previousContainersJSON = '';

    const pollFn = async (): Promise<string> => {
        const containers = await docker.listContainers();
        const containersJSON = JSON.stringify(containers);
        if (containersJSON !== previousContainersJSON) {
            previousContainersJSON = containersJSON;
            return `data: ${containersJSON}\n\n`;
        }
        return '';
    };

    const stream = createSSEStream(pollFn, 1000);
    return new Response(stream, { headers });
}

export function containerStream(containerId: string): Response {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    };

    const docker = new Docker();
    let previousContainerJSON = '';

    const pollFn = async (): Promise<string> => {
        const container = await docker.getContainer(containerId).inspect();
        const containerJSON = JSON.stringify(container);
        if (containerJSON !== previousContainerJSON) {
            previousContainerJSON = containerJSON;
            return `data: ${containerJSON}\n\n`;
        }
        return '';
    };

    const stream = createSSEStream(pollFn, 1000);
    return new Response(stream, { headers });
}
