import {describe, expect, it} from "vitest";
import {buildMindmapCode} from "../../src/utils/mindmap";

// Builds a graph whose labels are the note paths.
function graph(paths: string[], links: Record<string, string[]> = {}) {
	return {
		paths,
		outgoingLinks: new Map(Object.entries(links).map(([from, to]) => [from, new Set(to)])),
		getLabel: (path: string) => path,
	};
}

function lines(code: string): string[] {
	return code.split("\n");
}

describe("buildMindmapCode", () => {
	it("renders a bare root when no root label is set", () => {
		expect(lines(buildMindmapCode(null, graph([])))).toEqual(["mindmap", "  root"]);
	});

	it("renders the root label", () => {
		expect(lines(buildMindmapCode("Projects", graph([]))))
			.toEqual(["mindmap", "  root[\"Projects\"]"]);
	});

	it("places unlinked notes directly below the root", () => {
		expect(lines(buildMindmapCode(null, graph(["A", "B"])))).toEqual([
			"mindmap",
			"  root",
			"    n0[\"A\"]",
			"    n1[\"B\"]",
		]);
	});

	it("nests linked notes below the note linking to them", () => {
		const code = buildMindmapCode(null, graph(["A", "B", "C"], {A: ["B"], B: ["C"]}));

		expect(lines(code)).toEqual([
			"mindmap",
			"  root",
			"    n0[\"A\"]",
			"      n1[\"B\"]",
			"        n2[\"C\"]",
		]);
	});

	it("only starts branches at notes nothing links to", () => {
		const code = buildMindmapCode(null, graph(["Child", "Parent"], {Parent: ["Child"]}));

		expect(lines(code)).toEqual([
			"mindmap",
			"  root",
			"    n1[\"Parent\"]",
			"      n0[\"Child\"]",
		]);
	});

	it("places a note linked from several notes under the first one only", () => {
		const code = buildMindmapCode(null, graph(["A", "B", "Shared"], {A: ["Shared"], B: ["Shared"]}));

		expect(lines(code)).toEqual([
			"mindmap",
			"  root",
			"    n0[\"A\"]",
			"      n2[\"Shared\"]",
			"    n1[\"B\"]",
		]);
	});

	it("renders each note of a cycle once", () => {
		const code = buildMindmapCode(null, graph(["A", "B"], {A: ["B"], B: ["A"]}));

		expect(lines(code)).toEqual([
			"mindmap",
			"  root",
			"    n0[\"A\"]",
			"      n1[\"B\"]",
		]);
	});

	it("renders a cycle below a note outside of it", () => {
		const code = buildMindmapCode(null, graph(["A", "B", "Start"], {Start: ["A"], A: ["B"], B: ["A"]}));

		expect(lines(code)).toEqual([
			"mindmap",
			"  root",
			"    n2[\"Start\"]",
			"      n0[\"A\"]",
			"        n1[\"B\"]",
		]);
	});

	it("uses the label callback for node text", () => {
		const code = buildMindmapCode(null, {
			...graph(["notes/A.md"]),
			getLabel: () => "Title: A",
		});

		expect(lines(code)).toContain("    n0[\"Title: A\"]");
	});
});
