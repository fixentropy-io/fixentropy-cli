import os from 'node:os';
import path from 'node:path';

type Config = {
    rootPath: string;
    localRegistryPath: string;
    projectsRegistryUrl: string;
    emailOptinConfigFile: string;
};

const rootPath = path.join(os.homedir(), '.fixentropy');

export const config: Config = {
    rootPath,
    localRegistryPath:
        process.env.DRAGEE_ASSERTER_LOCAL_REGISTRY_PATH ?? path.join(rootPath, 'registry'),
    projectsRegistryUrl: 'https://registry.npmjs.org/@fixentropy-io',
    emailOptinConfigFile: path.resolve(rootPath, './emailOptin.config.json'),
};
