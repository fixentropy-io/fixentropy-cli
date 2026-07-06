import * as packageInstaller from "@fixentropy-io/package-installer";
import type { Dragee } from "@fixentropy-io/type/common";
import type { Grapher } from "@fixentropy-io/type/grapher";
import { afterAll, describe, expect, spyOn, test } from "bun:test";
import { generateClassDiagram } from "../src/class-diagram.ts";

const lookupMock = spyOn(packageInstaller, "lookupForProjects");

afterAll(() => {
	lookupMock.mockRestore();
});

const dragees: Dragee[] = [];

describe("generateClassDiagram", () => {
	test("returns the class-diagram handler output on the nominal path", async () => {
		lookupMock.mockResolvedValueOnce([
			{
				namespace: "ddd",
				graphs: [
					{
						id: "ddd/class-diagram",
						label: "class-diagram",
						handler: () => "classDiagram\n  class Foo",
					},
				],
			},
		] satisfies Grapher[]);

		expect(await generateClassDiagram(dragees)).toBe("classDiagram\n  class Foo");
	});

	test("returns null when no grapher is resolved", async () => {
		lookupMock.mockResolvedValueOnce([]);

		expect(await generateClassDiagram(dragees)).toBeNull();
	});

	test("returns null when the grapher has no class-diagram graph", async () => {
		lookupMock.mockResolvedValueOnce([{ namespace: "ddd", graphs: [] }]);

		expect(await generateClassDiagram(dragees)).toBeNull();
	});

	test("returns null when the lookup itself throws", async () => {
		lookupMock.mockRejectedValueOnce(new Error("registry unreachable"));

		expect(await generateClassDiagram(dragees)).toBeNull();
	});
});
