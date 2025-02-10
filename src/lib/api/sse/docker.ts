import Docker from 'dockerode';

export function containersStream(): Response {
    // SSE response headers
    const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    };

    const docker = new Docker();

    let previousContainersJSON = '';

    const stream = new ReadableStream({
        start(controller) {
            async function poll() {
                try {
                    const containers = await docker.listContainers();
                    const containersJSON = JSON.stringify(containers);

                    if (containersJSON !== previousContainersJSON) {
                        previousContainersJSON = containersJSON;
                        const message = `data: ${containersJSON}\n\n`;
                        controller.enqueue(message);
                    }
                } catch (error: any) {
                    console.error('Error polling Docker:', error);
                    const message = `data: ${JSON.stringify({ error: error.message })}\n\n`;
                    controller.enqueue(message);
                }
            }

            poll();

            const interval = setInterval(poll, 1000);

            // @ts-ignore – we’re augmenting the controller for cleanup
            controller.interval = interval;
        },
        cancel() {
            // @ts-ignore
            clearInterval(this.interval);
        }
    });

    return new Response(stream, { headers });
}

export function containerStream(containerId: string): Response {
    // SSE response headers
    const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    };

    const docker = new Docker();

    let previousContainerJSON = '';

    const stream = new ReadableStream({
        start(controller) {
            async function poll() {
                try {
                    const container = await docker.getContainer(containerId).inspect();
                    const containerJSON = JSON.stringify(container);

                    if (containerJSON !== previousContainerJSON) {
                        previousContainerJSON = containerJSON;
                        const message = `data: ${containerJSON}\n\n`;
                        controller.enqueue(message);
                    }
                } catch (error: any) {
                    console.error('Error polling Docker:', error);
                    const message = `data: ${JSON.stringify({ error: error.message })}\n\n`;
                    controller.enqueue(message);
                }
            }

            poll();

            const interval = setInterval(poll, 1000);

            // @ts-ignore – we’re augmenting the controller for cleanup
            controller.interval = interval;
        },
        cancel() {
            // @ts-ignore
            clearInterval(this.interval);
        }
    });

    return new Response(stream, { headers });
}
