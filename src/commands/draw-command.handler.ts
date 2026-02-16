import { lookupForProjects } from '@fixentropy-io/package-installer';
import type { Dragee } from '@fixentropy-io/type/common';
import type { Grapher } from '@fixentropy-io/type/grapher';
import { config } from '../cli.config.ts';
import { lookupForDragees } from '../dragee-lookup';
import { lookupForNamespaces } from '../namespace-lookup.ts';

type Options = {
    fromDir: string;
    toDir: string;
};

export const drawCommandhandler = async ({ fromDir, toDir }: Options) => {
    const dragees = await lookupForDragees(fromDir);
    const namespaces = await lookupForNamespaces(dragees);
    const graphers: Grapher[] = await lookupForProjects(
        config.projectsRegistryUrl,
        config.localRegistryPath,
        namespaces.map(n => `${n}-grapher`)
    );

    for (const grapher of graphers) {
        console.log(`Running grapher for namespace ${grapher.namespace}`);
        await grapherHandler(grapher, toDir, dragees);
    }
};

export const grapherHandler = async (grapher: Grapher, toDir: string, dragees: Dragee[]) => {
    for (const graph of grapher.graphs) {
        const graphFile = graph.handler(dragees);
        if (graphFile)
            await Bun.write(`${toDir}/${grapher.namespace}/${graph.label}.md`, graphFile);
    }
};
