import {indent} from "./utils";

export interface MindmapGraph {
	// Every note to place in the mindmap, in the order node ids are assigned.
	paths: string[];
	// Note path to the paths of the notes it links to.
	outgoingLinks: Map<string, Set<string>>;
	getLabel: (path: string) => string;
}

// Notes nothing links to become the top level branches. If every note is
// linked to (a cycle), all notes are candidates. A note reachable from several
// branches is placed under the first one only.
export function buildMindmapCode(rootLabel: string | null, graph: MindmapGraph): string {
	const nodeIds = new Map<string, string>();
	graph.paths.forEach((path, index) => nodeIds.set(path, `n${index}`));

	const linkedPaths = new Set<string>();
	for (const targets of graph.outgoingLinks.values())
		for (const target of targets)
			linkedPaths.add(target);

	let roots = graph.paths.filter((path) => !linkedPaths.has(path));
	if (roots.length === 0)
		roots = graph.paths;

	const lines = ["mindmap"];
	if (rootLabel === null)
		lines.push("  root");
	else
		lines.push(`  root["${rootLabel}"]`);

	const visited = new Set<string>();
	const renderNode = (path: string, level: number): void => {
		if (visited.has(path))
			return;
		visited.add(path);

		const nodeId = nodeIds.get(path);
		if (!nodeId)
			return;

		lines.push(`${indent(level)}${nodeId}["${graph.getLabel(path)}"]`);

		for (const childPath of graph.outgoingLinks.get(path) ?? [])
			renderNode(childPath, level + 1);
	};

	for (const rootPath of roots)
		renderNode(rootPath, 2);

	return lines.join("\n");
}
