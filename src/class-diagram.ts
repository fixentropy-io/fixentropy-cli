import { lookupForProjects } from "@fixentropy-io/package-installer";
import type { Dragee } from "@fixentropy-io/type/common";
import type { Grapher } from "@fixentropy-io/type/grapher";
import { config } from "./cli.config.ts";

export const generateClassDiagram = async (
  dragees: Dragee[],
): Promise<string | null> => {
  try {
    const graphers: Grapher[] = await lookupForProjects(
      config.projectsRegistryUrl,
      config.localRegistryPath,
      ["ddd-grapher"],
    );

    return (
      graphers[0]?.graphs
        .find((graph) => graph.id.endsWith("/class-diagram"))
        ?.handler(dragees) ?? null
    );
  } catch (error) {
    console.warn("Class diagram generation failed, skipping.", error);
    return null;
  }
};
