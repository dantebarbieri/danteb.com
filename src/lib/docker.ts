import Docker from 'dockerode';

const docker = new Docker();

export async function containers() {
	return await docker.listContainers();
}

export async function container(id: string) {
	return await docker.getContainer(id).inspect();
}
