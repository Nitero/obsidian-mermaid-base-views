import {type BasesEntryGroup, type CachedMetadata, type TFile} from "obsidian";
import {frontmatterLinkKeyToProperty} from "../../links/frontmatter-links";
import {getBodyLinksForSource, getFrontmatterLinksForSource} from "../../links/note-links";

export interface FlowchartEdge {
	from: string;
	to: string;
	label?: string;
}

export interface FlowchartGraph {
	fileToNodeId: Map<string, string>;
	nodeIdToLabel: Map<string, string>;
	groupIndexToNodeIds: Map<number, Set<string>>;
	groupedNodeIds: Set<string>;
	edges: Map<string, FlowchartEdge>;
}

interface FlowchartGraphOptions {
	linkSource: string;
	linkPropertyName: string | null;
	showLinkPropertyNames: boolean;
	getFileCache: (file: TFile) => CachedMetadata | null;
	resolveLink: (linkpath: string, sourcePath: string) => TFile | null;
	getLabel: (file: TFile) => string;
}

export function collectFlowchartGraph(
	groups: readonly BasesEntryGroup[],
	options: FlowchartGraphOptions,
): FlowchartGraph {
	const graph: FlowchartGraph = {
		fileToNodeId: new Map(),
		nodeIdToLabel: new Map(),
		groupIndexToNodeIds: new Map(),
		groupedNodeIds: new Set(),
		edges: new Map(),
	};

	const ensureNode = (file: TFile): string => {
		let nodeId = graph.fileToNodeId.get(file.path);
		if (nodeId)
			return nodeId;
		nodeId = `n${graph.fileToNodeId.size}`;
		graph.fileToNodeId.set(file.path, nodeId);
		graph.nodeIdToLabel.set(nodeId, options.getLabel(file));
		return nodeId;
	};

	const addEdge = (edge: FlowchartEdge): void => {
		const key = `${edge.from}||${edge.label ?? ""}||${edge.to}`;
		if (!graph.edges.has(key))
			graph.edges.set(key, edge);
	};

	for (const [groupIndex, group] of groups.entries()) {
		const nodeIds = new Set<string>();
		graph.groupIndexToNodeIds.set(groupIndex, nodeIds);
		if (!group)
			continue;
		for (const entry of group.entries) {
			if (!entry.file)
				continue;
			const sourceId = ensureNode(entry.file);
			nodeIds.add(sourceId);
			graph.groupedNodeIds.add(sourceId);

			const bodyCache = options.getFileCache(entry.file);
			for (const link of getBodyLinksForSource(bodyCache, options.linkSource)) {
				const target = options.resolveLink(link.link, entry.file.path);
				if (target)
					addEdge({from: sourceId, to: ensureNode(target)});
			}

			const frontmatterCache = options.getFileCache(entry.file);
			const frontmatterLinks = getFrontmatterLinksForSource(
				frontmatterCache, options.linkSource, options.linkPropertyName,
			);
			for (const link of frontmatterLinks) {
				const target = options.resolveLink(link.link, entry.file.path);
				if (!target)
					continue;
				const targetId = ensureNode(target);
				const label = options.showLinkPropertyNames ? frontmatterLinkKeyToProperty(link.key) : undefined;
				addEdge({from: sourceId, to: targetId, label});
			}
		}
	}
	return graph;
}
