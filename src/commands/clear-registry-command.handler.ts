import { readdirSync, rmdirSync } from 'node:fs';
import { config } from '../cli.config.ts';

export const clearRegistryHandler = async () => {
    emptyDir(config.localRegistryPath);
    console.log('Fixentropy local registry successfully cleared');
};

export const emptyDir = (registry: string) => {
    for (const projectDir of readdirSync(registry)) {
        console.log(`Deleting ${projectDir}`);
        rmdirSync(`${registry}/${projectDir}`, { recursive: true });
    }
};
