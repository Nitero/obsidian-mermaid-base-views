import {type BasesEntryGroup} from "obsidian";
import {escapeMermaidQuotedLabel} from "../../utils/mermaid-text";
import {type FlowchartEdge, type FlowchartGraph} from "./flowchart-graph";
import {getGroupLabel} from "../../links/group-label";

export function buildFlowchartCode(
	groups: readonly BasesEntryGroup[],
	graph: FlowchartGraph,
	direction: string,
	hasGroupingConfigured: boolean,
): string {
	const lines: string[] = [];

	lines.push(`flowchart ${direction}`);

	if (hasGroupingConfigured) {
		for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
			const group = groups[groupIndex];
			const nodeSet = graph.groupIndexToNodeIds.get(groupIndex);
			if (!nodeSet || nodeSet.size === 0)
				continue;

			if (!group)
				continue;

			const groupLabel = getGroupLabel(group, `No value (${groupIndex + 1})`);
			const groupId = `g${groupIndex}`;

			lines.push(`    subgraph ${groupId}["${escapeMermaidQuotedLabel(groupLabel)}"]`);

			for (const nodeId of nodeSet) {
				const label = graph.nodeIdToLabel.get(nodeId) ?? nodeId;
				lines.push(`        ${nodeId}["${escapeMermaidQuotedLabel(label)}"]`);
			}

			lines.push("    end");
		}

		for (const [path, id] of graph.fileToNodeId.entries()) {
			if (graph.groupedNodeIds.has(id))
				continue;

			const label = graph.nodeIdToLabel.get(id) ?? path;
			lines.push(`    ${id}["${escapeMermaidQuotedLabel(label)}"]`);
		}
	} else {
		for (const [path, id] of graph.fileToNodeId.entries()) {
			const label = graph.nodeIdToLabel.get(id) ?? path;
			lines.push(`    ${id}["${escapeMermaidQuotedLabel(label)}"]`);
		}
	}

	for (const edge of graph.edges.values())
		lines.push(`    ${formatEdgeForMermaid(edge)}`);

	for (const nodeId of graph.fileToNodeId.values())
		lines.push(`    class ${nodeId} bases-mermaid-note-${nodeId};`);

	return lines.join("\n");
}

function formatEdgeForMermaid(edge: FlowchartEdge): string {
	if (edge.label && edge.label.trim().length > 0)
		return `${edge.from}-->|${edge.label}|${edge.to}`;
	return `${edge.from}-->${edge.to}`;
}
